# App Specification: **Polymarket Agent MVP**

## Overview

**Polymarket Agent** is an autonomous agentic system built with [Mastra](https://mastra.ai/en/docs) that monitors active prediction markets on Polymarket, gathers external contextual information through multiple data sources, evaluates trading opportunities using sophisticated heuristics, and autonomously executes trades via secure wallet integration.

The system leverages Mastra's agent/workflow orchestration capabilities with a secure EVM MCP Server for blockchain transaction handling, providing users with automated, data-driven prediction market trading with real-time social media and news analysis.

---

## Core User Value

- **Autonomous Market Analysis**: 24/7 monitoring and evaluation of prediction markets with multi-source data synthesis
- **Intelligent Decision Making**: Context-aware trading decisions based on market odds, breaking news, social sentiment, and configurable strategies  
- **Secure Trade Execution**: Safe autonomous execution through secure EVM MCP Server with comprehensive audit trails
- **Information Advantage**: Process vast amounts of data from news, social media, and on-chain sources faster than human traders
- **Transparent Operations**: Complete logging of all agent actions, data sources, decisions, and rationale

---

## MVP Scope (V1.0)

### ✅ Included

- **Multi-Source Data Ingestion**: Real-time news, Twitter sentiment, Reddit discussions, official data feeds
- **Market Data Analysis**: Polymarket Gamma API integration with intelligent filtering and cross-market analysis
- **Advanced Research Engine**: Twitter scraping, news aggregation, social sentiment analysis, trending detection
- **Heuristic Decision Engine**: Multi-factor scoring with sentiment analysis, momentum detection, and risk assessment
- **Secure Trade Execution**: EVM MCP Server integration for transaction signing with slippage protection
- **Comprehensive Analytics**: Performance tracking, signal attribution, and strategy optimization
- **Development Interface**: CLI for testing, configuration, monitoring, and manual triggers

### ❌ Explicitly Out of Scope

- Machine learning model training (uses rule-based heuristics)
- Real-time streaming WebSocket connections (uses optimized polling)
- Multi-position portfolio management and correlation analysis
- Cross-platform arbitrage (Polymarket only)
- User interface beyond CLI operations
- Backtesting framework and historical simulation

---

## Enhanced Data Sources & Intelligence

### 🏆 **Tier 1: Core Intelligence Sources**

#### **Real-Time News Intelligence**
```typescript
interface NewsIntelligence {
  newsapi: "NewsAPI.org - 70+ sources, 24/7 coverage",
  financial_news: "Alpha Vantage News - Market-focused content",
  government_feeds: "RSS aggregation - Official announcements",
  breaking_detection: "Speed advantage: 15-30 min before mainstream"
}
```

#### **Social Media Sentiment Engine**
```typescript
interface SocialIntelligence {
  twitter: {
    source: "@the-convocation/twitter-scraper",
    capabilities: [
      "Real-time tweet search without API limits",
      "Influencer monitoring (politicians, analysts, insiders)",
      "Trending topic detection before mainstream adoption",
      "Sentiment analysis with engagement weighting"
    ],
    update_frequency: "Every 5 minutes for breaking events"
  },
  reddit: {
    source: "Reddit API",
    capabilities: [
      "Community sentiment in relevant subreddits",
      "Early discussion detection",
      "Post velocity and engagement analysis"
    ],
    key_subreddits: ["r/PredictionMarkets", "r/politics", "r/Economics", "r/wallstreetbets"]
  }
}
```

#### **Market & On-Chain Intelligence**
```typescript
interface MarketIntelligence {
  polymarket_cross_reference: "Compare odds across all similar markets",
  whale_tracking: "Large wallet movements and smart money flows",
  volume_analysis: "Unusual trading activity detection",
  order_book_analysis: "Liquidity depth and spread monitoring"
}
```

### 🥈 **Tier 2: Competitive Advantage Sources**

#### **Official & Government Data**
```typescript
interface OfficialSources {
  economic: {
    fed: "Federal Reserve communications and data releases",
    bls: "Bureau of Labor Statistics - Employment data",
    census: "Economic indicators and demographic trends"
  },
  political: {
    fec: "Campaign finance filings and spending",
    congress: "Legislative activity and voting records",
    polls: "Aggregated polling data from multiple sources"
  }
}
```

#### **Alternative Intelligence**
```typescript
interface AlternativeData {
  google_trends: "Search interest and regional variations",
  prediction_markets: "Cross-platform odds comparison",
  academic_research: "Early research and preprint analysis",
  think_tanks: "Policy research and expert analysis"
}
```

---

## Agent Architecture

### 🤖 Core Agents (Mastra Agents)

#### **Enhanced ResearchAgent**
```typescript
interface ResearchAgent {
  purpose: "Multi-source intelligence gathering and synthesis",
  data_sources: [
    "Twitter sentiment and trending analysis",
    "News aggregation with relevance scoring", 
    "Reddit community discussions",
    "Official government data feeds",
    "Google Trends analysis"
  ],
  output: "Comprehensive research context with signal strength",
  llm_integration: "GPT-4o for content synthesis and pattern detection"
}
```

#### **Advanced DecisionAgent** 
```typescript
interface DecisionAgent {
  purpose: "Multi-factor market evaluation with sentiment analysis",
  inputs: [
    "Market technical data (price, volume, liquidity)",
    "Social sentiment scores and momentum",
    "News impact assessment",
    "Cross-market correlation analysis",
    "Time decay and urgency factors"
  ],
  output: "Trade decision with confidence, reasoning, and risk assessment",
  scoring_framework: "Weighted multi-criteria decision matrix"
}
```

#### **SecureExecutionAgent**
```typescript
interface ExecutionAgent {
  purpose: "Risk-managed trade execution with monitoring",
  features: [
    "Position sizing based on confidence levels",
    "Slippage protection and limit orders",
    "Real-time execution monitoring",
    "Failure recovery and retry logic"
  ],
  integration: "EVM MCP Server with transaction simulation and multi-network support"
}
```

### 🔄 Enhanced Workflow Orchestration

**AutonomousTradingWorkflow** - Complete intelligence-to-execution pipeline:

1. **Market Discovery** → Fetch and filter active markets with opportunity scoring
2. **Multi-Source Research** → Parallel data gathering from all intelligence sources  
3. **Signal Analysis** → Sentiment synthesis, trend detection, momentum calculation
4. **Decision Matrix** → Multi-factor evaluation with risk-adjusted position sizing
5. **Execution Planning** → Order optimization with slippage and timing analysis
6. **Trade Execution** → Secure submission with real-time monitoring
7. **Performance Tracking** → Signal attribution and strategy effectiveness analysis

---

## Comprehensive Data Flow

### 🔄 Enhanced Execution Cycle

**1️⃣ Intelligent Market Discovery**
```typescript
interface MarketDiscovery {
  polymarket_scan: "Fetch all active markets with metadata",
  initial_filtering: {
    min_liquidity: "$1,000",
    max_time_to_close: "72 hours",
    orderbook_enabled: true,
    min_volume: "$500 daily"
  },
  opportunity_scoring: "Rank markets by potential for mispricing",
  monitoring_frequency: "Every 15 minutes"
}
```

**2️⃣ Multi-Source Intelligence Gathering**
```typescript
interface IntelligenceGathering {
  parallel_research: {
    twitter_sentiment: "Real-time tweet analysis and influencer monitoring",
    news_analysis: "Breaking news detection and sentiment scoring",
    reddit_discussions: "Community sentiment and early signals",
    official_data: "Government releases and economic indicators",
    market_technicals: "Price action, volume, and order book analysis"
  },
  processing_time: "30-60 seconds per market",
  relevance_filtering: "AI-powered content relevance scoring"
}
```

**3️⃣ Advanced Signal Synthesis**
```typescript
interface SignalSynthesis {
  sentiment_aggregation: "Weighted sentiment across all sources",
  momentum_detection: "Trend acceleration and velocity analysis", 
  confidence_calculation: "Signal strength and reliability scoring",
  contrarian_analysis: "Identification of crowd vs smart money",
  timing_analysis: "Optimal entry point determination"
}
```

**4️⃣ Risk-Adjusted Decision Making**
```typescript
interface DecisionFramework {
  multi_factor_scoring: {
    sentiment_edge: "40% - Research vs market sentiment gap",
    technical_momentum: "25% - Price and volume trend analysis", 
    liquidity_quality: "20% - Order book depth and spread",
    timing_urgency: "10% - Time decay and market close proximity",
    news_catalyst: "5% - Breaking news and event impact"
  },
  risk_management: {
    position_sizing: "Kelly criterion with confidence scaling",
    max_exposure: "$100 per trade, $300 total exposure",
    stop_loss_logic: "Dynamic based on volatility and confidence"
  }
}
```

**5️⃣ Optimized Trade Execution**
```typescript
interface TradeExecution {
  order_optimization: "Limit orders with optimal pricing",
  slippage_protection: "Maximum 2% slippage tolerance",
  execution_monitoring: "Real-time status tracking and failure recovery",
  gas_optimization: "Polygon network fee management"
}
```

**6️⃣ Performance Analytics & Learning**
```typescript
interface PerformanceTracking {
  trade_attribution: "Which signals contributed to successful trades",
  strategy_optimization: "Continuous improvement of scoring weights",
  market_adaptation: "Adjustment to changing market conditions",
  alert_system: "Notifications for significant events or performance issues"
}
```

---

## Architecture & Tech Stack

### 🏛 Enhanced Framework
- **Core Framework**: [Mastra](https://mastra.ai/en/docs) (@mastra/core, TypeScript-native) - See [Mastra Framework Implementation Guide](#mastra-framework-implementation-guide) for complete setup
- **Runtime**: Node.js 18+ with TypeScript and ES modules
- **Process Management**: PM2 with clustering for production deployment
- **Database**: Supabase (PostgreSQL) with Drizzle ORM for type-safe database operations
- **Caching**: Redis for market data and API response caching

### 🛠 Enhanced Mastra Tools

#### **TwitterIntelligenceTool**
```typescript
interface TwitterIntelligenceTool {
  library: "@the-convocation/twitter-scraper",
  capabilities: {
    sentiment_analysis: "Real-time tweet sentiment with engagement weighting",
    influencer_monitoring: "Track key accounts relevant to markets",
    trending_detection: "Identify emerging topics before mainstream",
    breaking_news_alerts: "High-engagement content detection"
  },
  rate_limiting: "Built-in with intelligent backoff",
  data_processing: "GPT-4o for sentiment analysis and relevance scoring"
}
```

#### **NewsIntelligenceTool**
```typescript
interface NewsIntelligenceTool {
  primary_sources: {
    newsapi: "Broad coverage with 70+ sources",
    alpha_vantage: "Financial and market-focused news",
    rss_feeds: "Government and official announcements"
  },
  processing: {
    relevance_scoring: "AI-powered content matching to markets",
    sentiment_analysis: "Bullish/bearish impact assessment",
    urgency_detection: "Breaking news identification",
    source_reliability: "Weighted scoring by source credibility"
  }
}
```

#### **RedditIntelligenceTool**
```typescript
interface RedditIntelligenceTool {
  authentication: {
    method: "OAuth2 Client Credentials Flow",
    endpoint: "https://www.reddit.com/api/v1/access_token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "PolymarketAgent/1.0 (by /u/your_reddit_username)"
    },
    auth: "Basic authentication with client_id:client_secret"
  },
  
  search_capabilities: {
    endpoint: "https://oauth.reddit.com/search",
    parameters: {
      q: "Market-specific search query with keywords",
      limit: 25, // Configurable based on analysis needs
      sort: "relevance | new | hot | top",
      t: "all | hour | day | week | month | year", // Time filter
      restrict_sr: false, // Search across all subreddits
      type: "link,sr" // Include both posts and subreddits
    }
  },
  
  target_subreddits: [
    "r/PredictionMarkets", // Primary prediction market discussions
    "r/politics", // Political event discussions
    "r/Economics", // Economic indicator discussions  
    "r/wallstreetbets", // Market sentiment and trading discussion
    "r/stocks", // General market sentiment
    "r/investing", // Investment analysis and discussion
    "r/news", // Breaking news discussions
    "r/worldnews", // International events
    "r/cryptocurrency" // Crypto market discussions
  ],
  
  data_extraction: {
    post_filtering: "Filter by selftext OR title content",
    content_limits: "Title + 500 chars of post content",
    score_weighting: "Use Reddit score for content quality",
    engagement_metrics: "Comments count, upvote ratio",
    time_relevance: "Prioritize recent posts for breaking events"
  },
  
  rate_limiting: {
    built_in_protection: "Axios timeout and retry logic",
    request_frequency: "Max 60 requests per minute per OAuth token",
    error_handling: "Graceful degradation with fallback messages",
    cache_strategy: "5-minute TTL for search results"
  },
  
  sentiment_processing: {
    content_analysis: "Extract sentiment from titles and post content",
    engagement_weighting: "Higher scores = higher confidence",
    trend_detection: "Multiple posts on same topic = trending",
    discussion_quality: "Filter low-quality posts by score threshold"
  }
}
```

#### **MarketIntelligenceTool**
```typescript
interface MarketIntelligenceTool {
  polymarket_integration: {
    gamma_api: "Official market data and metadata",
    cross_market_analysis: "Related market comparison",
    whale_tracking: "Large position movement detection",
    liquidity_analysis: "Order book depth and spread monitoring"
  },
  technical_analysis: {
    price_momentum: "Recent price movement analysis",
    volume_analysis: "Trading activity and unusual patterns",
    market_efficiency: "Bid-ask spread and liquidity metrics"
  }
}
```

#### **EVM MCP Server Integration**
```typescript
interface EVMMCPIntegration {
  server_setup: {
    package: "@mcpdotdirect/evm-mcp-server",
    mode: "stdio", // Secure stdio mode for MCP communication
    networks: "30+ EVM-compatible chains (Ethereum, Polygon, Base, Arbitrum, etc.)",
    ens_support: "Automatic ENS name resolution for human-readable addresses"
  },
  
  security_features: {
    local_key_usage: "Private keys used only for transaction signing, never stored",
    viem_integration: "Industry-standard blockchain library for secure operations", 
    transaction_simulation: "Pre-execution validation through RPC providers",
    spending_limits: "Configurable daily and per-trade caps in agent logic",
    emergency_stops: "Circuit breaker mechanisms in trading workflow"
  },
  
  blockchain_operations: {
    native_transfers: "ETH and native token transfers across all supported networks",
    erc20_tokens: "Token transfers, approvals, and balance checking",
    smart_contracts: "Read/write contract interactions with ABI support",
    gas_optimization: "Automatic gas estimation and fee management",
    slippage_protection: "Price impact minimization for market trades"
  },
  
  available_tools: [
    "transfer_eth", "transfer_token", "approve_token_spending",
    "get_balance", "get_transaction", "read_contract", "write_contract",
    "resolve_ens", "get_chain_info", "is_contract"
  ],
  
  integration_pattern: {
    mastra_tool: "Wrap MCP calls in Mastra tool interface",
    error_handling: "Comprehensive retry logic and fallback strategies",
    logging: "Secure transaction logging without exposing private keys",
    monitoring: "Transaction status tracking and confirmation waiting"
  }
}
```

---

## Enhanced Decision Engine & Strategy

### 🎯 Multi-Factor Scoring Framework

#### **Primary Market Filters** (Must Pass All)
```typescript
interface MarketFilters {
  min_liquidity: number; // $1,000 minimum
  max_time_to_close: number; // 72 hours maximum
  enable_orderbook: boolean; // Required for trading
  min_daily_volume: number; // $500 minimum
  max_spread: number; // 5% maximum bid-ask spread
  min_market_age: number; // 24 hours minimum (avoid brand new markets)
}
```

#### **Advanced Scoring Matrix** (Weighted Evaluation)
```typescript
interface ScoringWeights {
  sentiment_edge: {
    weight: 0.40,
    description: "Gap between research sentiment and market odds",
    calculation: "Weighted average of news + social + official sentiment vs implied probability"
  },
  technical_momentum: {
    weight: 0.25,
    description: "Price and volume trend analysis",
    factors: ["Recent price movement", "Volume acceleration", "Order book momentum"]
  },
  liquidity_quality: {
    weight: 0.20,
    description: "Market depth and execution quality",
    factors: ["Total liquidity", "Bid-ask spread", "Order book distribution"]
  },
  timing_factors: {
    weight: 0.10,
    description: "Time-sensitive opportunity assessment",
    factors: ["Time to market close", "Event proximity", "News freshness"]
  },
  catalyst_strength: {
    weight: 0.05,
    description: "Breaking news and event impact",
    factors: ["News urgency", "Social media momentum", "Official announcements"]
  }
}
```

#### **Risk Management Framework**
```typescript
interface RiskManagement {
  position_sizing: {
    base_size: "$50", // Base position for 60% confidence
    confidence_scaling: "Linear scaling: 50% conf = $25, 80% conf = $75",
    max_position: "$100", // Hard cap per trade
    kelly_fraction: "0.25", // Conservative Kelly criterion application
  },
  portfolio_limits: {
    max_total_exposure: "$300",
    max_concurrent_trades: 3,
    max_sector_exposure: "$150", // Limit exposure to single topic
    daily_loss_limit: "$100"
  },
  stop_loss_logic: {
    confidence_based: "Lower confidence = tighter stops",
    time_based: "Tighten stops as market close approaches",
    news_based: "Emergency stops for contradictory breaking news"
  }
}
```

### 💡 Enhanced Strategy Implementations

#### **"Sentiment Arbitrage"** (Primary MVP Strategy)
```typescript
interface SentimentArbitrageStrategy {
  concept: "Exploit gaps between public sentiment and market pricing",
  triggers: {
    sentiment_gap: "20%+ difference between research sentiment and odds",
    confidence_threshold: "70%+ confidence in sentiment analysis",
    liquidity_requirement: "$2,000+ market liquidity",
    time_buffer: "12+ hours until market close"
  },
  position_management: {
    entry: "Limit orders at favorable prices",
    sizing: "2-5% of bankroll based on confidence",
    exit: "Take profits at 50% of expected value realization"
  }
}
```

#### **"Breaking News Hunter"** (Secondary Strategy)
```typescript
interface BreakingNewsStrategy {
  concept: "Rapid response to market-moving news events",
  triggers: {
    news_urgency: "Breaking news with high relevance score",
    social_confirmation: "Twitter momentum supporting news direction",
    market_delay: "5+ minute lag between news and price movement",
    execution_window: "Trade within 3 minutes of signal"
  },
  risk_controls: {
    max_position: "$75", // Smaller size for higher risk
    stop_loss: "15% of position value",
    time_limit: "Exit within 2 hours if no momentum"
  }
}
```

---

## Reddit API Implementation Guide

### 🔧 **Complete Reddit Integration Architecture**

Based on production implementation patterns from truststay, here's the comprehensive approach for Reddit API integration:

#### **Authentication & Authorization**
```typescript
// OAuth2 Client Credentials Flow Implementation
async function getRedditAccessToken(): Promise<string> {
  try {
    const authResponse = await axios.post('https://www.reddit.com/api/v1/access_token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'PolymarketAgent/1.0 (by /u/your_reddit_username)'
        },
        auth: {
          username: process.env.REDDIT_CLIENT_ID!,
          password: process.env.REDDIT_CLIENT_SECRET!
        },
        timeout: 10000
      }
    );
    
    return authResponse.data.access_token;
  } catch (error) {
    throw new Error(`Reddit authentication failed: ${error.message}`);
  }
}
```

#### **Smart Search Implementation**
```typescript
interface RedditSearchParams {
  marketTitle: string;
  keywords: string[];
  timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  sortBy?: 'relevance' | 'new' | 'hot' | 'top';
  limit?: number;
  targetSubreddits?: string[];
}

async function searchRedditDiscussions(params: RedditSearchParams): Promise<RedditPost[]> {
  const accessToken = await getRedditAccessToken();
  
  // Build intelligent search queries
  const queries = buildSearchQueries(params);
  const allPosts: RedditPost[] = [];
  
  for (const query of queries) {
    try {
      const response = await axios.get('https://oauth.reddit.com/search', {
        params: {
          q: query,
          limit: params.limit || 25,
          sort: params.sortBy || 'relevance',
          t: params.timeFilter || 'week', // Focus on recent discussions
          type: 'link,sr',
          restrict_sr: false
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'PolymarketAgent/1.0 (by /u/your_reddit_username)'
        },
        timeout: 15000
      });
      
      if (response.data?.data?.children?.length) {
        const posts = response.data.data.children
          .filter((post: any) => post.data.selftext || post.data.title)
          .map((post: any) => ({
            title: post.data.title,
            content: post.data.selftext || '',
            score: post.data.score,
            subreddit: post.data.subreddit,
            author: post.data.author,
            created_utc: post.data.created_utc,
            num_comments: post.data.num_comments,
            upvote_ratio: post.data.upvote_ratio,
            permalink: post.data.permalink
          }));
        
        allPosts.push(...posts);
      }
      
      // Rate limiting - space out requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Reddit search failed for query "${query}":`, error);
      // Continue with other queries even if one fails
    }
  }
  
  return deduplicateAndRankPosts(allPosts);
}

