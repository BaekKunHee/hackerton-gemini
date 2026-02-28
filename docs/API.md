# Flipside - API 설계

---

## 1. API 개요

### 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `/api` |
| 인증 | 해커톤 MVP에서는 인증 없음 |
| 응답 형식 | JSON |
| 실시간 통신 | Server-Sent Events (SSE) |

### 공통 응답 형식

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 2. REST API 엔드포인트

### 2.1 분석 시작

**POST** `/api/analyze`

분석 세션을 시작합니다.

#### Request

```typescript
interface AnalyzeRequest {
  type: 'url' | 'text' | 'image';
  content: string;  // URL, 텍스트, 또는 base64 이미지
}
```

```bash
curl -X POST /api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url",
    "content": "https://example.com/news/article"
  }'
```

#### Response

```typescript
interface AnalyzeResponse {
  sessionId: string;
  status: 'started';
  streamUrl: string;  // SSE 연결 URL
}
```

```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "status": "started",
    "streamUrl": "/api/stream/sess_abc123"
  }
}
```

---

### 2.2 분석 결과 조회

**GET** `/api/result/:sessionId`

완료된 분석 결과를 조회합니다.

#### Response

```typescript
interface ResultResponse {
  sessionId: string;
  status: 'analyzing' | 'done' | 'error';
  result?: AnalysisResult;
  error?: string;
}

interface AnalysisResult {
  source: SourcePanelData;
  perspective: PerspectivePanelData;
  bias: BiasPanelData;
  steelMan: SteelManOutput;
}
```

```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "status": "done",
    "result": {
      "source": {
        "originalSources": [...],
        "verificationStatus": "distorted",
        "trustScore": 72
      },
      "perspective": {
        "perspectives": [...],
        "commonFacts": [...],
        "divergencePoints": [...]
      },
      "bias": {
        "biasScores": [...],
        "dominantBiases": ["blame_instinct", "single_perspective"],
        "textExamples": [...]
      },
      "steelMan": {
        "opposingArgument": "...",
        "strengthenedArgument": "..."
      }
    }
  }
}
```

---

### 2.3 소크라테스 대화

**POST** `/api/chat`

소크라테스 대화에 메시지를 보냅니다.

#### Request

```typescript
interface ChatRequest {
  sessionId: string;
  message: string;
}
```

```bash
curl -X POST /api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_abc123",
    "message": "저는 이 주장의 통계가 의심스러워요"
  }'
```

#### Response

```typescript
interface ChatResponse {
  response: string;
  step: number;  // 현재 대화 단계 (1-4)
  isComplete: boolean;
}
```

```json
{
  "success": true,
  "data": {
    "response": "흥미로운 지적이에요. 원본 데이터를 보니까 어떤 생각이 들어요?",
    "step": 2,
    "isComplete": false
  }
}
```

---

## 3. Server-Sent Events (SSE)

### 3.1 스트림 연결

**GET** `/api/stream/:sessionId`

실시간 분석 상태를 스트리밍합니다.

```typescript
// 클라이언트 연결
const eventSource = new EventSource(`/api/stream/${sessionId}`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleEvent(data);
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};
```

### 3.2 이벤트 타입

#### agent_status

에이전트 상태 변경

```typescript
interface AgentStatusEvent {
  type: 'agent_status';
  payload: {
    agentId: 'analyzer' | 'source' | 'perspective' | 'socrates';
    status: 'idle' | 'thinking' | 'searching' | 'analyzing' | 'done' | 'error';
    message?: string;
    progress?: number;
  };
}
```

```json
{
  "type": "agent_status",
  "payload": {
    "agentId": "source",
    "status": "searching",
    "message": "원본 소스를 찾고 있어요...",
    "progress": 30
  }
}
```

#### panel_update

패널 데이터 업데이트

```typescript
interface PanelUpdateEvent {
  type: 'panel_update';
  panel: 'source' | 'perspective' | 'bias';
  payload: SourcePanelData | PerspectivePanelData | BiasPanelData;
}
```

```json
{
  "type": "panel_update",
  "panel": "source",
  "payload": {
    "originalSources": [...],
    "verificationStatus": "distorted",
    "trustScore": 72
  }
}
```

