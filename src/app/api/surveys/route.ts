import { NextResponse } from 'next/server';
import { createSurvey, listSurveys } from '@/lib/survey/manager';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, rawInput, context, settings } = body;

    const surveyId = await createSurvey({
      title,
      description,
      rawInput,
      context,
      settings,
      createdBy: null,
    });

    return NextResponse.json({ id: surveyId, title, status: 'draft' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/surveys error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const surveys = await listSurveys();
    return NextResponse.json(surveys);
  } catch (error) {
    console.error('GET /api/surveys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
