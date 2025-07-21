import { and, desc, eq, gt, lt, sql, inArray } from "drizzle-orm";
import { db } from "../db";
import { tradeDecisions } from "../schema/markets/defs";
import type { 
  TradeDecision, 
  NewTradeDecision 
} from "../schema/markets/types";

export class TradeDecisionsRepository {
  /**
   * Create a new trade decision
   */
  async create(data: NewTradeDecision): Promise<TradeDecision> {
    const [created] = await db
      .insert(tradeDecisions)
      .values(data)
      .returning();
    return created;
  }

  /**
   * Update trade decision status (e.g., mark as executed)
   */
  async updateStatus(
    id: string, 
    status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED',
    updates: Partial<NewTradeDecision> = {}
  ): Promise<TradeDecision> {
    const [updated] = await db
      .update(tradeDecisions)
      .set({
        status,
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(tradeDecisions.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Get pending trade decisions
   */
  async getPendingTrades(): Promise<TradeDecision[]> {
    return db
      .select()
      .from(tradeDecisions)
      .where(eq(tradeDecisions.status, 'PENDING'))
      .orderBy(desc(tradeDecisions.createdAt));
  }

  /**
   * Get trades for a specific market
   */
  async getTradesForMarket(marketId: string): Promise<TradeDecision[]> {
    return db
      .select()
      .from(tradeDecisions)
      .where(eq(tradeDecisions.marketId, marketId))
      .orderBy(desc(tradeDecisions.createdAt));
  }

  /**
   * Get recent executed trades
   */
  async getRecentExecutedTrades(hoursBack: number = 24): Promise<TradeDecision[]> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    return db
      .select()
      .from(tradeDecisions)
      .where(
        and(
          eq(tradeDecisions.status, 'EXECUTED'),
          gt(tradeDecisions.updatedAt, cutoffTime)
        )
      )
      .orderBy(desc(tradeDecisions.updatedAt));
  }

  /**
   * Get trades by confidence level
   */
  async getTradesByConfidence(
    minConfidence: number,
    hoursBack: number = 168 // 1 week
  ): Promise<TradeDecision[]> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    return db
      .select()
      .from(tradeDecisions)
      .where(
        and(
          gt(tradeDecisions.confidence, minConfidence),
          gt(tradeDecisions.createdAt, cutoffTime)
        )
      )
      .orderBy(desc(tradeDecisions.confidence));
  }

  /**
   * Get trade by transaction hash
   */
  async getTradeByTransactionHash(txHash: string): Promise<TradeDecision | null> {
    const [result] = await db
      .select()
      .from(tradeDecisions)
      .where(eq(tradeDecisions.transactionHash, txHash))
      .limit(1);
    
    return result || null;
  }

  /**
   * Calculate daily trading statistics
   */
  async getDailyStats(date: Date): Promise<{
    totalTrades: number;
    executedTrades: number;
    totalVolume: string;
    avgConfidence: number;
  }> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const result = await db
      .select({
        totalTrades: sql<number>`count(*)`,
        executedTrades: sql<number>`count(case when status = 'EXECUTED' then 1 end)`,
        totalVolume: sql<string>`coalesce(sum(actual_amount), '0')`,
        avgConfidence: sql<number>`coalesce(avg(confidence), 0)`
      })
      .from(tradeDecisions)
      .where(
        and(
          gt(tradeDecisions.createdAt, startOfDay),
          lt(tradeDecisions.createdAt, endOfDay)
        )
      );

    return result[0] || {
      totalTrades: 0,
      executedTrades: 0,
      totalVolume: '0',
      avgConfidence: 0
    };
  }

  /**
   * Get active positions (executed trades without completion)
   */
  async getActivePositions(): Promise<TradeDecision[]> {
    return db
      .select()
      .from(tradeDecisions)
      .where(
        and(
          eq(tradeDecisions.status, 'EXECUTED'),
          // Add logic here for positions that haven't been closed
        )
      )
      .orderBy(desc(tradeDecisions.executionPrice));
  }

  /**
   * Delete old trade records
   */
  async cleanupOldTrades(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await db
      .delete(tradeDecisions)
      .where(
        and(
          lt(tradeDecisions.createdAt, cutoffDate),
          inArray(tradeDecisions.status, ['CANCELLED', 'FAILED'])
        )
      );
    
    return result.rowCount || 0;
  }
} 