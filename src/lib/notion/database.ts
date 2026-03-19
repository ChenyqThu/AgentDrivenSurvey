import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { surveys } from '@/lib/db/schema';
import { getNotionClient, withRetry } from './client';
import { buildDatabaseProperties } from './schema-mapper';
import type { SurveySchema, SurveyAgent, SurveySettings } from '@/lib/survey/types';
import type { NotionConfig } from './types';

/**
 * Create a new Notion database under the specified page.
 * Uses initial_data_source.properties for @notionhq/client v5.13+.
 */
export async function createNotionDatabase(
  pageId: string,
  surveyTitle: string,
  schema: SurveySchema
): Promise<{ databaseId: string; warnings: string[] }> {
  const notion = getNotionClient();
  const { properties, warnings } = buildDatabaseProperties(schema);

  const response = await withRetry(() =>
    notion.databases.create({
      parent: { type: 'page_id', page_id: pageId },
      title: [{ type: 'text', text: { content: `${surveyTitle} - 调研数据` } }],
      initial_data_source: {
        properties: properties as Parameters<typeof notion.databases.create>[0]['initial_data_source'] extends { properties?: infer P } ? P : never,
      },
    })
  );

  return { databaseId: response.id, warnings };
}

/**
 * Ensure a valid Notion database exists for the survey.
 * If databaseId is stored but invalid, recreate it.
 */
export async function ensureDatabase(
  surveyId: string
): Promise<{ databaseId: string; warnings: string[] }> {
  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1);

  if (!survey) throw new Error(`Survey ${surveyId} not found`);

  const settings = (survey.settings ?? {}) as SurveySettings & { notionConfig?: NotionConfig };
  const notionConfig = settings.notionConfig;

  if (!notionConfig?.pageId) {
    throw new Error('Notion is not configured for this survey');
  }

  const rawSchema = survey.schema as Record<string, unknown>;
  const isAgent = rawSchema && 'promptTemplate' in rawSchema;
  const schema = isAgent
    ? (rawSchema as unknown as SurveyAgent).schema
    : (rawSchema as unknown as SurveySchema);

  // Try to retrieve existing database
  if (notionConfig.databaseId) {
    try {
      const notion = getNotionClient();
      await withRetry(() =>
        notion.databases.retrieve({ database_id: notionConfig.databaseId! })
      );
      return { databaseId: notionConfig.databaseId, warnings: [] };
    } catch {
      // Database was deleted or inaccessible, recreate
    }
  }

  // Create new database
  const result = await createNotionDatabase(
    notionConfig.pageId,
    survey.title,
    schema
  );

  // Save databaseId back to survey settings
  const updatedConfig: NotionConfig = {
    ...notionConfig,
    databaseId: result.databaseId,
  };
  await db
    .update(surveys)
    .set({
      settings: { ...settings, notionConfig: updatedConfig } as unknown as Record<string, unknown>,
    })
    .where(eq(surveys.id, surveyId));

  return result;
}
