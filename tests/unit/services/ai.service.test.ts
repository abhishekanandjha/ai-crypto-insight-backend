// Set env vars BEFORE any imports so the AI service picks up mock config
process.env.OPENAI_API_KEY = '';
process.env.AI_PROVIDER = 'mock';

import * as aiService from '../../../src/services/ai.service.js';

describe('AI Service', () => {
  describe('getTokenInsight', () => {
    it('should return a valid insight from mock provider', async () => {
      const result = await aiService.getTokenInsight(
        'You are a crypto analyst.',
        'Bitcoin is at $65,000.',
      );

      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('sentiment');
      expect(['Bullish', 'Bearish', 'Neutral']).toContain(result.sentiment);
      expect(result.reasoning.length).toBeGreaterThan(10);
    });

    it('should return mock provider name when no API key', () => {
      expect(aiService.getProviderName()).toBe('mock');
      expect(aiService.getModelName()).toBe('mock-fallback');
    });
  });
});
