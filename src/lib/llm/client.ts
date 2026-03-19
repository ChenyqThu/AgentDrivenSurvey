import { createProvider, type LLMProvider, type ChatMessage, type StreamEvent, type ToolDefinition, type GenerateResult, type CacheConfig } from './provider';
import { type LLMConfig, getDefaultConfig, resolveConfig } from './config';

export type { ChatMessage, StreamEvent, ToolDefinition, GenerateResult, CacheConfig };
export type { LLMConfig };

// Singleton default provider (lazily initialized)
let defaultProvider: LLMProvider | null = null;

export function getProvider(config?: Partial<LLMConfig>): LLMProvider {
  const resolved = resolveConfig(config);
  if (!config && defaultProvider) return defaultProvider;
  const provider = createProvider(resolved);
  if (!config) defaultProvider = provider;
  return provider;
}

export const DEFAULT_MODEL = getDefaultConfig().model;

export async function generateWithTools(
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  tools: ToolDefinition[]
): Promise<GenerateResult> {
  const provider = getProvider();
  return provider.generate({ model, systemPrompt, messages, tools });
}

export function streamWithTools(
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  tools: ToolDefinition[],
  cacheConfig?: CacheConfig
): AsyncIterable<StreamEvent> {
  const provider = getProvider();
  return provider.stream({ model, systemPrompt, messages, tools, cacheConfig });
}
