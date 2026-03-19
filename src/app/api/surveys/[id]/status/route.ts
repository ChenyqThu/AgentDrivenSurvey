import { NextResponse } from 'next/server';
import { updateSurveyStatus, getSurvey } from '@/lib/survey/manager';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    await updateSurveyStatus(id, status);

    const updatedSurvey = await getSurvey(id);

    if (!updatedSurvey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSurvey);
  } catch (error) {
    console.error('PATCH /api/surveys/[id]/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