function buildSearchQueries(params: RedditSearchParams): string[] {
  const { marketTitle, keywords } = params;
  
  // Create multiple search strategies
  const queries: string[] = [];
  
  // Exact market title search
  queries.push(`"${marketTitle}"`);
  
  // Keyword combinations
  if (keywords.length >= 2) {
    for (let i = 0; i < keywords.length - 1; i++) {
      queries.push(`"${keywords[i]}" "${keywords[i + 1]}"`);
    }
  }
  
  // Individual high-impact keywords
  keywords.forEach(keyword => {
    if (keyword.length > 3) { // Skip short words
      queries.push(keyword);
    }
  });
  
  // Subreddit-specific searches for high-value discussions
  const prioritySubreddits = ['PredictionMarkets', 'politics', 'Economics'];
  prioritySubreddits.forEach(sub => {
    queries.push(`subreddit:${sub} ${keywords.slice(0, 2).join(' ')}`);
  });
  
  return queries.slice(0, 5); // Limit to top 5 queries to manage API usage
}
```

#### **Advanced Data Processing & Analysis**
```typescript
interface ProcessedRedditData {
  sentiment_score: number; // -1 to 1
  confidence: number; // 0 to 1
  trending_topics: string[];
  key_discussions: RedditDiscussion[];
  community_consensus: 'bullish' | 'bearish' | 'neutral' | 'divided';
  engagement_momentum: number;
  credibility_score: number;
}

