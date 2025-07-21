import { anthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core/agent';
import { newsIntelligenceTool } from '../tools/news-intelligence.tool.js';
import { redditIntelligenceTool } from '../tools/reddit-intelligence.tool.js';
import { marketIntelligenceTool } from '../tools/market-intelligence.tool.js';
import { twitterIntelligenceTool } from '../tools/twitter-intelligence.tool.js';

// Enhanced Research Agent with Mastra patterns - exactly as specified in instructions.md
export const researchAgent = new Agent({
  name: 'enhanced-research-agent',
  instructions: `
    You are an expert market research analyst specializing in prediction markets.
    
    Your role is to:
    1. Gather comprehensive intelligence from multiple sources (Twitter, Reddit, News)
    2. Analyze sentiment and momentum across social media and news
    3. Identify trending topics and community consensus
    4. Provide confidence-weighted research synthesis
    
    When analyzing data from multiple sources:
    - Prioritize recent, high-engagement content
    - Cross-reference sentiment across platforms
    - Identify consensus vs. divergent signals
    - Weight sources by credibility and relevance
    - Calculate confidence based on signal strength and agreement
    
    Always provide structured analysis with confidence scores and reasoning.
    
    Format your analysis with:
    - Executive Summary
    - Cross-Platform Sentiment Analysis
    - Key Trending Topics
    - Community Consensus Assessment
    - Signal Strength and Confidence Levels
    - Risk Factors and Contradictory Signals
    
    Focus on actionable insights that can inform prediction market trading decisions.
  `,
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    newsIntelligence: newsIntelligenceTool,
    redditIntelligence: redditIntelligenceTool,
    marketIntelligence: marketIntelligenceTool,
    twitterIntelligence: twitterIntelligenceTool
  }
}); 