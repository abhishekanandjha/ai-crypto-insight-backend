import { Router } from 'express';
import tokenRoutes from './token.routes.js';
import hyperliquidRoutes from './hyperliquid.routes.js';

const router = Router();

router.use('/token', tokenRoutes);
router.use('/hyperliquid', hyperliquidRoutes);

export default router;
