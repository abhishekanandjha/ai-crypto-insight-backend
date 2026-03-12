import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import * as tokenController from '../controllers/token.controller.js';

const router = Router();

const insightParamsSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Token ID must be lowercase alphanumeric with hyphens'),
});

const insightBodySchema = z
  .object({
    vs_currency: z.string().min(1).max(10).default('usd'),
    history_days: z.number().int().min(0).max(365).default(0),
  })
  .optional();

router.post(
  '/:id/insight',
  validateRequest({ params: insightParamsSchema, body: insightBodySchema }),
  tokenController.getInsight,
);

export default router;
