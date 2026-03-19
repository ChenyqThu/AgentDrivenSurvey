import type { LLMConfig } from './config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface StreamEvent {
  type: 'text_delta' | 'tool_use_start' | 'tool_input_delta' | 'tool_use_end' | 'message_end';
  // For text_delta
  text?: string;
  // For tool events
  index?: number;
  toolName?: string;
  partialJson?: string;
}

export interface GenerateResult {
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'tool_use'; name: string; input: Record<string, unknown> }
  >;
  usage: { inputTokens: number; outputTokens: number };
}

export interface CacheConfig {
  cacheSystemPrompt?: boolean;
  cacheTools?: boolean;
}

export interface LLMProvider {
  stream(params: {
    model: string;
    systemPrompt: string;
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    maxTokens?: number;
    temperature?: number;
    cacheConfig?: CacheConfig;
  }): AsyncIterable<StreamEvent>;

  generate(params: {
    model: string;
    systemPrompt: string;
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<GenerateResult>;
}

export function createProvider(config: LLMConfig): LLMProvider {
  if (config.provider === 'openai-compatible') {
    // Lazy import to avoid loading anthropic SDK when not needed
    const { OpenAIProvider } = require('./openai-provider') as { OpenAIProvider: new (config: LLMConfig) => LLMProvider };
    return new OpenAIProvider(config);
  }
  // Both 'anthropic' and 'anthropic-messages' use the Anthropic SDK provider
  const { AnthropicProvider } = require('./anthropic-provider') as { AnthropicProvider: new (config: LLMConfig) => LLMProvider };
  return new AnthropicProvider(config);
}
