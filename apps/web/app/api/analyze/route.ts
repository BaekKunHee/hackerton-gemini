import { NextRequest, NextResponse } from 'next/server';
import type { AnalyzeRequest, AnalyzeResponse, ApiResponse } from '@/lib/types';
import { fetchBackend, convertKeys } from '@/lib/api/backend';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeRequest;

    // Validation
    if (!body.type || !body.content) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'type and content are required',
          },
        },
        { status: 400 }
      );
    }

    if (body.type !== 'url' && body.type !== 'text' && body.type !== 'image') {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: 'type must be "url", "text", or "image"',
          },
        },
        { status: 400 }
      );
    }

    if (body.content.trim().length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'EMPTY_CONTENT',
            message: 'content must not be empty',
          },
        },
        { status: 400 }
      );
    }

    const raw = await fetchBackend<Record<string, unknown>>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ type: body.type, content: body.content }),
    });
    const data = convertKeys(raw) as AnalyzeResponse;
    return NextResponse.json<ApiResponse<AnalyzeResponse>>({
      success: true,
      data,
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to start analysis',
        },
      },
      { status: 500 }
    );
  }
}
