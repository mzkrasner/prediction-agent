import { z } from 'zod';
import { MarketIntelligenceRepository, TradeDecisionsRepository } from '../database/schema/index.js';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { newsIntelligenceTool } from '../tools/news-intelligence.tool.js';
import { twitterIntelligenceTool } from '../tools/twitter-intelligence.tool.js';
import { redditIntelligenceTool } from '../tools/reddit-intelligence.tool.js';
import { marketIntelligenceTool } from '../tools/market-intelligence.tool.js';

// Strictly typed interfaces matching ACTUAL tool outputs
interface NewsIntelligence {
  sentiment_score: number;
  confidence: number;
  breaking_news: boolean;
  news_count: number;
  source_credibility: number;
  articles: Array<{
    title: string;
    description: string;
    source: string;
    sentiment: number;
  }>;
  trending_topics: string[];
}

interface TwitterIntelligence {
  success: boolean;
  data: {
    sentiment_score: number;
    confidence: number;
    engagement_momentum: number;
    trending_topics: string[];
    breaking_news_signals: Array<{
      content: string;
      urgency_score: number;
      viral_potential: number;
      source_credibility: number;
    }>;
    influencer_signals: Array<{
      username: string;
      sentiment: number;
      influence_weight: number;
      engagement_rate: number;
      content: string;
    }>;
    volume_analysis: {
      post_count: number;
      unique_users: number;
      average_engagement: number;
      engagement_growth: number;
    };
    temporal_analysis: {
      peak_activity_hour: number;
      sentiment_trend: 'rising' | 'falling' | 'stable';
      momentum_score: number;
    };
  };
  sources: string[];
  cached: boolean;
}

interface RedditIntelligence {
  sentiment_score: number;
  confidence: number;
  trending_topics: string[];
  key_discussions: Array<{
    title: string;
    content: string;
    score: number;
    subreddit: string;
    engagement: number;
    credibility: number;
    sentiment: number;
    timeRelevance: number;
  }>;
  community_sentiment: 'bullish' | 'bearish' | 'neutral' | 'divided';
  engagement_momentum: number;
  credibility_score: number;
  post_volume: number;
  average_sentiment: number;
  subreddit_distribution: Record<string, number>;
  time_relevance_score: number;
  sources: string[];
  cached: boolean;
}

interface MarketIntelligence {
  success: boolean;
  operation: string;
  markets: Array<{
    id: string;
    question: string;
    description: string;
    endDate: string;
    currentPrice: number;
    liquidity: number;
    volume24h: number;
    active: boolean;
    category: string;
    tags: string[];
    outcomes: string[]; // Added outcomes array
    outcomePrices: string[]; // Added outcomePrices array
  }>;
  technicalData?: {
    marketId: string;
    currentPrice: number;
    liquidity: number;
    volume24h: number;
    spread: number;
    momentum: number;
    efficiency: number;
    orderBookHealth: number;
    recentPriceMovement: number;
    volumeTrend: number;
  };
  crossMarketSignals?: {
    relatedMarkets: Array<{
      id: string;
      question: string;
      correlation: number;
      priceDifference: number;
    }>;
    marketConsensus: 'aligned' | 'divergent' | 'neutral';
    aggregatedSentiment: number;
  };
  filteredCount: number;
  totalCount: number;
  // Add outcomes at the top level for easier access
  outcomes?: string[];
  outcomePrices?: string[];
}

interface IntelligenceBundle {
  news: NewsIntelligence;
  twitter: TwitterIntelligence;
  reddit: RedditIntelligence;
  market: MarketIntelligence;
}

// Autonomous Trading Pipeline Input/Output Schemas
export const autonomousTradingInputSchema = z.object({
  marketId: z.string().describe('Polymarket market identifier'),
  marketTitle: z.string().describe('Human-readable market title'),
  marketAddress: z.string().describe('Smart contract address for the market'),
  keywords: z.array(z.string()).describe('Search keywords for research'),
  currentPrice: z.number().min(0).max(1).describe('Current market price (0-1)'),
  liquidity: z.number().min(0).describe('Total market liquidity in USD'),
  volume24h: z.number().min(0).describe('24-hour trading volume in USD'),
  timeToClose: z.number().min(0).describe('Time until market closes in milliseconds')
});