async function processRedditData(posts: RedditPost[], marketContext: string): Promise<ProcessedRedditData> {
  // Filter and rank posts by relevance and quality
  const qualityPosts = posts
    .filter(post => post.score > 5) // Minimum score threshold
    .filter(post => post.content.length > 50 || post.title.length > 20)
    .sort((a, b) => (b.score * b.upvote_ratio) - (a.score * a.upvote_ratio))
    .slice(0, 15); // Top 15 most relevant posts
  
  if (qualityPosts.length === 0) {
    return getEmptyRedditData();
  }
  
  // Extract key discussions with enhanced context
  const keyDiscussions: RedditDiscussion[] = qualityPosts.map(post => ({
    title: post.title,
    content: post.content.slice(0, 500),
    score: post.score,
    subreddit: post.subreddit,
    engagement: post.num_comments,
    credibility: calculatePostCredibility(post),
    sentiment: extractPostSentiment(post, marketContext),
    timeRelevance: calculateTimeRelevance(post.created_utc)
  }));
  
  // Calculate aggregate sentiment with confidence weighting
  const sentimentData = calculateWeightedSentiment(keyDiscussions);
  
  // Detect trending topics and themes
  const trendingTopics = extractTrendingTopics(keyDiscussions);
  
  // Assess community consensus
  const consensus = determineCommunityConsensus(keyDiscussions);
  
  // Calculate engagement momentum (growth in discussion volume)
  const momentum = calculateEngagementMomentum(posts);
  
  return {
    sentiment_score: sentimentData.score,
    confidence: sentimentData.confidence,
    trending_topics: trendingTopics,
    key_discussions: keyDiscussions,
    community_consensus: consensus,
    engagement_momentum: momentum,
    credibility_score: calculateOverallCredibility(keyDiscussions)
  };
}

function calculatePostCredibility(post: RedditPost): number {
  let score = 0.5; // Base credibility
  
  // Subreddit reputation weighting
  const reputableSubs = ['PredictionMarkets', 'Economics', 'investing'];
  if (reputableSubs.includes(post.subreddit)) score += 0.2;
  
  // Score and engagement weighting
  if (post.score > 20) score += 0.1;
  if (post.num_comments > 10) score += 0.1;
  if (post.upvote_ratio > 0.8) score += 0.1;
  
  // Content quality indicators
  if (post.content.length > 200) score += 0.1; // Detailed posts
  if (post.title.includes('analysis') || post.title.includes('prediction')) score += 0.1;
  
  return Math.min(score, 1.0);
}
```

#### **Error Handling & Resilience**
```typescript
// Comprehensive error handling with fallback strategies
async function safeRedditApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  context: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`Reddit API error in ${context}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Handle specific error types
    if (error.response?.status === 429) {
      console.warn('Reddit API rate limit exceeded, using cache or fallback');
      // Could implement exponential backoff here
    } else if (error.response?.status === 401) {
      console.error('Reddit authentication failed, token may be expired');
      // Could implement token refresh logic here
    }
    
    return fallbackValue;
  }
}

// Circuit breaker pattern for Reddit API reliability
class RedditApiCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 300000; // 5 minutes
  
  async execute<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    if (this.isOpen()) {
      console.warn('Reddit API circuit breaker is open, using fallback');
      return fallback;
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private isOpen(): boolean {
    return this.failures >= this.failureThreshold && 
           (Date.now() - this.lastFailureTime) < this.recoveryTimeout;
  }
  
  private onSuccess(): void {
    this.failures = 0;
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}
```

#### **Caching Strategy Implementation**
```typescript
// Redis-based caching with intelligent TTL
interface RedditCacheEntry {
  data: ProcessedRedditData;
  timestamp: number;
  query_hash: string;
  market_id: string;
}

class RedditDataCache {
  constructor(private redis: Redis) {}
  
  async get(marketId: string, queryHash: string): Promise<ProcessedRedditData | null> {
    try {
      const cacheKey = `reddit:${marketId}:${queryHash}`;
      const cached = await this.redis.get(cacheKey);
      
      if (!cached) return null;
      
      const entry: RedditCacheEntry = JSON.parse(cached);
      
      // Check if cache is still fresh (adaptive TTL based on market volatility)
      const ttl = this.calculateDynamicTTL(marketId);
      if ((Date.now() - entry.timestamp) > ttl) {
        await this.redis.del(cacheKey);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error('Reddit cache retrieval error:', error);
      return null;
    }
  }
  
  async set(marketId: string, queryHash: string, data: ProcessedRedditData): Promise<void> {
    try {
      const entry: RedditCacheEntry = {
        data,
        timestamp: Date.now(),
        query_hash: queryHash,
        market_id: marketId
      };
      
      const cacheKey = `reddit:${marketId}:${queryHash}`;
      const ttl = this.calculateDynamicTTL(marketId);
      
      await this.redis.setex(cacheKey, Math.floor(ttl / 1000), JSON.stringify(entry));
    } catch (error) {
      console.error('Reddit cache storage error:', error);
    }
  }
  
  private calculateDynamicTTL(marketId: string): number {
    // Shorter TTL for high-volatility markets, longer for stable ones
    const baseTTL = 5 * 60 * 1000; // 5 minutes base
    
    // Could implement market-specific logic here
    // e.g., political markets during elections = shorter TTL
    
    return baseTTL;
  }
}
```

