import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Scraper, SearchMode } from '@the-convocation/twitter-scraper';
import { LRUCache } from 'lru-cache';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { analyzeBatchSentimentWithAI, calculateAggregateSentiment } from '../utils/sentiment-analysis.js';

// Types for Twitter data
interface TwitterPost {
  id: string;
  text: string;
  username: string;
  name: string;
  timestamp: Date;
  likes: number;
  retweets: number;
  replies: number;
  views?: number;
  isRetweet: boolean;
  hashtags: string[];
  mentions: string[];
  urls: string[];
  photos?: string[];
  videos?: string[];
  thread?: TwitterPost[];
  permanentUrl: string;
  userId: string;
  conversationId: string;
  inReplyToStatus?: string;
  quotedStatus?: TwitterPost;
}

interface InfluencerProfile {
  username: string;
  name: string;
  followerCount: number;
  influenceScore: number; // Calculated based on engagement and relevance
  category: 'politician' | 'analyst' | 'journalist' | 'trader' | 'insider' | 'other';
  verified: boolean;
}

interface ProcessedTwitterData {
  sentiment_score: number; // -1 to 1
  confidence: number; // 0 to 1
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
}

// Influential accounts to monitor for prediction markets
const INFLUENCER_ACCOUNTS: InfluencerProfile[] = [
  // Politicians
  { username: 'realDonaldTrump', name: 'Donald Trump', followerCount: 80000000, influenceScore: 0.95, category: 'politician', verified: true },
  { username: 'JoeBiden', name: 'Joe Biden', followerCount: 35000000, influenceScore: 0.90, category: 'politician', verified: true },
  { username: 'KamalaHarris', name: 'Kamala Harris', followerCount: 20000000, influenceScore: 0.85, category: 'politician', verified: true },
  { username: 'SpeakerPelosi', name: 'Nancy Pelosi', followerCount: 15000000, influenceScore: 0.80, category: 'politician', verified: true },
  
  // Market Analysts & Traders  
  { username: 'jimcramer', name: 'Jim Cramer', followerCount: 2000000, influenceScore: 0.75, category: 'analyst', verified: true },
  { username: 'RaoulGMI', name: 'Raoul Pal', followerCount: 1500000, influenceScore: 0.85, category: 'analyst', verified: true },
  { username: 'APompliano', name: 'Anthony Pompliano', followerCount: 1800000, influenceScore: 0.80, category: 'analyst', verified: true },
  
  // Financial Journalists
  { username: 'CharlieBilello', name: 'Charlie Bilello', followerCount: 800000, influenceScore: 0.82, category: 'analyst', verified: true },
  { username: 'business', name: 'Bloomberg', followerCount: 3000000, influenceScore: 0.88, category: 'journalist', verified: true },
  { username: 'WSJ', name: 'Wall Street Journal', followerCount: 20000000, influenceScore: 0.90, category: 'journalist', verified: true },
  
  // Crypto/Trading  
  { username: 'elonmusk', name: 'Elon Musk', followerCount: 150000000, influenceScore: 0.95, category: 'insider', verified: true },
  { username: 'VitalikButerin', name: 'Vitalik Buterin', followerCount: 5000000, influenceScore: 0.90, category: 'insider', verified: true },
];

// Cache for Twitter data (5 minute TTL)
const twitterCache = new LRUCache<string, { data: ProcessedTwitterData; timestamp: number }>({
  max: 50,
  ttl: 5 * 60 * 1000, // 5 minutes
});

// Rate limiting and retry logic
class TwitterRateLimiter {
  private lastRequest = 0;
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly maxRequestsPerWindow = 150; // Conservative limit
  private readonly windowDurationMs = 15 * 60 * 1000; // 15 minutes
  private readonly minDelayMs = 2000; // 2 seconds between requests