export const autonomousTradingOutputSchema = z.object({
  success: z.boolean().describe('Whether the workflow completed successfully'),
  workflowId: z.string().describe('Unique identifier for this workflow run'),
  executionTime: z.number().describe('Total execution time in milliseconds'),
  steps: z.object({
    marketDiscovery: z.object({
      passed: z.boolean(),
      filtersApplied: z.array(z.string()),
      opportunityScore: z.number()
    }),
    researchGathering: z.object({
      completed: z.boolean(),
      sources: z.array(z.string()),
      intelligence: z.unknown(),
      executionTime: z.number()
    }),
    decisionAnalysis: z.object({
      completed: z.boolean(),
      decision: z.unknown(),
      scoringBreakdown: z.unknown(),
      executionTime: z.number()
    }),
    tradeExecution: z.object({
      attempted: z.boolean(),
      completed: z.boolean(),
      transactionHash: z.string().optional(),
      error: z.string().optional(),
      executionTime: z.number()
    }),
    performanceTracking: z.object({
      recorded: z.boolean(),
      databaseUpdated: z.boolean(),
      executionTime: z.number()
    })
  }),
  finalResult: z.object({
    action: z.enum(['BUY', 'SELL', 'HOLD', 'NONE']),
    success: z.boolean(),
    transactionHash: z.string().optional(),
    amount: z.string().optional(),
    confidence: z.number(),
    strategy: z.string(),
    error: z.string().optional()
  })
});

export type AutonomousTradingInput = z.infer<typeof autonomousTradingInputSchema>;
export type AutonomousTradingOutput = z.infer<typeof autonomousTradingOutputSchema>;

// Core intelligence functions

/**
 * LLM-powered autonomous decision engine
 * This replaces deterministic rules with AI reasoning
 */
