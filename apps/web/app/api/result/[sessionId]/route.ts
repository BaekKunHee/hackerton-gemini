import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session-store';
import type { ApiResponse, AnalysisResult } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        },
      },
      { status: 404 }
    );
  }

  if (session.status === 'done' && session.result) {
    return NextResponse.json<ApiResponse<{ status: 'done'; result: AnalysisResult }>>({
      success: true,
      data: {
        status: 'done',
        result: session.result,
      },
    });
  }

  if (session.status === 'error') {
    return NextResponse.json<ApiResponse<{ status: 'error' }>>({
      success: true,
      data: { status: 'error' },
    });
  }

  return NextResponse.json<ApiResponse<{ status: 'analyzing' }>>({
    success: true,
    data: { status: 'analyzing' },
  });
}
