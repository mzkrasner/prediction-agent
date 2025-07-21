import { anthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
// Note: DecisionAgent focuses on decision logic only - 
// ExecutionAgent will handle database operations via repositories
import type { CreateTradeDecisionRequest } from '../database/schema/markets/types.js';

// Enhanced trading decision interfaces
interface MarketContext {
  marketId: string;
  title: string;
  currentPrice: number;
  impliedProbability: number;
  liquidity: number;
  volume24h: number;
  timeToClose: number; // milliseconds
  spread: number;
  orderBookEnabled: boolean;
}

interface IntelligenceData {
  // Research outputs from ResearchAgent
  newsIntelligence: {
    sentiment_score: number;
    confidence: number;
    breaking_news: boolean;
    news_count: number;
    source_credibility: number;
  };
  socialIntelligence: {
    twitter_sentiment: number;
    reddit_sentiment: number;
    engagement_momentum: number;
    trending_topics: string[];
    influencer_signals: Array<{
      username: string;
      sentiment: number;
      influence_weight: number;
    }>;
  };
  marketIntelligence: {
    technical_signals: {
      price_momentum: number;
      volume_trend: number;
      market_efficiency: number;
    };
    cross_market_signals: {
      correlation_score: number;
      consensus_direction: 'bullish' | 'bearish' | 'neutral';
    };
  };
}

interface ScoringFactors {
  sentiment_edge: number; // 40% weight
  technical_momentum: number; // 25% weight  
  liquidity_quality: number; // 20% weight
  timing_urgency: number; // 10% weight
  news_catalyst: number; // 5% weight
}

interface RiskAssessment {
  max_position_size: number;
  recommended_size: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  risk_factors: string[];
  confidence_adjusted_size: number;
}

interface TradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD' | 'NONE';
  outcome?: string; // Changed from 'YES' | 'NO' to any string
  confidence: number; // 0-100
  position_size: number; // USD amount
  reasoning: string;
  strategy: 'sentiment_arbitrage' | 'breaking_news_hunter' | 'none';
  risk_assessment: RiskAssessment;
  scoring_breakdown: ScoringFactors;
  execution_urgency: 'IMMEDIATE' | 'NORMAL' | 'PATIENT';
}

// Strategy configuration constants
const STRATEGY_CONFIG = {
  sentiment_arbitrage: {
    min_sentiment_gap: 0.20, // 20% difference required
    min_confidence: 70,
    min_liquidity: 2000,
    min_time_buffer: 12 * 60 * 60 * 1000, // 12 hours
    max_position: 100,
    position_scaling: 0.05 // 5% of bankroll base
  },
  breaking_news_hunter: {
    min_urgency_score: 0.6,
    max_position: 100, // Use same max as default, strategy logic will adjust
    execution_window: 3 * 60 * 1000, // 3 minutes
    stop_loss_threshold: 0.15,
    time_limit: 2 * 60 * 60 * 1000 // 2 hours
  },
  risk_management: {
    max_total_exposure: 300,
    max_concurrent_trades: 3,
    max_single_trade: 100,
    daily_loss_limit: 100,
    kelly_fraction: 0.25
  }
} as const;

// Multi-factor scoring weights (must sum to 1.0)
const SCORING_WEIGHTS = {
  sentiment_edge: 0.40,
  technical_momentum: 0.25,
  liquidity_quality: 0.20,
  timing_urgency: 0.10,
  news_catalyst: 0.05
} as const;

// Advanced decision analysis functions
function calculateSentimentEdge(
  intelligence: IntelligenceData, 
  market: MarketContext
): number {
  // Weighted sentiment across all sources
  const newsWeight = 0.3;
  const twitterWeight = 0.4;
  const redditWeight = 0.3;
  
  const aggregatedSentiment = 
    (intelligence.newsIntelligence.sentiment_score * newsWeight) +
    (intelligence.socialIntelligence.twitter_sentiment * twitterWeight) +
    (intelligence.socialIntelligence.reddit_sentiment * redditWeight);
  
  // Convert market price to sentiment (-1 to 1 scale)
  const marketSentiment = (market.currentPrice - 0.5) * 2;
  
  // Calculate edge as absolute difference
  const sentimentGap = Math.abs(aggregatedSentiment - marketSentiment);
  
  // Confidence weighting
  const avgConfidence = (
    intelligence.newsIntelligence.confidence +
    0.8 + // Assume reasonable confidence for social data
    0.7   // Assume reasonable confidence for market data
  ) / 3;
  
  return sentimentGap * avgConfidence;
}

