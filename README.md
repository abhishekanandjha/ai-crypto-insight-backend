# AI Crypto Insight Backend

Token Insight & Analytics API built with Node.js, Express, and TypeScript.

## Features

- **Token Insight API** - Fetches crypto token data from CoinGecko and generates AI-powered market analysis using OpenAI
- **HyperLiquid Wallet PnL API** - Calculates daily profit/loss breakdown for HyperLiquid wallets
- Input validation with Zod
- Rate limiting, error handling, structured logging
- Docker support
- Unit and integration tests

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **AI**: OpenAI GPT-4o-mini (with mock fallback)
- **External APIs**: CoinGecko (free), HyperLiquid Info API
- **Testing**: Jest + Supertest

## Quick Start

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/abhishekanandjha/ai-crypto-insight-backend.git
cd ai-crypto-insight-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY (optional - mock provider works without it)

# Start development server
npm run dev
```

The server starts at `http://localhost:3000`.

### Docker Setup (Preferred)

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your API key

# Build and run
docker compose up --build

# Or build manually
docker build -t ai-crypto-insight .
docker run -p 3000:3000 --env-file .env ai-crypto-insight
```

## AI Setup

This project uses **OpenAI GPT-4o-mini** for generating token insights.
I have also spend 7.1$ on this if possible pls refund me, thankyou.

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file:
   ```
   OPENAI_API_KEY=sk-your-key-here
   AI_PROVIDER=openai
   AI_MODEL=gpt-4o-mini
   ```

**No API key?** The system automatically falls back to a mock AI provider that returns static analysis. All other functionality (CoinGecko data, HyperLiquid PnL) works without any API key.

To explicitly use the mock provider:
```
AI_PROVIDER=mock
```

## API Endpoints

### Health Check

```
GET /health
```

### 1. Token Insight API

```
POST /api/token/:id/insight
```

Fetches token data from CoinGecko and generates AI-powered market analysis.

**Path Parameters:**
- `id` - CoinGecko token ID (e.g., `bitcoin`, `ethereum`, `chainlink`)

**Request Body** (optional):
```json
{
  "vs_currency": "usd",
  "history_days": 30
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/token/bitcoin/insight \
  -H "Content-Type: application/json" \
  -d '{"vs_currency": "usd", "history_days": 30}'
```

**Response:**
```json
{
  "source": "coingecko",
  "token": {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "Bitcoin",
    "market_data": {
      "current_price_usd": 65000,
      "market_cap_usd": 1200000000000,
      "total_volume_usd": 30000000000,
      "price_change_percentage_24h": 2.5
    }
  },
  "insight": {
    "reasoning": "Bitcoin shows strong momentum with a 2.5% gain in 24h...",
    "sentiment": "Bullish"
  },
  "model": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  }
}
```

### 2. HyperLiquid Wallet Daily PnL API

```
GET /api/hyperliquid/:wallet/pnl?start=YYYY-MM-DD&end=YYYY-MM-DD

That's just an example wallet address I used for the Postman collection and testing. I picked it arbitrarily - it's 
  a valid Ethereum address format (0x + 40 hex characters) but I have no idea if it's an active HyperLiquid trader.   
                                                                                                                      
  That's why when we tested it, it returned all zeros - that wallet likely has no trading activity on HyperLiquid in
  that date range.                                                                                                    
                                                            
  To get meaningful results, you'd need a wallet address that actually trades on HyperLiquid. You can find active ones
   from:                                                    
  - HyperLiquid's leaderboard
  - Any on-chain explorer showing HyperLiquid activity
```

Calculates daily PnL breakdown for a HyperLiquid wallet.

**Path Parameters:**
- `wallet` - Ethereum wallet address (0x + 40 hex chars)

**Query Parameters:**
- `start` - Start date (YYYY-MM-DD)
- `end` - End date (YYYY-MM-DD, max 90 days from start)

**Example:**
```bash
curl "http://localhost:3000/api/hyperliquid/0xE7bAC70aDA3a5AeF1e1a1fBe68D3dDfcFc18E892/pnl?start=2025-08-01&end=2025-08-03"
```

**Response:**
```json
{
  "wallet": "0xE7bAC70aDA3a5AeF1e1a1fBe68D3dDfcFc18E892",
  "start": "2025-08-01",
  "end": "2025-08-03",
  "daily": [
    {
      "date": "2025-08-01",
      "realized_pnl_usd": 120.5,
      "unrealized_pnl_usd": -15.3,
      "fees_usd": 2.1,
      "funding_usd": -0.5,
      "net_pnl_usd": 102.6,
      "equity_usd": 10102.6
    }
  ],
  "summary": {
    "total_realized_usd": 120.5,
    "total_unrealized_usd": -15.3,
    "total_fees_usd": 2.1,
    "total_funding_usd": -0.5,
    "net_pnl_usd": 102.6
  },
  "diagnostics": {
    "data_source": "hyperliquid_api",
    "last_api_call": "2025-09-22T12:00:00Z",
    "notes": "PnL calculated using daily close prices",
    "fills_count": 5,
    "funding_events_count": 3
  }
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
  index.ts              # Entry point
  app.ts                # Express app factory
  config/               # Environment configuration
  middleware/            # Error handler, validation, rate limiter
  routes/               # API route definitions
  controllers/          # Request handlers
  services/             # Business logic
    coingecko.service.ts
    ai.service.ts
    prompt.service.ts
    hyperliquid/
      client.ts         # HyperLiquid API client
      pnl.service.ts    # PnL calculation engine
  types/                # TypeScript interfaces
  utils/                # Errors, logger, retry
tests/
  unit/                 # Unit tests
  integration/          # API integration tests
```

## Error Handling

All errors return a consistent JSON format:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Token 'foobar' not found"
  }
}
```

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request parameters |
| 404 | RESOURCE_NOT_FOUND | Token not found on CoinGecko |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 502 | EXTERNAL_API_ERROR | External API failure |
| 502 | AI_RESPONSE_ERROR | AI returned invalid response |
