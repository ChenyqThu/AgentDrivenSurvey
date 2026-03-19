import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { surveys, sessions, messages, extractedData } from '@/lib/db/schema';
import { getProvider, DEFAULT_MODEL } from '@/lib/llm/client';
import type { StreamEvent } from '@/lib/llm/provider';
import { interviewTools } from '@/lib/conversation/tools';
import { buildSystemPrompt } from '@/lib/conversation/prompt-builder';
import { createInitialState, updateQuestionState } from '@/lib/conversation/state';
import type { ConversationState, ExtractedField, ProgressUpdate } from '@/lib/conversation/types';
import type { SurveyContext, SurveySettings, SurveySchema, SurveyAgent } from '@/lib/survey/types';
import type { LLMConfig } from '@/lib/llm/config';

// SSE encoding helper
function encodeSSE(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function createSession(
  surveyId: string,
  respondentId?: string
): Promise<string> {
  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1);

  if (!survey) {
    throw new Error(`Survey ${surveyId} not found`);
  }
  if (survey.status !== 'active') {
    throw new Error(`Survey ${surveyId} is not active (status: ${survey.status})`);
  }

  // Handle both SurveyAgent and legacy SurveySchema formats
  const rawSchema = survey.schema as Record<string, unknown>;
  const surveySchema = rawSchema && 'promptTemplate' in rawSchema
    ? (rawSchema as unknown as SurveyAgent).schema
    : (rawSchema as unknown as SurveySchema);
  const initialState = createInitialState(surveySchema);

  const rid = respondentId ?? `anon_${Date.now()}`;

  const [session] = await db
    .insert(sessions)
    .values({
      surveyId,
      respondentId: rid,
      state: initialState,
    })
    .returning({ id: sessions.id });

  return session.id;
}

export async function getSession(
  sessionId: string
): Promise<{ session: typeof sessions.$inferSelect; messages: typeof messages.$inferSelect[]; survey: typeof surveys.$inferSelect } | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, session.surveyId))
    .limit(1);

  if (!survey) return null;

  const sessionMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.sequence);

  return { session, messages: sessionMessages, survey };
}

