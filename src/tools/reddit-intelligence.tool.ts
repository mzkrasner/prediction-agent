import { createTool } from '@mastra/core';
import { z } from 'zod';
import axios from 'axios';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { analyzeBatchSentimentWithAI, calculateAggregateSentiment } from '../utils/sentiment-analysis.js';

// Initialize simple in-memory cache (no Redis needed for MVP)
const cache = new LRUCache<string, { data: ProcessedRedditData; timestamp: number }>({
  max: 100, // Maximum 100 cached results
  ttl: 5 * 60 * 1000, // 5 minute TTL
});

// Types for Reddit API responses
interface RedditPost {
  title: string;
  content: string;
  score: number;
  subreddit: string;
  author: string;
  created_utc: number;
  num_comments: number;
  upvote_ratio: number;
  permalink: string;
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

interface ProcessedRedditData {
  sentiment_score: number; // -1 to 1
  confidence: number; // 0 to 1
  trending_topics: string[];
  key_discussions: RedditDiscussion[];
  community_sentiment: 'bullish' | 'bearish' | 'neutral' | 'divided'; // Fixed field name
  engagement_momentum: number;
  credibility_score: number;
  post_volume: number;
  average_sentiment: number;
  subreddit_distribution: Record<string, number>;
  time_relevance_score: number;
}

// Circuit breaker for Reddit API reliability
class RedditApiCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = parseInt(process.env.REDDIT_FAILURE_THRESHOLD || '5');
  private readonly recoveryTimeout = parseInt(process.env.REDDIT_RECOVERY_TIMEOUT_MINUTES || '5') * 60000;
  
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

const circuitBreaker = new RedditApiCircuitBreaker();

// Simple cache helper functions
function getCachedResult(marketId: string, queryHash: string): ProcessedRedditData | null {
  const cacheKey = `reddit:${marketId}:${queryHash}`;
  const cached = cache.get(cacheKey);
  
  if (!cached) return null;
  
  // Check if cache is still fresh
  const ttl = 5 * 60 * 1000; // 5 minutes
  if ((Date.now() - cached.timestamp) > ttl) {
    cache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedResult(marketId: string, queryHash: string, data: ProcessedRedditData): void {
  const cacheKey = `reddit:${marketId}:${queryHash}`;
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

// OAuth2 Client Credentials Flow Implementation
async function getRedditAccessToken(): Promise<string> {
  try {
    console.log(`🔍 Reddit authenticating with client ID: ${process.env.REDDIT_CLIENT_ID?.substring(0, 8)}...`);
    const authResponse = await axios.post('https://www.reddit.com/api/v1/access_token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': process.env.REDDIT_USER_AGENT || 'PolymarketAgent/1.0'
        },
        auth: {
          username: process.env.REDDIT_CLIENT_ID!,
          password: process.env.REDDIT_CLIENT_SECRET!
        },
        timeout: parseInt(process.env.REDDIT_REQUEST_TIMEOUT || '10000')
      }
    );
    
    console.log(`✅ Reddit authentication successful, token length: ${authResponse.data.access_token?.length || 0}`);
    return authResponse.data.access_token;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
    console.error(`❌ Reddit authentication failed: ${errorMessage}`);
    throw new Error(`Reddit authentication failed: ${errorMessage}`);
  }
}

// LLM-driven subreddit discovery
async function discoverTargetSubreddits(marketTitle: string, keywords: string[]): Promise<{
  primary: string[];
  secondary: string[];
}> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set, using fallback subreddit selection');
      return getFallbackSubreddits(marketTitle, keywords);
    }

