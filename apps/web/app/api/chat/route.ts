import { NextRequest, NextResponse } from 'next/server';
import {
  DEMO_SOCRATES_QUESTIONS,
  DEMO_CONFIRMATION_RESPONSES,
} from '@/lib/demo/data';
import type { ChatRequest, ChatResponse, ApiResponse } from '@/lib/types';
import { isBackendMode, fetchBackend, convertKeys } from '@/lib/api/backend';

// Track chat state per session (in-memory for demo)
interface SessionChatState {
  step: number;
  phase: 'questions' | 'confirmation' | 'followup' | 'complete';
  userAgreed?: boolean;
}

const sessionStates = new Map<string, SessionChatState>();

function getSessionState(sessionId: string): SessionChatState {
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, { step: 0, phase: 'questions' });
  }
  return sessionStates.get(sessionId)!;
}

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

    if (isBackendMode()) {
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
    }

    const { sessionId } = body;
    if (!sessionId) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'sessionId is required',
          },
        },
        { status: 400 }
      );
    }

    if (typeof body.agreed === 'boolean') {
      return handleDemoConfirmation(sessionId, body.agreed);
    }

    const message = body.message ?? '';
    const state = getSessionState(sessionId);

    let response: string;
    let isComplete = false;
    let awaitingConfirmation = false;
    let isSearching = false;

    // Handle based on current phase
    switch (state.phase) {
      case 'questions': {
        const nextStep = state.step + 1;
        state.step = nextStep;

        if (nextStep < DEMO_SOCRATES_QUESTIONS.length) {
          // Continue with questions
          response = getStepResponse(nextStep, message);
        } else if (nextStep === DEMO_SOCRATES_QUESTIONS.length) {
          // Last question answered, show confirmation
          response = getStepResponse(nextStep, message);
          // After showing step 4 response, transition to confirmation
          state.phase = 'confirmation';
          awaitingConfirmation = true;
        } else {
          state.phase = 'confirmation';
          awaitingConfirmation = true;
          response = DEMO_CONFIRMATION_RESPONSES.confirmation;
        }
        break;
      }

      case 'confirmation': {
        // This shouldn't normally happen since confirmation is handled by onConfirmation
        // But handle gracefully
        const agreed = message.toLowerCase().includes('네') || message.toLowerCase().includes('yes');
        state.userAgreed = agreed;
        state.phase = 'followup';

        if (agreed) {
          response = DEMO_CONFIRMATION_RESPONSES.yes;
          isSearching = true;
        } else {
          response = DEMO_CONFIRMATION_RESPONSES.no;
        }
        break;
      }

      case 'followup': {
        if (state.userAgreed) {
          // User agreed and search completed - show results
          response = DEMO_CONFIRMATION_RESPONSES.searchResult;
        } else {
          // User disagreed - thank for feedback
          response = DEMO_CONFIRMATION_RESPONSES.feedbackThanks;
        }
        state.phase = 'complete';
        isComplete = true;
        break;
      }

      case 'complete':
      default:
        response = '대화가 완료되었습니다. 분석 카드를 확인해보세요!';
        isComplete = true;
        break;
    }

    sessionStates.set(sessionId, state);

    const chatResponse: ChatResponse = {
      response,
      step: state.step,
      isComplete,
      awaitingConfirmation,
      isSearching,
    };

    return NextResponse.json<ApiResponse<ChatResponse>>({
      success: true,
      data: chatResponse,
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

    return handleDemoConfirmation(sessionId, agreed);
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

function handleDemoConfirmation(sessionId: string, agreed: boolean) {
  const state = getSessionState(sessionId);
  state.userAgreed = agreed;
  state.phase = 'followup';

  let response: string;
  let isSearching = false;

  if (agreed) {
    response = DEMO_CONFIRMATION_RESPONSES.yes;
    isSearching = true;
  } else {
    response = DEMO_CONFIRMATION_RESPONSES.no;
  }

  sessionStates.set(sessionId, state);

  const chatResponse: ChatResponse = {
    response,
    step: state.step,
    isComplete: false,
    awaitingConfirmation: false,
    isSearching,
  };

  return NextResponse.json<ApiResponse<ChatResponse>>({
    success: true,
    data: chatResponse,
  });
}

function getStepResponse(step: number, userMessage: string): string {
  void userMessage;
  const responses: Record<number, string> = {
    1: `흥미로운 포인트네요. 실제로 많은 분들이 비슷한 부분에서 의문을 가지세요.\n\n그런데 한 가지 더 확인해볼게요. ${DEMO_SOCRATES_QUESTIONS[1]}`,
    2: `맞아요, 숫자가 꽤 다르죠? 공식 실업률 6.8%와 기사의 25%는 큰 차이예요. 확장실업률(21.3%)을 감안해도 과장된 면이 있죠.\n\n이제 다른 관점들도 살펴봤는데요. ${DEMO_SOCRATES_QUESTIONS[2]}`,
    3: `각 관점마다 나름의 논리가 있죠. 같은 팩트를 두고도 해석이 달라지는 게 흥미롭지 않나요?\n\n마지막 질문이에요. ${DEMO_SOCRATES_QUESTIONS[3]}`,
    4: `솔직한 답변 감사합니다. 비판적 사고의 핵심은 "내가 틀릴 수 있다"는 가능성을 열어두는 거예요.\n\n오늘 분석을 통해 같은 팩트를 다른 프레임으로 볼 수 있다는 걸 경험하셨길 바랍니다.`,
  };

  return responses[step] ?? '대화가 완료되었습니다.';
}
