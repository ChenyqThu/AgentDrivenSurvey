export type UsageRecord = {
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  timestamp: Date
}

// Cost per 1M tokens in USD (input / output)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'claude-opus-4-5': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5': { input: 0.8, output: 4.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
}

const FALLBACK_COST = { input: 3.0, output: 15.0 }

export function trackUsage(
  model: string,
  inputTokens: number,
  outputTokens: number
): UsageRecord {
  const rates = MODEL_COSTS[model] ?? FALLBACK_COST
  const cost =
    (inputTokens / 1_000_000) * rates.input +
    (outputTokens / 1_000_000) * rates.output

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