  async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.windowStart > this.windowDurationMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    // Check if we're over the rate limit
    if (this.requestCount >= this.maxRequestsPerWindow) {
      const waitTime = this.windowDurationMs - (now - this.windowStart);
      console.warn(`Twitter rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.windowStart = Date.now();
    }
    
    // Ensure minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.minDelayMs) {
      await new Promise(resolve => setTimeout(resolve, this.minDelayMs - timeSinceLastRequest));
    }
    
    this.requestCount++;
    this.lastRequest = Date.now();
  }
}

const rateLimiter = new TwitterRateLimiter();

// Twitter scraper instance
let scraper: Scraper | null = null;

async function getTwitterScraper(): Promise<Scraper> {
  if (!scraper) {
    scraper = new Scraper();
    
    // Debug: Check environment variables
    console.log(`🔍 TWITTER_USERNAME set: ${!!process.env.TWITTER_USERNAME}`);
    console.log(`🔍 TWITTER_PASSWORD set: ${!!process.env.TWITTER_PASSWORD}`);
    
    // Optional authentication if credentials are provided
    if (process.env.TWITTER_USERNAME && process.env.TWITTER_PASSWORD) {
      console.log('🐦 Authenticating Twitter scraper...');
      try {
        await scraper.login(process.env.TWITTER_USERNAME, process.env.TWITTER_PASSWORD);
        console.log('✅ Twitter authentication successful');
      } catch (error) {
        console.error('❌ Twitter authentication failed:', error instanceof Error ? error.message : 'Unknown error');
        console.log('🐦 Continuing without authentication (limited functionality)');
      }
    } else {
      console.log('🐦 Using Twitter scraper without authentication (limited functionality)');
    }
  }
  
  return scraper;
}

// Legacy sentiment analysis - replaced with shared LLM utility

// Trending topic detection
function extractTrendingTopics(posts: TwitterPost[]): string[] {
  const hashtagCounts = new Map<string, number>();
  const mentionCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();
  
  posts.forEach(post => {
    // Count hashtags
    post.hashtags.forEach(tag => {
      hashtagCounts.set(tag.toLowerCase(), (hashtagCounts.get(tag.toLowerCase()) || 0) + 1);
    });
    
    // Count mentions
    post.mentions.forEach(mention => {
      mentionCounts.set(mention.toLowerCase(), (mentionCounts.get(mention.toLowerCase()) || 0) + 1);
    });
    
    // Extract keywords from text
    const keywords = post.text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !word.startsWith('@') && !word.startsWith('#'))
      .filter(word => !/^https?:\/\//.test(word));
    
    keywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
  });
  
  // Get top trending items
  const topHashtags = Array.from(hashtagCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([tag]) => `#${tag}`);
  
  const topKeywords = Array.from(keywordCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([keyword]) => keyword);
  
  return [...topHashtags, ...topKeywords].slice(0, 8);
}

// Breaking news detection
function detectBreakingNews(posts: TwitterPost[]): Array<{
  content: string;
  urgency_score: number;
  viral_potential: number;
  source_credibility: number;
}> {
  const breakingSignals = ['BREAKING', 'URGENT', 'ALERT', 'JUST IN', 'LIVE'];
  const newsKeywords = ['report', 'confirms', 'announces', 'sources', 'exclusive'];
  
  return posts
    .filter(post => {
      const upperText = post.text.toUpperCase();
      return breakingSignals.some(signal => upperText.includes(signal)) ||
             newsKeywords.some(keyword => post.text.toLowerCase().includes(keyword));
    })
    .map(post => {
      const upperText = post.text.toUpperCase();
      let urgencyScore = 0;
      
      // Calculate urgency based on keywords and engagement
      if (breakingSignals.some(signal => upperText.includes(signal))) urgencyScore += 0.4;
      if (newsKeywords.some(keyword => post.text.toLowerCase().includes(keyword))) urgencyScore += 0.2;
      
      // Engagement factor
      const totalEngagement = post.likes + post.retweets + post.replies;
      const engagementFactor = Math.min(Math.log10(totalEngagement + 1) / 5, 0.4);
      urgencyScore += engagementFactor;
      
      // Viral potential based on retweet ratio
      const viralPotential = post.retweets > 0 ? 
        Math.min(post.retweets / (post.likes + 1), 1) : 0;
      
      // Source credibility (higher for verified accounts and influencers)
      const influencer = INFLUENCER_ACCOUNTS.find(inf => inf.username.toLowerCase() === post.username.toLowerCase());
      const sourceCredibility = influencer ? influencer.influenceScore : 0.3;
      
      return {
        content: post.text.slice(0, 200),
        urgency_score: Math.min(urgencyScore, 1),
        viral_potential: viralPotential,
        source_credibility: sourceCredibility
      };
    })
    .filter(signal => signal.urgency_score > 0.3)
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .slice(0, 5);
}

// LLM-driven search query generation
async function generateSmartTwitterQueries(marketTitle: string, keywords: string[]): Promise<{
  primary: string[];
  hashtag: string[];
  userTargets: string[];
}> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set, using fallback Twitter queries');
      return getFallbackTwitterQueries(marketTitle, keywords);
    }

