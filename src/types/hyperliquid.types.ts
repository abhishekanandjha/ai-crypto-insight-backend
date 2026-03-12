export interface DailyPnL {
  date: string;
  realized_pnl_usd: number;
  unrealized_pnl_usd: number;
  fees_usd: number;
  funding_usd: number;
  net_pnl_usd: number;
  equity_usd: number | null;
}

export interface PnLSummary {
  total_realized_usd: number;
  total_unrealized_usd: number;
  total_fees_usd: number;
  total_funding_usd: number;
  net_pnl_usd: number;
}

export interface PnLDiagnostics {
  data_source: string;
  last_api_call: string;
  notes: string;
  fills_count: number;
  funding_events_count: number;
}

export interface PnLResult {
  wallet: string;
  start: string;
  end: string;
  daily: DailyPnL[];
  summary: PnLSummary;
  diagnostics: PnLDiagnostics;
}
