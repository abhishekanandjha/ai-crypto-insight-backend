import axios from 'axios';
import * as coingeckoService from '../../../src/services/coingecko.service.js';
import { NotFoundError, RateLimitError } from '../../../src/utils/errors.js';

jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockInstance),
      isAxiosError: jest.requireActual('axios').isAxiosError,
    },
    isAxiosError: jest.requireActual('axios').isAxiosError,
  };
});

const mockAxiosInstance = (axios.create as jest.Mock)();

const MOCK_COIN_RESPONSE = {
  data: {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    market_cap_rank: 1,
    market_data: {
      current_price: { usd: 65000 },
      market_cap: { usd: 1200000000000 },
      total_volume: { usd: 30000000000 },
      price_change_percentage_24h: 2.5,
      price_change_percentage_7d: -1.2,
      price_change_percentage_30d: 5.0,
      circulating_supply: 19500000,
      max_supply: 21000000,
      high_24h: { usd: 66000 },
      low_24h: { usd: 64000 },
    },
  },
};

describe('CoinGecko Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTokenData', () => {
    it('should fetch and transform token data correctly', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce(MOCK_COIN_RESPONSE);

      const result = await coingeckoService.getTokenData('bitcoin', 'usd');

      expect(result).toEqual({
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        currentPrice: 65000,
        marketCap: 1200000000000,
        totalVolume: 30000000000,
        priceChange24h: 2.5,
        priceChange7d: -1.2,
        priceChange30d: 5.0,
        circulatingSupply: 19500000,
        maxSupply: 21000000,
        high24h: 66000,
        low24h: 64000,
        marketCapRank: 1,
      });
    });

    it('should throw NotFoundError for unknown token', async () => {
      const error = new Error('Not found') as any;
      error.response = { status: 404 };
      error.isAxiosError = true;
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      // The function uses axios.isAxiosError which checks for the isAxiosError property
      await expect(
        coingeckoService.getTokenData('unknown-token', 'usd'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw RateLimitError on 429', async () => {
      const error = new Error('Rate limited') as any;
      error.response = { status: 429 };
      error.isAxiosError = true;
      // Mock for all retry attempts (initial + 3 retries)
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(
        coingeckoService.getTokenData('bitcoin', 'usd'),
      ).rejects.toThrow(RateLimitError);
    });
  });

  describe('getMarketChart', () => {
    it('should fetch and return market chart data', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          prices: [[1700000000000, 65000], [1700100000000, 65500]],
          total_volumes: [[1700000000000, 30000000000], [1700100000000, 31000000000]],
        },
      });

      const result = await coingeckoService.getMarketChart('bitcoin', 'usd', 7);

      expect(result.prices).toHaveLength(2);
      expect(result.volumes).toHaveLength(2);
    });
  });

  describe('getTokenInsightData', () => {
    it('should return data without chart when historyDays is 0', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce(MOCK_COIN_RESPONSE);

      const result = await coingeckoService.getTokenInsightData('bitcoin', 'usd', 0);

      expect(result.id).toBe('bitcoin');
      expect(result.marketChart).toBeUndefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should return data with chart when historyDays > 0', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce(MOCK_COIN_RESPONSE)
        .mockResolvedValueOnce({
          data: {
            prices: [[1700000000000, 65000]],
            total_volumes: [[1700000000000, 30000000000]],
          },
        });

      const result = await coingeckoService.getTokenInsightData('bitcoin', 'usd', 30);

      expect(result.id).toBe('bitcoin');
      expect(result.marketChart).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });
  });
});
