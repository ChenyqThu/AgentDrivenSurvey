import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { surveys } from '@/lib/db/schema';
import { getNotionClient, withRetry } from '@/lib/notion/client';
import type { SurveySettings } from '@/lib/survey/types';
import type { NotionConfig } from '@/lib/notion/types';

// PUT /api/surveys/[id]/notion — Configure Notion integration
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pageId, autoSync } = body as { pageId: string; autoSync?: boolean };

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    // Verify survey exists
    const [survey] = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, id))
      .limit(1);

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Validate pageId by retrieving the page
    const notion = getNotionClient();
    let pageTitle = '';
    try {
      const page = await withRetry(() => notion.pages.retrieve({ page_id: pageId }));
      // Extract page title
      if ('properties' in page) {
        const titleProp = Object.values(page.properties).find(
          (p) => (p as { type: string }).type === 'title'
        );
        if (titleProp && 'title' in titleProp) {
          pageTitle = (titleProp.title as { plain_text: string }[])
            .map((t) => t.plain_text)
            .join('');
        }
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid pageId or insufficient permissions. Make sure the Notion integration has access to this page.' },
        { status: 400 }
      );
    }

    // Save notionConfig into survey settings
    const settings = (survey.settings ?? {}) as SurveySettings & { notionConfig?: NotionConfig };
    const existingConfig = settings.notionConfig;

    const notionConfig: NotionConfig = {
      pageId,
      autoSync: autoSync ?? false,
      // Preserve existing fields if reconfiguring
      databaseId: existingConfig?.pageId === pageId ? existingConfig?.databaseId : undefined,
      syncedSessionIds: existingConfig?.pageId === pageId ? existingConfig?.syncedSessionIds : [],
      lastSyncedAt: existingConfig?.lastSyncedAt,
    };

    await db
      .update(surveys)
      .set({
        settings: { ...settings, notionConfig } as unknown as Record<string, unknown>,
      })
      .where(eq(surveys.id, id));

    return NextResponse.json({ success: true, pageTitle });
  } catch (error) {
    console.error('PUT /api/surveys/[id]/notion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