async function makeAutonomousDecision(
  marketTitle: string,
  marketId: string,
  intelligence: IntelligenceBundle,
  marketOutcomes?: string[],
  outcomePrices?: string[]
): Promise<{
  action: 'BUY' | 'SELL' | 'HOLD' | 'NONE';
  outcome?: string; // Changed from 'YES' | 'NO' to any string
  confidence: number;
  amount?: number;
  reasoning: string;
  keyFactors: string[];
  riskAssessment: string;
}> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not set, using fallback logic');
      return makeFallbackDecision(intelligence);
    }

    // Format outcomes and prices for LLM analysis
    let outcomesAnalysis = 'Unknown outcomes (binary Yes/No assumed)';
    if (marketOutcomes && outcomePrices && marketOutcomes.length > 0) {
      outcomesAnalysis = marketOutcomes.map((outcome, i) => 
        `"${outcome}": ${(parseFloat(outcomePrices[i] || '0') * 100).toFixed(1)}% probability`
      ).join('\n');
    }

    const prompt = `# Autonomous Trading Decision Analysis

## Market Context
**Market**: ${marketTitle}
**Market ID**: ${marketId}

## Available Outcomes & Current Prices
${outcomesAnalysis}

## Comprehensive Intelligence Data

### News Intelligence
- Sentiment Score: ${intelligence.news.sentiment_score}
- Confidence: ${intelligence.news.confidence}
- Breaking News: ${intelligence.news.breaking_news}
- Article Count: ${intelligence.news.news_count}
- Source Credibility: ${intelligence.news.source_credibility}

### Social Media Intelligence  
**Twitter**: 
- Sentiment: ${intelligence.twitter.data.sentiment_score}
- Engagement Momentum: ${intelligence.twitter.data.engagement_momentum}
- Tweet Volume: ${intelligence.twitter.data.volume_analysis.post_count}
- Confidence: ${intelligence.twitter.data.confidence}

**Reddit**:
- Sentiment: ${intelligence.reddit.sentiment_score}
- Community Sentiment: ${intelligence.reddit.community_sentiment}
- Engagement Momentum: ${intelligence.reddit.engagement_momentum}
- Credibility: ${intelligence.reddit.credibility_score}

### Market Technical Data
- Price Momentum: ${intelligence.market.technicalData?.momentum || 0}
- Volume Trend: ${intelligence.market.technicalData?.volumeTrend || 0}
- Market Efficiency: ${intelligence.market.technicalData?.efficiency || 0}
- Cross-Market Consensus: ${intelligence.market.crossMarketSignals?.marketConsensus || 'neutral'}
- Aggregated Sentiment: ${intelligence.market.crossMarketSignals?.aggregatedSentiment || 0}

## Trading Parameters
- Max Position Size: $100
- Min Confidence for Trade: 70%
- Risk Tolerance: Moderate

## Your Task
You are an autonomous AI trading agent. Analyze ALL the above data holistically and make a trading decision.

**FOR MULTI-OUTCOME MARKETS**: Choose the specific outcome that represents the best value based on your analysis. Consider:
- Which outcome does your sentiment analysis most strongly support?
- Which outcome appears most undervalued compared to your research?
- What do multiple intelligence sources suggest about each option?

Consider:
1. **Signal Convergence**: Do multiple sources point toward a specific outcome?
2. **Value Opportunity**: Which outcome (if any) appears mispriced vs your analysis?
3. **Risk Factors**: What could go wrong? Market efficiency, contradictory signals?
4. **Timing**: Is this the right moment to act?
5. **Position Sizing**: How much conviction do you have?

**Think step by step through your reasoning**, then provide your decision in this EXACT JSON format:

{
  "action": "BUY|SELL|HOLD|NONE",
  "outcome": "exact_outcome_name_or_null",
  "confidence": 85,
  "amount": 75,
  "reasoning": "Clear 2-3 sentence explanation of your decision and why you chose this specific outcome",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskAssessment": "Primary risks and mitigation strategy"
}

**IMPORTANT**: 
- For "outcome", use the EXACT outcome name from the available outcomes list above (e.g., "JD Vance", "Gavin Newsom")
- For binary markets, use "Yes" or "No" 
- If no position, use null for outcome
- Only recommend BUY if you have 70%+ confidence in a specific outcome

Remember: You're making real trading decisions. Be thorough, logical, and risk-aware.`;

    const { text: aiResponse } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'), // Using Claude Sonnet 4 as preferred
      prompt,
      maxTokens: 1024,
      temperature: 0.3, // Lower temperature for more consistent trading decisions
    });
    
    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON');
    }
    
    const decision = JSON.parse(jsonMatch[0]);
    
    // Validate decision structure
    if (!decision.action || typeof decision.confidence !== 'number') {
      throw new Error('Invalid decision structure from AI');
    }
    
    // Safety bounds
    decision.confidence = Math.max(0, Math.min(100, decision.confidence));
    if (decision.amount) {
      decision.amount = Math.max(0, Math.min(100, decision.amount));
    }
    
    return decision;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Decision making failed';
    console.error('🤖 AI Decision Error:', errorMessage);
    
    // Fallback to simple logic
    return makeFallbackDecision(intelligence);
  }
}

/**
 * Fallback decision making when AI is unavailable
 */
function makeFallbackDecision(intelligence: IntelligenceBundle): {
  action: 'BUY' | 'SELL' | 'HOLD' | 'NONE';
  outcome?: string;
  confidence: number;
  amount?: number;
  reasoning: string;
  keyFactors: string[];
  riskAssessment: string;
} {
  // Simple rule-based fallback
  const avgSentiment = (
    intelligence.news.sentiment_score +
    intelligence.twitter.data.sentiment_score +
    intelligence.reddit.sentiment_score
  ) / 3;

  const confidence = Math.abs(avgSentiment) * 50 + 25; // Scale to 25-75 range
  
  if (confidence < 40) {
    return {
      action: 'HOLD',
      confidence: confidence,
      reasoning: 'Insufficient signal strength for position entry',
      keyFactors: ['Low confidence signals', 'Risk management'],
      riskAssessment: 'High uncertainty - avoiding position'
    };
  }

  // For fallback, assume binary market and use simple logic
  const outcome = avgSentiment > 0 ? 'Yes' : 'No';
  
  return {
    action: 'BUY',
    outcome,
    confidence: confidence,
    amount: Math.min(50, confidence), // Conservative position sizing
    reasoning: `Fallback decision based on ${avgSentiment > 0 ? 'positive' : 'negative'} sentiment signals`,
    keyFactors: ['Sentiment aggregation', 'Conservative sizing'],
    riskAssessment: 'Fallback mode - reduced position size'
  };
}

