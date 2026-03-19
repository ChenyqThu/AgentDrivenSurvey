import { NextResponse } from 'next/server';
import { getSession } from '@/lib/conversation/engine';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getSession(id);

    if (!data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { session, messages, survey } = data;

    return NextResponse.json({ session, messages, survey });
  } catch (error) {
    console.error('GET /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