#### analysis_complete

분석 완료

```typescript
interface AnalysisCompleteEvent {
  type: 'analysis_complete';
  payload: {
    sessionId: string;
    result: AnalysisResult;
  };
}
```

#### error

에러 발생

```typescript
interface ErrorEvent {
  type: 'error';
  payload: {
    code: string;
    message: string;
    agentId?: string;
  };
}
```

---

## 4. 타입 정의

### 4.1 분석 관련 타입

```typescript
// lib/types/analysis.ts

// 분석 세션
interface AnalysisSession {
  id: string;
  createdAt: Date;
  content: ContentInput;
  status: 'analyzing' | 'done' | 'error';
  result?: AnalysisResult;
}

// 콘텐츠 입력
interface ContentInput {
  type: 'url' | 'text' | 'image';
  value: string;
  metadata?: {
    title?: string;
    source?: string;
  };
}

// Primary Source 패널 데이터
interface SourcePanelData {
  originalSources: VerifiedSource[];
  verificationStatus: 'verified' | 'distorted' | 'context_missing';
  trustScore: number;
}

interface VerifiedSource {
  originalClaim: string;
  originalSource: {
    url: string;
    title: string;
    publisher: string;
    date: string;
    relevantQuote: string;
  };
  verification: {
    status: 'verified' | 'distorted' | 'context_missing' | 'unverifiable';
    explanation: string;
    comparison: {
      claimed: string;
      actual: string;
    };
  };
  trustScore: number;
}

// 다른 관점 패널 데이터
interface PerspectivePanelData {
  perspectives: Perspective[];
  commonFacts: string[];
  divergencePoints: DivergencePoint[];
}

interface Perspective {
  id: number;
  source: {
    url: string;
    title: string;
    publisher: string;
  };
  mainClaim: string;
  frame: string;
  keyPoints: string[];
  spectrum: {
    political: number;
    emotional: number;
    complexity: number;
  };
}

interface DivergencePoint {
  topic: string;
  positions: Record<string, string>;
}

// 편향 분석 패널 데이터
interface BiasPanelData {
  biasScores: BiasScore[];
  dominantBiases: string[];
  textExamples: BiasExample[];
  alternativeFraming?: string;
}

interface BiasScore {
  type: BiasType;
  score: number;  // 0-1
}

type BiasType =
  | 'gap_instinct'
  | 'negativity_instinct'
  | 'straight_line_instinct'
  | 'fear_instinct'
  | 'size_instinct'
  | 'generalization_instinct'
  | 'destiny_instinct'
  | 'single_perspective_instinct'
  | 'blame_instinct'
  | 'urgency_instinct';

interface BiasExample {
  text: string;
  biasType: BiasType;
  explanation: string;
}

// Steel Man 출력
interface SteelManOutput {
  opposingArgument: string;
  strengthenedArgument: string;
}

// 최종 분석 결과
interface AnalysisResult {
  source: SourcePanelData;
  perspective: PerspectivePanelData;
  bias: BiasPanelData;
  steelMan: SteelManOutput;
}
```

### 4.2 에이전트 관련 타입

```typescript
// lib/types/agent.ts

type AgentId = 'analyzer' | 'source' | 'perspective' | 'socrates';

type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'analyzing'
  | 'done'
  | 'error';

interface AgentState {
  id: AgentId;
  status: AgentStatus;
  message?: string;
  progress?: number;
  result?: unknown;
  error?: string;
}

// Agent A 출력
interface AnalyzerOutput {
  claims: Claim[];
  logicStructure: string;
  detectedBiases: DetectedBias[];
  agentInstructions: {
    sourceVerifier: SourceVerifierInstruction;
    perspectiveExplorer: PerspectiveInstruction;
  };
}

interface Claim {
  id: number;
  text: string;
  evidence: string;
  sources: string[];
}

interface DetectedBias {
  type: BiasType;
  confidence: number;
  example: string;
}

interface SourceVerifierInstruction {
  sources: string[];
  checkFor: string[];
}

interface PerspectiveInstruction {
  topic: string;
  keywords: string[];
}
```

