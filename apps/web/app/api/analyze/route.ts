import { NextRequest, NextResponse } from 'next/server';
import {
  generateSessionId,
  createSession,
  emitAgentStatus,
  emitPanelUpdate,
  emitComplete,
} from '@/lib/session-store';
import {
  demoSourceData,
  demoPerspectiveData,
  demoBiasData,
  demoResult,
} from '@/lib/demo/data';
import type { AnalyzeRequest, AnalyzeResponse, ApiResponse } from '@/lib/types';
import { isBackendMode, fetchBackend, convertKeys } from '@/lib/api/backend';

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

    if (body.type !== 'url' && body.type !== 'text') {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: 'type must be "url" or "text"',
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

    if (isBackendMode()) {
      const raw = await fetchBackend<Record<string, unknown>>('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ type: body.type, content: body.content }),
      });
      const data = convertKeys(raw) as AnalyzeResponse;
      return NextResponse.json<ApiResponse<AnalyzeResponse>>({
        success: true,
        data,
      });
    }

    // Demo mode
    const sessionId = generateSessionId();
    createSession(sessionId);
    runDemoSimulation(sessionId);

    const response: AnalyzeResponse = {
      sessionId,
      status: 'started',
      streamUrl: `/api/stream/${sessionId}`,
    };

    return NextResponse.json<ApiResponse<AnalyzeResponse>>({
      success: true,
      data: response,
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

function runDemoSimulation(sessionId: string): void {
  // Step 1: Analyzer starts thinking (0ms)
  setTimeout(() => {
    emitAgentStatus(sessionId, {
      agentId: 'analyzer',
      status: 'thinking',
      message: '콘텐츠를 분석하고 있습니다...',
      progress: 10,
    });
  }, 0);

  // Step 2: Analyzer analyzing + Source searching (500ms)
  setTimeout(() => {
    emitAgentStatus(sessionId, {
      agentId: 'analyzer',
      status: 'analyzing',
      message: '주장 구조를 파악하고 있습니다...',
      progress: 40,
    });
    emitAgentStatus(sessionId, {
      agentId: 'source',
      status: 'searching',
      message: '원본 소스를 검색하고 있습니다...',
      progress: 10,
    });
  }, 500);

  // Step 3: Source analyzing + Perspective searching (2000ms)
  setTimeout(() => {
    emitAgentStatus(sessionId, {
      agentId: 'analyzer',
      status: 'done',
      message: '분석 완료',
      progress: 100,
    });
    emitAgentStatus(sessionId, {
      agentId: 'source',
      status: 'analyzing',
      message: '인용 원본을 대조하고 있습니다...',
      progress: 50,
    });
    emitAgentStatus(sessionId, {
      agentId: 'perspective',
      status: 'searching',
      message: '다양한 관점을 수집하고 있습니다...',
      progress: 10,
    });
  }, 2000);

  // Step 4: Source done + panel_update for source (4000ms)
  setTimeout(() => {
    emitAgentStatus(sessionId, {
      agentId: 'source',
      status: 'done',
      message: '소스 검증 완료',
      progress: 100,
    });
    emitPanelUpdate(sessionId, 'source', demoSourceData);
    emitAgentStatus(sessionId, {
      agentId: 'perspective',
      status: 'analyzing',
      message: '관점 분석 중...',
      progress: 50,
    });
  }, 4000);

  // Step 5: Perspective done + panel_update for perspective (5500ms)
  setTimeout(() => {
    emitAgentStatus(sessionId, {
      agentId: 'perspective',
      status: 'done',
      message: '관점 탐색 완료',
      progress: 100,
    });
    emitPanelUpdate(sessionId, 'perspective', demoPerspectiveData);
  }, 5500);

  // Step 6: Bias panel_update (7000ms)
  setTimeout(() => {
    emitPanelUpdate(sessionId, 'bias', demoBiasData);
  }, 7000);

  // Step 7: Socrates thinking (7500ms)
  setTimeout(() => {
    emitAgentStatus(sessionId, {
      agentId: 'socrates',
      status: 'thinking',
      message: '대화를 준비하고 있습니다...',
      progress: 50,
    });
  }, 7500);

  // Step 8: Analysis complete (8000ms)
  setTimeout(() => {
    emitAgentStatus(sessionId, {
      agentId: 'socrates',
      status: 'done',
      message: '준비 완료',
      progress: 100,
    });
    emitComplete(sessionId, demoResult);
  }, 8000);
}
