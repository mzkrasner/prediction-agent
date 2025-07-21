import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

interface SentimentResult {
  score: number; // -1 to 1 scale
  confidence: number; // 0 to 1 scale
  reasoning: string;
}

interface ContentItem {
  id: string;
  text: string;
  source?: string;
}

/**
 * Analyze sentiment of a single piece of content using Claude Sonnet 4
 * @param text - Text content to analyze
 * @param context - Market context for more accurate sentiment analysis
 * @returns Sentiment score from -1 (very negative) to 1 (very positive)
 */
export async function analyzeSentimentWithAI(
  text: string, 
  context: string = ''
): Promise<SentimentResult> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set, using fallback sentiment analysis');
      return analyzeSentimentFallback(text);
    }

    // Add timeout wrapper for LLM calls
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('LLM call timeout after 15 seconds')), 15000);
    });
    
    const llmPromise = generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      maxTokens: 4000, // Higher token limit for full article analysis
      prompt: `You are a financial sentiment analyst. Analyze sentiment for prediction market "${context}".

Content: "${text.slice(0, 15000)}" // Feed MUCH more content - full long articles

Analyze considering:
- Market-relevant signals and indicators
- Bullish vs bearish implications for the outcome
- Confidence indicators vs uncertainty signals
- Economic/political impact on the market outcome
- Financial sentiment keywords and context
- Overall tone and narrative direction
- Expert opinions and data mentioned
- Historical context and comparisons

Rate from -1.0 (very negative for outcome) to 1.0 (very positive for outcome).

MANDATORY JSON FORMAT - Your response MUST be exactly this structure with NO additional text:

{"score":-1.0,"confidence":0.0,"reasoning":"example"}

RULES:
- ONLY return the JSON object above
- NO explanations, NO markdown, NO \`\`\`
- "score" must be -1.0 to 1.0 (decimal required)
- "confidence" must be 0.0 to 1.0 (decimal required)  
- "reasoning" must be under 50 characters
- Start with { and end with }`
    });
    
    console.log(`⏱️ Starting single LLM sentiment analysis...`);
    const { text: aiResponse } = await Promise.race([llmPromise, timeoutPromise]);

    // Clean the response - remove markdown blocks only
    const cleanedResponse = aiResponse.trim()
      .replace(/^```json\s*/, '')  // Remove opening ```json
      .replace(/\s*```$/, '');     // Remove closing ```
    
    // Check if response is truncated
    if (!cleanedResponse.trim().endsWith('}')) {
      throw new Error(`LLM response appears truncated - does not end with }. Response: "${aiResponse}"`);
    }
    
    // Validate JSON starts with { and ends with }
    if (!cleanedResponse.startsWith('{') || !cleanedResponse.endsWith('}')) {
      throw new Error(`Invalid JSON format: must start with { and end with }, got: "${cleanedResponse}"`);
    }
    
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate and normalize the response
    const score = Math.max(-1, Math.min(1, parsed.score || 0));
    const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));
    
    return {
      score,
      confidence,
      reasoning: parsed.reasoning || 'AI sentiment analysis'
    };
    
  } catch (error) {
    console.error('❌ LLM sentiment analysis failed:', error instanceof Error ? error.message : 'Unknown error');
    return analyzeSentimentFallback(text);
  }
}

/**
 * Analyze sentiment of multiple content items in batch for efficiency
 * @param items - Array of content items to analyze
 * @param context - Market context for sentiment analysis
 * @returns Array of sentiment results
 */