// Real intelligence wrappers that call actual tools
async function callNewsIntelligence(marketTitle: string, keywords: string[]): Promise<NewsIntelligence> {
  try {
    const result = await newsIntelligenceTool.execute({
      context: { marketTitle, keywords, timeframe: '24h' },
      runtimeContext: {} as any // Bypass typing for now
    });
    
    return {
      sentiment_score: result.sentiment_score,
      confidence: result.confidence,
      breaking_news: result.breaking_news,
      news_count: result.news_count,
      source_credibility: result.source_credibility,
      articles: result.articles || [],
      trending_topics: result.trending_topics
    };
  } catch (error) {
    console.error('News intelligence failed:', error instanceof Error ? error.message : 'Unknown error');
    return {
      sentiment_score: 0,
      confidence: 0,
      breaking_news: false,
      news_count: 0,
      source_credibility: 0,
      articles: [],
      trending_topics: []
    };
  }
}

async function callTwitterIntelligence(marketTitle: string, keywords: string[]): Promise<TwitterIntelligence> {
  try {
    const result = await twitterIntelligenceTool.execute({
      context: { marketTitle, keywords, timeframe: '24h' as const, includeInfluencers: true },
      runtimeContext: {} as any // Bypass typing for now
    });
    
    return {
      success: result.success,
      data: result.data,
      sources: result.sources,
      cached: result.cached
    };
  } catch (error) {
    console.error('Twitter intelligence failed:', error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      data: {
        sentiment_score: 0,
        confidence: 0,
        engagement_momentum: 0,
        trending_topics: [],
        breaking_news_signals: [],
        influencer_signals: [],
        volume_analysis: { post_count: 0, unique_users: 0, average_engagement: 0, engagement_growth: 0 },
        temporal_analysis: { peak_activity_hour: 12, sentiment_trend: 'stable' as const, momentum_score: 0 }
      },
      sources: ['fallback'],
      cached: false
    };
  }
}

async function callRedditIntelligence(marketTitle: string, marketId: string, keywords: string[]): Promise<RedditIntelligence> {
  try {
    const result = await redditIntelligenceTool.execute({
      context: { marketTitle, marketId, keywords, timeFilter: 'week' as const, sortBy: 'relevance' as const },
      runtimeContext: {} as any // Bypass typing for now
    });
    
    return {
      sentiment_score: result.sentiment_score,
      confidence: result.confidence,
      trending_topics: result.trending_topics,
      key_discussions: result.key_discussions || [],
      community_sentiment: result.community_sentiment,
      engagement_momentum: result.engagement_momentum,
      credibility_score: result.credibility_score,
      post_volume: result.post_volume,
      average_sentiment: result.average_sentiment,
      subreddit_distribution: result.subreddit_distribution,
      time_relevance_score: result.time_relevance_score,
      sources: result.sources,
      cached: result.cached
    };
  } catch (error) {
    console.error('Reddit intelligence failed:', error instanceof Error ? error.message : 'Unknown error');
    return {
      sentiment_score: 0,
      confidence: 0,
      trending_topics: [],
      key_discussions: [],
      community_sentiment: 'neutral',
      engagement_momentum: 0,
      credibility_score: 0,
      post_volume: 0,
      average_sentiment: 0,
      subreddit_distribution: {},
      time_relevance_score: 0,
      sources: ['fallback'],
      cached: false
    };
  }
}