export async function handleMessage(
  sessionId: string,
  userMessage: string,
  isCardInteraction = false
): Promise<ReadableStream<Uint8Array>> {
  // 1. Load session with survey
  const data = await getSession(sessionId);
  if (!data) {
    throw new Error(`Session ${sessionId} not found`);
  }
  const { session, messages: history, survey } = data;

  // 2. Load extracted data for this session
  const rawExtracted = await db
    .select()
    .from(extractedData)
    .where(eq(extractedData.sessionId, sessionId));

  const extractedFields: ExtractedField[] = rawExtracted.map((row) => ({
    sectionId: row.sectionId,
    fieldKey: row.fieldKey,
    value: row.fieldValue,
    confidence: row.confidence ?? 0,
    sourceMessageId: row.sourceMessageId ?? undefined,
  }));

  // 3. Build system prompt
  // survey.schema stores either a SurveySchema (legacy) or a full SurveyAgent
  const rawSchema = survey.schema as Record<string, unknown>;
  const isAgent = rawSchema && 'promptTemplate' in rawSchema;
  const agent = isAgent ? (rawSchema as unknown as SurveyAgent) : null;
  const schema = agent ? agent.schema : (rawSchema as unknown as SurveySchema);

  const context = survey.context as SurveyContext;
  const settings = survey.settings as SurveySettings;
  const state = (session.state as ConversationState) ?? createInitialState(schema);

  const systemPrompt = buildSystemPrompt({
    survey: {
      title: survey.title,
      description: survey.description ?? null,
      context,
      settings,
      schema,
    },
    state,
    extractedData: extractedFields,
    agentConfig: agent ? {
      promptTemplate: agent.promptTemplate,
      behavior: agent.behavior,
      interactiveSkills: agent.interactiveSkills,
    } : undefined,
  });

  // 4. Build message history for the LLM
  //    For card interactions, format as a structured user message the LLM can understand
  const llmUserMessage = isCardInteraction
    ? formatCardInteractionMessage(userMessage)
    : userMessage;

  const llmMessages = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  llmMessages.push({ role: 'user', content: llmUserMessage });

  // 5. Save user message first (get next sequence number)
  const nextSeq = history.length > 0 ? Math.max(...history.map((m) => m.sequence)) + 1 : 1;

  const [savedUserMsg] = await db
    .insert(messages)
    .values({
      sessionId,
      role: 'user',
      content: llmUserMessage,
      sequence: nextSeq,
    })
    .returning({ id: messages.id });

  // 6. Resolve LLM provider (use survey-level llmConfig override if present)
  const surveyLLMConfig = (settings as SurveySettings & { llmConfig?: Partial<LLMConfig> }).llmConfig;
  const provider = getProvider(surveyLLMConfig);

  // Enable prompt caching for Anthropic provider
  const cacheConfig = {
    cacheSystemPrompt: true,
    cacheTools: true,
  };

  const stream = provider.stream({
    model: DEFAULT_MODEL,
    systemPrompt,
    messages: llmMessages,
    tools: interviewTools,
    cacheConfig,
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantText = '';
      let currentState = state;

      // Track tool use blocks by index
      const toolBlocks: Record<number, { name: string; inputJson: string }> = {};

      try {
        for await (const event of stream as AsyncIterable<StreamEvent>) {
          if (event.type === 'tool_use_start') {
            const idx = event.index ?? 0;
            toolBlocks[idx] = { name: event.toolName ?? '', inputJson: '' };
          } else if (event.type === 'text_delta') {
            if (event.text) {
              assistantText += event.text;
              controller.enqueue(encodeSSE({ type: 'text', content: event.text }));
            }
          } else if (event.type === 'tool_input_delta') {
            const idx = event.index ?? 0;
            if (toolBlocks[idx] && event.partialJson) {
              toolBlocks[idx].inputJson += event.partialJson;
            }
          } else if (event.type === 'tool_use_end') {
            const idx = event.index ?? 0;
            const block = toolBlocks[idx];
            if (block) {
              let input: Record<string, unknown> = {};
              try {
                input = JSON.parse(block.inputJson || '{}');
              } catch {
                input = {};
              }

              if (block.name === 'extract_data') {
                // Upsert to extracted_data table
                const sectionId = input.section_id as string;
                const fieldKey = input.field_key as string;
                const value = input.value;
                const confidence = (input.confidence as number) ?? 0;

                // Check if exists
                const [existing] = await db
                  .select({ id: extractedData.id })
                  .from(extractedData)
                  .where(
                    and(
                      eq(extractedData.sessionId, sessionId),
                      eq(extractedData.sectionId, sectionId),
                      eq(extractedData.fieldKey, fieldKey)
                    )
                  )
                  .limit(1);

                if (existing) {
                  await db
                    .update(extractedData)
                    .set({ fieldValue: value, confidence, sourceMessageId: savedUserMsg.id })
                    .where(eq(extractedData.id, existing.id));
                } else {
                  await db.insert(extractedData).values({
                    sessionId,
                    surveyId: session.surveyId,
                    sectionId,
                    fieldKey,
                    fieldValue: value,
                    confidence,
                    sourceMessageId: savedUserMsg.id,
                  });
                }
              } else if (block.name === 'update_progress') {
                // Update session state
                const progressUpdate: ProgressUpdate = {
                  sectionId: input.section_id as string,
                  questionId: input.question_id as string,
                  status: input.status as 'answered' | 'skipped',
                };

                currentState = updateQuestionState(
                  currentState,
                  progressUpdate.sectionId,
                  progressUpdate.questionId,
                  progressUpdate.status
                );

                await db
                  .update(sessions)
                  .set({ state: currentState })
                  .where(eq(sessions.id, sessionId));
              } else if (block.name === 'render_interactive') {
                // Emit an interactive_card SSE event for the frontend to render
                const cardId = `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                const card = {
                  id: cardId,
                  type: input.card_type as string,
                  question: input.question as string,
                  options: (input.options as string[] | undefined) ?? [],
                  config: (input.config as Record<string, unknown> | undefined) ?? {},
                };
                controller.enqueue(encodeSSE({ type: 'interactive_card', card }));
              }

              delete toolBlocks[idx];
            }
          } else if (event.type === 'message_end') {
            // Save assistant message
            await db.insert(messages).values({
              sessionId,
              role: 'assistant',
              content: assistantText,
              sequence: nextSeq + 1,
            });

            // Update last_active_at
            await db
              .update(sessions)
              .set({ lastActiveAt: new Date() })
              .where(eq(sessions.id, sessionId));

            controller.enqueue(encodeSSE({ type: 'done' }));
          }
        }
      } catch (err) {
        controller.error(err);
        return;
      }

      controller.close();
    },
  });
}

// Format a card interaction result as a readable user message for the LLM
function formatCardInteractionMessage(rawMessage: string): string {
  try {
    const parsed = JSON.parse(rawMessage) as {
      type: string;
      cardId: string;
      cardType: string;
      value: unknown;
    };
    if (parsed.type === 'card_interaction') {
      return `[Card response] Card type: ${parsed.cardType}, Value: ${JSON.stringify(parsed.value)}`;
    }
  } catch {
    // not JSON, return as-is
  }
  return rawMessage;
}
