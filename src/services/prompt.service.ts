import { TokenInsightData } from '../types/token.types.js';

export function buildTokenInsightPrompt(data: TokenInsightData): {
  system: string;
  user: string;
} {
  const system = `You are a cryptocurrency market analyst. Analyze the following token data and provide a concise market insight.

You MUST respond with valid JSON in exactly this format:
{
  "reasoning": "<2-4 sentence analysis of current market conditions, price action, and notable metrics>",
  "sentiment": "<one of: Bullish, Bearish, Neutral>"
}

Do not include any text outside the JSON object.`;

  let userContent = `Token: ${data.name} (${data.symbol.toUpperCase()})
Current Price (USD): $${data.currentPrice.toLocaleString()}
Market Cap: $${data.marketCap.toLocaleString()}
24h Volume: $${data.totalVolume.toLocaleString()}
Market Cap Rank: #${data.marketCapRank}
24h Price Change: ${data.priceChange24h.toFixed(2)}%
7d Price Change: ${data.priceChange7d.toFixed(2)}%
30d Price Change: ${data.priceChange30d.toFixed(2)}%
Circulating Supply: ${data.circulatingSupply.toLocaleString()}${data.maxSupply ? ` / ${data.maxSupply.toLocaleString()}` : ''}
24h Range: $${data.low24h.toLocaleString()} - $${data.high24h.toLocaleString()}`;

  if (data.marketChart && data.marketChart.prices.length > 0) {
    const prices = data.marketChart.prices.map((p) => p[1]);
    const opening = prices[0];
    const closing = prices[prices.length - 1];
    const high = Math.max(...prices);
    const low = Math.min(...prices);

    const volumes = data.marketChart.volumes.map((v) => v[1]);
    const recentVol = volumes.slice(-7);
    const olderVol = volumes.slice(0, 7);
    const avgRecent = recentVol.reduce((a, b) => a + b, 0) / recentVol.length;
    const avgOlder = olderVol.reduce((a, b) => a + b, 0) / olderVol.length;
    const volTrend =
      avgRecent > avgOlder * 1.1
        ? 'increasing'
        : avgRecent < avgOlder * 0.9
          ? 'decreasing'
          : 'stable';

    userContent += `\n\nPrice History (${data.marketChart.prices.length} data points):
Opening: $${opening.toLocaleString()}
Closing: $${closing.toLocaleString()}
Period High: $${high.toLocaleString()}
Period Low: $${low.toLocaleString()}
Volume Trend: ${volTrend}`;
  }

  return { system, user: userContent };
}
