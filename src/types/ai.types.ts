export interface AIRawResponse {
  content: string;
  tokensUsed?: number;
}

export interface ValidatedInsight {
  reasoning: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface AIProvider {
  generateInsight(systemPrompt: string, userPrompt: string): Promise<AIRawResponse>;
  readonly providerName: string;
  readonly modelName: string;
}