#### **Integration with Mastra Workflow**
```typescript
// Example tool implementation for Mastra framework
export class RedditIntelligenceTool {
  private circuitBreaker = new RedditApiCircuitBreaker();
  private cache = new RedditDataCache(redisClient);
  
  async execute(params: {
    marketTitle: string;
    marketId: string;
    keywords: string[];
  }): Promise<{
    success: boolean;
    data: ProcessedRedditData;
    sources: string[];
    confidence: number;
  }> {
    const queryHash = this.generateQueryHash(params);
    
    // Try cache first
    const cached = await this.cache.get(params.marketId, queryHash);
    if (cached) {
      return {
        success: true,
        data: cached,
        sources: ['reddit-cache'],
        confidence: cached.confidence
      };
    }
    
    // Execute search with circuit breaker protection
    const fallbackData = this.getEmptyRedditData();
    
    try {
      const posts = await this.circuitBreaker.execute(
        () => searchRedditDiscussions({
          marketTitle: params.marketTitle,
          keywords: params.keywords,
          timeFilter: 'week',
          limit: 25
        }),
        []
      );
      
      const processedData = await processRedditData(posts, params.marketTitle);
      
      // Cache successful results
      await this.cache.set(params.marketId, queryHash, processedData);
      
      return {
        success: true,
        data: processedData,
        sources: ['reddit-api'],
        confidence: processedData.confidence
      };
      
    } catch (error) {
      console.error('Reddit tool execution failed:', error);
      
      return {
        success: false,
        data: fallbackData,
        sources: ['fallback'],
        confidence: 0
      };
    }
  }
  
  private generateQueryHash(params: any): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
  }
}
```

### 🔍 **Environment Configuration for Reddit API**

```bash
# Reddit API Credentials (Required)
REDDIT_CLIENT_ID=your_reddit_app_client_id
REDDIT_CLIENT_SECRET=your_reddit_app_client_secret
REDDIT_USER_AGENT="PolymarketAgent/1.0 (by /u/your_reddit_username)"

# Reddit API Configuration (Optional)
REDDIT_REQUEST_TIMEOUT=15000
REDDIT_MAX_RETRIES=3
REDDIT_RATE_LIMIT_DELAY=1000
REDDIT_SEARCH_LIMIT=25
REDDIT_CACHE_TTL_MINUTES=5

# Circuit Breaker Configuration
REDDIT_FAILURE_THRESHOLD=5
REDDIT_RECOVERY_TIMEOUT_MINUTES=5
```

### 📋 **Implementation Checklist**

- [ ] Create Reddit app at https://www.reddit.com/prefs/apps
- [ ] Implement OAuth2 client credentials flow
- [ ] Add comprehensive error handling and circuit breaker
- [ ] Implement intelligent search query building
- [ ] Add post filtering and quality scoring
- [ ] Implement sentiment analysis for Reddit content
- [ ] Add caching layer with Redis
- [ ] Implement rate limiting and request spacing
- [ ] Add monitoring and logging for Reddit API calls
- [ ] Test with various market types and keywords
- [ ] Implement fallback strategies for API failures
- [ ] Add comprehensive unit and integration tests

---

## EVM MCP Server Integration Guide

### 🔧 **Secure Blockchain Operations via MCP**

The Polymarket Agent uses the audited EVM MCP Server (@mcpdotdirect/evm-mcp-server) for all blockchain operations, providing secure transaction handling across multiple EVM networks.

#### **MCP Server Setup & Integration**
```typescript
// src/tools/evm-mcp.tool.ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { spawn } from "child_process";

export class EVMMCPTool {
  private client: Client;
  private transport: StdioServerTransport;
  
  constructor() {
    this.setupMCPConnection();
  }
  
  private async setupMCPConnection() {
    // Spawn the EVM MCP server process
    const serverProcess = spawn("npx", ["@mcpdotdirect/evm-mcp-server"], {
      stdio: ["pipe", "pipe", "inherit"], // stdin, stdout, stderr
    });
    
    // Create transport using the spawned process
    this.transport = new StdioServerTransport();
    await this.transport.connect(serverProcess);
    
    // Create MCP client
    this.client = new Client({
      name: "polymarket-agent",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {}
      }
    });
    
    // Connect client to transport
    await this.client.connect(this.transport);
    
    console.log("EVM MCP Server connected successfully");
  }
  
  /**
   * Execute a trade on Polymarket using USDC
   */
  async executePolymarketTrade(params: {
    marketAddress: string;
    outcome: 'YES' | 'NO';
    amount: string; // USDC amount
    maxSlippage: number; // Percentage
  }) {
    try {
      // First approve USDC spending
      await this.approveUSDCSpending(params.marketAddress, params.amount);
      
      // Execute the trade through Polymarket contract
      const result = await this.client.callTool("write_contract", {
        contractAddress: params.marketAddress,
        abi: POLYMARKET_CONDITIONAL_TOKEN_ABI,
        functionName: "buy",
        args: [
          params.outcome === 'YES' ? 1 : 0, // outcome index
          parseUnits(params.amount, 6), // USDC has 6 decimals
          calculateMinShares(params.amount, params.maxSlippage)
        ],
        privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
        network: "polygon"
      });
      
      return {
        success: true,
        transactionHash: result.content[0].text,
        amount: params.amount,
        outcome: params.outcome
      };
    } catch (error) {
      console.error("Trade execution failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private async approveUSDCSpending(spenderAddress: string, amount: string) {
    return this.client.callTool("approve_token_spending", {
      privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
      tokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
      spenderAddress,
      amount,
      network: "polygon"
    });
  }
  
  /**
   * Get wallet balance for trading
   */
  async getWalletBalance(tokenAddress?: string) {
    if (tokenAddress) {
      // Get token balance
      return this.client.callTool("get_token_balance", {
        tokenAddress,
        address: this.getWalletAddress(),
        network: "polygon"
      });
    } else {
      // Get MATIC balance
      return this.client.callTool("get_balance", {
        address: this.getWalletAddress(),
        network: "polygon"
      });
    }
  }
  
  private getWalletAddress(): string {
    // Derive address from private key using MCP tool
    return this.client.callTool("get_address_from_private_key", {
      privateKey: process.env.POLYMARKET_PRIVATE_KEY!
    });
  }
}
```

#### **Mastra Tool Integration**
```typescript
// src/agents/execution.agent.ts
import { MastraAgent } from '@mastra/core';
import { EVMMCPTool } from '../tools/evm-mcp.tool.js';

export class SecureExecutionAgent implements MastraAgent {
  name = 'secure-execution-agent';
  description = 'Risk-managed trade execution with blockchain operations';
  
  private evmTool: EVMMCPTool;
  
  constructor() {
    this.evmTool = new EVMMCPTool();
  }

  async execute(input: TradeDecisionInput): Promise<ExecutionResult> {
    try {
      // Validate trade parameters
      if (input.confidence < 70) {
        return { success: false, reason: "Confidence too low for execution" };
      }
      
      // Check wallet balance
      const usdcBalance = await this.evmTool.getWalletBalance(
        "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" // USDC
      );
      
      if (parseFloat(usdcBalance) < parseFloat(input.amount)) {
        return { success: false, reason: "Insufficient USDC balance" };
      }
      
      // Execute the trade
      const tradeResult = await this.evmTool.executePolymarketTrade({
        marketAddress: input.marketAddress,
        outcome: input.outcome,
        amount: input.amount,
        maxSlippage: 2.0 // 2% max slippage
      });
      
      if (tradeResult.success) {
        // Log successful trade to database
        await this.logTradeExecution(input, tradeResult.transactionHash);
        
        return {
          success: true,
          transactionHash: tradeResult.transactionHash,
          executedAmount: tradeResult.amount,
          outcome: tradeResult.outcome
        };
      } else {
        return { success: false, reason: tradeResult.error };
      }
    } catch (error) {
      console.error('Execution agent error:', error);
      return { success: false, reason: error.message };
    }
  }
}
```

#### **Security Best Practices Implementation**
```typescript
// src/security/wallet-security.ts
export class WalletSecurityManager {
  private dailySpentAmount = 0;
  private lastResetDate = new Date().toDateString();
  
  private readonly MAX_DAILY_SPEND = 300; // $300 USDC daily limit
  private readonly MAX_SINGLE_TRADE = 100; // $100 USDC per trade
  
  async validateTradeAmount(amount: string): Promise<boolean> {
    const tradeAmount = parseFloat(amount);
    
    // Reset daily counter if new day
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySpentAmount = 0;
      this.lastResetDate = today;
    }
    
    // Check single trade limit
    if (tradeAmount > this.MAX_SINGLE_TRADE) {
      throw new Error(`Trade amount ${amount} exceeds max single trade limit ${this.MAX_SINGLE_TRADE}`);
    }
    
    // Check daily limit
    if (this.dailySpentAmount + tradeAmount > this.MAX_DAILY_SPEND) {
      throw new Error(`Trade would exceed daily spending limit. Daily spent: ${this.dailySpentAmount}, Trade: ${tradeAmount}, Limit: ${this.MAX_DAILY_SPEND}`);
    }
    
    return true;
  }
  
  async recordSpentAmount(amount: string) {
    this.dailySpentAmount += parseFloat(amount);
  }
  
  async emergencyStop(): Promise<void> {
    // Implement emergency stop logic
    console.error("EMERGENCY STOP ACTIVATED - All trading halted");
    // Could also revoke token approvals here if needed
  }
}
```

