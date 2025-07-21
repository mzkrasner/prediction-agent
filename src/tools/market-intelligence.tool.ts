import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios';

// Types for Polymarket API responses - ACTUAL Gamma API field names
interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  endDate: string;
  closed: boolean;
  acceptingOrders: boolean;
  orderMinSize: number;
  orderPriceMinTickSize: number;
  outcomePrices: string; // JSON string like: '["0.27", "0.14", "0.07"]'
  outcomes: string; // JSON string like: '["JD Vance", "Gavin Newsom", "Marco Rubio"]'
  volume: string;
  liquidity?: string;
  volume24hr?: number;
  volume24hrAmm?: number;
  volume24hrClob?: number;
  liquidityAmm?: number;
  liquidityClob?: number;
  active: boolean;
  slug: string;
  submitted_by: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  rewardEpoch: number;
  conditionId: string;
  questionID: string;
  category: string;
  fpmm: string;
  spread?: number;
  enableOrderBook: boolean;
  // Add parsed outcomes for easier access
  parsedOutcomes?: string[];
  parsedPrices?: number[];
}

interface MarketTechnicalData {
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
}

interface CrossMarketSignals {
  relatedMarkets: Array<{
    id: string;
    question: string;
    correlation: number;
    priceDifference: number;
  }>;
  marketConsensus: 'aligned' | 'divergent' | 'neutral';
  aggregatedSentiment: number;
}

// Polymarket Gamma API client
class PolymarketClient {
  private baseUrl = 'https://gamma-api.polymarket.com';
  private timeout = 15000;

  async getActiveMarkets(limit: number = 50): Promise<PolymarketMarket[]> {
    try {
      console.log(`🔍 Calling Polymarket API: ${this.baseUrl}/markets`);
      console.log(`📊 Request params:`, { limit, active: true, closed: false, accepting_orders: true });
      
      const response = await axios.get(`${this.baseUrl}/markets`, {
        params: {
          limit,
          active: true,
          closed: false,
          accepting_orders: true
        },
        timeout: this.timeout
      });

      console.log(`📈 Polymarket API response status: ${response.status}`);
      console.log(`📊 Response data type:`, typeof response.data);
      console.log(`📊 Response data length:`, Array.isArray(response.data) ? response.data.length : 'not array');
      console.log(`📊 Response data sample:`, Array.isArray(response.data) ? response.data.slice(0, 2) : response.data);

      return response.data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error fetching active markets:', errorMessage);
      if (axios.isAxiosError(error)) {
        console.error('📊 Response status:', error.response?.status);
        console.error('📊 Response data:', error.response?.data);
      }
      return [];
    }
  }

