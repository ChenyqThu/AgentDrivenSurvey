import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { surveys, sessions, extractedData } from '@/lib/db/schema'
import type { SurveySchema, SurveyContext, SurveySettings, SurveyAgent } from '@/lib/survey/types'
import { generateSurveySchema } from '@/lib/survey/schema-generator'
import { buildAgentConfig } from '@/lib/survey/agent-builder'

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createSurvey(params: {
  title: string
  description?: string
  rawInput: string
  context: SurveyContext
  settings?: Partial<SurveySettings>
  createdBy: string
}): Promise<string> {
  const { title, description, rawInput, context, settings, createdBy } = params

  const [inserted] = await db
    .insert(surveys)
    .values({
      title,
      description,
      rawInput,
      context: context as unknown as Record<string, unknown>,
      settings: (settings ?? {}) as unknown as Record<string, unknown>,
      status: 'draft',
      createdBy,
    })
    .returning({ id: surveys.id })

  // Step 1: Generate structured survey schema (opus)
  const schema = await generateSurveySchema(rawInput, context)

  // Step 2: Build agent config from schema (opus)
  const agentConfig = await buildAgentConfig(schema, context)

  // Combine into full SurveyAgent
  const agent: SurveyAgent = {
    schema,
    promptTemplate: agentConfig.promptTemplate,
    interactiveSkills: agentConfig.interactiveSkills,
    behavior: agentConfig.behavior,
  }

  await db
    .update(surveys)
    .set({
      schema: agent as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(surveys.id, inserted.id))

  return inserted.id
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getSurvey(id: string) {
  const [survey] = await db.select().from(surveys).where(eq(surveys.id, id))
  return survey ?? null
}

export async function listSurveys(createdBy?: string) {
  if (createdBy) {
    return db
      .select()
      .from(surveys)
      .where(eq(surveys.createdBy, createdBy))
      .orderBy(desc(surveys.createdAt))
  }
  return db.select().from(surveys).orderBy(desc(surveys.createdAt))
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateSchema(surveyId: string, schema: SurveySchema) {
  const [updated] = await db
    .update(surveys)
    .set({ schema: schema as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(surveys.id, surveyId))
    .returning()
  return updated ?? null
}

export async function publishSurvey(surveyId: string) {
  const [updated] = await db
    .update(surveys)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(surveys.id, surveyId))
    .returning()
  return updated ?? null
}

export async function updateSurveyStatus(
  surveyId: string,
  status: 'draft' | 'active' | 'paused' | 'closed'
) {
  const [updated] = await db
    .update(surveys)
    .set({ status, updatedAt: new Date() })
    .where(eq(surveys.id, surveyId))
    .returning()
  return updated ?? null
}

// ─── Responses ────────────────────────────────────────────────────────────────

export async function getSurveyResponses(surveyId: string) {
  const surveySessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.surveyId, surveyId))
    .orderBy(desc(sessions.startedAt))

  const extracted = await db
    .select()
    .from(extractedData)
    .where(eq(extractedData.surveyId, surveyId))

  return { sessions: surveySessions, extractedData: extracted }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportSurveyData(
  surveyId: string,
  format: 'json' | 'csv'
): Promise<string> {
  const rows = await db
    .select()
    .from(extractedData)
    .where(eq(extractedData.surveyId, surveyId))
    .orderBy(desc(extractedData.extractedAt))

  if (format === 'json') {
    return JSON.stringify(rows, null, 2)
  }

  // CSV: flatten JSONB fieldValue into columns
  if (rows.length === 0) {
    return 'id,sessionId,surveyId,sectionId,fieldKey,fieldValue,confidence,extractedAt\n'
  }

  const headers = [
    'id',
    'sessionId',
    'surveyId',
    'sectionId',
    'fieldKey',
    'fieldValue',
    'confidence',
    'extractedAt',
  ]

  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const str =
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    // Wrap in quotes if the value contains a comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        escape(row.id),
        escape(row.sessionId),
        escape(row.surveyId),
        escape(row.sectionId),
        escape(row.fieldKey),
        escape(row.fieldValue),
        escape(row.confidence),
        escape(row.extractedAt),
      ].join(',')
    ),
  ]

  return lines.join('\n')
}
