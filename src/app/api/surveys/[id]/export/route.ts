import { NextResponse } from 'next/server';
import { exportSurveyData } from '@/lib/survey/manager';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') ?? 'json';

    const data = await exportSurveyData(id, format as 'json' | 'csv');

    if (!data) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (format === 'csv') {
      return new Response(data as string, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="survey-${id}.csv"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/surveys/[id]/export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
