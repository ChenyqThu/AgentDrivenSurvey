import Anthropic from '@anthropic-ai/sdk';
import type { LLMConfig } from './config';
import type {
  ChatMessage,
  ToolDefinition,
  StreamEvent,
  GenerateResult,
  CacheConfig,
  LLMProvider,
} from './provider';
import { withRetry } from '@/lib/llm/retry';

function buildSystemParam(
  systemPrompt: string,
  cacheSystemPrompt: boolean
): string | Anthropic.TextBlockParam[] {
  if (!cacheSystemPrompt) {
    return systemPrompt;
  }
  return [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ];
}

function buildTools(
  tools: ToolDefinition[],
  cacheTools: boolean
): Anthropic.Tool[] {
  return tools.map((tool, idx) => {
    const isLast = idx === tools.length - 1;
    const base: Anthropic.Tool = {
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema as Anthropic.Tool['input_schema'],
    };
    if (cacheTools && isLast) {
      return { ...base, cache_control: { type: 'ephemeral' } };
    }
    return base;
  });
}

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(config: LLMConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
    });
  }

  async *stream(params: {
    model: string;
    systemPrompt: string;
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    maxTokens?: number;
    temperature?: number;
    cacheConfig?: CacheConfig;
  }): AsyncIterable<StreamEvent> {
    const { model, systemPrompt, messages, tools = [], maxTokens = 4096, temperature, cacheConfig = {} } = params;

    const systemParam = buildSystemParam(systemPrompt, cacheConfig.cacheSystemPrompt ?? false);
    const anthropicTools = buildTools(tools, cacheConfig.cacheTools ?? false);

    const createParams: Anthropic.MessageStreamParams = {
      model,
      max_tokens: maxTokens,
      system: systemParam,
      messages: messages as Anthropic.MessageParam[],
      ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    };

    const rawStream = await withRetry(() =>
      Promise.resolve(this.client.messages.stream(
        createParams as unknown as Anthropic.MessageStreamParams
      ))
    );

    // Track which indices are tool blocks
    const toolBlockIndices = new Set<number>();

    for await (const event of rawStream) {
      const type = (event as { type: string }).type;

      if (type === 'content_block_start') {
        const ev = event as {
          type: string;
          index: number;
          content_block: { type: string; name?: string };
        };
        if (ev.content_block.type === 'tool_use') {
          toolBlockIndices.add(ev.index);
          yield {
            type: 'tool_use_start',
            index: ev.index,
            toolName: ev.content_block.name ?? '',
          };
        }
      } else if (type === 'content_block_delta') {
        const ev = event as {
          type: string;
          index: number;
          delta: { type: string; text?: string; partial_json?: string };
        };
        if (ev.delta.type === 'text_delta' && ev.delta.text !== undefined) {
          yield { type: 'text_delta', text: ev.delta.text };
        } else if (ev.delta.type === 'input_json_delta' && ev.delta.partial_json !== undefined) {
          yield { type: 'tool_input_delta', index: ev.index, partialJson: ev.delta.partial_json };
        }
      } else if (type === 'content_block_stop') {
        const ev = event as { type: string; index: number };
        if (toolBlockIndices.has(ev.index)) {
          toolBlockIndices.delete(ev.index);
          yield { type: 'tool_use_end', index: ev.index };
        }
      } else if (type === 'message_stop') {
        yield { type: 'message_end' };
      }
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

    const anthropicTools = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema as Anthropic.Tool['input_schema'],
    }));

    const response = await withRetry(() =>
      this.client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages as Anthropic.MessageParam[],
        ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
      })
    );

    const content: GenerateResult['content'] = response.content.map((block) => {
      if (block.type === 'text') {
        return { type: 'text' as const, text: block.text };
      }
      if (block.type === 'tool_use') {
        return {
          type: 'tool_use' as const,
          name: block.name,
          input: block.input as Record<string, unknown>,
        };
      }
      throw new Error(`Unexpected content block type: ${(block as { type: string }).type}`);
    });

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
