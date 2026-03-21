import { logger } from '@/lib/logger';

export type UsageRecord = {
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  timestamp: Date
}

// Cost per 1M tokens in USD (input / output)
const MODEL_COSTS: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  'claude-sonnet-4-6': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  'claude-opus-4-5': { inputPerMillion: 15.0, outputPerMillion: 75.0 },
  'claude-sonnet-4-20250514': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  'claude-haiku-4-5': { inputPerMillion: 0.8, outputPerMillion: 4.0 },
  'claude-3-5-sonnet-20241022': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  'claude-3-5-haiku-20241022': { inputPerMillion: 0.8, outputPerMillion: 4.0 },
  'claude-3-opus-20240229': { inputPerMillion: 15.0, outputPerMillion: 75.0 },
}

const FALLBACK_COST = { inputPerMillion: 3.0, outputPerMillion: 15.0 }

export function trackUsage(
  model: string,
  inputTokens: number,
  outputTokens: number
): UsageRecord {
  const rates = MODEL_COSTS[model] ?? FALLBACK_COST
  const cost =
    (inputTokens / 1_000_000) * rates.inputPerMillion +
    (outputTokens / 1_000_000) * rates.outputPerMillion

  return {
    model,
    inputTokens,
    outputTokens,
    cost,
    timestamp: new Date(),
  }
}

export function getSessionCost(records: UsageRecord[]): number {
  return records.reduce((total, record) => total + record.cost, 0)
}

export function logUsage(sessionId: string, model: string, inputTokens: number, outputTokens: number) {
  const costs = MODEL_COSTS[model] ?? FALLBACK_COST;
  const inputCost = (inputTokens / 1_000_000) * costs.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * costs.outputPerMillion;
  const totalCost = inputCost + outputCost;

  logger.info('llm.usage', {
    sessionId,
    model,
    inputTokens,
    outputTokens,
    costUsd: Math.round(totalCost * 10000) / 10000,
  });
}
