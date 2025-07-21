import { executeAutonomousTradingPipeline, type AutonomousTradingInput } from '../workflows/autonomous-trading.workflow.js';
import { marketIntelligenceTool } from '../tools/market-intelligence.tool.js';

/**
 * Autonomous Trading Scheduler
 * Uses REAL Polymarket markets exclusively - NO simulation or fake data
 */

interface RealMarketData {
  id: string;
  title: string;
  description?: string;
  currentPrice: number;
  liquidity: number;
  volume24h: number;
  endDate: string;
  active: boolean;
  keywords: string[];
  marketAddress: string;
  // Add multi-outcome support
  outcomes: string[];
  outcomePrices: number[];
  isMultiOutcome: boolean;
}

/**
 * Discover real active markets from Polymarket
 * Uses the actual Polymarket Gamma API via our marketIntelligenceTool
 */
async function discoverRealPolymarkets(): Promise<RealMarketData[]> {
  console.log('🔍 Discovering real active markets from Polymarket...');
  
  try {
    // Call the REAL market intelligence tool to get active markets
    const result = await marketIntelligenceTool.execute({
      context: {
        operation: 'discover',
        limit: 50 // Get top 50 active markets
      },
      runtimeContext: {} as any // Bypass typing for now
    });
    
    if (!result.success || !result.markets) {
      console.error('❌ Failed to discover markets from Polymarket');
      return [];
    }
    
    console.log(`📊 Found ${result.markets.length} active markets from Polymarket`);
    
    // Convert to our RealMarketData format
    const realMarkets: RealMarketData[] = result.markets.map(market => {
      // Convert string prices to numbers
      const numericPrices = (market.outcomePrices || []).map(price => parseFloat(price));
      const isMultiOutcome = (market.outcomes || []).length > 2;
      
      // Calculate representative price
      let currentPrice = market.currentPrice;
      if (isMultiOutcome && numericPrices.length > 0) {
        // For multi-outcome markets, use the highest probability (price) as representative
        currentPrice = Math.max(...numericPrices);
      }
      
      return {
        id: market.id,
        title: market.question,
        description: market.description,
        currentPrice: currentPrice,
        liquidity: market.liquidity,
        volume24h: market.volume24h,
        endDate: market.endDate,
        active: market.active,
        keywords: extractKeywordsFromTitle(market.question),
        marketAddress: market.id, // Use the real market ID as address
        outcomes: market.outcomes || [],
        outcomePrices: numericPrices,
        isMultiOutcome: isMultiOutcome
      };
    });
    
    return realMarkets;
    
  } catch (error) {
    console.error('❌ Error discovering real markets:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Extract keywords from market title for analysis
 */
function extractKeywordsFromTitle(title: string): string[] {
  // Remove common words and extract meaningful keywords
  const commonWords = ['will', 'be', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'by', 'a', 'an'];
  
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 5); // Limit to top 5 keywords
}

/**
 * Filter markets for high-opportunity candidates
 */
function filterHighOpportunityMarkets(markets: RealMarketData[]): RealMarketData[] {
  return markets.filter(market => {
    // Only active markets
    if (!market.active) return false;
    
    // Must have reasonable liquidity (at least $1000)
    if (market.liquidity < 1000) return false;
    
    // Must have some trading volume in last 24h
    if (market.volume24h < 100) return false;
    
    // Market must not be too close to expiry (at least 1 day left)
    const timeToClose = new Date(market.endDate).getTime() - Date.now();
    if (timeToClose < 24 * 60 * 60 * 1000) return false;
    
    // Smart price filtering based on market type
    if (market.isMultiOutcome) {
      // For multi-outcome markets, ensure there's some price uncertainty
      // Skip markets where one outcome dominates too heavily (>98%)
      const maxPrice = Math.max(...market.outcomePrices);
      if (maxPrice > 0.98) return false;
      
      // Ensure there are at least 2 outcomes with reasonable probability (>1%)
      const viableOutcomes = market.outcomePrices.filter(price => price > 0.01);
      if (viableOutcomes.length < 2) return false;
    } else {
      // For binary markets, keep existing logic (avoid obvious outcomes)
      if (market.currentPrice < 0.05 || market.currentPrice > 0.95) return false;
    }
    
    return true;
  });
}

/**
 * Process a single market opportunity through the autonomous trading pipeline
 */
async function processMarketOpportunity(market: RealMarketData): Promise<void> {
  console.log(`\n🎯 Processing market opportunity: "${market.title}"`);
  console.log(`📊 Market ID: ${market.id}, Price: $${market.currentPrice.toFixed(3)}, Liquidity: $${market.liquidity.toLocaleString()}`);
  
  // Log multi-outcome market details
  if (market.isMultiOutcome) {
    console.log(`🎲 Multi-outcome market with ${market.outcomes.length} outcomes:`);
    market.outcomes.forEach((outcome, i) => {
      const price = market.outcomePrices[i] || 0;
      console.log(`   ${i + 1}. "${outcome}": ${(price * 100).toFixed(1)}%`);
    });
  } else {
    console.log(`⚖️  Binary market: Yes/No`);
  }
  
  try {
    // Convert to AutonomousTradingInput format
    const tradingInput: AutonomousTradingInput = {
      marketId: market.id,
      marketTitle: market.title,
      marketAddress: market.marketAddress,
      currentPrice: market.currentPrice,
      liquidity: market.liquidity,
      volume24h: market.volume24h,
      timeToClose: new Date(market.endDate).getTime() - Date.now(),
      keywords: market.keywords
    };
    
    // Execute the full autonomous trading pipeline with REAL data
    const result = await executeAutonomousTradingPipeline(tradingInput);
    
    if (result.success) {
      console.log(`✅ Successfully processed market: ${market.title}`);
      if (result.finalResult?.action === 'BUY' || result.finalResult?.action === 'SELL') {
        console.log(`💰 Trading decision made: ${result.finalResult.action} (${result.finalResult.confidence}% confidence)`);
      } else {
        console.log(`⏸️  No trading action recommended (${result.finalResult?.action || 'NONE'})`);
      }
    } else {
      console.log(`❌ Failed to process market: ${market.title}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing market "${market.title}":`, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Main autonomous trading loop
 * Continuously discovers and processes REAL market opportunities
 */
export async function startAutonomousLoop(): Promise<void> {
  console.log('🚀 Starting Autonomous Trading Loop with REAL Polymarket data...');
  console.log('📋 Loop will run every 30 minutes, processing real market opportunities');
  
  const LOOP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  
  async function runIteration(): Promise<void> {
    const startTime = Date.now();
    console.log(`\n🔄 Starting autonomous trading iteration at ${new Date().toISOString()}`);
    
    try {
      // Step 1: Discover real active markets from Polymarket
      const allMarkets = await discoverRealPolymarkets();
      
      if (allMarkets.length === 0) {
        console.log('⚠️  No markets discovered, will retry next iteration');
        return;
      }
      
      // Step 2: Filter for high-opportunity markets
      const opportunities = filterHighOpportunityMarkets(allMarkets);
      console.log(`🎯 Found ${opportunities.length} high-opportunity markets out of ${allMarkets.length} total`);
      
      // Log multi-outcome market statistics
      const multiOutcomeCount = opportunities.filter(m => m.isMultiOutcome).length;
      const binaryCount = opportunities.length - multiOutcomeCount;
      console.log(`📊 Market types: ${binaryCount} binary, ${multiOutcomeCount} multi-outcome`);
      
      if (opportunities.length === 0) {
        console.log('📊 No high-opportunity markets found this iteration');
        return;
      }
      
      // Step 3: Process top opportunities (limit to 5 per iteration to avoid overload)
      const topOpportunities = opportunities
        .sort((a, b) => (b.volume24h * b.liquidity) - (a.volume24h * a.liquidity))
        .slice(0, 5);
      
      console.log(`🏆 Processing top ${topOpportunities.length} market opportunities:`);
      topOpportunities.forEach((market, i) => {
        console.log(`  ${i + 1}. ${market.title} (Volume: $${market.volume24h.toLocaleString()})`);
      });
      
      // Process each opportunity sequentially to avoid overwhelming the APIs
      for (const market of topOpportunities) {
        await processMarketOpportunity(market);
        
        // Small delay between markets to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Completed iteration in ${duration.toFixed(1)}s`);
      
    } catch (error) {
      console.error('❌ Error in autonomous trading iteration:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  // Run first iteration immediately
  await runIteration();
  
  // Set up recurring loop
  setInterval(async () => {
    await runIteration();
  }, LOOP_INTERVAL);
  
  console.log(`⏰ Autonomous loop configured to run every ${LOOP_INTERVAL / 60000} minutes`);
} 