export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  totalVolume: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  circulatingSupply: number;
  maxSupply: number | null;
  high24h: number;
  low24h: number;
  marketCapRank: number;
}

export interface MarketChart {
  prices: Array<[number, number]>;
  volumes: Array<[number, number]>;
}

export interface TokenInsightData extends TokenData {
  marketChart?: MarketChart;
}