export async function analyzeBatchSentimentWithAI(
  items: ContentItem[], 
  context: string = ''
): Promise<(SentimentResult & { id: string })[]> {
  try {
    if (!process.env.ANTHROPIC_API_KEY || items.length === 0) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set or no items, using fallback sentiment analysis');
      return items.map(item => ({
        id: item.id,
        ...analyzeSentimentFallback(item.text)
      }));
    }

    // Much smaller batch size for comprehensive analysis
    const batchSize = 2;
    const results: (SentimentResult & { id: string })[] = [];
    
    console.log(`🔄 Processing ${items.length} items in batches of ${batchSize} (with full content analysis)`);
    
    for (let i = 0; i < items.length; i += batchSize) {
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (items ${i + 1}-${Math.min(i + batchSize, items.length)})`);
      const batch = items.slice(i, i + batchSize);
      
      const itemsText = batch.map((item, index) => 
        `${index}: [${item.source || 'source'}] "${item.text.slice(0, 8000)}"` // Much more content per item - full articles
      ).join('\n\n');

      // Add timeout wrapper for LLM calls
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM call timeout after 60 seconds')), 60000); // Even longer timeout for full analysis
      });
      
      const llmPromise = generateText({
        model: anthropic('claude-sonnet-4-20250514'),
        maxTokens: 16000, // Massive token limit for comprehensive batch analysis
        prompt: `You are a financial sentiment analyst. Analyze sentiment for ${batch.length} content items for prediction market "${context}".

Content:
${itemsText}

For each item, analyze considering:
- Market-relevant signals and indicators
- Bullish vs bearish implications for the outcome
- Confidence indicators vs uncertainty signals  
- Economic/political impact on the market outcome
- Financial sentiment keywords and context
- Overall tone and narrative direction
- Expert opinions and data mentioned
- Historical context and comparisons
- Specific metrics, forecasts, and predictions mentioned
- Regulatory or policy implications

Rate each from -1.0 (very negative for outcome) to 1.0 (very positive for outcome).

MANDATORY JSON FORMAT - Your response MUST be exactly this structure with NO additional text:

[
${batch.map((_, index) => `{"id":${index},"score":-1.0,"confidence":0.0,"reasoning":"comprehensive analysis result"}`).join(',\n')}
]

RULES:
- ONLY return the JSON array above
- NO explanations, NO markdown, NO \`\`\`
- Each "id" must be 0 to ${batch.length - 1}
- Each "score" must be -1.0 to 1.0 (decimal required)
- Each "confidence" must be 0.0 to 1.0 (decimal required)
- Each "reasoning" must be under 60 characters
- Start with [ and end with ]
- NO trailing commas`
      });
      
      console.log(`⏱️ Starting comprehensive LLM batch analysis for ${batch.length} items...`);
      const { text: aiResponse } = await Promise.race([llmPromise, timeoutPromise]);
      console.log(`✅ Comprehensive LLM batch analysis completed for ${batch.length} items`);

      // Clean the response - remove markdown blocks only
      let cleanedResponse = aiResponse.trim()
        .replace(/^```json\s*/, '')  // Remove opening ```json
        .replace(/\s*```$/, '');     // Remove closing ```
      
      console.log(`🔍 Raw LLM response (first 200 chars): ${aiResponse.slice(0, 200)}...`);
      console.log(`🔍 Raw LLM response (last 200 chars): ...${aiResponse.slice(-200)}`);
      
      // Check if response is truncated (doesn't end with ] properly)
      if (!cleanedResponse.trim().endsWith(']')) {
        throw new Error(`LLM response appears truncated - does not end with ]. Response length: ${aiResponse.length}, ends with: "${aiResponse.slice(-50)}"`);
      }
      
      // Validate JSON starts with [ and ends with ]
      if (!cleanedResponse.startsWith('[') || !cleanedResponse.endsWith(']')) {
        throw new Error(`Invalid JSON format: must start with [ and end with ], got start: "${cleanedResponse.slice(0, 50)}", end: "${cleanedResponse.slice(-50)}"`);
      }
      
      let batchResults: Array<{
        id: number;
        score: number;
        confidence: number;
        reasoning: string;
      }>;
      
      try {
        batchResults = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('❌ JSON Parse Error Details:');
        console.error('  Raw response length:', aiResponse.length);
        console.error('  Cleaned response:', cleanedResponse.slice(0, 200) + '...');
        console.error('  Parse error:', parseError instanceof Error ? parseError.message : 'Unknown');
        throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
      
      // Validate structure
      if (!Array.isArray(batchResults)) {
        throw new Error(`Expected array, got: ${typeof batchResults}`);
      }
      
      if (batchResults.length !== batch.length) {
        throw new Error(`Expected ${batch.length} results, got ${batchResults.length}`);
      }
      
      // Map back to original items with validation
      batchResults.forEach((result, index) => {
        if (index < batch.length) {
          const score = Math.max(-1, Math.min(1, result.score || 0));
          const confidence = Math.max(0, Math.min(1, result.confidence || 0.5));
          
          results.push({
            id: batch[index].id,
            score,
            confidence,
            reasoning: result.reasoning || 'AI sentiment analysis'
          });
        }
      });
      
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed successfully`);
      
      // Small delay between batches to be respectful
      if (i + batchSize < items.length) {
        console.log(`⏸️ Waiting 500ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`🎉 Batch sentiment analysis completed successfully for ${items.length} items`);
    return results;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Batch LLM sentiment analysis failed:', errorMsg);
    
    // Log specific debugging info for different error types
    if (errorMsg.includes('truncated')) {
      console.error('💡 This appears to be a response truncation issue - try reducing batch size or content length');
    } else if (errorMsg.includes('timeout')) {
      console.error('💡 LLM call timed out - this could be due to API issues or model overload');
    }
    
    return items.map(item => ({
      id: item.id,
      ...analyzeSentimentFallback(item.text)
    }));
  }
}