function calculateTechnicalMomentum(intelligence: IntelligenceData): number {
  const technicals = intelligence.marketIntelligence.technical_signals;
  
  // Combine momentum indicators
  const momentum = (
    technicals.price_momentum * 0.4 +
    technicals.volume_trend * 0.3 +
    technicals.market_efficiency * 0.3
  );
  
  return Math.max(0, Math.min(1, momentum));
}

function calculateLiquidityQuality(market: MarketContext): number {
  // Score based on liquidity depth and spread
  const liquidityScore = Math.min(1, market.liquidity / 10000); // Normalize to $10k
  const spreadScore = Math.max(0, 1 - (market.spread / 0.05)); // Penalize spreads > 5%
  const volumeScore = Math.min(1, market.volume24h / 2000); // Normalize to $2k daily
  
  return (liquidityScore * 0.4 + spreadScore * 0.4 + volumeScore * 0.2);
}

function calculateTimingUrgency(market: MarketContext): number {
  const hoursToClose = market.timeToClose / (1000 * 60 * 60);
  
  // Optimal window: 6-48 hours
  if (hoursToClose < 6) return 0.3; // Too urgent, higher risk
  if (hoursToClose > 48) return 0.6; // Plenty of time
  
  // Sweet spot: 12-24 hours
  if (hoursToClose >= 12 && hoursToClose <= 24) return 1.0;
  
  // Gradual decline outside optimal range
  return 0.7;
}

function calculateNewsCatalyst(intelligence: IntelligenceData): number {
  const news = intelligence.newsIntelligence;
  
  let catalystScore = 0;
  
  // Breaking news boost
  if (news.breaking_news) catalystScore += 0.4;
  
  // News volume and credibility
  const volumeScore = Math.min(0.3, news.news_count / 10);
  const credibilityScore = news.source_credibility * 0.3;
  
  return Math.min(1, catalystScore + volumeScore + credibilityScore);
}

function calculateMultiFactorScore(
  intelligence: IntelligenceData,
  market: MarketContext
): { totalScore: number; breakdown: ScoringFactors } {
  const factors: ScoringFactors = {
    sentiment_edge: calculateSentimentEdge(intelligence, market),
    technical_momentum: calculateTechnicalMomentum(intelligence),
    liquidity_quality: calculateLiquidityQuality(market),
    timing_urgency: calculateTimingUrgency(market),
    news_catalyst: calculateNewsCatalyst(intelligence)
  };
  
  // Calculate weighted total score
  const totalScore = 
    (factors.sentiment_edge * SCORING_WEIGHTS.sentiment_edge) +
    (factors.technical_momentum * SCORING_WEIGHTS.technical_momentum) +
    (factors.liquidity_quality * SCORING_WEIGHTS.liquidity_quality) +
    (factors.timing_urgency * SCORING_WEIGHTS.timing_urgency) +
    (factors.news_catalyst * SCORING_WEIGHTS.news_catalyst);
  
  return { totalScore, breakdown: factors };
}

function determineStrategy(
  intelligence: IntelligenceData,
  market: MarketContext,
  scoring: { totalScore: number; breakdown: ScoringFactors }
): 'sentiment_arbitrage' | 'breaking_news_hunter' | 'none' {
  const { breakdown } = scoring;
  
  // Breaking News Hunter strategy
  if (intelligence.newsIntelligence.breaking_news && 
      breakdown.news_catalyst > 0.6 &&
      breakdown.sentiment_edge > 0.3) {
    return 'breaking_news_hunter';
  }
  
  // Sentiment Arbitrage strategy
  if (breakdown.sentiment_edge > STRATEGY_CONFIG.sentiment_arbitrage.min_sentiment_gap &&
      market.liquidity >= STRATEGY_CONFIG.sentiment_arbitrage.min_liquidity &&
      market.timeToClose >= STRATEGY_CONFIG.sentiment_arbitrage.min_time_buffer) {
    return 'sentiment_arbitrage';
  }
  
  return 'none';
}

