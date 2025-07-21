#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';

const program = new Command();

program
  .name('polymarket-agent')
  .description('CLI for Polymarket Agent MVP')
  .version('1.0.0');

program
  .command('health')
  .description('Check system health')
  .action(async () => {
    console.log('🏥 Checking system health...');
    
    try {
      const { healthCheck } = await import('../database/db.js');
      const dbHealthy = await healthCheck();
      
      console.log(`📊 Database: ${dbHealthy ? '✅ Connected' : '❌ Failed'}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔑 Brave Search API: ${process.env.BRAVE_API_KEY ? '✅ Configured' : '❌ Missing'}`);
      console.log(`🔑 Reddit API: ${process.env.REDDIT_CLIENT_ID ? '✅ Configured' : '❌ Missing'}`);
      console.log(`🔑 Anthropic API: ${process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Missing'}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Health check failed:', errorMessage);
    }
  });

program
  .command('start')
  .description('Start the Polymarket Agent')
  .action(async () => {
    const main = await import('../index.js');
    await main.default();
  });

program.parse(); 