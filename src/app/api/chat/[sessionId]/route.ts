import { NextResponse } from 'next/server';
import { handleMessage } from '@/lib/conversation/engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { message, isCardInteraction, isNudge } = body;

    const stream = await handleMessage(
      sessionId,
      message,
      isCardInteraction === true,
      isNudge === true,
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('POST /api/chat/[sessionId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
