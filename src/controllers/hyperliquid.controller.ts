import { Request, Response, NextFunction } from 'express';
import * as pnlService from '../services/hyperliquid/pnl.service.js';

export async function getDailyPnL(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const wallet = req.params.wallet as string;
    const start = req.query.start as string;
    const end = req.query.end as string;

    const result = await pnlService.calculateDailyPnL(wallet, start, end);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