#### **Error Handling & Monitoring**
```typescript
// src/monitoring/transaction-monitor.ts
export class TransactionMonitor {
  async waitForConfirmation(
    txHash: string, 
    network: string = 'polygon',
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const receipt = await this.evmTool.client.callTool("get_transaction", {
          txHash,
          network
        });
        
        if (receipt.content[0].text.includes('"status":"success"')) {
          console.log(`Transaction ${txHash} confirmed successfully`);
          return true;
        }
        
        // Wait 10 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.error("Error checking transaction status:", error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.error(`Transaction ${txHash} confirmation timeout`);
    return false;
  }
}
```

### 🔒 **Security Configuration**

#### **Environment Variables Security**
```bash
# Use strong private key (64 hex characters)
POLYMARKET_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Optional: Use your own RPC endpoints for privacy
POLYGON_RPC_URL=https://your-private-polygon-rpc.com

# Security settings
MAX_DAILY_SPEND_USDC=300
MAX_SINGLE_TRADE_USDC=100
SLIPPAGE_TOLERANCE_PERCENT=2
TRANSACTION_TIMEOUT_SECONDS=300
```

#### **Production Deployment Security**
- **Private key storage**: Use environment variables or secure key management
- **Network isolation**: Run MCP server in isolated environment
- **Monitoring**: Log all transactions and spending limits
- **Emergency stops**: Implement circuit breakers for unusual activity
- **Gas optimization**: Monitor and optimize transaction costs

### 📋 **EVM MCP Implementation Checklist**

- [ ] Install @mcpdotdirect/evm-mcp-server package
- [ ] Configure private key environment variable securely
- [ ] Implement EVMMCPTool wrapper for Mastra integration
- [ ] Set up spending limits and security controls
- [ ] Add transaction monitoring and confirmation waiting
- [ ] Implement emergency stop mechanisms
- [ ] Test trades on testnet before production deployment
- [ ] Set up logging for all blockchain operations
- [ ] Configure custom RPC endpoints if needed
- [ ] Add error handling and retry logic for failed transactions

---

## Mastra Framework Implementation Guide

### 🏗️ **Complete Mastra Setup & Configuration**

