import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import axios from 'axios';
import { analyzeBatchSentimentWithAI, calculateAggregateSentiment } from '../utils/sentiment-analysis.js';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  relevanceScore: number;
  sentiment: number;
}

// Brave Search API interface
interface BraveSearchResult {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description?: string;
      snippet?: string;
      age?: string;
    }>;
  };
}

// Direct Brave Search API call with exponential backoff and jitter
async function searchBraveAPI(query: string, count: number = 10, retryCount: number = 0): Promise<BraveSearchResult | null> {
  if (!process.env.BRAVE_API_KEY) {
    console.warn('⚠️ BRAVE_API_KEY not set, skipping Brave search');
    return null;
  }

  const maxRetries = 3;
  
  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count,
        search_lang: 'en',
        country: 'US',
        freshness: 'pd'  // Past day for news
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_API_KEY
      },
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 429 && retryCount < maxRetries) {
      // Rate limited - use exponential backoff with jitter
      const baseDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
      const jitter = Math.random() * 1000; // 0-1s random jitter
      const waitTime = baseDelay + jitter;
      
      console.log(`⏱️ Rate limited (429). Waiting ${Math.round(waitTime/1000)}s before retry ${retryCount + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return searchBraveAPI(query, count, retryCount + 1);
    }
    
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.error(`❌ Rate limited after ${maxRetries} retries for query: "${query}"`);
    } else {
      console.error('❌ Brave Search API error:', error instanceof Error ? error.message : 'Unknown error');
    }
    return null;
  }
}

// Legacy sentiment analysis - replaced with shared LLM utility

// LLM-driven search query generation
async function generateSmartNewsQueries(marketTitle: string, keywords: string[]): Promise<{
  primary: string[];
  targeted: string[];
  sources: string[];
}> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set, using fallback news queries');
      return getFallbackNewsQueries(marketTitle, keywords);
    }

    const { text: aiResponse } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `You are a news research expert. Given this prediction market, generate optimal search queries for finding relevant news coverage.

Market: "${marketTitle}"
Keywords: ${keywords.join(', ')}

Generate 3 types of search strategies:
1. Primary queries: 4-5 comprehensive queries that would capture breaking news and analysis
2. Targeted queries: 3-4 specific phrases likely to appear in relevant headlines
3. Source targets: 3-4 reliable news domains that would cover this topic

Consider:
- Breaking news and recent developments
- Analysis and opinion pieces
- Official announcements and statements
- Market-moving events and catalysts

CRITICAL: Return ONLY raw JSON with no explanations, no markdown, no code blocks, no additional text.
Your entire response must be valid JSON that can be parsed directly.

Expected format (return exactly this structure with your data):
{"primary":["recession forecast 2025","US economic outlook","Federal Reserve policy impact"],"targeted":["economic downturn prediction","GDP growth forecast","inflation trends"],"sources":["reuters.com","bloomberg.com","wsj.com"]}

Do not include \`\`\`json or \`\`\` or any other formatting. Start your response with { and end with }.`
    });

    // Clean the response - remove markdown code blocks if present
    const cleanedResponse = aiResponse.trim()
      .replace(/^```json\s*/, '')  // Remove opening ```json
      .replace(/\s*```$/, '')       // Remove closing ```
      .trim();
    
    const parsed = JSON.parse(cleanedResponse);
    console.log(`🧠 LLM generated news queries - Primary: ${parsed.primary.join(', ')}, Targeted: ${parsed.targeted.join(', ')}, Sources: ${parsed.sources.join(', ')}`);
    
    return {
      primary: parsed.primary || [],
      targeted: parsed.targeted || [],
      sources: parsed.sources || []
    };
  } catch (error) {
    console.error('❌ LLM news query generation failed:', error instanceof Error ? error.message : 'Unknown error');
    return getFallbackNewsQueries(marketTitle, keywords);
  }
}

// Fallback query generation
function getFallbackNewsQueries(marketTitle: string, keywords: string[]): {
  primary: string[];
  targeted: string[];
  sources: string[];
} {
  const baseQueries = [
    `"${marketTitle}" news`,
    `${keywords.slice(0, 2).join(' ')} latest`,
    `${marketTitle} analysis`,
    `${keywords[0]} forecast`
  ];
  
  const targetedQueries = [
    `${keywords[0]} prediction`,
    `${keywords[1] || keywords[0]} outlook`,
    `${marketTitle} impact`
  ];
  
  const sources = ['reuters.com', 'bloomberg.com', 'wsj.com', 'ap.org'];
  
  return {
    primary: baseQueries,
    targeted: targetedQueries,
    sources
  };
}

