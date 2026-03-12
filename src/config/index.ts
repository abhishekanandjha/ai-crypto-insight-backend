import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || '',
    maxTokens: 500,
    temperature: 0.7,
  },
  coingecko: {
    baseUrl: process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3',
  },
  hyperliquid: {
    baseUrl: process.env.HYPERLIQUID_BASE_URL || 'https://api.hyperliquid.xyz',
  },
};