Based on the [official Mastra documentation](https://mastra.ai/en/docs), here's the comprehensive implementation approach for the Polymarket Agent using Mastra's TypeScript framework.

#### **Mastra Core Configuration**
```typescript
// src/mastra/config.ts
import { Mastra } from '@mastra/core';
import { createTool } from '@mastra/core';
import { z } from 'zod';

// Initialize Mastra instance with configuration
export const mastra = new Mastra({
  name: 'polymarket-agent',
  version: '1.0.0',
  logs: {
    type: 'FILE',
    dirPath: './logs'
  },
  memory: {
    provider: 'POSTGRES',
    connectionString: process.env.DATABASE_URL!,
    debug: process.env.NODE_ENV === 'development'
  },
  agents: [
    // Agents will be registered here
  ],
  workflows: [
    // Workflows will be registered here
  ]
});
```

#### **Mastra Agent Implementation Patterns**
```typescript
// src/agents/research.agent.ts
import { Agent } from '@mastra/core';
import { createTool } from '@mastra/core';
import { z } from 'zod';

// Define tools using Mastra's createTool function
const twitterIntelligenceTool = createTool({
  id: 'twitter-intelligence',
  description: 'Gather Twitter sentiment and trending data for markets',
  inputSchema: z.object({
    marketTitle: z.string(),
    keywords: z.array(z.string()),
    timeframe: z.enum(['1h', '6h', '24h', '7d']).default('24h')
  }),
  outputSchema: z.object({
    sentiment_score: z.number().min(-1).max(1),
    engagement_momentum: z.number(),
    trending_topics: z.array(z.string()),
    confidence: z.number().min(0).max(1)
  }),
  execute: async ({ marketTitle, keywords, timeframe }) => {
    // Implementation using @the-convocation/twitter-scraper
    const twitterData = await searchTwitter(marketTitle, keywords, timeframe);
    return processTwitterSentiment(twitterData);
  }
});

const redditIntelligenceTool = createTool({
  id: 'reddit-intelligence',
  description: 'Analyze Reddit discussions for market sentiment',
  inputSchema: z.object({
    marketTitle: z.string(),
    keywords: z.array(z.string()),
    subreddits: z.array(z.string()).optional()
  }),
  outputSchema: z.object({
    community_sentiment: z.enum(['bullish', 'bearish', 'neutral', 'divided']),
    discussion_volume: z.number(),
    credibility_score: z.number().min(0).max(1),
    key_discussions: z.array(z.object({
      title: z.string(),
      score: z.number(),
      subreddit: z.string()
    }))
  }),
  execute: async ({ marketTitle, keywords, subreddits }) => {
    // Implementation using Reddit API patterns from truststay
    return await processRedditData(marketTitle, keywords, subreddits);
  }
});

const newsIntelligenceTool = createTool({
  id: 'news-intelligence', 
  description: 'Gather and analyze news sentiment for markets',
  inputSchema: z.object({
    marketTitle: z.string(),
    keywords: z.array(z.string()),
    timeframe: z.string().default('24h')
  }),
  outputSchema: z.object({
    sentiment_score: z.number(),
    news_count: z.number(),
    breaking_news: z.boolean(),
    source_credibility: z.number()
  }),
  execute: async ({ marketTitle, keywords, timeframe }) => {
    // Implementation using NewsAPI and Alpha Vantage
    return await processNewsData(marketTitle, keywords, timeframe);
  }
});

// Enhanced Research Agent with Mastra patterns
export const researchAgent = new Agent({
  name: 'enhanced-research-agent',
  instructions: `
    You are an expert market research analyst specializing in prediction markets.
    
    Your role is to:
    1. Gather comprehensive intelligence from multiple sources (Twitter, Reddit, News)
    2. Analyze sentiment and momentum across social media and news
    3. Identify trending topics and community consensus
    4. Provide confidence-weighted research synthesis
    
    Always provide structured analysis with confidence scores and reasoning.
  `,
  model: {
    provider: 'OPENAI',
    name: 'gpt-4o',
    toolChoice: 'auto'
  },
  tools: [
    twitterIntelligenceTool,
    redditIntelligenceTool, 
    newsIntelligenceTool
  ],
  memory: {
    store: true,
    maxMessages: 50
  }
});
```

#### **Mastra Workflow Implementation**
```typescript
// src/workflows/autonomous-trading.workflow.ts
import { Workflow } from '@mastra/core';
import { z } from 'zod';

export const autonomousTradingWorkflow = new Workflow({
  name: 'autonomous-trading',
  triggerSchema: z.object({
    marketId: z.string(),
    marketTitle: z.string(),
    keywords: z.array(z.string())
  })
})
  // Step 1: Market Discovery and Filtering
  .step('market-discovery', {
    outputSchema: z.object({
      validMarkets: z.array(z.object({
        id: z.string(),
        title: z.string(),
        liquidity: z.number(),
        timeToClose: z.number(),
        currentPrice: z.number()
      }))
    })
  }, async ({ context }) => {
    const markets = await getActivePolymarkets();
    const validMarkets = markets.filter(market => 
      market.liquidity > 1000 && 
      market.timeToClose > 12 * 60 * 60 * 1000 // 12 hours
    );
    return { validMarkets };
  })
  
  // Step 2: Parallel Research Execution
  .parallel([
    {
      name: 'gather-intelligence',
      steps: [
        // Research Agent execution
        researchAgent.step('comprehensive-research', {
          input: (context) => ({
            marketTitle: context.marketTitle,
            keywords: context.keywords
          })
        })
      ]
    },
    {
      name: 'market-technicals',
      steps: [
        // Technical analysis
        marketIntelligenceTool.step('technical-analysis', {
          input: (context) => ({
            marketId: context.marketId
          })
        })
      ]
    }
  ])
  
  // Step 3: Decision Synthesis
  .step('decision-analysis', {
    outputSchema: z.object({
      action: z.enum(['BUY', 'SELL', 'HOLD', 'NONE']),
      outcome: z.enum(['YES', 'NO']).optional(),
      confidence: z.number().min(0).max(100),
      amount: z.number().optional(),
      reasoning: z.string()
    })
  }, async ({ context }) => {
    // Use decision agent to synthesize all research
    const decision = await decisionAgent.generate([
      {
        role: 'user',
        content: `
          Analyze this market data and provide trading decision:
          
          Market: ${context.marketTitle}
          Research: ${JSON.stringify(context.researchResults)}
          Technical: ${JSON.stringify(context.technicalAnalysis)}
          
          Provide structured decision with confidence and reasoning.
        `
      }
    ]);
    
    return parseDecision(decision.text);
  })
  
  // Step 4: Conditional Execution
  .branch({
    condition: (context) => context.action !== 'NONE' && context.confidence > 70,
    thenSteps: [
      // Execute trade through EVM MCP
      executionAgent.step('execute-trade', {
        input: (context) => ({
          marketId: context.marketId,
          action: context.action,
          outcome: context.outcome,
          amount: context.amount
        })
      })
    ],
    elseSteps: [
      // Log decision without execution
      {
        name: 'log-no-action',
        fn: async (context) => {
          console.log(`No action taken for ${context.marketTitle}: ${context.reasoning}`);
          return { logged: true };
        }
      }
    ]
  })
  
  // Step 5: Performance Tracking
  .step('track-performance', async ({ context }) => {
    await logPerformanceMetrics({
      marketId: context.marketId,
      decision: context.action,
      confidence: context.confidence,
      executionResult: context.executionResult
    });
    
    return { tracked: true };
  });
```

#### **MCP Integration with Mastra**
```typescript
// src/tools/evm-mcp.tool.ts
import { createTool } from '@mastra/core';
import { MCPClient } from '@mastra/core';
import { z } from 'zod';

// Create MCP client for EVM operations
const evmMCPClient = new MCPClient({
  name: 'evm-mcp-client',
  serverCommand: 'npx @mcpdotdirect/evm-mcp-server',
  serverArgs: [],
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
});

// Mastra tool wrapping EVM MCP operations
export const evmTradingTool = createTool({
  id: 'evm-trading',
  description: 'Execute secure blockchain trades via EVM MCP server',
  inputSchema: z.object({
    marketAddress: z.string(),
    outcome: z.enum(['YES', 'NO']),
    amount: z.string(),
    maxSlippage: z.number().default(2)
  }),
  outputSchema: z.object({
    success: z.boolean(),
    transactionHash: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({ marketAddress, outcome, amount, maxSlippage }) => {
    try {
      // Call EVM MCP server for trade execution
      const result = await evmMCPClient.callTool('write_contract', {
        contractAddress: marketAddress,
        abi: POLYMARKET_CONDITIONAL_TOKEN_ABI,
        functionName: 'buy',
        args: [
          outcome === 'YES' ? 1 : 0,
          parseUnits(amount, 6), // USDC decimals
          calculateMinShares(amount, maxSlippage)
        ],
        privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
        network: 'polygon'
      });
      
      return {
        success: true,
        transactionHash: result.transactionHash
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});
```

#### **Memory Configuration & Usage**
```typescript
// src/agents/decision.agent.ts
import { Agent } from '@mastra/core';

export const decisionAgent = new Agent({
  name: 'decision-agent',
  instructions: `
    You are an expert trading decision maker for prediction markets.
    
    Use your memory to:
    - Remember successful trading patterns and market conditions
    - Learn from previous mistakes and failed predictions
    - Track market sentiment evolution over time
    - Build knowledge of reliable vs unreliable signal sources
    
    Always consider historical context when making decisions.
  `,
  model: {
    provider: 'OPENAI',
    name: 'gpt-4o'
  },
  memory: {
    store: true,
    maxMessages: 100,
    // Semantic memory for pattern recognition
    systemPrompt: `
      Remember successful trading patterns:
      - High confidence trades with strong multi-source alignment
      - Market conditions that led to profitable outcomes
      - Signal reliability across different market types
      
      Learn from failures:
      - Low confidence trades that were avoided
      - Overconfident trades that failed
      - Signal sources that proved unreliable
    `
  },
  tools: [evmTradingTool]
});
```

#### **Development Environment Setup**
```typescript
// src/dev/playground.ts
import { mastra } from '../mastra/config';

// Start Mastra development server
async function startDevelopment() {
  // Register all agents and workflows
  mastra.agents([
    researchAgent,
    decisionAgent,
    executionAgent
  ]);
  
  mastra.workflows([
    autonomousTradingWorkflow
  ]);
  
  // Start development server with playground
  await mastra.init();
  
  console.log('🚀 Mastra development environment started');
  console.log('🎮 Visit http://localhost:4000 for agent playground');
  console.log('📊 Agent memory and state visible in dashboard');
}

// Test workflow execution
async function testWorkflow() {
  const result = await autonomousTradingWorkflow.execute({
    marketId: 'test-market-123',
    marketTitle: 'Will Bitcoin reach $100k by 2024?',
    keywords: ['bitcoin', 'btc', '100k', 'cryptocurrency']
  });
  
  console.log('Workflow result:', result);
}

if (process.env.NODE_ENV === 'development') {
  startDevelopment();
}
```

#### **Production Deployment with Mastra**
```typescript
// src/server/production.ts
import { mastra } from '../mastra/config';
import { Hono } from 'hono';

const app = new Hono();

// Initialize Mastra server
app.use('*', async (c, next) => {
  c.set('mastra', mastra);
  await next();
});

// Agent endpoints
app.post('/api/agents/:agentName/generate', async (c) => {
  const agentName = c.req.param('agentName');
  const { messages } = await c.req.json();
  
  const agent = mastra.getAgent(agentName);
  const result = await agent.generate(messages);
  
  return c.json(result);
});

// Workflow endpoints  
app.post('/api/workflows/:workflowName/execute', async (c) => {
  const workflowName = c.req.param('workflowName');
  const input = await c.req.json();
  
  const workflow = mastra.getWorkflow(workflowName);
  const result = await workflow.execute(input);
  
  return c.json(result);
});

// Health check with Mastra status
app.get('/health', async (c) => {
  const status = {
    agents: mastra.agents.length,
    workflows: mastra.workflows.length,
    memory: await mastra.memory.status(),
    timestamp: new Date().toISOString()
  };
  
  return c.json(status);
});

export default app;
```

### 🔧 **Mastra CLI & Development Workflow**

```bash
# Initialize new Mastra project (if starting fresh)
npx create-mastra@latest polymarket-agent

# Start development environment with agent playground
npm run dev
# or
npx mastra dev

# Build for production
npm run build
# or  
npx mastra build

# Start production server
npm run start
# or
npx mastra start

# Lint Mastra configuration
npx mastra lint
```

### 📋 **Mastra Implementation Checklist**

- [ ] Install @mastra/core and configure Mastra instance
- [ ] Implement agents using Mastra Agent class with proper instructions
- [ ] Create tools using createTool() function with Zod schemas
- [ ] Set up agent memory with PostgreSQL storage
- [ ] Implement workflows using Mastra workflow syntax (.step(), .parallel(), .branch())
- [ ] Configure MCP client for EVM operations integration
- [ ] Set up development environment and agent playground
- [ ] Add proper error handling and logging throughout
- [ ] Configure observability and performance tracking
- [ ] Test agents and workflows in development environment
- [ ] Set up production deployment with Mastra server
- [ ] Add comprehensive unit tests for agents and workflows

---

## Database Architecture: Supabase + Drizzle ORM

### 🗄️ **Complete Database Setup (Production-Ready)**

Based on the proven implementation from truststay, here's the comprehensive database architecture using Supabase and Drizzle ORM:

#### **Database Connection & Configuration**
```typescript
// src/database/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import schema from "./schema/index";

// Connection pool configuration for optimal performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Health check function for monitoring
export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// Graceful shutdown for clean deployment
export async function closeConnection(): Promise<void> {
  await pool.end();
}
```

#### **Schema Organization & Structure**
```typescript
// drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema/**/defs.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});

// src/database/schema/index.ts - Centralized schema management
import * as marketsDefs from "./markets/defs";
import * as marketsRelations from "./markets/relations";
import * as tradesDefs from "./trades/defs";
import * as tradesRelations from "./trades/relations";
import * as analyticsDefs from "./analytics/defs";
import * as analyticsRelations from "./analytics/relations";

const schema = {
  ...marketsDefs,
  ...marketsRelations,
  ...tradesDefs,
  ...tradesRelations,
  ...analyticsDefs,
  ...analyticsRelations,
};

export default schema;
```

#### **Schema Utilities & Common Patterns**
```typescript
// src/database/schema/util.ts
import { varchar, timestamp, uuid, text, integer, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Standard UUID column for primary keys and foreign keys
 */
export function uuidColumn(name: string = "id") {
  return uuid(name).primaryKey().defaultRandom();
}

/**
 * Standard timestamp columns with timezone support
 */
export function timestampColumns() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  };
}

/**
 * Market-specific columns
 */
export function marketIdColumn() {
  return varchar("market_id", { length: 100 }).notNull();
}

/**
 * Currency amount columns with proper precision
 */
export function currencyColumn(name: string) {
  return decimal(name, { precision: 18, scale: 6 });
}

/**
 * Confidence score column (0-100)
 */
export function confidenceColumn() {
  return integer("confidence").notNull();
}
```

#### **Core Schema Definitions for Polymarket Agent**
```typescript
// src/database/schema/markets/defs.ts
import {
  index,
  jsonb,
  pgTable,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { uuidColumn, timestampColumns, marketIdColumn, confidenceColumn } from "../util";

/**
 * Market Intelligence Storage
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
 */
export const tradeDecisions = pgTable(
  "trade_decisions",
  {
    id: uuidColumn(),
    marketId: marketIdColumn(),
    
    // Decision metadata
    action: text("action", { enum: ["BUY", "SELL", "HOLD", "NONE"] }).notNull(),
    outcome: text("outcome", { enum: ["YES", "NO"] }),
    
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
```

#### **Repository Pattern Implementation**
```typescript
// src/database/repositories/market-intelligence.ts
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
}
```

#### **Type Safety with Drizzle + Zod**
```typescript
// src/database/schema/markets/types.ts
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { marketIntelligence, tradeDecisions } from "./defs";

// Drizzle inferred types
export type MarketIntelligence = InferSelectModel<typeof marketIntelligence>;
export type NewMarketIntelligence = InferInsertModel<typeof marketIntelligence>;
export type TradeDecision = InferSelectModel<typeof tradeDecisions>;
export type NewTradeDecision = InferInsertModel<typeof tradeDecisions>;

// Zod schemas for runtime validation
export const selectMarketIntelligenceSchema = createSelectSchema(marketIntelligence);
export const insertMarketIntelligenceSchema = createInsertSchema(marketIntelligence);

// API validation schemas
export const createTradeDecisionSchema = z.object({
  marketId: z.string().min(1),
  action: z.enum(["BUY", "SELL", "HOLD", "NONE"]),
  outcome: z.enum(["YES", "NO"]).optional(),
  plannedAmount: z.string().regex(/^\d+(\.\d+)?$/),
  confidence: z.number().int().min(0).max(100),
  reasoning: z.string().min(10),
});

export type CreateTradeDecisionRequest = z.infer<typeof createTradeDecisionSchema>;
```

### 🚀 **Database Setup & Migration Workflow**

#### **Environment Configuration**
```bash
# Supabase PostgreSQL (Recommended)
DATABASE_URL="postgresql://postgres:password@db.xyz.supabase.co:5432/postgres"

# Alternative PostgreSQL providers
# DATABASE_URL="postgresql://username:password@neon.tech/database"
# DATABASE_URL="postgresql://username:password@railway.app/database"

# Development vs Production SSL
NODE_ENV=development  # or production
```

#### **Package Dependencies**
```json
{
  "dependencies": {
    "drizzle-orm": "^0.43.1",
    "drizzle-zod": "^0.8.2",
    "pg": "^8.10.0",
    "zod": "^3.25.17"
  },
  "devDependencies": {
    "@types/pg": "^8.6.6",
    "drizzle-kit": "^0.31.1"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:check": "drizzle-kit check"
  }
}
```

#### **Development Workflow**
```bash
# 1. Generate migration after schema changes
npm run db:generate

# 2. Review generated migration files in drizzle/ directory

# 3. Run migration against database
npm run db:migrate

# 4. (Optional) Open database studio for inspection
npm run db:studio

# 5. Test with health check
curl http://localhost:3000/api/health/db
```

### 🔒 **Production Considerations**

#### **Security Best Practices**
- **Connection pooling** with appropriate limits
- **SSL enforcement** in production environments
- **Environment variable validation** on startup
- **Database health monitoring** endpoints
- **Graceful shutdown** handling for deployments

#### **Performance Optimization**
- **Strategic indexing** on commonly queried columns
- **JSONB for flexible data** storage (research context, signals)
- **Timestamp-based partitioning** for large datasets
- **Connection pool tuning** based on load patterns
- **Query optimization** using Drizzle's type-safe queries

#### **Monitoring & Maintenance**
- **Automated cleanup** of old intelligence data
- **Performance metrics** tracking and alerting
- **Database size monitoring** and archival strategies
- **Backup and recovery** procedures
- **Migration rollback** strategies

### 📋 **Database Implementation Checklist**

- [ ] Set up Supabase project and obtain connection string
- [ ] Configure drizzle.config.ts with proper schema paths
- [ ] Implement core schemas (markets, trades, analytics)
- [ ] Create repository classes for data access
- [ ] Add Zod validation schemas for API endpoints
- [ ] Set up migration workflow and scripts
- [ ] Implement database health checks
- [ ] Add connection pooling and error handling
- [ ] Create cleanup jobs for old data
- [ ] Add performance monitoring and logging
- [ ] Test migration and rollback procedures
- [ ] Document schema changes and relationships

---

## Enhanced LLM Integration & Prompts

### 🔍 Advanced Research Analysis Prompt

```markdown
# Comprehensive Market Intelligence Analysis

## Market Context
- **Market Title**: {{marketTitle}}
- **Market Description**: {{marketDescription}}
- **Current Odds**: {{impliedProbability}}% (Price: {{currentPrice}})
- **Time Remaining**: {{timeToClose}}
- **Liquidity**: ${{liquidity}} | **Daily Volume**: ${{dailyVolume}}

## Multi-Source Intelligence

### News Intelligence ({{newsCount}} articles)
{{#each newsItems}}
- **{{source}}** ({{publishedAt}}): {{title}}
  Sentiment: {{sentiment}} | Relevance: {{relevanceScore}}/100
  Summary: {{summary}}
{{/each}}

### Social Media Intelligence
**Twitter Analysis** ({{tweetCount}} tweets analyzed):
- Average Sentiment: {{twitterSentiment}}/100
- Engagement Momentum: {{engagementMomentum}}
- Trending Status: {{trendingStatus}}
- Key Influencer Signals: {{influencerSignals}}

**Reddit Discussion** ({{redditPostCount}} posts):
- Community Sentiment: {{redditSentiment}}/100
- Discussion Volume: {{discussionVolume}}
- Post Velocity: {{postVelocity}}

### Market Technical Analysis
- Recent Price Movement: {{priceMovement}}%
- Volume Trend: {{volumeTrend}}
- Order Book Health: {{orderBookHealth}}
- Cross-Market Correlation: {{crossMarketSignals}}

## Analysis Framework

Provide a comprehensive assessment with:

1. **Sentiment Synthesis** (0-100):
   - Weighted sentiment across all sources
   - Confidence level in sentiment accuracy
   - Direction strength (STRONG_BULLISH/BULLISH/NEUTRAL/BEARISH/STRONG_BEARISH)

2. **Market Opportunity Assessment**:
   - Sentiment vs Current Odds Gap (percentage)
   - Quality of Supporting Evidence (HIGH/MEDIUM/LOW)
   - Time Sensitivity (URGENT/MODERATE/LOW)

3. **Risk Factors**:
   - Contradictory signals or uncertainty sources
   - Market liquidity and execution risks
   - Time decay and external event risks

4. **Trading Recommendation**:
   - Position Direction (YES/NO/NONE)
   - Confidence Level (0-100)
   - Suggested Position Size (% of max position)
   - Key Risk Mitigation strategies

Return analysis in structured JSON format for programmatic processing.
```

### 🎯 Enhanced Decision Synthesis Prompt

```markdown
# Advanced Trading Decision Analysis

## Comprehensive Market Data
**Market**: {{marketTitle}}
**Current State**: {{currentPrice}} ({{impliedProbability}}% implied) | Spread: {{spread}}%
**Market Health**: Liquidity: ${{liquidity}} | Volume: ${{volume}} | Time: {{timeToClose}}

## Multi-Source Research Summary
**News Sentiment**: {{newsSentiment}}/100 ({{newsConfidence}}% confidence)
**Social Sentiment**: {{socialSentiment}}/100 ({{socialMomentum}} momentum)
**Technical Signals**: {{technicalSignals}}
**Official Data**: {{officialDataSignals}}

## Strategic Parameters
- **Target Confidence**: {{minConfidence}}%
- **Max Position**: ${{maxPosition}}
- **Risk Tolerance**: {{riskTolerance}}
- **Strategy**: {{activeStrategy}}

## Decision Request

Based on comprehensive analysis, provide trading decision with:

1. **Trade Recommendation**:
   - Action: BUY/SELL/HOLD/NONE
   - Outcome: YES/NO (if applicable)
   - Position Size: Dollar amount (0 to ${{maxPosition}})
   - Order Type: MARKET/LIMIT
   - Target Price: (if limit order)

2. **Confidence Assessment**:
   - Overall Confidence: 0-100
   - Signal Quality: HIGH/MEDIUM/LOW
   - Execution Urgency: IMMEDIATE/NORMAL/PATIENT

3. **Risk Analysis**:
   - Primary Risk Factor
   - Maximum Acceptable Loss
   - Stop Loss Trigger
   - Position Hold Time Estimate

4. **Reasoning & Attribution**:
   - 2-3 sentence trade rationale
   - Key supporting factors
   - Main signal sources contributing to decision
   - Expected value calculation

Format response as structured JSON for automated execution.
```

---

## Enhanced Data Models

### 🏪 Market Intelligence Models

```typescript
interface MarketIntelligence {
  market: Market;
  research_context: EnhancedResearchContext;
  sentiment_analysis: SentimentSynthesis;
  technical_analysis: TechnicalSignals;
  decision_matrix: DecisionScoring;
  timestamp: Date;
}

interface EnhancedResearchContext {
  market_id: string;
  news_intelligence: NewsIntelligence;
  social_intelligence: SocialIntelligence;
  official_data: OfficialDataSignals;
  market_technicals: TechnicalAnalysis;
  cross_market_signals: CrossMarketAnalysis;
  composite_confidence: number;
  signal_freshness: number; // Minutes since latest signal
  timestamp: Date;
}

interface SentimentSynthesis {
  weighted_sentiment: number; // -1 to 1 (bearish to bullish)
  confidence_level: number; // 0 to 1
  direction_strength: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  supporting_factors: string[];
  contradictory_factors: string[];
  momentum_score: number; // Rate of sentiment change
  source_attribution: {
    news_weight: number;
    social_weight: number; 
    official_weight: number;
    technical_weight: number;
  };
}
```

### 📱 Social Intelligence Models

```typescript
interface SocialIntelligence {
  twitter_analysis: TwitterAnalysis;
  reddit_analysis: RedditAnalysis;
  composite_social_score: number;
  momentum_indicators: MomentumIndicators;
  influencer_signals: InfluencerSignal[];
  trending_status: TrendingStatus;
  timestamp: Date;
}

interface TwitterAnalysis {
  tweet_volume: number;
  average_sentiment: number;
  engagement_momentum: number;
  trending_keywords: string[];
  influencer_participation: boolean;
  breaking_news_signals: BreakingNewsSignal[];
  geographic_sentiment: Record<string, number>; // Regional sentiment variation
}

interface RedditAnalysis {
  post_volume: number;
  average_sentiment: number;
  engagement_momentum: number;
  trending_topics: string[];
  community_consensus: 'bullish' | 'bearish' | 'neutral' | 'divided';
  credibility_score: number;
  subreddit_distribution: Record<string, number>;
  key_discussions: RedditDiscussion[];
  time_relevance_score: number;
}

interface RedditDiscussion {
  title: string;
  content: string;
  score: number;
  subreddit: string;
  engagement: number;
  credibility: number;
  sentiment: number;
  timeRelevance: number;
}

interface InfluencerSignal {
  username: string;
  follower_count: number;
  influence_score: number; // Historical accuracy weight
  latest_relevant_tweet: Tweet;
  sentiment: number;
  engagement_rate: number;
  credibility_score: number;
}

interface BreakingNewsSignal {
  source: 'TWITTER' | 'NEWS' | 'REDDIT' | 'OFFICIAL';
  content: string;
  urgency_score: number; // 0-100
  relevance_score: number; // 0-100
  viral_potential: number; // Predicted spread rate
  first_detected: Date;
  confirmation_sources: number;
}
```

### 💰 Enhanced Trading Models

```typescript
interface EnhancedTradeDecision {
  market_id: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'NONE';
  outcome: 'YES' | 'NO' | null;
  position_sizing: PositionSizing;
  execution_plan: ExecutionPlan;
  risk_assessment: RiskAssessment;
  confidence_breakdown: ConfidenceBreakdown;
  signal_attribution: SignalAttribution;
  timestamp: Date;
}

interface PositionSizing {
  dollar_amount: number;
  confidence_adjusted_size: number;
  kelly_optimal_size: number;
  risk_adjusted_size: number;
  final_position_size: number;
  reasoning: string;
}

interface ExecutionPlan {
  order_type: 'MARKET' | 'LIMIT';
  target_price?: number;
  slippage_tolerance: number;
  execution_timeframe: 'IMMEDIATE' | 'NORMAL' | 'PATIENT';
  stop_loss_price?: number;
  take_profit_price?: number;
}

interface RiskAssessment {
  max_loss_amount: number;
  max_loss_percentage: number;
  primary_risk_factors: string[];
  risk_mitigation_strategies: string[];
  position_correlation_risk: number;
  liquidity_risk: number;
  time_decay_risk: number;
}
```

### 📊 Performance Analytics Models

```typescript
interface PerformanceAnalytics {
  trade_performance: TradePerformance;
  signal_attribution: SignalAttribution;
  strategy_effectiveness: StrategyEffectiveness;
  market_conditions: MarketConditionAnalysis;
  learning_insights: LearningInsights;
  timestamp: Date;
}

interface SignalAttribution {
  winning_signals: Record<string, number>; // Signal type -> contribution to wins
  losing_signals: Record<string, number>; // Signal type -> contribution to losses
  signal_reliability: Record<string, ReliabilityMetrics>;
  optimal_weights: Record<string, number>; // Recommended signal weights
}

interface ReliabilityMetrics {
  accuracy_rate: number;
  false_positive_rate: number;
  signal_decay_rate: number; // How quickly signal value degrades
  optimal_confidence_threshold: number;
}
```

---

## Environment Configuration

### 🔧 Comprehensive Environment Variables

```bash
# === External API Keys ===
POLYMARKET_API_URL=https://gamma-api.polymarket.com
NEWS_API_KEY=your_newsapi_key
ALPHA_VANTAGE_KEY=your_alpha_vantage_key
OPENAI_API_KEY=your_openai_api_key

# === Social Media Intelligence ===
# Twitter (optional for authenticated searches)
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
TWITTER_EMAIL=your_twitter_email

# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# === EVM MCP Server & Blockchain ===
# Private key for transaction signing (required)
POLYMARKET_PRIVATE_KEY=0x1234567890abcdef...
# Optional: Custom RPC endpoints (uses public RPCs by default)
ETHEREUM_RPC_URL=https://eth.llamarpc.com
POLYGON_RPC_URL=https://polygon-rpc.com
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
# EVM MCP Server configuration
EVM_MCP_MODE=stdio  # stdio (recommended) or http
EVM_MCP_DEFAULT_NETWORK=polygon  # Default network for transactions

# === Strategy Configuration ===
# Market Filters
MIN_LIQUIDITY=1000
MAX_TIME_TO_CLOSE_HOURS=72
MIN_DAILY_VOLUME=500
MAX_SPREAD_PERCENT=5

# Scoring Weights
SENTIMENT_WEIGHT=0.40
TECHNICAL_WEIGHT=0.25
LIQUIDITY_WEIGHT=0.20
TIMING_WEIGHT=0.10
CATALYST_WEIGHT=0.05

# Risk Management
MIN_CONFIDENCE_THRESHOLD=65
MAX_POSITION_SIZE=100
MAX_TOTAL_EXPOSURE=300
MAX_CONCURRENT_TRADES=3
DAILY_LOSS_LIMIT=100

# === Operational Settings ===
WORKFLOW_INTERVAL_MINUTES=15
RESEARCH_TIMEOUT_SECONDS=60
DECISION_TIMEOUT_SECONDS=30
EXECUTION_TIMEOUT_SECONDS=120

# Monitoring & Alerts
LOG_LEVEL=info
ENABLE_TRADE_EXECUTION=false
ENABLE_SLACK_ALERTS=false
SLACK_WEBHOOK_URL=your_slack_webhook

# === Database & Caching ===
# Supabase PostgreSQL connection string
DATABASE_URL=postgresql://username:password@hostname:port/database
REDIS_URL=redis://localhost:6379
CACHE_TTL_MINUTES=5

# === Development & Testing ===
NODE_ENV=development
DRY_RUN_MODE=true
MOCK_EVM_RESPONSES=true
ENABLE_PERFORMANCE_TRACKING=true
```

### 🏗 Enhanced Dependencies

```json
{
  "name": "polymarket-agent-mvp",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@mastra/core": "^0.1.50",
    "@the-convocation/twitter-scraper": "^latest",
    "zod": "^3.23",
    "dotenv": "^16.3", 
    "axios": "^1.6",
    "winston": "^3.11",
    "drizzle-orm": "^0.43.1",
    "drizzle-zod": "^0.8.2",
    "pg": "^8.10.0",
    "crypto": "^1.0", // For query hashing
    "lru-cache": "^11.1", // For in-memory caching fallback
    "@mcpdotdirect/evm-mcp-server": "^1.2.0", // EVM blockchain operations via MCP
    "node-cron": "^3.0",
    "ioredis": "^5.3",
    "openai": "^4.20",
    "sentiment": "^5.0",
    "natural": "^6.7",
    "cheerio": "^1.0",
    "rss-parser": "^3.13",
    "ws": "^8.14",
    "express": "^4.18",
    "cors": "^2.8",
    "helmet": "^7.1",
    "rate-limiter-flexible": "^3.0"
  },
  "devDependencies": {
    "@types/node": "^20.8",
    "@types/ws": "^8.5",
    "@types/express": "^4.17",
    "@types/pg": "^8.6.6",
    "drizzle-kit": "^0.31.1",
    "typescript": "^5.2",
    "ts-node": "^10.9",
    "nodemon": "^3.0",
    "jest": "^29.7",
    "@types/jest": "^29.5",
    "supertest": "^6.3",
    "eslint": "^8.50",
    "@typescript-eslint/eslint-plugin": "^6.7",
    "prettier": "^3.0"
  },
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "cli": "ts-node src/cli/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:check": "drizzle-kit check"
  }
}
```

---

## Detailed Component Architecture

### 🤖 Enhanced Agent Implementations

#### **Complete Agent Implementation Examples**

**Note**: The following shows the legacy interface - refer to the [Mastra Framework Implementation Guide](#mastra-framework-implementation-guide) above for the modern Mastra Agent patterns using `new Agent()` class and `createTool()` functions.

```typescript
// Legacy implementation reference - use new Mastra patterns instead
// See "Mastra Framework Implementation Guide" section above for current approach

/*
// src/agents/research.agent.ts - LEGACY PATTERN (DO NOT USE)
import { MastraAgent } from '@mastra/core';

export class EnhancedResearchAgent implements MastraAgent {
  name = 'enhanced-research-agent';
  description = 'Multi-source intelligence gathering and synthesis';

  async execute(input: ResearchInput): Promise<EnhancedResearchContext> {
    // Reddit implementation will follow the established patterns from truststay:
    // 1. OAuth2 client credentials authentication
    // 2. Intelligent multi-query search strategies  
    // 3. Post quality filtering and credibility scoring
    // 4. Comprehensive error handling with circuit breaker pattern
    // 5. Redis caching with dynamic TTL based on market volatility
    // 6. Rate limiting and request spacing for API compliance
    // 7. Sentiment analysis and community consensus detection
    
    // This implementation is incomplete - use the modern Mastra patterns instead
    throw new Error('Use new Agent() class from Mastra Framework Implementation Guide');
  }
}
*/
```

**👆 Important**: Use the modern Mastra patterns shown in the [Mastra Framework Implementation Guide](#mastra-framework-implementation-guide) section instead of the legacy patterns above.