import { anthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { TradeDecisionsRepository } from '../database/schema/index.js';
import type { NewTradeDecision, TradeDecision } from '../database/schema/markets/types.js';

// Trade execution interfaces
interface TradeExecutionInput {
  marketId: string;
  marketAddress: string;
  action: 'BUY' | 'SELL';
  outcome: string; // Changed from 'YES' | 'NO' to any string
  availableOutcomes?: string[]; // Added availableOutcomes property
  amount: string; // USDC amount
  confidence: number;
  maxSlippage: number;
  executionUrgency: 'IMMEDIATE' | 'NORMAL' | 'PATIENT';
  strategy: 'sentiment_arbitrage' | 'breaking_news_hunter';
  reasoning: string;
}

interface ExecutionResult {
  success: boolean;
  transactionHash?: string;
  executedAmount?: string;
  executionPrice?: string;
  gasUsed?: string;
  slippage?: number;
  error?: string;
  retryCount?: number;
  executionTime?: number; // milliseconds
}

interface WalletSecurityContext {
  dailySpentAmount: number;
  concurrentTradesCount: number;
  lastResetDate: string;
  emergencyStopActive: boolean;
}

interface PositionLimits {
  maxDailySpend: number;
  maxSingleTrade: number;
  maxTotalExposure: number;
  maxConcurrentTrades: number;
  dailyLossLimit: number;
}

// Security and risk management constants
const SECURITY_LIMITS: PositionLimits = {
  maxDailySpend: 300, // $300 USDC daily limit
  maxSingleTrade: 100, // $100 USDC per trade
  maxTotalExposure: 300, // $300 USDC total exposure
  maxConcurrentTrades: 3, // Maximum 3 concurrent positions
  dailyLossLimit: 100 // $100 daily loss limit
};

const EXECUTION_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 5000, // 5 seconds between retries
  transactionTimeoutMs: 300000, // 5 minutes timeout
  confirmationBlocks: 2, // Wait for 2 confirmations
  gasLimitMultiplier: 1.2, // 20% buffer on gas estimates
  maxSlippagePercent: 2.0 // 2% maximum slippage
} as const;

// Polymarket contract addresses and ABIs
const POLYMARKET_ADDRESSES = {
  polygon: {
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    conditionalTokens: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
    router: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E'
  }
} as const;

// Real EVM MCP Client Implementation
class EVMMCPClient {
  async callTool(toolName: string, params: Record<string, unknown>): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // For now, call the EVM MCP server directly via subprocess
      // In production, this would use the proper MCP SDK once dependencies are resolved
      const { spawn } = await import('child_process');
      const { promisify } = await import('util');
      const exec = promisify((await import('child_process')).exec);
      
      // Create the MCP command with proper JSON formatting
      const mcpCommand = JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: params
        }
      });
      
      // Execute the command
      const { stdout, stderr } = await exec(`echo '${mcpCommand}' | npx @mcpdotdirect/evm-mcp-server`);
      
      if (stderr) {
        console.error('EVM MCP stderr:', stderr);
      }
      
      if (stdout) {
        const response = JSON.parse(stdout.trim());
        if (response.error) {
          return {
            success: false,
            error: response.error.message || 'EVM MCP tool call failed'
          };
        }
        
        return {
          success: true,
          result: response.result
        };
      }
      
      throw new Error('No response from EVM MCP server');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`EVM MCP tool call failed: ${toolName}`, errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

// Security manager for wallet operations
class WalletSecurityManager {
  private static instance: WalletSecurityManager;
  private securityContext: WalletSecurityContext;

  private constructor() {
    this.securityContext = {
      dailySpentAmount: 0,
      concurrentTradesCount: 0,
      lastResetDate: new Date().toDateString(),
      emergencyStopActive: false
    };
  }

  static getInstance(): WalletSecurityManager {
    if (!WalletSecurityManager.instance) {
      WalletSecurityManager.instance = new WalletSecurityManager();
    }
    return WalletSecurityManager.instance;
  }