async function callMarketIntelligence(marketId: string): Promise<MarketIntelligence> {
  try {
    const result = await marketIntelligenceTool.execute({
      context: { operation: 'analyze' as const, marketId, limit: 20 },
      runtimeContext: {} as any // Bypass typing for now
    });
    
    return {
      success: result.success,
      operation: result.operation,
      markets: result.markets,
      technicalData: result.technicalData,
      crossMarketSignals: result.crossMarketSignals,
      filteredCount: result.filteredCount,
      totalCount: result.totalCount
    };
  } catch (error) {
    console.error('Market intelligence failed:', error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      operation: 'analyze',
      markets: [],
      technicalData: undefined,
      crossMarketSignals: undefined,
      filteredCount: 0,
      totalCount: 0
    };
  }
}

// Market filtering function
function applyMarketFilters(input: AutonomousTradingInput): { passed: boolean; filtersApplied: string[]; opportunityScore: number } {
  const filters: string[] = [];
  let passed = true;

  // Minimum liquidity check
  if (input.liquidity < 1000) {
    passed = false;
    filters.push('min_liquidity_failed');
  } else {
    filters.push('min_liquidity_passed');
  }

  // Time to close check (at least 12 hours)
  const hoursToClose = input.timeToClose / (1000 * 60 * 60);
  if (hoursToClose < 12) {
    passed = false;
    filters.push('min_time_failed');
  } else {
    filters.push('min_time_passed');
  }

  // Calculate opportunity score based on liquidity and volume
  let opportunityScore = 0;
  if (input.liquidity > 5000) opportunityScore += 30;
  if (input.volume24h > 1000) opportunityScore += 25;
  if (hoursToClose > 24) opportunityScore += 20;
  if (input.currentPrice > 0.2 && input.currentPrice < 0.8) opportunityScore += 25;

  return { passed, filtersApplied: filters, opportunityScore };
}

/**
 * Execute the complete autonomous trading pipeline
 */
