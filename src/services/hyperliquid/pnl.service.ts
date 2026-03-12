import { hyperLiquidClient } from './client.js';
import { UserFill, FundingPayment, PortfolioData } from './types.js';
import { PnLResult, DailyPnL, PnLSummary, PnLDiagnostics } from '../../types/hyperliquid.types.js';
import { ExternalAPIError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00Z');
  const endDate = new Date(end + 'T00:00:00Z');

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function groupByDay<T>(items: T[], getTime: (item: T) => number): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const day = toDateString(getTime(item));
    const arr = map.get(day) || [];
    arr.push(item);
    map.set(day, arr);
  }
  return map;
}

function extractDailyEquity(portfolio: PortfolioData): Map<string, number> {
  const equityMap = new Map<string, number>();

  for (const [, periodData] of portfolio) {
    if (!periodData?.accountValueHistory) continue;

    for (const [timestamp, value] of periodData.accountValueHistory) {
      const day = toDateString(timestamp);
      // Keep the latest value for each day
      equityMap.set(day, parseFloat(value));
    }
  }

  return equityMap;
}

function extractDailyPnLFromPortfolio(portfolio: PortfolioData): Map<string, number> {
  const pnlMap = new Map<string, number>();

  for (const [, periodData] of portfolio) {
    if (!periodData?.pnlHistory) continue;

    const history = periodData.pnlHistory;
    for (let i = 0; i < history.length; i++) {
      const [timestamp, cumulativePnl] = history[i];
      const day = toDateString(timestamp);
      const currentPnl = parseFloat(cumulativePnl);

      if (i === 0) {
        pnlMap.set(day, currentPnl);
      } else {
        const prevPnl = parseFloat(history[i - 1][1]);
        const dailyDelta = currentPnl - prevPnl;
        // Keep the latest delta for each day
        pnlMap.set(day, dailyDelta);
      }
    }
  }

  return pnlMap;
}

export async function calculateDailyPnL(
  wallet: string,
  startDate: string,
  endDate: string,
): Promise<PnLResult> {
  const startMs = new Date(startDate + 'T00:00:00Z').getTime();
  const endMs = new Date(endDate + 'T23:59:59.999Z').getTime();

  logger.info({ wallet, startDate, endDate }, 'Calculating daily PnL');

  let fills: UserFill[];
  let funding: FundingPayment[];
  let portfolio: PortfolioData;

  try {
    [fills, funding, portfolio] = await Promise.all([
      hyperLiquidClient.getAllFillsInRange(wallet, startMs, endMs),
      hyperLiquidClient.getUserFunding(wallet, startMs, endMs),
      hyperLiquidClient.getPortfolio(wallet),
    ]);
  } catch (error) {
    if (error instanceof Error) {
      throw new ExternalAPIError('HyperLiquid', 502, error.message);
    }
    throw error;
  }

  const fillsByDay = groupByDay(fills, (f) => f.time);
  const fundingByDay = groupByDay(funding, (f) => f.time);
  const dailyEquity = extractDailyEquity(portfolio);
  const dailyPortfolioPnL = extractDailyPnLFromPortfolio(portfolio);

  const dates = dateRange(startDate, endDate);
  const dailyResults: DailyPnL[] = [];

  for (const date of dates) {
    const dayFills = fillsByDay.get(date) || [];
    const dayFunding = fundingByDay.get(date) || [];

    // Realized PnL: sum of closedPnl from all fills
    const realizedPnl = dayFills.reduce(
      (sum, f) => sum + parseFloat(f.closedPnl || '0'),
      0,
    );

    // Fees: sum of fee from all fills
    const fees = dayFills.reduce(
      (sum, f) => sum + parseFloat(f.fee || '0'),
      0,
    );

    // Funding: sum of delta.usdc from funding events
    const fundingTotal = dayFunding.reduce(
      (sum, f) => sum + parseFloat(f.delta?.usdc || '0'),
      0,
    );

    // Unrealized PnL: derive from portfolio total PnL delta minus known components
    const totalDailyPnL = dailyPortfolioPnL.get(date) ?? 0;
    // total = realized + unrealized - fees + funding
    // unrealized = total - realized + fees - funding
    const unrealizedPnl = totalDailyPnL - realizedPnl + fees - fundingTotal;

    // Net PnL = realized + unrealized - fees + funding
    const netPnl = realizedPnl + unrealizedPnl - fees + fundingTotal;

    const equity = dailyEquity.get(date) ?? null;

    dailyResults.push({
      date,
      realized_pnl_usd: round2(realizedPnl),
      unrealized_pnl_usd: round2(unrealizedPnl),
      fees_usd: round2(fees),
      funding_usd: round2(fundingTotal),
      net_pnl_usd: round2(netPnl),
      equity_usd: equity !== null ? round2(equity) : null,
    });
  }

  const summary = buildSummary(dailyResults);

  const diagnostics: PnLDiagnostics = {
    data_source: 'hyperliquid_api',
    last_api_call: new Date().toISOString(),
    notes: 'PnL calculated using daily close prices. Unrealized PnL derived from portfolio history deltas.',
    fills_count: fills.length,
    funding_events_count: funding.length,
  };

  return { wallet, start: startDate, end: endDate, daily: dailyResults, summary, diagnostics };
}

function buildSummary(daily: DailyPnL[]): PnLSummary {
  return {
    total_realized_usd: round2(daily.reduce((s, d) => s + d.realized_pnl_usd, 0)),
    total_unrealized_usd: round2(daily.reduce((s, d) => s + d.unrealized_pnl_usd, 0)),
    total_fees_usd: round2(daily.reduce((s, d) => s + d.fees_usd, 0)),
    total_funding_usd: round2(daily.reduce((s, d) => s + d.funding_usd, 0)),
    net_pnl_usd: round2(daily.reduce((s, d) => s + d.net_pnl_usd, 0)),
  };
}
