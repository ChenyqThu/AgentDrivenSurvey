import { NextResponse } from 'next/server';
import { createSession } from '@/lib/conversation/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surveyId, respondentId } = body;

    const sessionId = await createSession(surveyId, respondentId);

    return NextResponse.json({ id: sessionId }, { status: 201 });
  } catch (error) {
    console.error('POST /api/sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