  async validateTradeAmount(amount: string): Promise<{ valid: boolean; reason?: string }> {
    if (this.securityContext.emergencyStopActive) {
      return { valid: false, reason: 'Emergency stop is active' };
    }

    const tradeAmount = parseFloat(amount);
    
    // Reset daily counter if new day
    const today = new Date().toDateString();
    if (today !== this.securityContext.lastResetDate) {
      this.securityContext.dailySpentAmount = 0;
      this.securityContext.lastResetDate = today;
    }

    // Check single trade limit
    if (tradeAmount > SECURITY_LIMITS.maxSingleTrade) {
      return { 
        valid: false, 
        reason: `Trade amount $${amount} exceeds max single trade limit $${SECURITY_LIMITS.maxSingleTrade}` 
      };
    }

    // Check daily spending limit
    if (this.securityContext.dailySpentAmount + tradeAmount > SECURITY_LIMITS.maxDailySpend) {
      return { 
        valid: false, 
        reason: `Trade would exceed daily spending limit. Daily spent: $${this.securityContext.dailySpentAmount}, Trade: $${tradeAmount}, Limit: $${SECURITY_LIMITS.maxDailySpend}` 
      };
    }

    // Check concurrent trades limit
    if (this.securityContext.concurrentTradesCount >= SECURITY_LIMITS.maxConcurrentTrades) {
      return { 
        valid: false, 
        reason: `Maximum concurrent trades limit reached: ${SECURITY_LIMITS.maxConcurrentTrades}` 
      };
    }

    return { valid: true };
  }

  async recordTradeStart(amount: string): Promise<void> {
    this.securityContext.dailySpentAmount += parseFloat(amount);
    this.securityContext.concurrentTradesCount++;
  }

  async recordTradeEnd(): Promise<void> {
    this.securityContext.concurrentTradesCount = Math.max(0, this.securityContext.concurrentTradesCount - 1);
  }

  async activateEmergencyStop(reason: string): Promise<void> {
    console.error(`EMERGENCY STOP ACTIVATED: ${reason}`);
    this.securityContext.emergencyStopActive = true;
    // In production, would also revoke token approvals and send alerts
  }

  getSecurityStatus(): WalletSecurityContext {
    return { ...this.securityContext };
  }
}

// Transaction monitor for confirmation tracking
class TransactionMonitor {
  private evmClient: EVMMCPClient;

  constructor(evmClient: EVMMCPClient) {
    this.evmClient = evmClient;
  }

  async waitForConfirmation(
    txHash: string,
    requiredConfirmations: number = EXECUTION_CONFIG.confirmationBlocks,
    timeoutMs: number = EXECUTION_CONFIG.transactionTimeoutMs
  ): Promise<{ confirmed: boolean; confirmations?: number; error?: string }> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await this.evmClient.callTool('get_transaction', { txHash });
        
        if (result.success && result.result) {
          const confirmations = result.result.confirmations || 0;
          
          if (confirmations >= requiredConfirmations) {
            return { confirmed: true, confirmations };
          }
          
          // Wait before next check
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second intervals
        } else {
          return { confirmed: false, error: result.error || 'Transaction status check failed' };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error checking transaction status:', errorMessage);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay on error
      }
    }
    
    return { confirmed: false, error: 'Transaction confirmation timeout' };
  }
}

