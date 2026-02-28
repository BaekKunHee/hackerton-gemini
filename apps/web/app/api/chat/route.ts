import { NextRequest, NextResponse } from 'next/server';
import { DEMO_SOCRATES_QUESTIONS } from '@/lib/demo/data';
import type { ChatRequest, ChatResponse, ApiResponse } from '@/lib/types';

// Track chat steps per session (in-memory for demo)
const sessionSteps = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.sessionId || !body.message) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'sessionId and message are required',
          },
        },
        { status: 400 }
      );
    }

    const { sessionId, message } = body;

    // Get current step (1-indexed)
    const currentStep = sessionSteps.get(sessionId) ?? 0;
    const nextStep = currentStep + 1;

    // Save updated step
    sessionSteps.set(sessionId, nextStep);

    // Determine response
    let response: string;
    const isComplete = nextStep >= DEMO_SOCRATES_QUESTIONS.length;

    if (nextStep <= DEMO_SOCRATES_QUESTIONS.length) {
      // Generate contextual response based on step
      const stepResponses = getStepResponse(nextStep, message);
      response = stepResponses;
    } else {
      response =
        '좋은 대화였습니다. 분석 결과를 바탕으로 더 깊이 생각해보는 시간이 되셨길 바랍니다.';
    }

    const chatResponse: ChatResponse = {
      response,
      step: nextStep,
      isComplete,
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

function getStepResponse(step: number, _userMessage: string): string {
  const responses: Record<number, string> = {
    1: `흥미로운 포인트네요. 실제로 많은 분들이 비슷한 부분에서 의문을 가지세요.\n\n그런데 한 가지 더 확인해볼게요. ${DEMO_SOCRATES_QUESTIONS[1]}`,
    2: `맞아요, 숫자가 꽤 다르죠? 공식 실업률 6.8%와 기사의 25%는 큰 차이예요. 확장실업률(21.3%)을 감안해도 과장된 면이 있죠.\n\n이제 다른 관점들도 살펴봤는데요. ${DEMO_SOCRATES_QUESTIONS[2]}`,
    3: `각 관점마다 나름의 논리가 있죠. 같은 팩트를 두고도 해석이 달라지는 게 흥미롭지 않나요?\n\n마지막 질문이에요. ${DEMO_SOCRATES_QUESTIONS[3]}`,
    4: `솔직한 답변 감사합니다. 비판적 사고의 핵심은 "내가 틀릴 수 있다"는 가능성을 열어두는 거예요.\n\n오늘 분석을 통해 같은 팩트를 다른 프레임으로 볼 수 있다는 걸 경험하셨길 바랍니다. 분석 카드를 확인해보세요!`,
  };

  return responses[step] ?? '대화가 완료되었습니다.';
}
