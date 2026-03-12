import axios from 'axios';
import { logger } from './logger.js';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 500 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) throw error;

      // Only retry on transient errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw error; // Don't retry client errors (except rate limit)
        }
      }

      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn({ attempt: attempt + 1, delay }, 'Retrying after transient error');
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}
