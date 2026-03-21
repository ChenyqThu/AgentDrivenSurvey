import type { LLMConfig } from './config';
import type {
  ChatMessage,
  ToolDefinition,
  StreamEvent,
  GenerateResult,
  LLMProvider,
} from './provider';
import { withRetry } from '@/lib/llm/retry';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAIFunction {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

interface OpenAITool {
  type: 'function';
  function: OpenAIFunction;
}

interface OpenAIDelta {
  role?: string;
  content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: string;
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
}

interface OpenAIStreamChunk {
  choices: Array<{
    index: number;
    delta: OpenAIDelta;
    finish_reason: string | null;
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: OpenAIToolCall[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

function buildOpenAIMessages(systemPrompt: string, messages: ChatMessage[]): OpenAIMessage[] {
  const result: OpenAIMessage[] = [{ role: 'system', content: systemPrompt }];
  for (const m of messages) {
    result.push({ role: m.role, content: m.content });
  }
  return result;
}

function buildOpenAITools(tools: ToolDefinition[]): OpenAITool[] {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}

async function fetchWithStatus(url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const err = new Error(`OpenAI-compatible API error: ${response.status} ${response.statusText} - ${body}`) as Error & { status: number };
    err.status = response.status;
    throw err;
  }
  return response;
}

export class OpenAIProvider implements LLMProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: LLMConfig) {
    this.baseUrl = (config.baseUrl ?? 'https://api.openai.com').replace(/\/$/, '');
    this.apiKey = config.apiKey ?? '';
  }

  async *stream(params: {
    model: string;
    systemPrompt: string;
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    maxTokens?: number;
    temperature?: number;
  }): AsyncIterable<StreamEvent> {
    const { model, systemPrompt, messages, tools = [], maxTokens = 4096, temperature } = params;

    const openAIMessages = buildOpenAIMessages(systemPrompt, messages);
    const openAITools = buildOpenAITools(tools);

    const body: Record<string, unknown> = {
      model,
      messages: openAIMessages,
      max_tokens: maxTokens,
      stream: true,
    };
    if (temperature !== undefined) body.temperature = temperature;
    if (openAITools.length > 0) body.tools = openAITools;

    const response = await withRetry(() =>
      fetchWithStatus(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      })
    );

    const reader = response.body?.getReader();
    if (!reader) throw new Error('OpenAI-compatible provider: response body is null');

    const decoder = new TextDecoder();
    let buffer = '';

    // Track accumulated tool call state by index
    const toolCallState: Record<number, { id: string; name: string; argsJson: string }> = {};
    // Track which tool call indices have been started (yielded tool_use_start)
    const startedToolCalls = new Set<number>();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') {
            if (trimmed === 'data: [DONE]') {
              yield { type: 'message_end' };
            }
            continue;
          }
          if (!trimmed.startsWith('data: ')) continue;

          let chunk: OpenAIStreamChunk;
          try {
            chunk = JSON.parse(trimmed.slice(6)) as OpenAIStreamChunk;
          } catch {
            continue;
          }

          const choice = chunk.choices[0];
          if (!choice) continue;

          const delta = choice.delta;

          // Text content
          if (delta.content) {
            yield { type: 'text_delta', text: delta.content };
          }

          // Tool calls
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index;
              if (!toolCallState[idx]) {
                toolCallState[idx] = { id: tc.id ?? '', name: '', argsJson: '' };
              }
              if (tc.function?.name) {
                toolCallState[idx].name += tc.function.name;
              }
              if (tc.function?.arguments) {
                toolCallState[idx].argsJson += tc.function.arguments;
              }
              if (tc.id) {
                toolCallState[idx].id = tc.id;
              }

              // Emit tool_use_start once we have a name
              if (!startedToolCalls.has(idx) && toolCallState[idx].name) {
                startedToolCalls.add(idx);
                yield {
                  type: 'tool_use_start',
                  index: idx,
                  toolName: toolCallState[idx].name,
                };
              }

              // Emit partial JSON delta if arguments arrived
              if (tc.function?.arguments) {
                yield {
                  type: 'tool_input_delta',
                  index: idx,
                  partialJson: tc.function.arguments,
                };
              }
            }
          }

          // Finish reason: emit tool_use_end for any pending tool calls
          if (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'stop') {
            for (const idx of startedToolCalls) {
              yield { type: 'tool_use_end', index: idx };
            }
            startedToolCalls.clear();
            yield { type: 'message_end' };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async generate(params: {
    model: string;
    systemPrompt: string;
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<GenerateResult> {
    const { model, systemPrompt, messages, tools = [], maxTokens = 4096, temperature } = params;

    const openAIMessages = buildOpenAIMessages(systemPrompt, messages);
    const openAITools = buildOpenAITools(tools);

    const body: Record<string, unknown> = {
      model,
      messages: openAIMessages,
      max_tokens: maxTokens,
    };
    if (temperature !== undefined) body.temperature = temperature;
    if (openAITools.length > 0) body.tools = openAITools;

    const response = await withRetry(() =>
      fetchWithStatus(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      })
    );

    const data = (await response.json()) as OpenAIResponse;
    const choice = data.choices[0];
    if (!choice) throw new Error('OpenAI-compatible provider: no choices in response');

    const content: GenerateResult['content'] = [];
    const msg = choice.message;

    if (msg.content) {
      content.push({ type: 'text', text: msg.content });
    }

    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
        } catch {
          input = {};
        }
        content.push({ type: 'tool_use', name: tc.function.name, input });
      }
    }

    return {
      content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
    };
  }
}