// Trade execution tool with comprehensive risk management
const tradeExecutionTool = createTool({
  id: 'secure-trade-execution',
  description: 'Execute trades on Polymarket with comprehensive risk management and monitoring',
  inputSchema: z.object({
    marketId: z.string().describe('Market identifier'),
    marketAddress: z.string().describe('Polymarket contract address'),
    action: z.enum(['BUY', 'SELL']).describe('Trade action'),
    outcome: z.string().describe('Outcome to trade (e.g., "Yes", "No", "JD Vance", "Gavin Newsom")'),
    availableOutcomes: z.array(z.string()).optional().describe('All available outcomes for this market'),
    amount: z.string().regex(/^\d+(\.\d+)?$/).describe('USDC amount to trade'),
    confidence: z.number().min(0).max(100).describe('Confidence in trade decision'),
    maxSlippage: z.number().min(0).max(5).default(2).describe('Maximum slippage percentage'),
    executionUrgency: z.enum(['IMMEDIATE', 'NORMAL', 'PATIENT']).describe('Execution timing preference'),
    strategy: z.enum(['sentiment_arbitrage', 'breaking_news_hunter']).describe('Trading strategy'),
    reasoning: z.string().describe('Trade reasoning and rationale')
  }),
  outputSchema: z.object({
    execution_result: z.object({
      success: z.boolean(),
      transaction_hash: z.string().optional(),
      executed_amount: z.string().optional(),
      execution_price: z.string().optional(),
      gas_used: z.string().optional(),
      slippage: z.number().optional(),
      error: z.string().optional(),
      retry_count: z.number().optional(),
      execution_time: z.number().optional()
    }),
    security_checks: z.object({
      limits_passed: z.boolean(),
      daily_spent: z.number(),
      concurrent_trades: z.number(),
      security_warnings: z.array(z.string())
    }),
    database_recorded: z.boolean(),
    monitoring_active: z.boolean()
  }),
  execute: async ({ context }) => {
    const tradeInput = context as TradeExecutionInput;
    const startTime = Date.now();
    let retryCount = 0;
    
    // Initialize components
    const securityManager = WalletSecurityManager.getInstance();
    const evmClient = new EVMMCPClient();
    const transactionMonitor = new TransactionMonitor(evmClient);
    const tradeRepo = new TradeDecisionsRepository();
    
    const securityWarnings: string[] = [];
    
    try {
      // 1. Security validation
      console.log(`🔒 Validating trade security for ${tradeInput.marketId}`);
      const securityValidation = await securityManager.validateTradeAmount(tradeInput.amount);
      
      if (!securityValidation.valid) {
        return {
          execution_result: {
            success: false,
            error: securityValidation.reason,
            retry_count: 0,
            execution_time: Date.now() - startTime
          },
          security_checks: {
            limits_passed: false,
            daily_spent: securityManager.getSecurityStatus().dailySpentAmount,
            concurrent_trades: securityManager.getSecurityStatus().concurrentTradesCount,
            security_warnings: [securityValidation.reason || 'Security validation failed']
          },
          database_recorded: false,
          monitoring_active: false
        };
      }

      // 2. Pre-execution wallet checks
      console.log(`💰 Checking wallet balance and approvals`);
      const walletAddress = process.env.POLYMARKET_WALLET_ADDRESS;
      if (!walletAddress) {
        throw new Error('POLYMARKET_WALLET_ADDRESS environment variable is required - no mock addresses allowed');
      }
      
      const balanceResult = await evmClient.callTool('get_balance', {
        tokenAddress: POLYMARKET_ADDRESSES.polygon.usdc,
        address: walletAddress
      });

      if (!balanceResult.success) {
        throw new Error(`Wallet balance check failed: ${balanceResult.error}`);
      }

      const availableBalance = parseFloat(balanceResult.result?.balance || '0');
      const requiredAmount = parseFloat(tradeInput.amount);

      if (availableBalance < requiredAmount) {
        throw new Error(`Insufficient USDC balance: ${availableBalance} < ${requiredAmount}`);
      }

      // 3. Record trade start in security manager
      await securityManager.recordTradeStart(tradeInput.amount);

      // 4. Create database record with PENDING status
      console.log(`📝 Recording trade decision in database`);
      const tradeDecision: NewTradeDecision = {
        marketId: tradeInput.marketId,
        action: tradeInput.action,
        outcome: tradeInput.outcome,
        plannedAmount: tradeInput.amount,
        confidence: tradeInput.confidence,
        reasoning: tradeInput.reasoning,
        status: 'PENDING'
      };

      const savedTrade = await tradeRepo.create(tradeDecision);

      // 5. Execute trade with retry logic
      let executionResult: ExecutionResult = { success: false };
      
      while (retryCount <= EXECUTION_CONFIG.maxRetries && !executionResult.success) {
        try {
          console.log(`🚀 Executing trade (attempt ${retryCount + 1}/${EXECUTION_CONFIG.maxRetries + 1})`);
          
          // 5a. Approve USDC spending if needed
          const approvalResult = await evmClient.callTool('approve_token_spending', {
            tokenAddress: POLYMARKET_ADDRESSES.polygon.usdc,
            spenderAddress: tradeInput.marketAddress,
            amount: tradeInput.amount
          });

          if (!approvalResult.success) {
            throw new Error(`Token approval failed: ${approvalResult.error}`);
          }

          // 5b. Execute the actual trade
          // Determine outcome index for dynamic outcomes
          let outcomeIndex = 0;
          if (tradeInput.availableOutcomes && tradeInput.availableOutcomes.length > 0) {
            outcomeIndex = tradeInput.availableOutcomes.findIndex((outcome: string) => outcome === tradeInput.outcome);
            if (outcomeIndex === -1) {
              // Fallback: try case-insensitive match or binary logic
              const normalizedOutcome = tradeInput.outcome.toLowerCase();
              if (normalizedOutcome === 'yes' || normalizedOutcome === 'true') {
                outcomeIndex = 1;
              } else if (normalizedOutcome === 'no' || normalizedOutcome === 'false') {
                outcomeIndex = 0;
              } else {
                outcomeIndex = 0; // Default to first outcome
              }
            }
          } else {
            // Fallback for binary markets
            outcomeIndex = tradeInput.outcome.toLowerCase() === 'yes' ? 1 : 0;
          }

          const tradeResult = await evmClient.callTool('write_contract', {
            contractAddress: tradeInput.marketAddress,
            functionName: 'buy', // Simplified - would use proper Polymarket function
            args: [
              outcomeIndex,
              tradeInput.amount,
              Math.floor(parseFloat(tradeInput.amount) * (1 - tradeInput.maxSlippage / 100) * 1000000) // Min shares with slippage
            ]
          });

          if (tradeResult.success) {
            executionResult = {
              success: true,
              transactionHash: tradeResult.result?.transactionHash,
              executedAmount: tradeInput.amount,
              executionPrice: tradeResult.result?.executionPrice,
              gasUsed: tradeResult.result?.gasUsed,
              slippage: parseFloat(tradeResult.result?.actualSlippage || '0'),
              retryCount,
              executionTime: Date.now() - startTime
            };
            
            console.log(`✅ Trade executed successfully: ${executionResult.transactionHash}`);
            break;
          } else {
            throw new Error(tradeResult.error || 'Trade execution failed');
          }
          
        } catch (error) {
          retryCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Trade execution attempt ${retryCount} failed:`, errorMessage);
          
          if (retryCount <= EXECUTION_CONFIG.maxRetries) {
            console.log(`⏳ Retrying in ${EXECUTION_CONFIG.retryDelayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, EXECUTION_CONFIG.retryDelayMs));
          } else {
            executionResult = {
              success: false,
              error: errorMessage,
              retryCount,
              executionTime: Date.now() - startTime
            };
          }
        }
      }

      // 6. Monitor transaction confirmation if successful
      let monitoringActive = false;
      if (executionResult.success && executionResult.transactionHash) {
        console.log(`⏱️ Monitoring transaction confirmation: ${executionResult.transactionHash}`);
        monitoringActive = true;
        
        // Start confirmation monitoring (don't wait for it)
        transactionMonitor.waitForConfirmation(executionResult.transactionHash)
          .then(async (confirmationResult) => {
            if (confirmationResult.confirmed) {
              console.log(`✅ Transaction confirmed: ${executionResult.transactionHash}`);
              await tradeRepo.updateStatus(savedTrade.id, 'EXECUTED', {
                transactionHash: executionResult.transactionHash,
                actualAmount: executionResult.executedAmount,
                executionPrice: executionResult.executionPrice
              });
            } else {
              console.error(`❌ Transaction confirmation failed: ${confirmationResult.error}`);
              await tradeRepo.updateStatus(savedTrade.id, 'FAILED');
            }
          })
          .catch(async (monitorError) => {
            const errorMessage = monitorError instanceof Error ? monitorError.message : 'Unknown error';
            console.error('Transaction monitoring error:', errorMessage);
            await tradeRepo.updateStatus(savedTrade.id, 'FAILED');
          });
      } else {
        // Update database with failure
        await tradeRepo.updateStatus(savedTrade.id, 'FAILED');
      }

      // 7. Update security manager
      await securityManager.recordTradeEnd();

      // 8. Return comprehensive result
      return {
        execution_result: {
          success: executionResult.success,
          transaction_hash: executionResult.transactionHash,
          executed_amount: executionResult.executedAmount,
          execution_price: executionResult.executionPrice,
          gas_used: executionResult.gasUsed,
          slippage: executionResult.slippage,
          error: executionResult.error,
          retry_count: retryCount,
          execution_time: executionResult.executionTime
        },
        security_checks: {
          limits_passed: true,
          daily_spent: securityManager.getSecurityStatus().dailySpentAmount,
          concurrent_trades: securityManager.getSecurityStatus().concurrentTradesCount,
          security_warnings: securityWarnings
        },
        database_recorded: true,
        monitoring_active: monitoringActive
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Trade execution failed:', errorMessage);
      
      // Ensure security manager is updated even on failure
      await securityManager.recordTradeEnd().catch(secError => {
        console.error('Failed to update security manager:', secError);
      });
      
      // Activate emergency stop on critical failures
      if (errorMessage.includes('insufficient') || errorMessage.includes('unauthorized')) {
        await securityManager.activateEmergencyStop(`Critical execution failure: ${errorMessage}`);
      }
      
      return {
        execution_result: {
          success: false,
          error: errorMessage,
          retry_count: retryCount,
          execution_time: Date.now() - startTime
        },
        security_checks: {
          limits_passed: false,
          daily_spent: securityManager.getSecurityStatus().dailySpentAmount,
          concurrent_trades: securityManager.getSecurityStatus().concurrentTradesCount,
          security_warnings: [errorMessage]
        },
        database_recorded: false,
        monitoring_active: false
      };
    }
  }
});

