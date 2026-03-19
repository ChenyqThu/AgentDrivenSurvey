import { NextResponse } from 'next/server';
import { updateSchema, getSurvey } from '@/lib/survey/manager';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { schema } = body;

    await updateSchema(id, schema);

    const updatedSurvey = await getSurvey(id);

    if (!updatedSurvey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSurvey);
  } catch (error) {
    console.error('PUT /api/surveys/[id]/schema error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