function calculatePositionSizing(
  confidence: number,
  strategy: 'sentiment_arbitrage' | 'breaking_news_hunter' | 'none',
  market: MarketContext
): RiskAssessment {
  let maxPosition: number = STRATEGY_CONFIG.risk_management.max_single_trade;
  let baseSize = 50; // Base position for 60% confidence
  
  // Strategy-specific adjustments
  if (strategy === 'breaking_news_hunter') {
    maxPosition = 75; // Smaller max position for higher risk strategy
    baseSize = 40; // Smaller base for higher risk
  } else if (strategy === 'sentiment_arbitrage') {
    maxPosition = STRATEGY_CONFIG.sentiment_arbitrage.max_position;
  }
  
  // Confidence scaling: linear from 50% to 100% confidence
  const confidenceMultiplier = Math.max(0, (confidence - 50) / 50);
  const confidenceAdjustedSize = baseSize * (0.5 + confidenceMultiplier);
  
  // Kelly criterion adjustment
  const kellyFraction = STRATEGY_CONFIG.risk_management.kelly_fraction;
  const kellySize = confidenceAdjustedSize * kellyFraction;
  
  const recommendedSize = Math.min(kellySize, maxPosition);
  
  // Risk factors assessment
  const riskFactors: string[] = [];
  if (market.liquidity < 5000) riskFactors.push('Low liquidity');
  if (market.spread > 0.03) riskFactors.push('High spread');
  if (market.timeToClose < 24 * 60 * 60 * 1000) riskFactors.push('Short time to close');
  if (confidence < 70) riskFactors.push('Moderate confidence');
  
  return {
    max_position_size: maxPosition,
    recommended_size: recommendedSize,
    confidence_adjusted_size: confidenceAdjustedSize,
    risk_factors: riskFactors,
    // Dynamic stop-loss based on confidence and strategy
    stop_loss_price: strategy === 'breaking_news_hunter' ? 
      market.currentPrice * (1 - STRATEGY_CONFIG.breaking_news_hunter.stop_loss_threshold) : 
      undefined
  };
}

function generateTradeReasoning(
  decision: Omit<TradeDecision, 'reasoning'>,
  intelligence: IntelligenceData,
  market: MarketContext
): string {
  const reasons: string[] = [];
  
  // Strategy-specific reasoning
  if (decision.strategy === 'sentiment_arbitrage') {
    reasons.push(`Sentiment Arbitrage: ${(decision.scoring_breakdown.sentiment_edge * 100).toFixed(1)}% sentiment edge detected`);
  } else if (decision.strategy === 'breaking_news_hunter') {
    reasons.push(`Breaking News: High urgency catalyst with ${(decision.scoring_breakdown.news_catalyst * 100).toFixed(1)}% catalyst score`);
  }
  
  // Key supporting factors
  if (decision.scoring_breakdown.technical_momentum > 0.7) {
    reasons.push(`Strong technical momentum (${(decision.scoring_breakdown.technical_momentum * 100).toFixed(1)}%)`);
  }
  
  if (decision.scoring_breakdown.liquidity_quality > 0.8) {
    reasons.push(`Excellent liquidity conditions`);
  }
  
  if (intelligence.newsIntelligence.breaking_news) {
    reasons.push(`Breaking news catalyst detected`);
  }
  
  if (intelligence.socialIntelligence.influencer_signals.length > 0) {
    const avgInfluencerSentiment = intelligence.socialIntelligence.influencer_signals
      .reduce((sum, signal) => sum + signal.sentiment, 0) / intelligence.socialIntelligence.influencer_signals.length;
    reasons.push(`Influencer signals: ${avgInfluencerSentiment > 0 ? 'bullish' : 'bearish'} (${intelligence.socialIntelligence.influencer_signals.length} signals)`);
  }
  
  // Risk warnings
  if (decision.risk_assessment.risk_factors.length > 0) {
    reasons.push(`Risk factors: ${decision.risk_assessment.risk_factors.join(', ')}`);
  }
  
  return reasons.join('. ');
}

