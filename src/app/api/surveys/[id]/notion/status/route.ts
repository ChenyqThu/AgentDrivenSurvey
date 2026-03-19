import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { surveys, sessions } from '@/lib/db/schema';
import type { SurveySettings } from '@/lib/survey/types';
import type { NotionConfig } from '@/lib/notion/types';

// GET /api/surveys/[id]/notion/status — Check Notion sync status
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [survey] = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, id))
      .limit(1);

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    const settings = (survey.settings ?? {}) as SurveySettings & { notionConfig?: NotionConfig };
    const notionConfig = settings.notionConfig;

    if (!notionConfig) {
      return NextResponse.json({
        configured: false,
        databaseId: null,
        autoSync: false,
        syncedSessionCount: 0,
        totalSessionCount: 0,
      });
    }

    // Count total sessions
    const allSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.surveyId, id));

    return NextResponse.json({
      configured: true,
      databaseId: notionConfig.databaseId ?? null,
      autoSync: notionConfig.autoSync,
      lastSyncedAt: notionConfig.lastSyncedAt ?? null,
      syncedSessionCount: notionConfig.syncedSessionIds?.length ?? 0,
      totalSessionCount: allSessions.length,
    });
  } catch (error) {
    console.error('GET /api/surveys/[id]/notion/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
