import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { marketIntelligence } from "../schema/markets/defs";
import type { 
  MarketIntelligence, 
  NewMarketIntelligence 
} from "../schema/markets/types";

export class MarketIntelligenceRepository {
  /**
   * Store new market intelligence
   */
  async create(data: NewMarketIntelligence): Promise<MarketIntelligence> {
    const [created] = await db
      .insert(marketIntelligence)
      .values(data)
      .returning();
    return created;
  }

  /**
   * Get latest intelligence for a market
   */
  async getLatestForMarket(marketId: string): Promise<MarketIntelligence | null> {
    const [result] = await db
      .select()
      .from(marketIntelligence)
      .where(eq(marketIntelligence.marketId, marketId))
      .orderBy(desc(marketIntelligence.createdAt))
      .limit(1);
    
    return result || null;
  }

  /**
   * Get markets by confidence threshold
   */
  async getHighConfidenceMarkets(
    minConfidence: number,
    hoursBack: number = 24
  ): Promise<MarketIntelligence[]> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    return db
      .select()
      .from(marketIntelligence)
      .where(
        and(
          gt(marketIntelligence.overallConfidence, minConfidence),
          gt(marketIntelligence.createdAt, cutoffTime)
        )
      )
      .orderBy(desc(marketIntelligence.overallConfidence));
  }

  /**
   * Update market intelligence with new data
   */
  async updateIntelligence(
    id: string, 
    updates: Partial<NewMarketIntelligence>
  ): Promise<MarketIntelligence> {
    const [updated] = await db
      .update(marketIntelligence)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(marketIntelligence.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Clean up old intelligence data
   */
  async cleanupOldData(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await db
      .delete(marketIntelligence)
      .where(lt(marketIntelligence.createdAt, cutoffDate));
    
    return result.rowCount || 0;
  }

  /**
   * Get markets with active end dates
   */
  async getActiveMarkets(hoursAhead: number = 72): Promise<MarketIntelligence[]> {
    const futureTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    
    return db
      .select()
      .from(marketIntelligence)
      .where(
        and(
          gt(marketIntelligence.endDate, new Date()),
          lt(marketIntelligence.endDate, futureTime)
        )
      )
      .orderBy(marketIntelligence.endDate);
  }

  /**
   * Get intelligence history for a market
   */
  async getMarketHistory(
    marketId: string, 
    limit: number = 10
  ): Promise<MarketIntelligence[]> {
    return db
      .select()
      .from(marketIntelligence)
      .where(eq(marketIntelligence.marketId, marketId))
      .orderBy(desc(marketIntelligence.createdAt))
      .limit(limit);
  }

  /**
   * Get markets by sentiment score range
   */
  async getMarketsBySentiment(
    minSentiment: number,
    maxSentiment: number = 1,
    hoursBack: number = 24
  ): Promise<MarketIntelligence[]> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    return db
      .select()
      .from(marketIntelligence)
      .where(
        and(
          gt(marketIntelligence.sentimentScore, minSentiment.toString()),
          lt(marketIntelligence.sentimentScore, maxSentiment.toString()),
          gt(marketIntelligence.createdAt, cutoffTime)
        )
      )
      .orderBy(desc(marketIntelligence.sentimentScore));
  }
} 