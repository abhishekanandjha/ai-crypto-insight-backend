import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import * as hyperliquidController from '../controllers/hyperliquid.controller.js';

const router = Router();

const pnlParamsSchema = z.object({
  wallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address'),
});

const pnlQuerySchema = z
  .object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start must be YYYY-MM-DD'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end must be YYYY-MM-DD'),
  })
  .refine(
    (data) => new Date(data.start) <= new Date(data.end),
    { message: 'start date must be before or equal to end date' },
  )
  .refine(
    (data) => {
      const diffMs = new Date(data.end).getTime() - new Date(data.start).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 90;
    },
    { message: 'Date range must not exceed 90 days' },
  );

router.get(
  '/:wallet/pnl',
  validateRequest({ params: pnlParamsSchema, query: pnlQuerySchema }),
  hyperliquidController.getDailyPnL,
);

export default router;