/**
 * Fallback sentiment analysis using enhanced keyword matching
 * @param text - Text to analyze
 * @returns Basic sentiment result
 */
function analyzeSentimentFallback(text: string): SentimentResult {
  const positiveWords = [
    'positive', 'good', 'success', 'win', 'up', 'bullish', 'likely', 'confident',
    'strong', 'growth', 'increase', 'rise', 'boom', 'surge', 'optimistic',
    'favorable', 'approve', 'support', 'boost', 'rally', 'momentum', 'gains',
    'upward', 'recovery', 'improvement', 'expanding', 'advancing'
  ];
  
  const negativeWords = [
    'negative', 'bad', 'fail', 'down', 'bearish', 'unlikely', 'doubt',
    'weak', 'decline', 'decrease', 'fall', 'crash', 'plunge', 'pessimistic',
    'unfavorable', 'reject', 'oppose', 'tank', 'collapse', 'concern',
    'losses', 'downward', 'recession', 'contraction', 'falling', 'dropping'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  let wordCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) {
      score += 0.1;
      wordCount++;
    }
    if (negativeWords.includes(word)) {
      score -= 0.1;
      wordCount++;
    }
  });
  
  // Normalize score and calculate confidence based on signal strength
  const normalizedScore = Math.max(-1, Math.min(1, score));
  const confidence = Math.min(0.8, wordCount * 0.1); // Lower confidence for keyword matching
  
  return {
    score: normalizedScore,
    confidence,
    reasoning: `Keyword-based analysis (${wordCount} sentiment indicators found)`
  };
}

/**
 * Calculate aggregate sentiment from multiple sentiment results
 * @param sentiments - Array of sentiment results
 * @returns Weighted average sentiment score
 */
export function calculateAggregateSentiment(sentiments: SentimentResult[]): number {
  if (sentiments.length === 0) return 0;
  
  // Weight by confidence - more confident results have higher impact
  const weightedSum = sentiments.reduce((sum, sentiment) => 
    sum + (sentiment.score * sentiment.confidence), 0
  );
  
  const totalWeight = sentiments.reduce((sum, sentiment) => 
    sum + sentiment.confidence, 0
  );
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
} 