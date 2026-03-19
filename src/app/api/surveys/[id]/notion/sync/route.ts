import { NextResponse } from 'next/server';
import { syncAllSessions } from '@/lib/notion/sync';

// POST /api/surveys/[id]/notion/sync — Trigger sync
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const incremental = (body as { incremental?: boolean }).incremental !== false;

    const result = await syncAllSessions(id, incremental);

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/surveys/[id]/notion/sync error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
