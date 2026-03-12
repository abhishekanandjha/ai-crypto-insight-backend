import axios from 'axios';
import { config } from '../config/index.js';
import { TokenData, MarketChart, TokenInsightData } from '../types/token.types.js';
import { NotFoundError, ExternalAPIError, RateLimitError } from '../utils/errors.js';
import { withRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';

const client = axios.create({
  baseURL: config.coingecko.baseUrl,
  timeout: 10000,
});

export async function getTokenData(tokenId: string, vsCurrency: string): Promise<TokenData> {
  try {
    const response = await withRetry(() =>
      client.get(`/coins/${tokenId}`, {
        params: {
          localization: false,
          tickers: false,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
      }),
    );

    const data = response.data;
    const md = data.market_data;

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      currentPrice: md.current_price?.[vsCurrency] ?? 0,
      marketCap: md.market_cap?.[vsCurrency] ?? 0,
      totalVolume: md.total_volume?.[vsCurrency] ?? 0,
      priceChange24h: md.price_change_percentage_24h ?? 0,
      priceChange7d: md.price_change_percentage_7d ?? 0,
      priceChange30d: md.price_change_percentage_30d ?? 0,
      circulatingSupply: md.circulating_supply ?? 0,
      maxSupply: md.max_supply ?? null,
      high24h: md.high_24h?.[vsCurrency] ?? 0,
      low24h: md.low_24h?.[vsCurrency] ?? 0,
      marketCapRank: data.market_cap_rank ?? 0,
    };
  } catch (error) {
    handleCoinGeckoError(error, tokenId);
  }
}

export async function getMarketChart(
  tokenId: string,
  vsCurrency: string,
  days: number,
): Promise<MarketChart> {
  try {
    const response = await withRetry(() =>
      client.get(`/coins/${tokenId}/market_chart`, {
        params: { vs_currency: vsCurrency, days },
      }),
    );

    return {
      prices: response.data.prices,
      volumes: response.data.total_volumes,
    };
  } catch (error) {
    handleCoinGeckoError(error, tokenId);
  }
}

export async function getTokenInsightData(
  tokenId: string,
  vsCurrency: string,
  historyDays?: number,
): Promise<TokenInsightData> {
  logger.info({ tokenId, vsCurrency, historyDays }, 'Fetching token insight data');

  if (historyDays && historyDays > 0) {
    const [tokenData, marketChart] = await Promise.all([
      getTokenData(tokenId, vsCurrency),
      getMarketChart(tokenId, vsCurrency, historyDays),
    ]);
    return { ...tokenData, marketChart };
  }

  const tokenData = await getTokenData(tokenId, vsCurrency);
  return tokenData;
}

function handleCoinGeckoError(error: unknown, tokenId: string): never {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      throw new NotFoundError('Token', tokenId);
    }
    if (error.response?.status === 429) {
      throw new RateLimitError('CoinGecko');
    }
    throw new ExternalAPIError(
      'CoinGecko',
      error.response?.status ?? 500,
      error.message,
    );
  }
  throw error;
}
