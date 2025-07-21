import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { marketIntelligence, tradeDecisions, performanceMetrics } from "./defs";

// Drizzle inferred types
export type MarketIntelligence = InferSelectModel<typeof marketIntelligence>;
export type NewMarketIntelligence = InferInsertModel<typeof marketIntelligence>;
export type TradeDecision = InferSelectModel<typeof tradeDecisions>;
export type NewTradeDecision = InferInsertModel<typeof tradeDecisions>;
export type PerformanceMetrics = InferSelectModel<typeof performanceMetrics>;
export type NewPerformanceMetrics = InferInsertModel<typeof performanceMetrics>;

// Zod schemas for runtime validation
export const selectMarketIntelligenceSchema = createSelectSchema(marketIntelligence);
export const insertMarketIntelligenceSchema = createInsertSchema(marketIntelligence);
export const selectTradeDecisionSchema = createSelectSchema(tradeDecisions);
export const insertTradeDecisionSchema = createInsertSchema(tradeDecisions);
export const selectPerformanceMetricsSchema = createSelectSchema(performanceMetrics);
export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics);

// API validation schemas
export const createTradeDecisionSchema = z.object({
  marketId: z.string().min(1),
  action: z.enum(["BUY", "SELL", "HOLD", "NONE"]),
  outcome: z.string().optional(), // Support any outcome string
  availableOutcomes: z.array(z.string()).optional(), // All available outcomes
  outcomesPrices: z.array(z.string()).optional(), // Corresponding prices
  plannedAmount: z.string().regex(/^\d+(\.\d+)?$/),
  confidence: z.number().int().min(0).max(100),
  reasoning: z.string().min(10),
});

export const createMarketIntelligenceSchema = z.object({
  marketId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  researchContext: z.record(z.unknown()),
  sentimentAnalysis: z.record(z.unknown()),
  technicalSignals: z.record(z.unknown()),
  overallConfidence: z.number().int().min(0).max(100),
  sentimentScore: z.number().min(-1).max(1),
});

export type CreateTradeDecisionRequest = z.infer<typeof createTradeDecisionSchema>;
export type CreateMarketIntelligenceRequest = z.infer<typeof createMarketIntelligenceSchema>; 