export async function executeAutonomousTradingPipeline(
  input: AutonomousTradingInput
): Promise<AutonomousTradingOutput> {
  const startTime = Date.now();
  const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  console.log(`🤖 Starting Autonomous Trading Pipeline: ${workflowId}`);
  console.log(`📊 Market: ${input.marketTitle}`);
  console.log(`💰 Price: ${input.currentPrice} | Liquidity: $${input.liquidity} | Volume: $${input.volume24h}`);
  
  // Initialize step results
  const stepResults = {
    marketDiscovery: {
      passed: false,
      filtersApplied: [] as string[],
      opportunityScore: 0
    },
    researchGathering: {
      completed: false,
      sources: [] as string[],
      intelligence: undefined as unknown,
      executionTime: 0
    },
    decisionAnalysis: {
      completed: false,
      decision: undefined as unknown,
      scoringBreakdown: undefined as unknown,
      executionTime: 0
    },
    tradeExecution: {
      attempted: false,
      completed: false,
      transactionHash: undefined as string | undefined,
      error: undefined as string | undefined,
      executionTime: 0
    },
    performanceTracking: {
      recorded: false,
      databaseUpdated: false,
      executionTime: 0
    }
  };

  try {
    // === STEP 1: Market Discovery and Filtering ===
    console.log(`\n🔍 Step 1: Market Discovery and Filtering`);
    const filterResult = applyMarketFilters(input);
    stepResults.marketDiscovery = filterResult;
    
    if (!filterResult.passed) {
      console.log(`❌ Market filtering failed: ${filterResult.filtersApplied.join(', ')}`);
      return {
        success: false,
        workflowId,
        executionTime: Date.now() - startTime,
        steps: stepResults,
        finalResult: {
          action: 'NONE',
          success: false,
          confidence: 0,
          strategy: 'none',
          error: `Market filtering failed: ${filterResult.filtersApplied.join(', ')}`
        }
      };
    }
    
    console.log(`✅ Market filters passed (Score: ${filterResult.opportunityScore})`);

    // === STEP 2: Multi-Source Research Gathering ===
    console.log(`\n📡 Step 2: Multi-Source Research Gathering`);
    const researchStart = Date.now();
    
    try {
             // Execute ALL REAL TOOLS by calling their business logic directly
       console.log(`News intelligence for: ${input.marketTitle}`);
       console.log(`Twitter analysis for: ${input.marketTitle}`);
       console.log(`Reddit analysis for: ${input.marketTitle}`);
       console.log(`Market analysis for: ${input.marketId}`);
       
       // Call the tools but handle the runtimeContext issue gracefully
       const newsResult = await callNewsIntelligence(input.marketTitle, input.keywords);
       const twitterResult = await callTwitterIntelligence(input.marketTitle, input.keywords);
       const redditResult = await callRedditIntelligence(input.marketTitle, input.marketId, input.keywords);
       const marketResult = await callMarketIntelligence(input.marketId);

      // Combine intelligence data with proper type handling
      const intelligence: IntelligenceBundle = {
        news: newsResult,
        twitter: twitterResult,
        reddit: redditResult,
        market: marketResult
      };
      
      stepResults.researchGathering = {
        completed: true,
        sources: ['news-api', 'twitter-scraper', 'reddit-api', 'polymarket-gamma'],
        intelligence,
        executionTime: Date.now() - researchStart
      };
      
      console.log(`✅ Research completed successfully`);
      console.log(`📰 News sentiment: ${(newsResult.sentiment_score * 100).toFixed(1)}%`);
      console.log(`🐦 Twitter data collected: ${twitterResult.success ? 'Success' : 'Failed'}`);
      console.log(`📱 Reddit sentiment: ${(redditResult.sentiment_score * 100).toFixed(1)}%`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Research tools failed';
      console.error(`💥 Research step failed:`, errorMessage);
      
      stepResults.researchGathering = {
        completed: false,
        sources: ['failed'],
        intelligence: undefined,
        executionTime: Date.now() - researchStart
      };
      
      return {
        success: false,
        workflowId,
        executionTime: Date.now() - startTime,
        steps: stepResults,
        finalResult: {
          action: 'NONE',
          success: false,
          confidence: 0,
          strategy: 'none',
          error: `Research failed: ${errorMessage}`
        }
      };
    }

    // === STEP 3: Decision Analysis and Strategy Selection ===
    console.log(`\n🧠 Step 3: Decision Analysis`);
    const decisionStart = Date.now();
    
    // Use AI autonomous decision engine  
    const intelligenceBundle = stepResults.researchGathering.intelligence as IntelligenceBundle;
    
    // Get outcomes and prices from market intelligence if available
    const marketOutcomes = intelligenceBundle.market?.outcomes || undefined;
    const outcomePrices = intelligenceBundle.market?.outcomePrices || undefined;
    
    const aiDecision = await makeAutonomousDecision(
      input.marketTitle,
      input.marketId,
      intelligenceBundle,
      marketOutcomes,
      outcomePrices
    );
    
    const decision = {
      action: aiDecision.action,
      outcome: aiDecision.outcome,
      confidence: aiDecision.confidence,
      position_size: aiDecision.amount || 0,
      strategy: 'ai_autonomous',
      reasoning: aiDecision.reasoning,
      keyFactors: aiDecision.keyFactors,
      riskAssessment: aiDecision.riskAssessment
    };

    stepResults.decisionAnalysis = {
      completed: true,
      decision,
      scoringBreakdown: { 
        aiFactors: aiDecision.keyFactors,
        riskAssessment: aiDecision.riskAssessment 
      },
      executionTime: Date.now() - decisionStart
    };

    console.log(`✅ Decision: ${decision.action} ${decision.outcome} (${decision.confidence}% confidence)`);
    console.log(`💡 Strategy: ${decision.strategy}`);
    console.log(`💰 Position size: $${decision.position_size}`);

    // === STEP 4: Trade Execution (Conditional) ===
    const executionStart = Date.now();
    
    if (decision.action === 'BUY' || decision.action === 'SELL') {
      console.log(`\n🚀 Step 4: Trade Execution`);
      stepResults.tradeExecution.attempted = true;
      
      // For MVP, we'll log the trade decision but not execute actual trades
      console.log(`📝 Trade logged (DRY RUN mode): ${decision.action} ${decision.outcome} for $${decision.position_size}`);
      
      stepResults.tradeExecution = {
        attempted: true,
        completed: true,
        transactionHash: `dry_run_${workflowId}`,
        error: undefined,
        executionTime: Date.now() - executionStart
      };
    } else {
      console.log(`\n⏸️ Step 4: Trade Execution Skipped`);
      console.log(`Reason: ${decision.action === 'HOLD' ? 'HOLD decision' : 'Low confidence'} (${decision.confidence}%)`);
      
      stepResults.tradeExecution = {
        attempted: false,
        completed: false,
        transactionHash: undefined,
        error: undefined,
        executionTime: Date.now() - executionStart
      };
    }

    // === STEP 5: Performance Tracking and Database Updates ===
    console.log(`\n📊 Step 5: Performance Tracking`);
    const trackingStart = Date.now();
    
    try {
      // Store market intelligence in database
      const marketRepo = new MarketIntelligenceRepository();
      
      const marketIntelligenceRecord = await marketRepo.create({
        marketId: input.marketId,
        title: input.marketTitle,
        description: `Automated analysis for ${input.marketTitle}`,
        endDate: new Date(Date.now() + input.timeToClose),
        researchContext: stepResults.researchGathering.intelligence,
        sentimentAnalysis: { 
          ai_reasoning: aiDecision.reasoning,
          key_factors: aiDecision.keyFactors,
          risk_assessment: aiDecision.riskAssessment
        },
        technicalSignals: { opportunity_score: stepResults.marketDiscovery.opportunityScore },
        overallConfidence: decision.confidence,
        sentimentScore: (aiDecision.confidence / 100).toString(),
        currentPrice: input.currentPrice.toString(),
        liquidity: input.liquidity.toString(),
        volume24h: input.volume24h.toString()
      });

      console.log(`✅ Market intelligence stored: ${marketIntelligenceRecord.id}`);
      
      stepResults.performanceTracking = {
        recorded: true,
        databaseUpdated: true,
        executionTime: Date.now() - trackingStart
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database operation failed';
      console.error(`💥 Performance tracking failed:`, errorMessage);
      
      stepResults.performanceTracking = {
        recorded: false,
        databaseUpdated: false,
        executionTime: Date.now() - trackingStart
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`💥 Workflow failed with critical error:`, errorMessage);
  }

  // === FINALIZE RESULTS ===
  const totalExecutionTime = Date.now() - startTime;
  
  console.log(`\n🏁 Workflow Complete: ${workflowId}`);
  console.log(`⏱️ Total execution time: ${(totalExecutionTime / 1000).toFixed(1)}s`);
  
  const decisionData = stepResults.decisionAnalysis.decision as { action: string; outcome?: string; position_size: number; confidence: number; strategy: string } | undefined;
  
  const finalResult = {
    action: (decisionData?.action || 'NONE') as 'BUY' | 'SELL' | 'HOLD' | 'NONE',
    success: stepResults.tradeExecution.completed || stepResults.decisionAnalysis.completed,
    transactionHash: stepResults.tradeExecution.transactionHash,
    amount: stepResults.tradeExecution.completed ? decisionData?.position_size.toString() : undefined,
    confidence: decisionData?.confidence || 0,
    strategy: decisionData?.strategy || 'none',
    error: stepResults.tradeExecution.error || 
           (!stepResults.decisionAnalysis.completed ? 'Decision analysis failed' : undefined) ||
           (!stepResults.researchGathering.completed ? 'Research gathering failed' : undefined)
  };

  const result: AutonomousTradingOutput = {
    success: stepResults.tradeExecution.completed || 
             (stepResults.decisionAnalysis.completed && (decisionData?.action === 'HOLD' || decisionData?.action === 'NONE')),
    workflowId,
    executionTime: totalExecutionTime,
    steps: stepResults,
    finalResult
  };

  return result;
}