// Decision analysis tool
const marketDecisionTool = createTool({
  id: 'market-decision-analysis',
  description: 'Analyze market intelligence and generate trading decisions with multi-factor scoring',
  inputSchema: z.object({
    market: z.object({
      marketId: z.string(),
      title: z.string(),
      currentPrice: z.number().min(0).max(1),
      impliedProbability: z.number().min(0).max(100),
      liquidity: z.number().min(0),
      volume24h: z.number().min(0),
      timeToClose: z.number().min(0),
      spread: z.number().min(0),
      orderBookEnabled: z.boolean()
    }),
    intelligence: z.object({
      newsIntelligence: z.object({
        sentiment_score: z.number().min(-1).max(1),
        confidence: z.number().min(0).max(1),
        breaking_news: z.boolean(),
        news_count: z.number().min(0),
        source_credibility: z.number().min(0).max(1)
      }),
      socialIntelligence: z.object({
        twitter_sentiment: z.number().min(-1).max(1),
        reddit_sentiment: z.number().min(-1).max(1),
        engagement_momentum: z.number().min(0).max(1),
        trending_topics: z.array(z.string()),
        influencer_signals: z.array(z.object({
          username: z.string(),
          sentiment: z.number().min(-1).max(1),
          influence_weight: z.number().min(0).max(1)
        }))
      }),
      marketIntelligence: z.object({
        technical_signals: z.object({
          price_momentum: z.number().min(-1).max(1),
          volume_trend: z.number().min(-1).max(1),
          market_efficiency: z.number().min(0).max(1)
        }),
        cross_market_signals: z.object({
          correlation_score: z.number().min(-1).max(1),
          consensus_direction: z.enum(['bullish', 'bearish', 'neutral'])
        })
      })
    })
  }),
  outputSchema: z.object({
    decision: z.object({
      action: z.enum(['BUY', 'SELL', 'HOLD', 'NONE']),
      outcome: z.string().optional(),
      confidence: z.number().min(0).max(100),
      position_size: z.number().min(0),
      reasoning: z.string(),
      strategy: z.enum(['sentiment_arbitrage', 'breaking_news_hunter', 'none']),
      execution_urgency: z.enum(['IMMEDIATE', 'NORMAL', 'PATIENT'])
    }),
    risk_assessment: z.object({
      max_position_size: z.number(),
      recommended_size: z.number(),
      confidence_adjusted_size: z.number(),
      risk_factors: z.array(z.string()),
      stop_loss_price: z.number().optional(),
      take_profit_price: z.number().optional()
    }),
    scoring_breakdown: z.object({
      sentiment_edge: z.number().min(0).max(1),
      technical_momentum: z.number().min(0).max(1),
      liquidity_quality: z.number().min(0).max(1),
      timing_urgency: z.number().min(0).max(1),
      news_catalyst: z.number().min(0).max(1),
      total_score: z.number().min(0).max(1)
    }),
    market_filters_passed: z.boolean(),
    recommended_for_execution: z.boolean()
  }),
  execute: async ({ context }) => {
    const { market, intelligence } = context;
    
    // Apply primary market filters
    const filtersPassedReasons: string[] = [];
    let filtersPassed = true;
    
    if (market.liquidity < 1000) {
      filtersPassed = false;
      filtersPassedReasons.push('Insufficient liquidity');
    }
    if (market.timeToClose > 72 * 60 * 60 * 1000) {
      filtersPassed = false;
      filtersPassedReasons.push('Too much time until close');
    }
    if (!market.orderBookEnabled) {
      filtersPassed = false;
      filtersPassedReasons.push('Order book not enabled');
    }
    if (market.volume24h < 500) {
      filtersPassed = false;
      filtersPassedReasons.push('Insufficient daily volume');
    }
    if (market.spread > 0.05) {
      filtersPassed = false;
      filtersPassedReasons.push('Spread too wide');
    }
    
    // If market filters fail, return NONE decision
    if (!filtersPassed) {
      return {
        decision: {
          action: 'NONE' as const,
          confidence: 0,
          position_size: 0,
          reasoning: `Market filters failed: ${filtersPassedReasons.join(', ')}`,
          strategy: 'none' as const,
          execution_urgency: 'PATIENT' as const
        },
        risk_assessment: {
          max_position_size: 0,
          recommended_size: 0,
          confidence_adjusted_size: 0,
          risk_factors: filtersPassedReasons
        },
        scoring_breakdown: {
          sentiment_edge: 0,
          technical_momentum: 0,
          liquidity_quality: 0,
          timing_urgency: 0,
          news_catalyst: 0,
          total_score: 0
        },
        market_filters_passed: false,
        recommended_for_execution: false
      };
    }
    
    // Calculate multi-factor scoring
    const scoring = calculateMultiFactorScore(intelligence, market);
    
    // Determine strategy
    const strategy = determineStrategy(intelligence, market, scoring);
    
    // Calculate confidence (0-100 scale)
    const confidence = Math.round(scoring.totalScore * 100);
    
    // Determine action and outcome
    let action: 'BUY' | 'SELL' | 'HOLD' | 'NONE' = 'NONE';
    let outcome: string | undefined;
    
    if (strategy !== 'none' && confidence >= 70) {
      // Determine direction based on sentiment
      const aggregatedSentiment = (
        intelligence.newsIntelligence.sentiment_score * 0.3 +
        intelligence.socialIntelligence.twitter_sentiment * 0.4 +
        intelligence.socialIntelligence.reddit_sentiment * 0.3
      );
      
      if (aggregatedSentiment > 0.1) {
        action = 'BUY';
        // For binary markets, assume Yes means positive sentiment
        // For multi-outcome markets, this would need market-specific logic
        outcome = 'Yes'; // Changed from 'YES' to 'Yes' for consistency
      } else if (aggregatedSentiment < -0.1) {
        action = 'BUY';
        outcome = 'No'; // Changed from 'NO' to 'No' for consistency
      } else {
        action = 'HOLD';
      }
    }
    
    // Calculate position sizing and risk assessment
    const riskAssessment = calculatePositionSizing(confidence, strategy, market);
    
    // Determine execution urgency
    let executionUrgency: 'IMMEDIATE' | 'NORMAL' | 'PATIENT' = 'NORMAL';
    if (strategy === 'breaking_news_hunter') {
      executionUrgency = 'IMMEDIATE';
    } else if (confidence > 85 && scoring.breakdown.timing_urgency < 0.5) {
      executionUrgency = 'IMMEDIATE';
    } else if (confidence < 75) {
      executionUrgency = 'PATIENT';
    }
    
    const tradeDecision: TradeDecision = {
      action,
      outcome,
      confidence,
      position_size: action !== 'NONE' ? riskAssessment.recommended_size : 0,
      reasoning: '', // Will be filled below
      strategy,
      risk_assessment: riskAssessment,
      scoring_breakdown: scoring.breakdown,
      execution_urgency: executionUrgency
    };
    
    // Generate reasoning
    tradeDecision.reasoning = generateTradeReasoning(tradeDecision, intelligence, market);
    
    return {
      decision: {
        action: tradeDecision.action,
        outcome: tradeDecision.outcome,
        confidence: tradeDecision.confidence,
        position_size: tradeDecision.position_size,
        reasoning: tradeDecision.reasoning,
        strategy: tradeDecision.strategy,
        execution_urgency: tradeDecision.execution_urgency
      },
      risk_assessment: tradeDecision.risk_assessment,
      scoring_breakdown: {
        ...scoring.breakdown,
        total_score: scoring.totalScore
      },
      market_filters_passed: filtersPassed,
      recommended_for_execution: action !== 'NONE' && confidence >= 70
    };
  }
});