// Fetch news using Brave Search
async function fetchNewsData(marketTitle: string, keywords: string[]): Promise<NewsArticle[]> {
  try {
    const queries = await generateSmartNewsQueries(marketTitle, keywords);
    console.log(`🎯 News strategy - ${queries.primary.length} primary, ${queries.targeted.length} targeted, ${queries.sources.length} sources`);
    
    const allQueries = [
      ...queries.primary,
      ...queries.targeted.map(q => `"${q}"`),
      ...queries.sources.map(source => `${queries.primary[0]} site:${source}`)
    ]; // Full search integrity - no artificial limits
    
    console.log(`🔍 Searching news with ${allQueries.length} strategic queries`);
    
    const allResults: NewsArticle[] = [];
    
    for (let i = 0; i < allQueries.length; i++) {
      const query = allQueries[i];
      
      try {
        console.log(`🔍 Searching news for query: "${query}"`);
        
        // Small respectful delay between requests (except first)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms between queries
        }
        
        const results = await searchBraveAPI(`${query} news`, 5);
        
        if (results?.web?.results) {
          const articles = results.web.results.map((result: any) => ({
            title: result.title || '',
            description: result.description || result.snippet || '',
            url: result.url || '',
            source: extractDomain(result.url || ''),
            publishedAt: result.age || new Date().toISOString(),
            relevanceScore: 0.8,
            sentiment: 0 // Will be filled in by batch sentiment analysis
          }));
          
          allResults.push(...articles);
          console.log(`📊 Query "${query}" returned ${articles.length} articles`);
        } else if (results === null) {
          console.log(`⚠️ Skipping query "${query}" - Brave API unavailable`);
        } else {
          console.log(`📊 Query "${query}" returned no results`);
        }
      } catch (error) {
        console.error(`❌ Query "${query}" failed:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Remove duplicates by URL
    const uniqueResults = allResults.filter((article, index, self) => 
      index === self.findIndex(a => a.url === article.url)
    );
    
    console.log(`📊 Found ${uniqueResults.length} unique articles`);
    
    // Apply LLM-driven sentiment analysis to all articles
    if (uniqueResults.length > 0) {
      console.log(`🧠 Analyzing sentiment for ${uniqueResults.length} articles...`);
      
      const contentItems = uniqueResults.map((article, index) => ({
        id: index.toString(),
        text: `${article.title} ${article.description}`,
        source: article.source
      }));
      
      const sentimentResults = await analyzeBatchSentimentWithAI(contentItems, marketTitle);
      
      // Apply sentiment scores back to articles
      sentimentResults.forEach(result => {
        const index = parseInt(result.id);
        if (index < uniqueResults.length) {
          uniqueResults[index].sentiment = result.score;
        }
      });
      
      console.log(`🧠 Sentiment analysis complete`);
    }
    
    // If no results and no API key, provide helpful guidance
    if (uniqueResults.length === 0 && !process.env.BRAVE_API_KEY) {
      console.log('💡 To enable news intelligence, set BRAVE_API_KEY environment variable');
      console.log('💡 Get your free API key at: https://api.search.brave.com/app/keys');
    }
    
    return uniqueResults.slice(0, 20); // Limit to top 20
    
  } catch (error) {
    console.error('❌ News data fetching failed:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Unknown Source';
  }
}

// LLM-powered content relevance filtering
async function filterNewsForRelevance(
  articles: NewsArticle[], 
  marketTitle: string, 
  keywords: string[]
): Promise<NewsArticle[]> {
  try {
    if (!process.env.ANTHROPIC_API_KEY || articles.length < 10) {
      console.warn('⚠️ Skipping LLM news filtering (no API key or insufficient articles)');
      return articles;
    }

    // Prepare article summaries for LLM evaluation
    const articleSummaries = articles.slice(0, 50).map((article, index) => ({
      id: index,
      title: article.title.slice(0, 100),
      description: article.description.slice(0, 150),
      source: article.source
    }));

    const { text: aiResponse } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `Filter these news articles for relevance to the prediction market: "${marketTitle}"

Market Keywords: ${keywords.join(', ')}

Articles to evaluate:
${articleSummaries.map(a => `${a.id}: [${a.source}] "${a.title}" - ${a.description}`).join('\n')}

Return a JSON array of article IDs that are DIRECTLY relevant to this prediction market.
Only include articles that could provide genuine insight for prediction purposes.
Exclude: generic news, entertainment, sports (unless directly related), advertisements, unrelated content.

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
    const filteredArticles = relevantIds
      .filter(id => id < articles.length)
      .map(id => articles[id]);
    
    console.log(`🧠 LLM filtered ${articles.length} articles down to ${filteredArticles.length} relevant ones`);
    return filteredArticles;
    
  } catch (error) {
    console.error('❌ LLM news filtering failed:', error instanceof Error ? error.message : 'Unknown error');
    return articles; // Return original articles on failure
  }
}

export const newsIntelligenceTool = createTool({
  id: 'news-intelligence',
  description: 'Gather and analyze news sentiment using Brave Search with LLM-driven query generation and content filtering',
  inputSchema: z.object({
    marketTitle: z.string().describe('The prediction market title to analyze'),
    keywords: z.array(z.string()).describe('Keywords related to the market'),
    timeframe: z.string().default('24h').describe('Time window for news analysis')
  }),
  outputSchema: z.object({
    sentiment_score: z.number().describe('Overall sentiment score (-1 to 1)'),
    news_count: z.number().describe('Number of relevant news articles found'),
    breaking_news: z.boolean().describe('Whether breaking news was detected'),
    source_credibility: z.number().describe('Average credibility of sources (0-1)'),
    articles: z.array(z.object({
      title: z.string(),
      description: z.string(),
      source: z.string(),
      sentiment: z.number()
    })),
    trending_topics: z.array(z.string()),
    confidence: z.number().describe('Confidence in the analysis (0-1)')
  }),
  execute: async ({ context }) => {
    const { marketTitle, keywords } = context;
    
    try {
      console.log(`📰 News intelligence for: ${marketTitle}`);
      
      // Fetch news data using Brave Search + LLM
      const rawArticles = await fetchNewsData(marketTitle, keywords);
      
      if (rawArticles.length === 0) {
        return {
          sentiment_score: 0,
          news_count: 0,
          breaking_news: false,
          source_credibility: 0,
          articles: [],
          trending_topics: [],
          confidence: 0
        };
      }

      // Apply LLM filtering for relevance
      const articles = await filterNewsForRelevance(rawArticles, marketTitle, keywords);
      
      if (articles.length === 0) {
        console.log('⚠️ No articles passed LLM relevance filtering');
        return {
          sentiment_score: 0,
          news_count: 0,
          breaking_news: false,
          source_credibility: 0,
          articles: [],
          trending_topics: [],
          confidence: 0
        };
      }

      // Calculate aggregate sentiment using confidence weighting
      const sentimentResults = articles.map(article => ({
        score: article.sentiment,
        confidence: 0.8, // Default confidence for LLM-analyzed sentiment
        reasoning: 'LLM sentiment analysis'
      }));
      const avgSentiment = calculateAggregateSentiment(sentimentResults);
      
      // Calculate source credibility based on known reliable sources
      const reliableSources = ['reuters.com', 'bloomberg.com', 'wsj.com', 'ap.org', 'bbc.com', 'cnn.com', 'npr.org'];
      const credibilityScore = articles.reduce((sum, article) => {
        const isReliable = reliableSources.some(source => article.source.includes(source));
        return sum + (isReliable ? 1 : 0.6);
      }, 0) / articles.length;
      
      // Extract trending topics from article text
      const allText = articles.map(a => a.title + ' ' + a.description).join(' ').toLowerCase();
      const words = allText.split(/\s+/)
        .filter(w => w.length > 4 && !['that', 'this', 'with', 'from', 'will', 'could', 'would', 'said'].includes(w));
      
      const wordCounts = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const trendingTopics = Object.entries(wordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);

      // Detect breaking news (recent articles from reliable sources)
      const breakingNews = articles.some(article => {
        const isReliable = reliableSources.some(source => article.source.includes(source));
        return isReliable && article.title.toLowerCase().includes('breaking');
      });

      console.log(`📰 News sentiment: ${(avgSentiment * 100).toFixed(1)}%`);

      return {
        sentiment_score: avgSentiment,
        news_count: articles.length,
        breaking_news: breakingNews,
        source_credibility: credibilityScore,
        articles: articles.map(a => ({
          title: a.title,
          description: a.description,
          source: a.source,
          sentiment: a.sentiment
        })),
        trending_topics: trendingTopics,
        confidence: articles.length > 5 ? 0.9 : articles.length > 2 ? 0.7 : 0.5
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ News intelligence tool error:', errorMessage);
      return {
        sentiment_score: 0,
        news_count: 0,
        breaking_news: false,
        source_credibility: 0,
        articles: [],
        trending_topics: [],
        confidence: 0
      };
    }
  }
}); 