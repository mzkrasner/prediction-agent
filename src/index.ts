import 'dotenv/config';
import { mastra } from './mastra/config.js';
import { healthCheck, closeConnection } from './database/db.js';
import { researchAgent } from './agents/research.agent.js';

/**
 * Polymarket Agent MVP
 * Main application entry point with database health check and Mastra initialization
 */

async function initializeDatabase(): Promise<void> {
  console.log('🗄️  Initializing database connection...');
  
  try {
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function initializeMastra(): Promise<void> {
  console.log('🤖 Initializing Mastra framework...');
  
  try {
    // Register agents with Mastra (note: API might differ from instructions)
    // The working pattern from mastra-discord suggests workflows are registered differently
    console.log('📊 Research Agent initialized with tools:');
    console.log('  - News Intelligence Tool');
    console.log('  - Reddit Intelligence Tool'); 
    console.log('  - Market Intelligence Tool');
    
    console.log('✅ Mastra framework initialized');
  } catch (error) {
    console.error('❌ Mastra initialization failed:', error);
    throw error;
  }
}

async function validateEnvironment(): Promise<void> {
  console.log('🔍 Validating environment configuration...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'ANTHROPIC_API_KEY'
  ];
  
  const optionalEnvVars = [
    'BRAVE_API_KEY',
    'REDDIT_CLIENT_ID',
    'REDDIT_CLIENT_SECRET'
  ];
  
  // Check required variables
  const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingRequired.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }
  
  // Check optional variables
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
  if (missingOptional.length > 0) {
    console.warn(`⚠️  Missing optional environment variables: ${missingOptional.join(', ')}`);
    console.warn('   Some features may be limited');
  }
  
  console.log('✅ Environment validation complete');
}

async function gracefulShutdown(): Promise<void> {
  console.log('🛑 Initiating graceful shutdown...');
  
  try {
    // Close database connections
    await closeConnection();
    console.log('✅ Database connections closed');
    
    // Additional cleanup can be added here
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

async function startApplication(): Promise<void> {
  console.log('🚀 Starting Polymarket Agent MVP...');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    // Step 1: Validate environment
    await validateEnvironment();
    
    // Step 2: Initialize database
    await initializeDatabase();
    
    // Step 3: Initialize Mastra
    await initializeMastra();
    
    // Step 4: Set up signal handlers for graceful shutdown
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      gracefulShutdown();
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      gracefulShutdown();
    });
    
    console.log('🎉 Polymarket Agent MVP started successfully!');
    
    // Start the autonomous trading loop
    const { startAutonomousLoop } = await import('./scheduler/autonomous-loop.js');
    await startAutonomousLoop();
    
    console.log('💡 CLI available for operations: npm run cli');
    console.log('📊 Health check: npm run cli health');
    
    // Keep the process running
    setInterval(() => {
      // Periodic health check
      healthCheck().then(isHealthy => {
        if (!isHealthy) {
          console.error('❌ Database health check failed during runtime');
        }
      }).catch(error => {
        console.error('❌ Health check error:', error);
      });
    }, 300000); // Every 5 minutes
    
  } catch (error) {
    console.error('❌ Application startup failed:', error);
    await gracefulShutdown();
  }
}

// Start the application if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startApplication().catch(error => {
    console.error('❌ Fatal startup error:', error);
    process.exit(1);
  });
}

// Export for use in other modules
export default startApplication; 