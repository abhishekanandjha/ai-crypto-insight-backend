export interface UserFill {
  coin: string;
  px: string;
  sz: string;
  side: 'B' | 'A';
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  feeToken: string;
  tid: number;
  builderFee?: string;
}

export interface FundingDelta {
  type: 'funding';
  coin: string;
  usdc: string;
  szi: string;
  fundingRate: string;
  nSamples: number | null;
}

export interface FundingPayment {
  time: number;
  hash: string;
  delta: FundingDelta;
}

export interface AssetPosition {
  position: {
    coin: string;
    entryPx: string | null;
    leverage: { type: string; value: number };
    liquidationPx: string | null;
    marginUsed: string;
    positionValue: string;
    returnOnEquity: string;
    szi: string;
    unrealizedPnl: string;
    cumFunding: {
      allTime: string;
      sinceChange: string;
      sinceOpen: string;
    };
  };
  type: string;
}

export interface MarginSummary {
  accountValue: string;
  totalMarginUsed: string;
  totalNtlPos: string;
  totalRawUsd: string;
}

export interface ClearinghouseState {
  assetPositions: AssetPosition[];
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: MarginSummary;
  marginSummary: MarginSummary;
  withdrawable: string;
  time: number;
}

export interface PortfolioPeriod {
  accountValueHistory: Array<[number, string]>;
  pnlHistory: Array<[number, string]>;
  vlm: string;
}

export type PortfolioData = Array<[string, PortfolioPeriod]>;
