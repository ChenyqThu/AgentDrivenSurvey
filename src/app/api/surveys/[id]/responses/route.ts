import { NextResponse } from 'next/server';
import { getSurveyResponses } from '@/lib/survey/manager';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const responses = await getSurveyResponses(id);

    if (!responses) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    return NextResponse.json(responses);
  } catch (error) {
    console.error('GET /api/surveys/[id]/responses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
