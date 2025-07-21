import {
  index,
  jsonb,
  pgTable,
  text,
  decimal,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { uuidColumn, timestampColumns, marketIdColumn, confidenceColumn } from "../util";

/**
 * Market Intelligence Storage
 * Stores comprehensive research context and analysis for prediction markets
 */
export const marketIntelligence = pgTable(
  "market_intelligence",
  {
    id: uuidColumn(),
    marketId: marketIdColumn(),
    
    // Market metadata
    title: text("title").notNull(),
    description: text("description"),
    endDate: timestamp("end_date", { withTimezone: true }),
    
    // Intelligence data as JSONB for flexibility
    researchContext: jsonb("research_context").notNull(),
    sentimentAnalysis: jsonb("sentiment_analysis").notNull(),
    technicalSignals: jsonb("technical_signals").notNull(),
    
    // Computed scores
    overallConfidence: confidenceColumn(),
    sentimentScore: decimal("sentiment_score", { precision: 5, scale: 4 }), // -1 to 1
    
    // Current market state
    currentPrice: decimal("current_price", { precision: 18, scale: 6 }),
    liquidity: decimal("liquidity", { precision: 18, scale: 2 }),
    volume24h: decimal("volume_24h", { precision: 18, scale: 2 }),
    
    ...timestampColumns(),
  },
  (table) => [
    // Performance indexes
    index("idx_market_intelligence_market_id").on(table.marketId),
    index("idx_market_intelligence_created_at").on(table.createdAt),
    index("idx_market_intelligence_confidence").on(table.overallConfidence),
    index("idx_market_intelligence_end_date").on(table.endDate),
  ]
);

/**
 * Trade Decisions and Executions
 * Stores all trading decisions, execution details, and risk management data
 */
export const tradeDecisions = pgTable(
  "trade_decisions",
  {
    id: uuidColumn(),
    marketId: marketIdColumn(),
    
    // Decision metadata
    action: text("action", { enum: ["BUY", "SELL", "HOLD", "NONE"] }).notNull(),
    outcome: text("outcome"), // Remove enum constraint - support any outcome string
    
    // Market outcomes context for reference
    availableOutcomes: jsonb("available_outcomes"), // Store all outcomes: ["JD Vance", "Gavin Newsom", ...]
    outcomesPrices: jsonb("outcomes_prices"), // Store all prices: ["0.27", "0.14", ...]
    
    // Position sizing
    plannedAmount: decimal("planned_amount", { precision: 18, scale: 6 }),
    actualAmount: decimal("actual_amount", { precision: 18, scale: 6 }),
    
    // Decision factors
    confidence: confidenceColumn(),
    reasoning: text("reasoning").notNull(),
    signalAttribution: jsonb("signal_attribution"),
    
    // Execution details
    status: text("status", { 
      enum: ["PENDING", "EXECUTED", "FAILED", "CANCELLED"] 
    }).notNull().default("PENDING"),
    transactionHash: text("transaction_hash"),
    executionPrice: decimal("execution_price", { precision: 18, scale: 6 }),
    
    // Risk management
    stopLoss: decimal("stop_loss", { precision: 18, scale: 6 }),
    takeProfit: decimal("take_profit", { precision: 18, scale: 6 }),
    
    ...timestampColumns(),
  },
  (table) => [
    index("idx_trade_decisions_market_id").on(table.marketId),
    index("idx_trade_decisions_status").on(table.status),
    index("idx_trade_decisions_created_at").on(table.createdAt),
    index("idx_trade_decisions_confidence").on(table.confidence),
  ]
);

/**
 * Performance Analytics and Attribution
 * Tracks performance metrics, signal attribution, and strategy effectiveness
 */
export const performanceMetrics = pgTable(
  "performance_metrics",
  {
    id: uuidColumn(),
    
    // Time period
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    
    // Performance data
    totalTrades: integer("total_trades").notNull(),
    winningTrades: integer("winning_trades").notNull(),
    totalPnl: decimal("total_pnl", { precision: 18, scale: 6 }),
    
    // Signal attribution
    signalPerformance: jsonb("signal_performance"), // Performance by signal type
    strategyEffectiveness: jsonb("strategy_effectiveness"),
    
    // Risk metrics
    maxDrawdown: decimal("max_drawdown", { precision: 18, scale: 6 }),
    sharpeRatio: decimal("sharpe_ratio", { precision: 8, scale: 4 }),
    
    ...timestampColumns(),
  },
  (table) => [
    index("idx_performance_metrics_period").on(table.periodStart, table.periodEnd),
    index("idx_performance_metrics_created_at").on(table.createdAt),
  ]
); 