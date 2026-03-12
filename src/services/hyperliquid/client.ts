import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/index.js';
import { withRetry } from '../../utils/retry.js';
import {
  UserFill,
  FundingPayment,
  ClearinghouseState,
  PortfolioData,
} from './types.js';

class HyperLiquidClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.hyperliquid.baseUrl,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getClearinghouseState(wallet: string): Promise<ClearinghouseState> {
    return this.post({ type: 'clearinghouseState', user: wallet });
  }

  async getUserFillsByTime(
    wallet: string,
    startTime: number,
    endTime: number,
  ): Promise<UserFill[]> {
    return this.post({
      type: 'userFillsByTime',
      user: wallet,
      startTime,
      endTime,
      aggregateByTime: false,
    });
  }

  async getAllFillsInRange(
    wallet: string,
    startTime: number,
    endTime: number,
  ): Promise<UserFill[]> {
    const allFills: UserFill[] = [];
    let currentStart = startTime;
    const PAGE_SIZE = 2000;

    while (true) {
      const batch = await this.getUserFillsByTime(wallet, currentStart, endTime);
      allFills.push(...batch);

      if (batch.length < PAGE_SIZE) break;

      // Move start past the last fill's timestamp
      currentStart = batch[batch.length - 1].time + 1;
    }

    return allFills;
  }

  async getUserFunding(
    wallet: string,
    startTime: number,
    endTime: number,
  ): Promise<FundingPayment[]> {
    return this.post({
      type: 'userFunding',
      user: wallet,
      startTime,
      endTime,
    });
  }

  async getPortfolio(wallet: string): Promise<PortfolioData> {
    return this.post({ type: 'portfolio', user: wallet });
  }

  private async post<T>(body: Record<string, unknown>): Promise<T> {
    const response = await withRetry(() =>
      this.client.post('/info', body),
    );
    return response.data as T;
  }
}

export const hyperLiquidClient = new HyperLiquidClient();
