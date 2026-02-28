import { NextRequest, NextResponse } from 'next/server';
import type { ChatRequest, ChatResponse, ApiResponse } from '@/lib/types';
import { fetchBackend, convertKeys } from '@/lib/api/backend';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ChatRequest> & {
      sessionId?: string;
      message?: string;
      agreed?: boolean;
    };

    if (
      !body.sessionId ||
      (typeof body.message !== 'string' && typeof body.agreed !== 'boolean')
    ) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'sessionId and either message or agreed(boolean) are required',
          },
        },
        { status: 400 }
      );
    }

    const normalizedMessage =
      typeof body.message === 'string'
        ? body.message
        : body.agreed
          ? '네, 동의해요'
          : '아니요';
    const raw = await fetchBackend<Record<string, unknown>>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: body.sessionId,
        message: normalizedMessage,
      }),
    });
    const data = convertKeys(raw) as ChatResponse;
    return NextResponse.json<ApiResponse<ChatResponse>>({
      success: true,
      data,
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process chat message',
        },
      },
      { status: 500 }
    );
  }
}

// Handle Y/N confirmation directly
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, agreed } = body;

    if (!sessionId || typeof agreed !== 'boolean') {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'sessionId and agreed (boolean) are required',
          },
        },
        { status: 400 }
      );
    }

    const normalizedMessage = agreed ? '네, 동의해요' : '아니요';
    const raw = await fetchBackend<Record<string, unknown>>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        message: normalizedMessage,
      }),
    });
    const data = convertKeys(raw) as ChatResponse;
    return NextResponse.json<ApiResponse<ChatResponse>>({
      success: true,
      data,
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process confirmation',
        },
      },
      { status: 500 }
    );
  }
}