    const { text: aiResponse } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `You are a Reddit research expert. Given this prediction market, suggest the most relevant Reddit communities for gathering intelligent discussion.

Market: "${marketTitle}"
Keywords: ${keywords.join(', ')}

Consider these factors:
- Topic relevance to the market
- Community quality and engagement
- Discussion depth and expertise level
- Likelihood of informed opinions

Suggest subreddits in two tiers:
- Primary: 4-5 most relevant, high-quality communities
- Secondary: 3-4 additional communities for broader perspective

CRITICAL: Return ONLY raw JSON with no explanations, no markdown, no code blocks, no additional text.
Your entire response must be valid JSON that can be parsed directly.

Expected format (return exactly this structure with your data):
{"primary":["economics","investing","politics"],"secondary":["worldnews","PredictionMarkets","SecurityAnalysis"]}

Do not include the r/ prefix. Do not include \`\`\`json or \`\`\` or any other formatting. Start with { and end with }.`
    });

    // Clean the response - remove markdown code blocks if present
    const cleanedResponse = aiResponse.trim()
      .replace(/^```json\s*/, '')  // Remove opening ```json
      .replace(/\s*```$/, '')       // Remove closing ```
      .trim();
    
    const parsed = JSON.parse(cleanedResponse);
    console.log(`🧠 LLM suggested subreddits - Primary: ${parsed.primary.join(', ')}, Secondary: ${parsed.secondary.join(', ')}`);
    
    return {
      primary: parsed.primary || [],
      secondary: parsed.secondary || []
    };
  } catch (error) {
    console.error('❌ LLM subreddit discovery failed:', error instanceof Error ? error.message : 'Unknown error');
    return getFallbackSubreddits(marketTitle, keywords);
  }
}

// Fallback subreddit selection for when LLM is unavailable
function getFallbackSubreddits(marketTitle: string, keywords: string[]): {
  primary: string[];
  secondary: string[];
} {
  const title = marketTitle.toLowerCase();
  const keywordStr = keywords.join(' ').toLowerCase();
  
  // Economic/Financial markets
  if (title.includes('recession') || title.includes('economy') || title.includes('inflation') || 
      keywordStr.includes('fed') || keywordStr.includes('market') || keywordStr.includes('stock')) {
    return {
      primary: ['economics', 'investing', 'stocks', 'SecurityAnalysis'],
      secondary: ['financialindependence', 'econmonitor', 'ValueInvesting']
    };
  }
  
  // Political markets
  if (title.includes('trump') || title.includes('election') || title.includes('president') || 
      title.includes('biden') || title.includes('congress') || keywordStr.includes('political')) {
    return {
      primary: ['politics', 'PoliticalDiscussion', 'Ask_Politics'],
      secondary: ['NeutralPolitics', 'moderatepolitics', 'Conservative']
    };
  }
  
  // Geopolitical markets
  if (title.includes('russia') || title.includes('ukraine') || title.includes('china') || 
      title.includes('war') || title.includes('conflict') || keywordStr.includes('ceasefire')) {
    return {
      primary: ['geopolitics', 'worldnews', 'europe'],
      secondary: ['InternationalNews', 'UkrainianConflict', 'russia']
    };
  }
  
  // Technology markets
  if (title.includes('ai') || title.includes('technology') || title.includes('crypto') || 
      title.includes('bitcoin') || keywordStr.includes('tech')) {
    return {
      primary: ['technology', 'artificial', 'singularity'],
      secondary: ['MachineLearning', 'Futurology', 'CryptoCurrency']
    };
  }
  
  // Default general approach
  return {
    primary: ['PredictionMarkets', 'worldnews', 'news'],
    secondary: ['todayilearned', 'explainlikeimfive', 'AskReddit']
  };
}