    const { text: aiResponse } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `You are a Twitter search expert. Given this prediction market, generate optimal search queries for finding relevant discussions.

Market: "${marketTitle}"
Keywords: ${keywords.join(', ')}

Generate 3 types of search strategies:
1. Primary queries: 4-5 natural language queries that would capture relevant discussions
2. Hashtag queries: 3-4 hashtags likely to be used in relevant posts (without #)
3. User targets: 3-4 influential Twitter usernames likely to discuss this topic (without @)

Consider:
- Twitter's search syntax and limitations
- Different ways people discuss this topic
- Relevant hashtags and trending terms
- Key influencers in the space

CRITICAL: Return ONLY raw JSON with no explanations, no markdown, no code blocks, no additional text.
Your entire response must be valid JSON that can be parsed directly.

Expected format (return exactly this structure with your data):
{"primary":["recession 2025","economic downturn prediction","Fed policy impact"],"hashtag":["recession","economy","fed"],"userTargets":["jimcramer","RaoulGMI","business"]}

Do not include \`\`\`json or \`\`\` or any other formatting. Start your response with { and end with }.`
    });

    // Clean the response - remove markdown code blocks if present
    const cleanedResponse = aiResponse.trim()
      .replace(/^```json\s*/, '')  // Remove opening ```json
      .replace(/\s*```$/, '')       // Remove closing ```
      .trim();
    
    const parsed = JSON.parse(cleanedResponse);
    console.log(`🧠 LLM generated Twitter queries - Primary: ${parsed.primary.join(', ')}, Hashtags: ${parsed.hashtag.join(', ')}, Users: ${parsed.userTargets.join(', ')}`);
    
    return {
      primary: parsed.primary || [],
      hashtag: parsed.hashtag || [],
      userTargets: parsed.userTargets || []
    };
  } catch (error) {
    console.error('❌ LLM Twitter query generation failed:', error instanceof Error ? error.message : 'Unknown error');
    return getFallbackTwitterQueries(marketTitle, keywords);
  }
}

// Fallback Twitter queries when LLM is unavailable
function getFallbackTwitterQueries(marketTitle: string, keywords: string[]): {
  primary: string[];
  hashtag: string[];
  userTargets: string[];
} {
  const title = marketTitle.toLowerCase();
  
  // Economic/Financial markets
  if (title.includes('recession') || title.includes('economy') || title.includes('fed')) {
    return {
      primary: [`"${marketTitle}"`, 'recession 2025', 'economic outlook', keywords.slice(0,2).join(' ')],
      hashtag: ['recession', 'economy', 'fed', 'inflation'],
      userTargets: ['jimcramer', 'RaoulGMI', 'business', 'CharlieBilello']
    };
  }
  
  // Political markets
  if (title.includes('trump') || title.includes('biden') || title.includes('election')) {
    return {
      primary: [`"${marketTitle}"`, 'trump prediction', 'election forecast', keywords.slice(0,2).join(' ')],
      hashtag: ['trump', 'politics', 'election', 'potus'],
      userTargets: ['realDonaldTrump', 'JoeBiden', 'PoliticsUpdates', 'Nate_Cohn']
    };
  }
  
  // Geopolitical markets
  if (title.includes('russia') || title.includes('ukraine') || title.includes('china')) {
    return {
      primary: [`"${marketTitle}"`, 'geopolitical risk', 'conflict update', keywords.slice(0,2).join(' ')],
      hashtag: ['ukraine', 'russia', 'geopolitics', 'conflict'],
      userTargets: ['KyivIndependent', 'BBCBreaking', 'business', 'CFR_org']
    };
  }
  
  // Default
  return {
    primary: [`"${marketTitle}"`, ...keywords.slice(0, 3)],
    hashtag: keywords.slice(0, 3),
    userTargets: ['business', 'BBCBreaking', 'Reuters']
  };
}