### 4.3 대화 관련 타입

```typescript
// lib/types/chat.ts

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationContext {
  sessionId: string;
  step: number;
  messages: ChatMessage[];
  initialReaction?: string;
  factReaction?: string;
  perspectiveReaction?: string;
}
```

---

## 5. 에러 코드

| 코드 | 설명 |
|------|------|
| `INVALID_INPUT` | 잘못된 입력 형식 |
| `SESSION_NOT_FOUND` | 세션을 찾을 수 없음 |
| `SESSION_EXPIRED` | 세션 만료 |
| `ANALYSIS_FAILED` | 분석 실패 |
| `GEMINI_API_ERROR` | Gemini API 오류 |
| `RATE_LIMIT_EXCEEDED` | 요청 제한 초과 |
| `INTERNAL_ERROR` | 내부 서버 오류 |

---

## 6. API Route 구현 예시

### 6.1 분석 시작 API

```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agents/orchestrator';
import { generateSessionId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content } = body;

    // 입력 검증
    if (!type || !content) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '타입과 콘텐츠가 필요합니다' }
      }, { status: 400 });
    }

    // 세션 생성
    const sessionId = generateSessionId();

    // 분석 시작 (비동기)
    const orchestrator = new AgentOrchestrator(sessionId);
    orchestrator.start(content, type).catch(console.error);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        status: 'started',
        streamUrl: `/api/stream/${sessionId}`
      }
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '분석을 시작할 수 없습니다' }
    }, { status: 500 });
  }
}
```

### 6.2 SSE 스트림 API

```typescript
// app/api/stream/[sessionId]/route.ts
import { NextRequest } from 'next/server';
import { subscribeToSession } from '@/lib/session-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // 세션 이벤트 구독
      const unsubscribe = subscribeToSession(sessionId, {
        onAgentStatus: (status) => send({ type: 'agent_status', payload: status }),
        onPanelUpdate: (panel, data) => send({ type: 'panel_update', panel, payload: data }),
        onComplete: (result) => send({ type: 'analysis_complete', payload: result }),
        onError: (error) => send({ type: 'error', payload: error })
      });

      // 연결 종료 시 정리
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 6.3 대화 API

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Socrates } from '@/lib/agents/socrates';
import { getSession } from '@/lib/session-store';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json();

    // 세션 확인
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: '세션을 찾을 수 없습니다' }
      }, { status: 404 });
    }

    // 소크라테스 응답 생성
    const socrates = new Socrates(sessionId);
    const response = await socrates.respond(message, session.conversationContext);

    return NextResponse.json({
      success: true,
      data: {
        response: response.message,
        step: response.step,
        isComplete: response.step >= 4
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '응답을 생성할 수 없습니다' }
    }, { status: 500 });
  }
}
```

---

## 7. Gemini API 통합

### 7.1 클라이언트 설정

```typescript
// lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 기본 모델 (Deep Think)
export const gemini = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 8192,
  }
});

// Search Grounding 포함 모델
export const geminiWithSearch = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
  tools: [{ googleSearch: {} }],
});
```

### 7.2 프롬프트 템플릿

```typescript
// lib/gemini/prompts.ts

// JSON 출력 지시 래퍼
export function withJsonOutput(prompt: string, schema: string): string {
  return `${prompt}

## 중요: JSON 출력
반드시 아래 스키마에 맞는 유효한 JSON으로만 응답하세요.
마크다운 코드 블록 없이 JSON만 출력하세요.

스키마:
${schema}`;
}

// 에이전트별 프롬프트는 AGENTS.md 참조
export { ANALYZER_PROMPT } from './prompts/analyzer';
export { SOURCE_VERIFIER_PROMPT } from './prompts/source-verifier';
export { PERSPECTIVE_EXPLORER_PROMPT } from './prompts/perspective';
export { SOCRATES_PROMPT } from './prompts/socrates';
```

---

## 참조 문서

- [PRD 요약](PRD.md)
- [시스템 아키텍처](ARCHITECTURE.md)
- [AI 에이전트 설계](AGENTS.md)
- [UI/UX 설계](UI.md)
- [클린 코드 패턴](PATTERNS.md)
