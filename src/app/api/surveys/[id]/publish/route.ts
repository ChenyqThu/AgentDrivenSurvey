import { NextResponse } from 'next/server';
import { publishSurvey, getSurvey } from '@/lib/survey/manager';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await publishSurvey(id);

    const survey = await getSurvey(id);

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: survey.id,
      status: survey.status,
      link: `/s/${survey.id}`,
    });
  } catch (error) {
    console.error('POST /api/surveys/[id]/publish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
