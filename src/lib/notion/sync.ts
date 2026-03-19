import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { surveys, sessions, extractedData } from '@/lib/db/schema';
import { getNotionClient, withRetry } from './client';
import { ensureDatabase } from './database';
import { appendConversationToPage } from './markdown';
import type { SurveySchema, SurveyAgent, SurveySettings } from '@/lib/survey/types';
import type { NotionConfig, NotionSyncResult } from './types';

const SYNC_INTERVAL_MS = 350; // ~3 req/s Notion rate limit

/**
 * Map extracted data values to Notion property values.
 */
function toNotionPropertyValue(
  value: unknown,
  type: string
): Record<string, unknown> {
  switch (type) {
    case 'number':
      return { number: typeof value === 'number' ? value : Number(value) || null };
    case 'boolean':
      return { checkbox: Boolean(value) };
    case 'string[]':
      return {
        multi_select: Array.isArray(value)
          ? (value as string[]).map((v) => ({ name: String(v) }))
          : [],
      };
    case 'object':
      return {
        rich_text: [{ text: { content: JSON.stringify(value, null, 2).slice(0, 2000) } }],
      };
    case 'string':
    default:
      return {
        rich_text: [{ text: { content: String(value ?? '').slice(0, 2000) } }],
      };
  }
}

/**
 * Sync a single session to Notion.
 */
export async function syncSession(
  surveyId: string,
  sessionId: string
): Promise<{ pageId: string }> {
  // 1. Ensure database exists
  const { databaseId } = await ensureDatabase(surveyId);

  // 2. Load survey for schema
  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1);
  if (!survey) throw new Error(`Survey ${surveyId} not found`);

  const rawSchema = survey.schema as Record<string, unknown>;
  const isAgent = rawSchema && 'promptTemplate' in rawSchema;
  const schema: SurveySchema = isAgent
    ? (rawSchema as unknown as SurveyAgent).schema
    : (rawSchema as unknown as SurveySchema);

  // 3. Load session
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  // 4. Load extracted data
  const rawExtracted = await db
    .select()
    .from(extractedData)
    .where(eq(extractedData.sessionId, sessionId));

  // 5. Build field type lookup from schema
  const fieldTypeLookup: Record<string, { sectionTitle: string; type: string }> = {};
  for (const section of schema.sections) {
    for (const question of section.questions) {
      for (const field of question.extractionFields) {
        const key = `${section.id}:${field.key}`;
        fieldTypeLookup[key] = { sectionTitle: section.title, type: field.type };
      }
    }
  }

  // 6. Build Notion properties
  const properties: Record<string, unknown> = {
    '会话 ID': {
      title: [{ text: { content: sessionId } }],
    },
    '受访者': {
      rich_text: [{ text: { content: session.respondentId ?? '' } }],
    },
    '状态': {
      select: { name: session.status },
    },
    '完成时间': session.completedAt
      ? { date: { start: session.completedAt.toISOString() } }
      : { date: null },
  };

  // Calculate average confidence
  const confidences = rawExtracted
    .map((r) => r.confidence)
    .filter((c): c is number => c !== null);
  const avgConfidence =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : null;
  properties['平均置信度'] = { number: avgConfidence };

  // Map extracted fields
  for (const row of rawExtracted) {
    const lookupKey = `${row.sectionId}:${row.fieldKey}`;
    const fieldInfo = fieldTypeLookup[lookupKey];
    if (!fieldInfo) continue;

    const propName = `${fieldInfo.sectionTitle}: ${row.fieldKey}`;
    properties[propName] = toNotionPropertyValue(row.fieldValue, fieldInfo.type);
  }

  // 7. Create Notion page (database row)
  const notion = getNotionClient();
  const page = await withRetry(() =>
    notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties as Record<string, unknown> as Parameters<typeof notion.pages.create>[0]['properties'],
    })
  );

  // 8. Append conversation to the page
  await appendConversationToPage(page.id, sessionId);

  // 9. Update syncedSessionIds in survey settings
  const settings = (survey.settings ?? {}) as SurveySettings & { notionConfig?: NotionConfig };
  const notionConfig = settings.notionConfig!;
  const syncedIds = new Set(notionConfig.syncedSessionIds ?? []);
  syncedIds.add(sessionId);

  const updatedConfig: NotionConfig = {
    ...notionConfig,
    syncedSessionIds: [...syncedIds],
    lastSyncedAt: new Date().toISOString(),
  };

  await db
    .update(surveys)
    .set({
      settings: { ...settings, notionConfig: updatedConfig } as unknown as Record<string, unknown>,
    })
    .where(eq(surveys.id, surveyId));

  return { pageId: page.id };
}

/**
 * Sync all sessions for a survey to Notion.
 */
export async function syncAllSessions(
  surveyId: string,
  incremental = true
): Promise<NotionSyncResult> {
  const { databaseId } = await ensureDatabase(surveyId);

  // Load survey for synced list
  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1);
  if (!survey) throw new Error(`Survey ${surveyId} not found`);

  const settings = (survey.settings ?? {}) as SurveySettings & { notionConfig?: NotionConfig };
  const syncedIds = new Set(settings.notionConfig?.syncedSessionIds ?? []);

  // Load all sessions
  const allSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.surveyId, surveyId));

  const toSync = incremental
    ? allSessions.filter((s) => !syncedIds.has(s.id))
    : allSessions;

  const errors: { sessionId: string; error: string }[] = [];
  let syncedCount = 0;

  for (const session of toSync) {
    try {
      await syncSession(surveyId, session.id);
      syncedCount++;
    } catch (err) {
      errors.push({
        sessionId: session.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Rate limit between sessions
    await new Promise((r) => setTimeout(r, SYNC_INTERVAL_MS));
  }

  return { success: errors.length === 0, databaseId, syncedCount, errors };
}
