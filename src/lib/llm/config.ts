export type LLMProviderType = 'anthropic' | 'anthropic-messages' | 'openai-compatible';

export interface LLMConfig {
  provider: LLMProviderType;
  baseUrl?: string;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export function getDefaultConfig(): LLMConfig {
  return {
    provider: (process.env.LLM_PROVIDER as LLMProviderType) || 'anthropic',
    baseUrl: process.env.LLM_BASE_URL || undefined,
    apiKey: process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    model: process.env.LLM_MODEL || 'claude-sonnet-4-6',
    temperature: 0.7,
    maxTokens: 4096,
  };
}

export function resolveConfig(surveyConfig?: Partial<LLMConfig>): LLMConfig {
  const defaults = getDefaultConfig();
  if (!surveyConfig) return defaults;
  return { ...defaults, ...surveyConfig };
}
