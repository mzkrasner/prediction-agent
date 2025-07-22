# Polymarket Agent MVP

An autonomous prediction market trading agent built with [Mastra](https://mastra.ai) that monitors active markets on Polymarket, gathers intelligence from multiple sources, and executes data-driven trading decisions.

## 🎯 Project Status

This is an **MVP (Minimum Viable Product)** implementation currently in active development. 

### ✅ Completed Components

- [x] **Project Structure & Configuration**
  - TypeScript configuration with ES modules
  - Environment variable management
  - Package.json with all required dependencies

- [x] **Database Architecture** 
  - Supabase + Drizzle ORM setup
  - Market intelligence, trade decisions, and performance metrics schemas
  - Database utilities and connection management

- [x] **Mastra Framework Integration**
  - Core Mastra configuration
  - Agent and workflow structure foundation

- [x] **Intelligence Tools (In Progress)**
  - News intelligence tool with NewsAPI integration
  - Reddit intelligence tool (API integration patterns established)
  - Sentiment analysis and content processing

### 🚧 Work In Progress

- [ ] **Fix Mastra API Compatibility Issues**
  - Tool execution context adjustments
  - Agent configuration updates
  - Workflow implementation

- [ ] **EVM MCP Server Integration**
  - Blockchain transaction handling
  - Wallet security implementation
  - Trading execution logic

- [ ] **Complete Agent Implementation**
  - Research Agent with multi-source intelligence
  - Decision Agent with market analysis
  - Execution Agent with risk management

## 🏗️ Architecture Overview

```
src/
├── mastra/              # Mastra framework configuration
├── database/            # Supabase + Drizzle setup
│   ├── schema/         # Database schemas
│   └── repositories/   # Data access patterns
├── tools/              # Intelligence gathering tools
│   ├── reddit-intelligence.tool.ts
│   ├── news-intelligence.tool.ts
│   └── evm-mcp.tool.ts
├── agents/             # Mastra agents
│   ├── research.agent.ts
│   ├── decision.agent.ts
│   └── execution.agent.ts
├── workflows/          # Automated trading workflows
├── cli/               # Development and testing CLI
└── index.ts           # Main application entry
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Redis (for caching)
- API Keys:
  - Anthropic API key (for Claude Sonnet 4)
  - NewsAPI key (see setup details below)
  - Reddit API credentials
  - EVM private key for trading

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository>
   cd <repository-dir>
   npm install
   ```

2. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your API keys and configuration
   ```
   - for testing all you will need are your Reddit and Twitter credentials, `DATABASE_URL`, `ANTHROPIC_API_KEY`

3. **Database setup**
   ```bash
   # Generate migrations
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Optional: Open database studio
   npm run db:studio
   ```

### 🔑 API Key Setup Guide

#### NewsAPI Configuration

The agent uses NewsAPI.org to gather real-time news intelligence for market analysis.

1. **Get your NewsAPI key:**
   - Visit [https://newsapi.org](https://newsapi.org)
   - Click "Get API Key" or "Sign Up"
   - Create a free account with your email
   - Verify your email address
   - Your API key will be displayed on your dashboard

2. **API Key Plans:**
   - **Developer Plan (Free)**: 1,000 requests/month, 2-day article delay
   - **Business Plan ($449/month)**: 250,000 requests/month, live articles
   - **For testing**: The free plan is sufficient for development and testing

3. **Add to your `.env` file:**
   ```bash
   NEWS_API_KEY=your_actual_api_key_here
   ```

4. **Rate Limiting:**
   - The tool includes built-in rate limiting to respect API limits
   - Free tier: Max 1,000 requests per month
   - Requests are cached to minimize API usage

**Note**: For production trading, consider upgrading to the Business plan for real-time news access without the 2-day delay.

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run CLI commands
npm run cli health          # Check system health
npm run cli test-news "Bitcoin Price" -k bitcoin crypto
npm run cli start          # Start the agent

# Database commands
npm run db:generate        # Generate new migrations
npm run db:migrate         # Apply migrations
npm run db:studio         # Open Drizzle Studio
npm run db:check          # Check migration status
```

## 🔧 Configuration

Key environment variables (see `env.example` for full list):

```bash
# Core Configuration
NODE_ENV=development
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379

# API Keys
ANTHROPIC_API_KEY=your_anthropic_key
NEWS_API_KEY=your_newsapi_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# Trading Configuration
POLYMARKET_PRIVATE_KEY=0x...
MAX_POSITION_SIZE=100
MIN_CONFIDENCE_THRESHOLD=65
```

## 🎭 Features

### Intelligence Gathering
- **News Analysis**: Real-time news sentiment using NewsAPI
- **Reddit Sentiment**: Community discussion analysis with OAuth2
- **Social Media Monitoring**: Twitter sentiment and trending detection
- **Market Data**: Polymarket API integration for market metrics

### Risk Management
- **Position Sizing**: Kelly criterion with confidence scaling
- **Spending Limits**: Daily and per-trade caps
- **Circuit Breakers**: API failure protection
- **Transaction Monitoring**: Real-time execution tracking

### Security
- **Private Key Safety**: Keys used only for signing, never stored
- **MCP Integration**: Secure blockchain operations via Model Context Protocol
- **Audit Trail**: Comprehensive logging of all decisions and trades

## 🧪 Testing

```bash
# Test news intelligence
npm run cli test-news "Will Bitcoin reach $100k?" -k bitcoin crypto price

# Check system health
npm run cli health

# Run development environment
npm run dev
```

## 📚 Implementation Guide

Detailed implementation instructions are available in [`docs/instructions.md`](docs/instructions.md), including:

- Complete Reddit API integration patterns
- Database schema design and migrations  
- EVM MCP Server security implementation
- Mastra agent and workflow development
- Production deployment guidelines

## 🤝 Development Status

This project is actively under development. Current priorities:

1. **Fix Mastra API compatibility** - Update tool and agent definitions
2. **Complete EVM integration** - Implement secure trading execution
3. **Enhance intelligence tools** - Add Twitter and enhanced Reddit analysis
4. **Implement workflows** - Complete autonomous trading pipeline
5. **Add comprehensive testing** - Unit and integration test coverage

## 🔒 Security Considerations

- Private keys are used only for transaction signing
- All API calls include rate limiting and circuit breakers
- Comprehensive spending limits and emergency stops
- Audit logging for all trades and decisions
- Secure environment variable management

## 📄 License

MIT License - See LICENSE file for details

## 🙋‍♂️ Contributing

This is currently a private development project. For questions or collaboration, please contact the maintainers.

---

Built with ❤️ using [Mastra](https://mastra.ai), TypeScript, and modern web technologies. 