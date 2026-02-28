import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/lib/types';
import { fetchBackend, convertKeys } from '@/lib/api/backend';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    const raw = await fetchBackend<Record<string, unknown>>(`/api/result/${sessionId}`);
    const data = convertKeys(raw);
    return NextResponse.json<ApiResponse<typeof data>>({
      success: true,
      data,
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: 'BACKEND_ERROR', message: 'Failed to fetch result' } },
      { status: 502 }
    );
  }
}
