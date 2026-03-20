import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { surveys, sessions, messages, extractedData } from '@/lib/db/schema';
import { getProvider, DEFAULT_MODEL } from '@/lib/llm/client';
import type { StreamEvent } from '@/lib/llm/provider';
import { interviewTools } from '@/lib/conversation/tools';
import { buildSystemPrompt } from '@/lib/conversation/prompt-builder';
import { createInitialState, updateQuestionState, isComplete } from '@/lib/conversation/state';
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
  // Handle auto-start trigger — used to generate AI greeting without a real user message
  const isAutoStart = userMessage.trim() === '__START__';

  const llmUserMessage = isAutoStart
    ? '[System: The user just opened the survey. Deliver your opening introduction as described in the instructions. Do NOT ask any survey questions yet.]'
    : isCardInteraction
      ? formatCardInteractionMessage(userMessage)
      : userMessage;

  const llmMessages = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  llmMessages.push({ role: 'user', content: llmUserMessage });

  // 5. Save user message first (get next sequence number)
  //    For auto-start, don't save a fake user message to the DB
  const nextSeq = history.length > 0 ? Math.max(...history.map((m) => m.sequence)) + 1 : 1;

  let savedUserMsgId: string;
  if (isAutoStart) {
    // No user message saved for auto-start — use a placeholder ID for source tracking
    savedUserMsgId = 'auto-start';
  } else {
    const [savedUserMsg] = await db
      .insert(messages)
      .values({
        sessionId,
        role: 'user',
        content: isCardInteraction ? formatCardInteractionMessage(userMessage) : userMessage,
        sequence: nextSeq,
      })
      .returning({ id: messages.id });
    savedUserMsgId = savedUserMsg.id;
  }

  // 6. Resolve LLM provider (use survey-level llmConfig override if present)
  const surveyLLMConfig = (settings as SurveySettings & { llmConfig?: Partial<LLMConfig> }).llmConfig;
  const provider = getProvider(surveyLLMConfig);

  // Enable prompt caching for Anthropic provider
  const cacheConfig = {
    cacheSystemPrompt: true,
    cacheTools: true,
  };

  // Helper: process a single LLM stream, executing tools and emitting SSE events.
  // Returns { text, hadToolCalls, state } so the caller can decide whether to continue.
  async function processStream(
    llmStream: AsyncIterable<StreamEvent>,
    controller: ReadableStreamDefaultController<Uint8Array>,
    currentState: ConversationState,
  ): Promise<{ text: string; hadToolCalls: boolean; state: ConversationState }> {
    let assistantText = '';
    let hadToolCalls = false;
    const toolBlocks: Record<number, { name: string; inputJson: string }> = {};

    for await (const event of llmStream) {
      if (event.type === 'tool_use_start') {
        const idx = event.index ?? 0;
        toolBlocks[idx] = { name: event.toolName ?? '', inputJson: '' };
        hadToolCalls = true;
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
            const sectionId = input.section_id as string;
            const fieldKey = input.field_key as string;
            const value = input.value;
            const confidence = (input.confidence as number) ?? 0;

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
                .set({ fieldValue: value, confidence, sourceMessageId: savedUserMsgId === 'auto-start' ? null : savedUserMsgId })
                .where(eq(extractedData.id, existing.id));
            } else {
              await db.insert(extractedData).values({
                sessionId,
                surveyId: session.surveyId,
                sectionId,
                fieldKey,
                fieldValue: value,
                confidence,
                sourceMessageId: savedUserMsgId === 'auto-start' ? null : savedUserMsgId,
              });
            }
          } else if (block.name === 'update_progress') {
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
      }
      // message_end is handled by the caller
    }

    return { text: assistantText, hadToolCalls, state: currentState };
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let currentState = state;
      let allAssistantText = '';
      const MAX_CONTINUATION_ROUNDS = 3;

      try {
        // Initial LLM call
        let currentMessages = [...llmMessages];
        let round = 0;

        while (round < MAX_CONTINUATION_ROUNDS) {
          round++;

          const llmStream = provider.stream({
            model: DEFAULT_MODEL,
            systemPrompt,
            messages: currentMessages,
            tools: interviewTools,
            cacheConfig,
          });

          const result = await processStream(
            llmStream as AsyncIterable<StreamEvent>,
            controller,
            currentState,
          );

          allAssistantText += result.text;
          currentState = result.state;

          // If the LLM produced text, we're done — no continuation needed
          if (result.text.trim()) {
            break;
          }

          // If the LLM only called tools with no text, do a continuation call
          // by appending a tool-results acknowledgment to prompt the LLM to continue
          if (result.hadToolCalls && !result.text.trim()) {
            currentMessages.push({
              role: 'assistant' as const,
              content: '[Tools executed: data extracted and progress updated successfully]',
            });
            currentMessages.push({
              role: 'user' as const,
              content: '[System: Your tool calls have been processed. Now please respond to the user — acknowledge their answer naturally and continue to the next question. Always include a text response.]',
            });
            continue;
          }

          // No text and no tools — nothing more to do
          break;
        }

        // Save assistant message
        const assistantSeq = isAutoStart ? 1 : nextSeq + 1;
        await db.insert(messages).values({
          sessionId,
          role: 'assistant',
          content: allAssistantText,
          sequence: assistantSeq,
        });

        // Update last_active_at
        await db
          .update(sessions)
          .set({ lastActiveAt: new Date() })
          .where(eq(sessions.id, sessionId));

        // Check if survey is complete and mark session
        if (isComplete(currentState)) {
          await db
            .update(sessions)
            .set({ status: 'completed', completedAt: new Date() })
            .where(eq(sessions.id, sessionId));

          if (settings.notionConfig?.autoSync) {
            import('@/lib/notion/sync')
              .then(({ syncSession: notionSync }) =>
                notionSync(session.surveyId, sessionId)
              )
              .catch((err) =>
                console.error('Notion auto-sync failed:', err)
              );
          }
        }

        controller.enqueue(encodeSSE({ type: 'done' }));
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
