import supertest from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();
const request = supertest(app);

describe('API Integration Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request.get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/token/:id/insight', () => {
    it('should return 400 for invalid token id', async () => {
      const res = await request.post('/api/token/INVALID TOKEN/insight');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/hyperliquid/:wallet/pnl', () => {
    it('should return 400 for invalid wallet address', async () => {
      const res = await request.get('/api/hyperliquid/invalid-wallet/pnl?start=2025-08-01&end=2025-08-03');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing query params', async () => {
      const res = await request.get(
        '/api/hyperliquid/0x1234567890abcdef1234567890abcdef12345678/pnl',
      );

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date format', async () => {
      const res = await request.get(
        '/api/hyperliquid/0x1234567890abcdef1234567890abcdef12345678/pnl?start=invalid&end=2025-08-03',
      );

      expect(res.status).toBe(400);
    });

    it('should return 400 when start > end', async () => {
      const res = await request.get(
        '/api/hyperliquid/0x1234567890abcdef1234567890abcdef12345678/pnl?start=2025-08-05&end=2025-08-01',
      );

      expect(res.status).toBe(400);
    });
  });
});