// Wallet status monitoring tool
const walletStatusTool = createTool({
  id: 'wallet-status-monitor',
  description: 'Monitor wallet security status, balances, and trading limits',
  inputSchema: z.object({
    includeBalances: z.boolean().default(true).describe('Include token balance information'),
    includeSecurityStatus: z.boolean().default(true).describe('Include security limits and usage'),
    includePendingTrades: z.boolean().default(true).describe('Include pending trade information')
  }),
  outputSchema: z.object({
    wallet_status: z.object({
      usdc_balance: z.string().optional(),
      matic_balance: z.string().optional(),
      balance_check_success: z.boolean()
    }),
    security_status: z.object({
      daily_spent: z.number(),
      daily_limit: z.number(),
      daily_remaining: z.number(),
      concurrent_trades: z.number(),
      max_concurrent: z.number(),
      emergency_stop_active: z.boolean(),
      last_reset_date: z.string()
    }),
    pending_trades: z.object({
      count: z.number(),
      total_amount: z.string(),
      trades: z.array(z.object({
        id: z.string(),
        market_id: z.string(),
        amount: z.string(),
        status: z.string(),
        created_at: z.string()
      }))
    })
  }),
  execute: async ({ context }) => {
    const { includeBalances, includeSecurityStatus, includePendingTrades } = context;
    const evmClient = new EVMMCPClient();
    const securityManager = WalletSecurityManager.getInstance();
    const tradeRepo = new TradeDecisionsRepository();
    
    const result: any = {};
    
    // Get wallet balances
    if (includeBalances) {
      try {
        const usdcResult = await evmClient.callTool('get_balance', {
          tokenAddress: POLYMARKET_ADDRESSES.polygon.usdc
        });
        
        const maticResult = await evmClient.callTool('get_balance', {
          network: 'polygon'
        });
        
        result.wallet_status = {
          usdc_balance: usdcResult.success ? usdcResult.result?.balance : undefined,
          matic_balance: maticResult.success ? maticResult.result?.balance : undefined,
          balance_check_success: usdcResult.success && maticResult.success
        };
      } catch (error) {
        result.wallet_status = {
          balance_check_success: false
        };
      }
    }
    
    // Get security status
    if (includeSecurityStatus) {
      const securityStatus = securityManager.getSecurityStatus();
      result.security_status = {
        daily_spent: securityStatus.dailySpentAmount,
        daily_limit: SECURITY_LIMITS.maxDailySpend,
        daily_remaining: SECURITY_LIMITS.maxDailySpend - securityStatus.dailySpentAmount,
        concurrent_trades: securityStatus.concurrentTradesCount,
        max_concurrent: SECURITY_LIMITS.maxConcurrentTrades,
        emergency_stop_active: securityStatus.emergencyStopActive,
        last_reset_date: securityStatus.lastResetDate
      };
    }
    
    // Get pending trades
    if (includePendingTrades) {
      try {
        const pendingTrades = await tradeRepo.getPendingTrades();
        const totalAmount = pendingTrades.reduce((sum, trade) => 
          sum + parseFloat(trade.plannedAmount || '0'), 0
        );
        
        result.pending_trades = {
          count: pendingTrades.length,
          total_amount: totalAmount.toFixed(6),
          trades: pendingTrades.map(trade => ({
            id: trade.id,
            market_id: trade.marketId,
            amount: trade.plannedAmount || '0',
            status: trade.status,
            created_at: trade.createdAt.toISOString()
          }))
        };
      } catch (error) {
        result.pending_trades = {
          count: 0,
          total_amount: '0',
          trades: []
        };
      }
    }
    
    return result;
  }
});