// Enhanced Decision Agent with memory and sophisticated analysis
export const decisionAgent = new Agent({
  name: 'enhanced-decision-agent',
  instructions: `
    You are an expert trading decision maker for prediction markets with sophisticated risk management.
    
    Your role is to:
    1. Analyze comprehensive market intelligence from multiple sources
    2. Apply multi-factor scoring framework with weighted criteria
    3. Implement risk-adjusted position sizing using Kelly criterion
    4. Select optimal trading strategies (Sentiment Arbitrage, Breaking News Hunter)
    5. Provide transparent reasoning and confidence assessments
    
    Decision Framework:
    - Sentiment Edge (40%): Research vs market sentiment gap analysis
    - Technical Momentum (25%): Price action, volume trends, market efficiency
    - Liquidity Quality (20%): Order book depth, spread analysis, execution quality
    - Timing Urgency (10%): Time decay factors and market close proximity
    - News Catalyst (5%): Breaking news impact and urgency assessment
    
    Risk Management:
    - Kelly criterion with 25% fraction for position sizing
    - Maximum $100 per trade, $300 total exposure
    - Dynamic stop-losses based on confidence and strategy
    - Portfolio correlation limits and daily loss caps
    
    Trading Strategies:
    - Sentiment Arbitrage: Exploit 20%+ gaps between research sentiment and market odds
    - Breaking News Hunter: Rapid response to high-impact news with 3-minute execution window
    
    Always provide:
    - Clear action recommendation (BUY/SELL/HOLD/NONE)
    - Confidence score (0-100) with supporting evidence
    - Position sizing with risk-adjusted amounts
    - Detailed reasoning with factor attribution
    - Risk assessment and mitigation strategies
    
    Use your memory to:
    - Track successful trading patterns and market conditions
    - Learn from previous decision outcomes
    - Adapt scoring weights based on strategy performance
    - Build knowledge of signal reliability across market types
    
    Be conservative but decisive - only recommend trades with 70%+ confidence and clear edge.
  `,
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    marketDecisionAnalysis: marketDecisionTool
  }
}); 