// Get posts from a specific subreddit using proper Reddit API endpoints
async function getSubredditPosts(
  subreddit: string, 
  endpoint: 'hot' | 'top' | 'new' | 'rising',
  accessToken: string,
  limit: number = 10,
  timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
): Promise<RedditPost[]> {
  try {
    const url = `https://oauth.reddit.com/r/${subreddit}/${endpoint}`;
    const params: any = { limit };
    
    // Add time filter for 'top' endpoint
    if (endpoint === 'top' && timeFilter) {
      params.t = timeFilter;
    }
    
    console.log(`🔍 Fetching r/${subreddit}/${endpoint} (limit: ${limit})`);
    
    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'PolymarketAgent/1.0'
      },
      timeout: parseInt(process.env.REDDIT_REQUEST_TIMEOUT || '15000')
    });
    
    if (response.data?.data?.children?.length) {
      const posts = response.data.data.children
        .filter((post: any) => post.data.selftext || post.data.title)
        .map((post: any) => ({
          title: post.data.title,
          content: post.data.selftext || '',
          score: post.data.score || 0,
          subreddit: post.data.subreddit,
          author: post.data.author,
          created_utc: post.data.created_utc,
          num_comments: post.data.num_comments || 0,
          upvote_ratio: post.data.upvote_ratio || 0,
          permalink: post.data.permalink
        })) as RedditPost[];
      
      console.log(`📊 Found ${posts.length} posts from r/${subreddit}/${endpoint}`);
      return posts;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ Failed to fetch r/${subreddit}/${endpoint}:`, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

// Enhanced Reddit research using LLM-guided subreddit selection
async function searchRedditDiscussions(params: {
  marketTitle: string;
  keywords: string[];
  timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  sortBy?: 'relevance' | 'new' | 'hot' | 'top';
  limit?: number;
}): Promise<RedditPost[]> {
  const accessToken = await getRedditAccessToken();
  
  // Phase 1: LLM suggests target subreddits
  const subredditTargets = await discoverTargetSubreddits(params.marketTitle, params.keywords);
  console.log(`🎯 Targeting ${subredditTargets.primary.length} primary + ${subredditTargets.secondary.length} secondary subreddits`);
  
  const allPosts: RedditPost[] = [];
  const postsPerSubreddit = Math.max(3, Math.floor((params.limit || 25) / (subredditTargets.primary.length + subredditTargets.secondary.length)));
  
  // Phase 2: Sample posts from primary subreddits (higher priority)
  for (const subreddit of subredditTargets.primary) {
    try {
      // Get hot posts (current discussions)
      const hotPosts = await getSubredditPosts(subreddit, 'hot', accessToken, Math.ceil(postsPerSubreddit * 0.6), params.timeFilter);
      allPosts.push(...hotPosts);
      
      // Get top posts (quality discussions)  
      const topPosts = await getSubredditPosts(subreddit, 'top', accessToken, Math.ceil(postsPerSubreddit * 0.4), params.timeFilter || 'week');
      allPosts.push(...topPosts);
      
    } catch (error) {
      console.error(`⚠️ Failed to fetch from primary subreddit r/${subreddit}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  // Phase 3: Sample posts from secondary subreddits (broader perspective)
  for (const subreddit of subredditTargets.secondary.slice(0, 2)) { // Limit secondary to 2 subreddits
    try {
      const posts = await getSubredditPosts(subreddit, 'hot', accessToken, Math.ceil(postsPerSubreddit * 0.5), params.timeFilter);
      allPosts.push(...posts);
    } catch (error) {
      console.error(`⚠️ Failed to fetch from secondary subreddit r/${subreddit}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  console.log(`📊 Collected ${allPosts.length} total posts from targeted subreddits`);
  
  // Phase 4: LLM content relevance filtering (if we have too many posts)
  if (allPosts.length > 50) {
    console.log(`🧠 LLM filtering ${allPosts.length} posts for relevance...`);
    const filteredPosts = await filterPostsForRelevance(allPosts, params.marketTitle, params.keywords);
    return deduplicateAndRankPosts(filteredPosts);
  }
  
  return deduplicateAndRankPosts(allPosts);
}

// LLM-powered content relevance filtering
async function filterPostsForRelevance(
  posts: RedditPost[], 
  marketTitle: string, 
  keywords: string[]
): Promise<RedditPost[]> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set, skipping LLM filtering');
      return posts;
    }

    // Prepare post summaries for LLM evaluation
    const postSummaries = posts.slice(0, 100).map((post, index) => ({
      id: index,
      title: post.title,
      subreddit: post.subreddit,
      score: post.score,
      comments: post.num_comments
    }));

    const { text: aiResponse } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `Filter these Reddit posts for relevance to the prediction market: "${marketTitle}"

Market Keywords: ${keywords.join(', ')}

Posts to evaluate:
${postSummaries.map(p => `${p.id}: [r/${p.subreddit}] "${p.title}" (${p.score} upvotes, ${p.comments} comments)`).join('\n')}

Return a JSON array of post IDs that are DIRECTLY relevant to this prediction market.
Only include posts that could provide genuine insight for prediction purposes.
Exclude: memes, jokes, off-topic discussions, general news without prediction relevance.

CRITICAL: Return ONLY a raw JSON array with no explanations, no markdown, no code blocks.
Your entire response must be valid JSON that can be parsed directly.

Expected format: [0,5,12,18]

Do not include \`\`\`json or \`\`\` or any other formatting. Start with [ and end with ].`
    });

    // Clean the response - remove markdown code blocks if present
    const cleanedResponse = aiResponse.trim()
      .replace(/^```json\s*/, '')  // Remove opening ```json
      .replace(/\s*```$/, '')       // Remove closing ```
      .trim();
    
    const relevantIds = JSON.parse(cleanedResponse) as number[];
    const filteredPosts = relevantIds
      .filter(id => id < posts.length)
      .map(id => posts[id]);
    
    console.log(`🧠 LLM filtered ${posts.length} posts down to ${filteredPosts.length} relevant posts`);
    return filteredPosts;
    
  } catch (error) {
    console.error('❌ LLM filtering failed:', error instanceof Error ? error.message : 'Unknown error');
    return posts; // Return all posts if filtering fails
  }
}

// Deduplicate and rank posts
function deduplicateAndRankPosts(posts: RedditPost[]): RedditPost[] {
  const seen = new Set<string>();
  const unique = posts.filter(post => {
    const key = `${post.title}-${post.subreddit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Sort by relevance score (combination of score and upvote ratio)
  return unique
    .sort((a, b) => (b.score * b.upvote_ratio) - (a.score * a.upvote_ratio))
    .slice(0, 50); // Limit to top 50 posts
}

// Calculate post credibility
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

// Calculate time relevance
function calculateTimeRelevance(created_utc: number): number {
  const hoursSincePost = (Date.now() / 1000 - created_utc) / 3600;
  
  // More recent posts are more relevant
  if (hoursSincePost < 1) return 1.0;
  if (hoursSincePost < 6) return 0.9;
  if (hoursSincePost < 24) return 0.7;
  if (hoursSincePost < 72) return 0.5;
  return 0.3;
}

// Legacy sentiment analysis - replaced with shared LLM utility

// Process Reddit data into structured format
async function processRedditData(posts: RedditPost[], marketContext: string): Promise<ProcessedRedditData> {
  // Filter and rank posts by relevance and quality
  const qualityPosts = posts
    .filter(post => post.score > 5) // Minimum score threshold
    .filter(post => post.content.length > 50 || post.title.length > 20)
    .sort((a, b) => (b.score * b.upvote_ratio) - (a.score * a.upvote_ratio))
    .slice(0, 15); // Top 15 most relevant posts
  
  if (qualityPosts.length === 0) {
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
      time_relevance_score: 0
    };
  }
  
  // Extract key discussions with enhanced context
  const keyDiscussions: RedditDiscussion[] = qualityPosts.map(post => ({
    title: post.title,
    content: post.content.slice(0, 500),
    score: post.score,
    subreddit: post.subreddit,
    engagement: post.num_comments,
    credibility: calculatePostCredibility(post),
    sentiment: 0, // Will be filled by batch sentiment analysis
    timeRelevance: calculateTimeRelevance(post.created_utc)
  }));
  
  // Apply LLM-driven sentiment analysis to all discussions
  if (keyDiscussions.length > 0) {
    console.log(`🧠 Analyzing sentiment for ${keyDiscussions.length} Reddit posts...`);
    
    const contentItems = keyDiscussions.map((discussion, index) => ({
      id: index.toString(),
      text: `${discussion.title} ${discussion.content}`,
      source: `r/${discussion.subreddit}`
    }));
    
    const sentimentResults = await analyzeBatchSentimentWithAI(contentItems, marketContext);
    
    // Apply sentiment scores back to discussions
    sentimentResults.forEach(result => {
      const index = parseInt(result.id);
      if (index < keyDiscussions.length) {
        keyDiscussions[index].sentiment = result.score;
      }
    });
    
    console.log(`🧠 Reddit sentiment analysis complete`);
  }
  
  // Calculate aggregate metrics using confidence-weighted sentiment
  const sentimentResults = keyDiscussions.map(d => ({
    score: d.sentiment,
    confidence: 0.8, // Default confidence for LLM analysis
    reasoning: 'LLM sentiment analysis'
  }));
  const avgSentiment = calculateAggregateSentiment(sentimentResults);
  const avgCredibility = keyDiscussions.reduce((sum, d) => sum + d.credibility, 0) / keyDiscussions.length;
  const avgTimeRelevance = keyDiscussions.reduce((sum, d) => sum + d.timeRelevance, 0) / keyDiscussions.length;
  
  // Determine community sentiment
  let sentiment: 'bullish' | 'bearish' | 'neutral' | 'divided' = 'neutral';
  if (avgSentiment > 0.3) sentiment = 'bullish';
  else if (avgSentiment < -0.3) sentiment = 'bearish';
  else if (Math.abs(avgSentiment) < 0.1) sentiment = 'neutral';
  else sentiment = 'divided';
  
  // Calculate subreddit distribution
  const subredditDist: Record<string, number> = {};
  keyDiscussions.forEach(d => {
    subredditDist[d.subreddit] = (subredditDist[d.subreddit] || 0) + 1;
  });
  
  // Extract trending topics (simple keyword extraction)
  const allText = keyDiscussions.map(d => d.title + ' ' + d.content).join(' ').toLowerCase();
  const words = allText.split(/\s+/).filter(w => w.length > 4);
  const wordCounts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const trendingTopics = Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return {
    sentiment_score: avgSentiment,
    confidence: avgCredibility,
    trending_topics: trendingTopics,
    key_discussions: keyDiscussions,
    community_sentiment: sentiment,
    engagement_momentum: keyDiscussions.reduce((sum, d) => sum + d.engagement, 0) / keyDiscussions.length,
    credibility_score: avgCredibility,
    post_volume: qualityPosts.length,
    average_sentiment: avgSentiment,
    subreddit_distribution: subredditDist,
    time_relevance_score: avgTimeRelevance
  };
}

// Generate query hash for caching
function generateQueryHash(params: { 
  marketTitle: string; 
  keywords: string[]; 
  timeFilter?: string;
  sortBy?: string;
  limit?: number;
  targetSubreddits?: string[];
}): string {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex');
}

// Main Reddit Intelligence Tool
export const redditIntelligenceTool = createTool({
  id: 'reddit-intelligence',
  description: 'Analyze Reddit discussions for market sentiment and community consensus',
  inputSchema: z.object({
    marketTitle: z.string().min(1, 'Market title is required'),
    marketId: z.string().min(1, 'Market ID is required'),
    keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
    subreddits: z.array(z.string()).optional().describe('Optional specific subreddits to search'),
    timeFilter: z.enum(['hour', 'day', 'week', 'month', 'year', 'all']).default('week'),
    sortBy: z.enum(['relevance', 'new', 'hot', 'top']).default('relevance')
  }),
  outputSchema: z.object({
    sentiment_score: z.number().min(-1).max(1),
    confidence: z.number().min(0).max(1),
    trending_topics: z.array(z.string()),
    key_discussions: z.array(z.object({
      title: z.string(),
      content: z.string(),
      score: z.number(),
      subreddit: z.string(),
      engagement: z.number(),
      credibility: z.number(),
      sentiment: z.number(),
      timeRelevance: z.number()
    })),
    community_sentiment: z.enum(['bullish', 'bearish', 'neutral', 'divided']),
    engagement_momentum: z.number(),
    credibility_score: z.number(),
    post_volume: z.number(),
    average_sentiment: z.number(),
    subreddit_distribution: z.record(z.string(), z.number()),
    time_relevance_score: z.number(),
    sources: z.array(z.string()),
    cached: z.boolean()
  }),
  execute: async (context) => {
    const { marketTitle, marketId, keywords, subreddits, timeFilter, sortBy } = context.context;
    try {
      const queryHash = generateQueryHash({ marketTitle, keywords, timeFilter, sortBy });
      
      // Try cache first
      const cached = getCachedResult(marketId, queryHash);
      if (cached) {
        return {
          ...cached,
          sources: ['reddit-cache'],
          cached: true
        };
      }
      
      // Execute search with circuit breaker protection
      const fallbackData: ProcessedRedditData = {
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
        time_relevance_score: 0
      };
      
      const posts = await circuitBreaker.execute(
        () => searchRedditDiscussions({
          marketTitle,
          keywords,
          timeFilter,
          sortBy,
          limit: 25
        }),
        []
      );
      
      const processedData = await processRedditData(posts, marketTitle);
      
      // Cache successful results
      setCachedResult(marketId, queryHash, processedData);
      
      return {
        ...processedData,
        sources: ['reddit-api'],
        cached: false
      };
      
    } catch (error) {
      console.error('Reddit tool execution failed:', error);
      
      return {
        sentiment_score: 0,
        confidence: 0,
        trending_topics: [],
        key_discussions: [],
        community_sentiment: 'neutral' as const,
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
});