import { calculateDailyPnL } from '../../../../src/services/hyperliquid/pnl.service.js';
import { hyperLiquidClient } from '../../../../src/services/hyperliquid/client.js';

jest.mock('../../../../src/services/hyperliquid/client.js', () => ({
  hyperLiquidClient: {
    getAllFillsInRange: jest.fn(),
    getUserFunding: jest.fn(),
    getPortfolio: jest.fn(),
  },
}));

const mockClient = hyperLiquidClient as jest.Mocked<typeof hyperLiquidClient>;

describe('PnL Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty daily array for wallet with no activity', async () => {
    mockClient.getAllFillsInRange.mockResolvedValue([]);
    mockClient.getUserFunding.mockResolvedValue([]);
    mockClient.getPortfolio.mockResolvedValue([]);

    const result = await calculateDailyPnL(
      '0x1234567890abcdef1234567890abcdef12345678',
      '2025-08-01',
      '2025-08-03',
    );

    expect(result.wallet).toBe('0x1234567890abcdef1234567890abcdef12345678');
    expect(result.start).toBe('2025-08-01');
    expect(result.end).toBe('2025-08-03');
    expect(result.daily).toHaveLength(3); // 3 days in range
    expect(result.daily[0].realized_pnl_usd).toBe(0);
    expect(result.daily[0].fees_usd).toBe(0);
    expect(result.summary.net_pnl_usd).toBe(0);
  });

  it('should calculate realized PnL from fills', async () => {
    const fills = [
      {
        coin: 'ETH',
        px: '2000',
        sz: '1',
        side: 'A' as const,
        time: new Date('2025-08-01T10:00:00Z').getTime(),
        startPosition: '1',
        dir: 'Close Long',
        closedPnl: '120.5',
        hash: '0xabc',
        oid: 1,
        crossed: false,
        fee: '2.1',
        feeToken: 'USDC',
        tid: 1,
      },
    ];

    mockClient.getAllFillsInRange.mockResolvedValue(fills);
    mockClient.getUserFunding.mockResolvedValue([]);
    mockClient.getPortfolio.mockResolvedValue([]);

    const result = await calculateDailyPnL(
      '0x1234567890abcdef1234567890abcdef12345678',
      '2025-08-01',
      '2025-08-01',
    );

    expect(result.daily).toHaveLength(1);
    expect(result.daily[0].realized_pnl_usd).toBe(120.5);
    expect(result.daily[0].fees_usd).toBe(2.1);
    expect(result.summary.total_realized_usd).toBe(120.5);
    expect(result.summary.total_fees_usd).toBe(2.1);
  });

  it('should calculate funding from funding events', async () => {
    const funding = [
      {
        time: new Date('2025-08-01T08:00:00Z').getTime(),
        hash: '0xdef',
        delta: {
          type: 'funding' as const,
          coin: 'ETH',
          usdc: '-0.5',
          szi: '1',
          fundingRate: '0.0001',
          nSamples: null,
        },
      },
    ];

    mockClient.getAllFillsInRange.mockResolvedValue([]);
    mockClient.getUserFunding.mockResolvedValue(funding);
    mockClient.getPortfolio.mockResolvedValue([]);

    const result = await calculateDailyPnL(
      '0x1234567890abcdef1234567890abcdef12345678',
      '2025-08-01',
      '2025-08-01',
    );

    expect(result.daily[0].funding_usd).toBe(-0.5);
    expect(result.summary.total_funding_usd).toBe(-0.5);
  });

  it('should group fills by day correctly', async () => {
    const fills = [
      {
        coin: 'ETH',
        px: '2000',
        sz: '1',
        side: 'A' as const,
        time: new Date('2025-08-01T10:00:00Z').getTime(),
        startPosition: '1',
        dir: 'Close Long',
        closedPnl: '100',
        hash: '0x1',
        oid: 1,
        crossed: false,
        fee: '1',
        feeToken: 'USDC',
        tid: 1,
      },
      {
        coin: 'BTC',
        px: '60000',
        sz: '0.1',
        side: 'A' as const,
        time: new Date('2025-08-02T15:00:00Z').getTime(),
        startPosition: '0.1',
        dir: 'Close Long',
        closedPnl: '50',
        hash: '0x2',
        oid: 2,
        crossed: false,
        fee: '0.5',
        feeToken: 'USDC',
        tid: 2,
      },
    ];

    mockClient.getAllFillsInRange.mockResolvedValue(fills);
    mockClient.getUserFunding.mockResolvedValue([]);
    mockClient.getPortfolio.mockResolvedValue([]);

    const result = await calculateDailyPnL(
      '0x1234567890abcdef1234567890abcdef12345678',
      '2025-08-01',
      '2025-08-02',
    );

    expect(result.daily).toHaveLength(2);
    expect(result.daily[0].realized_pnl_usd).toBe(100);
    expect(result.daily[0].fees_usd).toBe(1);
    expect(result.daily[1].realized_pnl_usd).toBe(50);
    expect(result.daily[1].fees_usd).toBe(0.5);
    expect(result.summary.total_realized_usd).toBe(150);
  });

  it('should include diagnostics', async () => {
    mockClient.getAllFillsInRange.mockResolvedValue([]);
    mockClient.getUserFunding.mockResolvedValue([]);
    mockClient.getPortfolio.mockResolvedValue([]);

    const result = await calculateDailyPnL(
      '0x1234567890abcdef1234567890abcdef12345678',
      '2025-08-01',
      '2025-08-01',
    );

    expect(result.diagnostics.data_source).toBe('hyperliquid_api');
    expect(result.diagnostics.last_api_call).toBeDefined();
    expect(result.diagnostics.fills_count).toBe(0);
    expect(result.diagnostics.funding_events_count).toBe(0);
  });
});
