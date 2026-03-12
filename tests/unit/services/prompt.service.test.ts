import { buildTokenInsightPrompt } from '../../../src/services/prompt.service.js';
import { TokenInsightData } from '../../../src/types/token.types.js';

describe('Prompt Service', () => {
  const mockTokenData: TokenInsightData = {
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
  };

  it('should build system and user prompts', () => {
    const { system, user } = buildTokenInsightPrompt(mockTokenData);

    expect(system).toContain('cryptocurrency market analyst');
    expect(system).toContain('JSON');
    expect(user).toContain('Bitcoin');
    expect(user).toContain('BTC');
    expect(user).toContain('65,000');
  });

  it('should include market chart data when available', () => {
    const dataWithChart: TokenInsightData = {
      ...mockTokenData,
      marketChart: {
        prices: [
          [1700000000000, 60000],
          [1700100000000, 65000],
        ],
        volumes: [
          [1700000000000, 30000000000],
          [1700100000000, 31000000000],
        ],
      },
    };

    const { user } = buildTokenInsightPrompt(dataWithChart);

    expect(user).toContain('Price History');
    expect(user).toContain('Volume Trend');
  });

  it('should handle missing maxSupply', () => {
    const dataNoMax: TokenInsightData = { ...mockTokenData, maxSupply: null };
    const { user } = buildTokenInsightPrompt(dataNoMax);

    expect(user).toContain('19,500,000');
    expect(user).not.toContain('/ null');
  });
});
