import OpenAI from 'openai';
import { z } from 'zod';
import { config } from '../config/index.js';
import { AIProvider, AIRawResponse, ValidatedInsight } from '../types/ai.types.js';
import { AIResponseError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const InsightSchema = z.object({
  reasoning: z.string().min(10).max(2000),
  sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']),
});

// --- OpenAI Provider ---
class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.ai.apiKey });
  }

  get providerName(): string {
    return 'openai';
  }

  get modelName(): string {
    return config.ai.model;
  }

  async generateInsight(systemPrompt: string, userPrompt: string): Promise<AIRawResponse> {
    const response = await this.client.chat.completions.create({
      model: config.ai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: config.ai.maxTokens,
      temperature: config.ai.temperature,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AIResponseError('AI returned empty response');
    }

    return {
      content,
      tokensUsed: response.usage?.total_tokens,
    };
  }
}

// --- Mock Provider (fallback when no API key) ---
class MockAIProvider implements AIProvider {
  get providerName(): string {
    return 'mock';
  }

  get modelName(): string {
    return 'mock-fallback';
  }

  async generateInsight(_systemPrompt: string, _userPrompt: string): Promise<AIRawResponse> {
    return {
      content: JSON.stringify({
        reasoning:
          'This is a mock AI response. Configure OPENAI_API_KEY in .env for real AI analysis. Based on available market data, the token shows standard market behavior with no extreme signals.',
        sentiment: 'Neutral',
      }),
    };
  }
}

// --- AI Service ---
function createProvider(): AIProvider {
  if (config.ai.provider === 'mock' || !config.ai.apiKey) {
    if (!config.ai.apiKey) {
      logger.warn('No OPENAI_API_KEY configured, using mock AI provider');
    }
    return new MockAIProvider();
  }
  return new OpenAIProvider();
}

const provider = createProvider();

export function getProviderName(): string {
  return provider.providerName;
}

export function getModelName(): string {
  return provider.modelName;
}

export async function getTokenInsight(
  systemPrompt: string,
  userPrompt: string,
): Promise<ValidatedInsight> {
  try {
    const raw = await provider.generateInsight(systemPrompt, userPrompt);
    return parseAndValidate(raw.content);
  } catch (error) {
    // If OpenAI fails (quota, rate limit, etc.), fall back to mock
    if (!(error instanceof AIResponseError)) {
      logger.warn({ err: error }, 'AI provider failed, falling back to mock response');
      const mockProvider = new MockAIProvider();
      const raw = await mockProvider.generateInsight(systemPrompt, userPrompt);
      return parseAndValidate(raw.content);
    }
    throw error;
  }
}

function parseAndValidate(content: string): ValidatedInsight {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    // Attempt repair: strip markdown fences
    const cleaned = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    // Find JSON boundaries
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new AIResponseError('AI response is not valid JSON', content);
    }

    try {
      parsed = JSON.parse(cleaned.substring(start, end + 1));
    } catch {
      throw new AIResponseError('AI response could not be parsed as JSON', content);
    }
  }

  const result = InsightSchema.safeParse(parsed);
  if (!result.success) {
    throw new AIResponseError(
      `AI response validation failed: ${result.error.message}`,
      content,
    );
  }

  return result.data;
}
