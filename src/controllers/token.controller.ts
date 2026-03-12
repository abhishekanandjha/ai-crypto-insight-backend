import { Request, Response, NextFunction } from 'express';
import * as coingeckoService from '../services/coingecko.service.js';
import * as promptService from '../services/prompt.service.js';
import * as aiService from '../services/ai.service.js';

export async function getInsight(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { vs_currency = 'usd', history_days = 0 } = req.body || {};

    // 1. Fetch token data from CoinGecko
    const tokenData = await coingeckoService.getTokenInsightData(
      id,
      vs_currency as string,
      history_days as number,
    );

    // 2. Build prompt
    const prompt = promptService.buildTokenInsightPrompt(tokenData);

    // 3. Get AI insight
    const insight = await aiService.getTokenInsight(prompt.system, prompt.user);

    // 4. Return combined response
    res.json({
      source: 'coingecko',
      token: {
        id: tokenData.id,
        symbol: tokenData.symbol,
        name: tokenData.name,
        market_data: {
          current_price_usd: tokenData.currentPrice,
          market_cap_usd: tokenData.marketCap,
          total_volume_usd: tokenData.totalVolume,
          price_change_percentage_24h: tokenData.priceChange24h,
        },
      },
      insight: {
        reasoning: insight.reasoning,
        sentiment: insight.sentiment,
      },
      model: {
        provider: aiService.getProviderName(),
        model: aiService.getModelName(),
      },
    });
  } catch (error) {
    next(error);
  }
}