  async getMarketById(marketId: string): Promise<PolymarketMarket | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/markets/${marketId}`, {
        timeout: this.timeout
      });

      return response.data || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error fetching market ${marketId}:`, errorMessage);
      return null;
    }
  }

  async searchMarkets(query: string, limit: number = 20): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/markets`, {
        params: {
          q: query,
          limit,
          active: true,
          closed: false
        },
        timeout: this.timeout
      });

      return response.data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error searching markets:', errorMessage);
      return [];
    }
  }

  async getMarketVolume(marketId: string): Promise<{ volume: string; volume_24hr: string } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/markets/${marketId}/volume`, {
        timeout: this.timeout
      });

      return response.data || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error fetching volume for market ${marketId}:`, errorMessage);
      return null;
    }
  }
}

const polymarketClient = new PolymarketClient();

// Market filtering logic
function applyMarketFilters(markets: PolymarketMarket[]): PolymarketMarket[] {
  const now = Date.now();
  const maxTimeToClose = parseInt(process.env.MAX_TIME_TO_CLOSE_HOURS || '8760') * 60 * 60 * 1000; // 8760 hours = 1 year
  const minLiquidity = parseFloat(process.env.MIN_LIQUIDITY || '1000');
  const minDailyVolume = parseFloat(process.env.MIN_DAILY_VOLUME || '500');

  console.log(`🔍 Filtering ${markets.length} markets with criteria:`);
  console.log(`   - Max time to close: ${maxTimeToClose / (60 * 60 * 1000)} hours`);
  console.log(`   - Min liquidity: $${minLiquidity}`);
  console.log(`   - Min daily volume: $${minDailyVolume}`);

  const filtered = markets.filter(market => {
    // Check if market is still active and not closed
    if (!market.active || market.closed) {
      return false;
    }

    // Check accepting orders (if field exists, otherwise assume true if orderbook enabled)
    const isAcceptingOrders = market.acceptingOrders !== undefined ? market.acceptingOrders : market.enableOrderBook;
    if (!isAcceptingOrders) {
      return false;
    }

    // Check time to close
    const endTime = new Date(market.endDate).getTime();
    const timeToClose = endTime - now;
    if (timeToClose > maxTimeToClose || timeToClose < 0) {
      return false;
    }

    // Check liquidity (handle multiple possible field names)
    const liquidity = parseFloat(market.liquidity || '0') || 
                     parseFloat(String(market.liquidityClob || 0)) || 
                     (parseFloat(String(market.liquidityAmm || 0)) + parseFloat(String(market.liquidityClob || 0)));
    if (liquidity < minLiquidity) {
      return false;
    }

    // Check daily volume (handle multiple possible field names)
    const dailyVolume = market.volume24hr || 
                       market.volume24hrClob || 
                       ((market.volume24hrAmm || 0) + (market.volume24hrClob || 0)) ||
                       0;
    if (dailyVolume < minDailyVolume) {
      return false;
    }

    // Check orderbook requirement
    if (!market.enableOrderBook) {
      return false;
    }

    return true;
  });

  console.log(`✅ ${filtered.length} markets passed filters out of ${markets.length} total`);
  return filtered;
}

// Technical analysis calculations
function calculateTechnicalSignals(market: PolymarketMarket): MarketTechnicalData {
  // Parse all outcomes and prices
  let parsedOutcomes: string[] = [];
  let parsedPrices: number[] = [];
  
  try {
    parsedOutcomes = JSON.parse(market.outcomes || '[]');
    const priceStrings = JSON.parse(market.outcomePrices || '[]');
    parsedPrices = priceStrings.map((p: string) => parseFloat(p || '0'));
  } catch (error) {
    console.warn(`Failed to parse outcomes for market ${market.id}:`, error);
    parsedOutcomes = ['Unknown'];
    parsedPrices = [0];
  }
  
  // For analysis, use the highest probability outcome (most liquid/relevant)
  const maxPriceIndex = parsedPrices.findIndex(price => price === Math.max(...parsedPrices));
  const currentPrice = parsedPrices[maxPriceIndex] || 0;
  
  // Store parsed data on market object for later use
  market.parsedOutcomes = parsedOutcomes;
  market.parsedPrices = parsedPrices;
  
  const liquidity = parseFloat(market.liquidity || '0');
  const volume24h = market.volume24hr || 0;
  const totalVolume = parseFloat(market.volume || '0');

  // Calculate spread (simplified)
  const spread = market.spread || 0.05; // Default 5% if not available

  // Calculate momentum (volume trend)
  const momentum = volume24h > 0 ? (volume24h / Math.max(totalVolume, 1)) * 100 : 0;

  // Calculate market efficiency (inverse of spread)
  const efficiency = Math.max(0, 1 - spread);

  // Order book health (based on liquidity and spread)
  const orderBookHealth = Math.min(1, (liquidity / 10000) * efficiency);

  // Recent price movement (simplified - would need historical data for accurate calculation)
  const recentPriceMovement = Math.abs(currentPrice - 0.5) * 100; // Distance from 50%

  // Volume trend (simplified)
  const volumeTrend = volume24h > (totalVolume / 30) ? 1 : 0; // Above 30-day average

  return {
    marketId: market.id,
    currentPrice,
    liquidity,
    volume24h,
    spread,
    momentum,
    efficiency,
    orderBookHealth,
    recentPriceMovement,
    volumeTrend
  };
}

// Cross-market analysis
function analyzeCrossMarketSignals(markets: PolymarketMarket[], targetMarket: PolymarketMarket): CrossMarketSignals {
  // Find related markets by category or tags
  const relatedMarkets = markets
    .filter(m => 
      m.id !== targetMarket.id && 
      (m.category === targetMarket.category || 
       (m.tags && targetMarket.tags && m.tags.some(tag => targetMarket.tags!.includes(tag))))
    )
    .slice(0, 5)
    .map(m => ({
      id: m.id,
      question: m.question,
      correlation: calculateCorrelation(targetMarket, m),
      priceDifference: Math.abs(
        parseFloat(JSON.parse(m.outcomePrices || '["0"]')[0] || '0') - 
        parseFloat(JSON.parse(targetMarket.outcomePrices || '["0"]')[0] || '0')
      )
    }));

  // Determine market consensus
  let marketConsensus: 'aligned' | 'divergent' | 'neutral' = 'neutral';
  if (relatedMarkets.length > 0) {
    const avgCorrelation = relatedMarkets.reduce((sum, m) => sum + m.correlation, 0) / relatedMarkets.length;
    if (avgCorrelation > 0.7) marketConsensus = 'aligned';
    else if (avgCorrelation < 0.3) marketConsensus = 'divergent';
  }

  // Calculate aggregated sentiment from related markets
  const aggregatedSentiment = relatedMarkets.length > 0 
    ? relatedMarkets.reduce((sum, m) => sum + parseFloat(JSON.parse(targetMarket.outcomePrices || '["0"]')[0] || '0'), 0) / relatedMarkets.length
    : parseFloat(JSON.parse(targetMarket.outcomePrices || '["0"]')[0] || '0');

  return {
    relatedMarkets,
    marketConsensus,
    aggregatedSentiment
  };
}

function calculateCorrelation(market1: PolymarketMarket, market2: PolymarketMarket): number {
  // Simplified correlation based on category and tag overlap
  let correlation = 0;
  
  if (market1.category === market2.category) correlation += 0.3;
  
  const commonTags = (market1.tags && market2.tags) ? market1.tags.filter(tag => market2.tags!.includes(tag)) : [];
  correlation += commonTags.length * 0.1;
  
  // Price similarity
  const price1 = parseFloat(JSON.parse(market1.outcomePrices || '["0"]')[0] || '0');
  const price2 = parseFloat(JSON.parse(market2.outcomePrices || '["0"]')[0] || '0');
  const priceSimilarity = 1 - Math.abs(price1 - price2);
  correlation += priceSimilarity * 0.2;
  
  return Math.min(1, correlation);
}

// Main Market Intelligence Tool
export const marketIntelligenceTool = createTool({
  id: 'market-intelligence',
  description: 'Analyze Polymarket prediction markets with technical and cross-market signals',
  inputSchema: z.object({
    operation: z.enum(['discover', 'analyze', 'search']).describe('Operation type'),
    marketId: z.string().optional().describe('Specific market ID to analyze'),
    searchQuery: z.string().optional().describe('Search query for market discovery'),
    limit: z.number().default(20).describe('Maximum number of markets to return')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    operation: z.string(),
    markets: z.array(z.object({
      id: z.string(),
      question: z.string(),
      description: z.string(),
      endDate: z.string(),
      currentPrice: z.number(),
      liquidity: z.number(),
      volume24h: z.number(),
      active: z.boolean(),
      category: z.string(),
      tags: z.array(z.string()),
      outcomes: z.array(z.string()), // Added outcomes to output schema
      outcomePrices: z.array(z.string()) // Added outcomePrices to output schema
    })),
    technicalData: z.object({
      marketId: z.string(),
      currentPrice: z.number(),
      liquidity: z.number(),
      volume24h: z.number(),
      spread: z.number(),
      momentum: z.number(),
      efficiency: z.number(),
      orderBookHealth: z.number(),
      recentPriceMovement: z.number(),
      volumeTrend: z.number()
    }).optional(),
    crossMarketSignals: z.object({
      relatedMarkets: z.array(z.object({
        id: z.string(),
        question: z.string(),
        correlation: z.number(),
        priceDifference: z.number()
      })),
      marketConsensus: z.enum(['aligned', 'divergent', 'neutral']),
      aggregatedSentiment: z.number()
    }).optional(),
    filteredCount: z.number(),
    totalCount: z.number()
  }),
  execute: async ({ context }) => {
    const { operation, marketId, searchQuery, limit } = context;

    try {
      let markets: PolymarketMarket[] = [];
      let technicalData: MarketTechnicalData | undefined;
      let crossMarketSignals: CrossMarketSignals | undefined;

      switch (operation) {
        case 'discover':
          markets = await polymarketClient.getActiveMarkets(limit);
          break;
          
        case 'search':
          if (!searchQuery) {
            throw new Error('Search query is required for search operation');
          }
          markets = await polymarketClient.searchMarkets(searchQuery, limit);
          break;
          
        case 'analyze':
          if (!marketId) {
            throw new Error('Market ID is required for analyze operation');
          }
          const targetMarket = await polymarketClient.getMarketById(marketId);
          if (!targetMarket) {
            throw new Error(`Market ${marketId} not found`);
          }
          markets = [targetMarket];
          
          // Get all markets for cross-market analysis
          const allMarkets = await polymarketClient.getActiveMarkets(100);
          
          technicalData = calculateTechnicalSignals(targetMarket);
          crossMarketSignals = analyzeCrossMarketSignals(allMarkets, targetMarket);
          break;
      }

      const totalCount = markets.length;
      const filteredMarkets = applyMarketFilters(markets);
      const filteredCount = filteredMarkets.length;

      // Format markets for output
      const formattedMarkets = filteredMarkets.map(market => ({
        id: market.id,
        question: market.question,
        description: market.description,
        endDate: market.endDate,
        currentPrice: parseFloat(JSON.parse(market.outcomePrices || '["0"]')[0] || '0'),
        liquidity: parseFloat(market.liquidity || '0'),
        volume24h: market.volume24hr || 0,
        active: market.active,
        category: market.category || 'general',
        tags: market.tags || [],
        outcomes: market.parsedOutcomes || [], // Added outcomes to formatted output
        outcomePrices: (market.parsedPrices || []).map(p => p.toString()) // Convert numbers to strings for schema
      }));

      return {
        success: true,
        operation,
        markets: formattedMarkets,
        technicalData,
        crossMarketSignals,
        filteredCount,
        totalCount
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Market intelligence tool error:', errorMessage);
      
      return {
        success: false,
        operation,
        markets: [],
        filteredCount: 0,
        totalCount: 0
      };
    }
  }
}); 