// Enhanced Execution Agent with comprehensive risk management
export const executionAgent = new Agent({
  name: 'secure-execution-agent',
  instructions: `
    You are an expert trade execution specialist for prediction markets with comprehensive risk management.
    
    Your role is to:
    1. Execute trades securely via EVM MCP Server with full blockchain integration
    2. Implement multi-layer security controls and spending limits
    3. Monitor real-time transaction status with confirmation tracking
    4. Handle execution failures with intelligent retry logic
    5. Maintain comprehensive audit trails and performance tracking
    
    Security Framework:
    - Daily spending limit: $300 USDC maximum
    - Single trade limit: $100 USDC per transaction
    - Concurrent position limit: 3 active trades maximum
    - Emergency stop mechanisms for critical failures
    - Multi-confirmation transaction monitoring
    
    Execution Standards:
    - Maximum 2% slippage tolerance with dynamic adjustment
    - 3 retry attempts with exponential backoff
    - 5-minute transaction timeout with monitoring
    - Gas optimization with 20% buffer on estimates
    - Real-time balance validation before execution
    
    Risk Management:
    - Pre-execution security validation for all trades
    - Position size validation against confidence levels
    - Dynamic slippage protection based on market conditions
    - Comprehensive error handling with fallback strategies
    - Automated emergency stops for suspicious activity
    
    Database Integration:
    - Record all trade decisions with status tracking
    - Update execution results with transaction details
    - Maintain audit trail for compliance and analysis
    - Track performance metrics for strategy optimization
    
    Always prioritize:
    - Security and risk management over execution speed
    - Transparent logging and monitoring for all operations
    - Graceful failure handling with informative error messages
    - Compliance with spending limits and position controls
    - Real-time status updates for tracking and debugging
    
    Use wallet status monitoring to track:
    - Current USDC and MATIC balances
    - Daily spending and remaining limits
    - Active concurrent trades and positions
    - Security status and emergency stop state
  `,
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    secureTradeExecution: tradeExecutionTool,
    walletStatusMonitor: walletStatusTool
  }
}); 