// LLM-powered content relevance filtering
async function filterTweetsForRelevance(
  tweets: TwitterPost[], 
  marketTitle: string, 
  keywords: string[]
): Promise<TwitterPost[]> {
  try {
    if (!process.env.ANTHROPIC_API_KEY || tweets.length < 20) {
      console.warn('⚠️ Skipping LLM tweet filtering (no API key or insufficient tweets)');
      return tweets;
    }

    // Prepare tweet summaries for LLM evaluation
    const tweetSummaries = tweets.slice(0, 100).map((tweet, index) => ({
      id: index,
      text: tweet.text.slice(0, 100),
      username: tweet.username,
      engagement: tweet.likes + tweet.retweets + tweet.replies
    }));

    const { text: aiResponse } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `Filter these tweets for relevance to the prediction market: "${marketTitle}"

Market Keywords: ${keywords.join(', ')}

Tweets to evaluate:
${tweetSummaries.map(t => `${t.id}: @${t.username}: "${t.text}" (${t.engagement} engagement)`).join('\n')}

Return a JSON array of tweet IDs that are DIRECTLY relevant to this prediction market.
Only include tweets that could provide genuine insight for prediction purposes.
Exclude: spam, off-topic content, generic news without prediction relevance, promotional content.

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
     const filteredTweets = relevantIds
       .filter(id => id < tweets.length)
       .map(id => tweets[id]);
     
     console.log(`🧠 LLM filtered ${tweets.length} tweets down to ${filteredTweets.length} relevant tweets`);
     return filteredTweets;
    
  } catch (error) {
    console.error('❌ LLM tweet filtering failed:', error instanceof Error ? error.message : 'Unknown error');
    return tweets; // Return all tweets if filtering fails
  }
}

// Enhanced search and processing function with LLM intelligence
async function searchAndAnalyzeTwitter(
  marketTitle: string,
  keywords: string[],
  timeframe: '1h' | '6h' | '24h' | '7d' = '24h'
): Promise<ProcessedTwitterData> {
  const twitter = await getTwitterScraper();
  const allPosts: TwitterPost[] = [];
  
  // Phase 1: LLM generates smart search queries
  const queryStrategy = await generateSmartTwitterQueries(marketTitle, keywords);
  console.log(`🎯 LLM Twitter strategy - ${queryStrategy.primary.length} primary queries, ${queryStrategy.hashtag.length} hashtags, ${queryStrategy.userTargets.length} user targets`);
  
  // Phase 2: Execute searches with different strategies
  const searchQueries = [
    ...queryStrategy.primary,
    ...queryStrategy.hashtag.map(tag => `#${tag}`),
    ...queryStrategy.userTargets.map(user => `from:${user} ${keywords.slice(0,2).join(' OR ')}`)
  ];
  
  console.log(`🐦 Searching Twitter with ${searchQueries.length} strategic queries`);
  
  // Debug: Check if scraper is properly authenticated
  console.log(`🔍 Twitter scraper authentication status: ${scraper ? 'initialized' : 'not initialized'}`);
  
  // Search for each query
  for (const query of searchQueries.slice(0, 8)) { // Limit to 8 queries for rate limiting
    try {
      await rateLimiter.waitForRateLimit();
      
      console.log(`🔍 Searching Twitter for query: "${query}"`);
      const searchResult = twitter.searchTweets(query, 25, SearchMode.Latest);
      const tweets = [];
      
      for await (const tweet of searchResult) {
        if (tweets.length >= 25) break; // Limit per query
        
        // Convert to our TwitterPost format
        const post: TwitterPost = {
          id: tweet.id || '',
          text: tweet.text || '',
          username: tweet.username || '',
          name: tweet.name || '',
          timestamp: tweet.timeParsed || new Date(),
          likes: tweet.likes || 0,
          retweets: tweet.retweets || 0,
          replies: tweet.replies || 0,
          views: tweet.views,
          isRetweet: tweet.isRetweet || false,
          hashtags: tweet.hashtags || [],
          mentions: (tweet.mentions || []).map((m: { username?: string; text?: string }) => m.username || m.text || ''),
          urls: tweet.urls || [],
          photos: (tweet.photos || []).map((p: { url?: string }) => p.url || ''),
          videos: (tweet.videos || []).map((v: { url?: string }) => v.url || ''),
          permanentUrl: tweet.permanentUrl || '',
          userId: tweet.userId || '',
          conversationId: tweet.conversationId || '',
          inReplyToStatus: tweet.inReplyToStatus?.id || undefined,
          quotedStatus: undefined // Simplified for now
        };
        
        tweets.push(post);
      }
      
      console.log(`📊 Query "${query}" returned ${tweets.length} tweets`);
      allPosts.push(...tweets);
      
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Twitter search error for "${query}":`, errorMessage);
      // Continue with other queries
    }
  }
  
  // Remove duplicates
  const uniquePosts = Array.from(
    new Map(allPosts.map(post => [post.id, post])).values()
  );
  
  console.log(`📊 Found ${uniquePosts.length} unique tweets`);
  
  if (uniquePosts.length === 0) {
    return getEmptyTwitterData();
  }
  
  // Filter by timeframe
  const now = Date.now();
  const timeframeMs = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  }[timeframe];
  
  const recentPosts = uniquePosts.filter(post => 
    now - post.timestamp.getTime() < timeframeMs
  );
  
  // Phase 3: LLM content relevance filtering
  const filteredPosts = await filterTweetsForRelevance(recentPosts, marketTitle, keywords);
  
  // Apply LLM-driven sentiment analysis to all posts
  let weightedSentiment = 0;
  let avgConfidence = 0;
  const tweetSentiments = new Map<number, number>(); // Store sentiment by post index
  
  if (filteredPosts.length > 0) {
    console.log(`🧠 Analyzing sentiment for ${filteredPosts.length} tweets...`);
    
    const contentItems = filteredPosts.map((post, index) => ({
      id: index.toString(),
      text: post.text,
      source: `@${post.username}`
    }));
    
    const sentimentResults = await analyzeBatchSentimentWithAI(contentItems, marketTitle);
    
    // Store individual tweet sentiments for later use
    sentimentResults.forEach(result => {
      const index = parseInt(result.id);
      tweetSentiments.set(index, result.score);
    });
    
    // Calculate weighted sentiment using confidence from LLM
    weightedSentiment = calculateAggregateSentiment(sentimentResults);
    avgConfidence = sentimentResults.reduce((sum, result) => sum + result.confidence, 0) / sentimentResults.length;
    
    console.log(`🐦 Twitter sentiment analysis complete: ${(weightedSentiment * 100).toFixed(1)}%`);
  }
  
  // Calculate engagement momentum
  const totalEngagement = filteredPosts.reduce((sum, post) => 
    sum + post.likes + post.retweets + post.replies, 0);
  const avgEngagement = totalEngagement / filteredPosts.length;
  const engagementMomentum = Math.min(avgEngagement / 100, 1); // Normalize to 0-1
  
  // Extract trending topics
  const trendingTopics = extractTrendingTopics(filteredPosts);
  
  // Detect breaking news
  const breakingNewsSignals = detectBreakingNews(filteredPosts);
  
  // Analyze influencer signals
  const influencerSignals = filteredPosts
    .filter((post, index) => INFLUENCER_ACCOUNTS.some(inf => 
      inf.username.toLowerCase() === post.username.toLowerCase()))
    .map((post, originalIndex) => {
      // Find the original index in filteredPosts for sentiment lookup
      const postIndex = filteredPosts.findIndex(p => p === post);
      const influencer = INFLUENCER_ACCOUNTS.find(inf => 
        inf.username.toLowerCase() === post.username.toLowerCase())!;
      const engagement = post.likes + post.retweets + post.replies;
      const sentiment = tweetSentiments.get(postIndex) || 0; // Get sentiment from batch analysis
      
      return {
        username: post.username,
        sentiment,
        influence_weight: influencer.influenceScore,
        engagement_rate: engagement / (influencer.followerCount / 1000), // Normalize
        content: post.text.slice(0, 150)
      };
    })
    .slice(0, 10);
  
  // Volume analysis
  const uniqueUsers = new Set(filteredPosts.map(post => post.username)).size;
  const volumeAnalysis = {
    post_count: filteredPosts.length,
    unique_users: uniqueUsers,
    average_engagement: avgEngagement,
    engagement_growth: engagementMomentum
  };
  
  // Temporal analysis
  const hourCounts = new Array(24).fill(0);
  filteredPosts.forEach(post => {
    const hour = post.timestamp.getHours();
    hourCounts[hour]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  
  const temporalAnalysis = {
    peak_activity_hour: peakHour,
    sentiment_trend: 'stable' as 'rising' | 'falling' | 'stable', // Would need historical data for accurate trend
    momentum_score: engagementMomentum
  };
  
  return {
    sentiment_score: weightedSentiment,
    confidence: avgConfidence,
    engagement_momentum: engagementMomentum,
    trending_topics: trendingTopics,
    breaking_news_signals: breakingNewsSignals,
    influencer_signals: influencerSignals,
    volume_analysis: volumeAnalysis,
    temporal_analysis: temporalAnalysis
  };
}

function getEmptyTwitterData(): ProcessedTwitterData {
  return {
    sentiment_score: 0,
    confidence: 0,
    engagement_momentum: 0,
    trending_topics: [],
    breaking_news_signals: [],
    influencer_signals: [],
    volume_analysis: {
      post_count: 0,
      unique_users: 0,
      average_engagement: 0,
      engagement_growth: 0
    },
    temporal_analysis: {
      peak_activity_hour: 12,
      sentiment_trend: 'stable',
      momentum_score: 0
    }
  };
}

// Main Twitter Intelligence Tool
export const twitterIntelligenceTool = createTool({
  id: 'twitter-intelligence',
  description: 'Analyze Twitter sentiment, influencer signals, and trending topics for prediction markets',
  inputSchema: z.object({
    marketTitle: z.string().describe('The prediction market title to analyze'),
    keywords: z.array(z.string()).describe('Keywords related to the market'),
    timeframe: z.enum(['1h', '6h', '24h', '7d']).default('24h').describe('Time window for analysis'),
    includeInfluencers: z.boolean().default(true).describe('Include influencer monitoring')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      sentiment_score: z.number().min(-1).max(1),
      confidence: z.number().min(0).max(1),
      engagement_momentum: z.number().min(0).max(1),
      trending_topics: z.array(z.string()),
      breaking_news_signals: z.array(z.object({
        content: z.string(),
        urgency_score: z.number(),
        viral_potential: z.number(),
        source_credibility: z.number()
      })),
      influencer_signals: z.array(z.object({
        username: z.string(),
        sentiment: z.number(),
        influence_weight: z.number(),
        engagement_rate: z.number(),
        content: z.string()
      })),
      volume_analysis: z.object({
        post_count: z.number(),
        unique_users: z.number(),
        average_engagement: z.number(),
        engagement_growth: z.number()
      }),
      temporal_analysis: z.object({
        peak_activity_hour: z.number(),
        sentiment_trend: z.enum(['rising', 'falling', 'stable']),
        momentum_score: z.number()
      })
    }),
    sources: z.array(z.string()),
    cached: z.boolean()
  }),
  execute: async ({ context }) => {
    const { marketTitle, keywords, timeframe, includeInfluencers } = context;

    try {
      // Generate cache key
      const cacheKey = `twitter:${marketTitle}:${keywords.join(',')}:${timeframe}`;
      
      // Check cache first
      const cached = twitterCache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached.data,
          sources: ['twitter-cache'],
          cached: true
        };
      }

      // Perform Twitter analysis
      const twitterData = await searchAndAnalyzeTwitter(marketTitle, keywords, timeframe);
      
      // Cache the results
      twitterCache.set(cacheKey, {
        data: twitterData,
        timestamp: Date.now()
      });

      return {
        success: true,
        data: twitterData,
        sources: ['twitter-api'],
        cached: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Twitter intelligence tool error:', errorMessage);
      
      return {
        success: false,
        data: getEmptyTwitterData(),
        sources: ['fallback'],
        cached: false
      };
    }
  }
}); 