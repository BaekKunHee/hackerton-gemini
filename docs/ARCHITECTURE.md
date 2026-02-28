# Flipside - 시스템 아키텍처

---

## 1. 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Source Panel  │  │ Perspective   │  │ Bias Panel    │       │
│  │               │  │ Panel         │  │               │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Agent Status Display                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Socrates Chat Interface                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/SSE
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                           │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/analyze          │  분석 시작, 세션 생성             │
│  GET  /api/stream/:id       │  SSE 스트리밍 (에이전트 상태)     │
│  POST /api/chat             │  소크라테스 대화                  │
│  GET  /api/result/:id       │  최종 분석 결과                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATOR                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Agent A: Analyzer                     │   │
│  │  - 콘텐츠 파싱 (URL/텍스트/이미지)                       │   │
│  │  - 주장 구조화, 인용 소스 식별                           │   │
│  │  - 편향 사전 감지                                        │   │
│  │  - Agent B, C, D 지시                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  Agent B    │     │  Agent C    │     │  Agent D    │       │
│  │  Source     │     │ Perspective │     │  Socrates   │       │
│  │  Verifier   │     │  Explorer   │     │             │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GEMINI 3 API                               │
├─────────────────────────────────────────────────────────────────┤
│  - Multimodal Vision (이미지/스크린샷 분석)                     │
│  - Deep Think (논리 구조 파악, 편향 분석)                       │
│  - Search Grounding (원본 소스 탐색)                            │
│  - Structured Output (패널 데이터 생성)                         │
│  - Thought Signatures (멀티턴 대화 일관성)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend 아키텍처

### 2.1 Next.js App Router 구조

```
app/
├── page.tsx                    # 메인 페이지 (서버 컴포넌트)
├── layout.tsx                  # 루트 레이아웃
├── globals.css                 # 글로벌 스타일
│
├── api/                        # API Routes
│   ├── analyze/
│   │   └── route.ts            # POST: 분석 시작
│   ├── stream/
│   │   └── [sessionId]/
│   │       └── route.ts        # GET: SSE 스트리밍
│   ├── chat/
│   │   └── route.ts            # POST: 소크라테스 대화
│   └── result/
│       └── [sessionId]/
│           └── route.ts        # GET: 최종 결과
│
└── components/
    ├── panels/
    │   ├── SourcePanel.tsx     # Primary Source 검증 패널
    │   ├── PerspectivePanel.tsx # 다른 관점 탐색 패널
    │   └── BiasPanel.tsx       # 편향 분석 패널
    │
    ├── agents/
    │   ├── AgentStatusBar.tsx  # 에이전트 상태 표시 바
    │   └── AgentCard.tsx       # 개별 에이전트 상태 카드
    │
    ├── input/
    │   ├── ContentInput.tsx    # 콘텐츠 입력 영역
    │   └── UrlInput.tsx        # URL 입력 컴포넌트
    │
    ├── chat/
    │   ├── SocratesChat.tsx    # 소크라테스 대화 UI
    │   └── ChatMessage.tsx     # 채팅 메시지 컴포넌트
    │
    ├── result/
    │   ├── AnalysisCard.tsx    # 최종 분석 카드
    │   └── ShareButton.tsx     # 공유 버튼
    │
    └── shared/
        ├── LoadingSpinner.tsx  # 로딩 스피너
        ├── ProgressBar.tsx     # 진행률 바
        └── Badge.tsx           # 상태 뱃지
```

### 2.2 상태 관리 전략

**React 19 특성 활용:**
- Server Components 기본 사용
- Client Components는 상호작용 필요시만 사용
- `use` 훅으로 비동기 데이터 처리

**클라이언트 상태:**
```typescript
// lib/hooks/useAnalysis.ts
interface AnalysisState {
  sessionId: string | null;
  status: 'idle' | 'analyzing' | 'done' | 'error';
  agents: AgentState[];
  panels: {
    source: SourcePanelData | null;
    perspective: PerspectivePanelData | null;
    bias: BiasPanelData | null;
  };
  chat: ChatMessage[];
}
```

### 2.3 실시간 업데이트 (SSE)

```typescript
// 클라이언트에서 SSE 연결
const eventSource = new EventSource(`/api/stream/${sessionId}`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'agent_status':
      updateAgentStatus(data.payload);
      break;
    case 'panel_update':
      updatePanel(data.panel, data.payload);
      break;
    case 'analysis_complete':
      setStatus('done');
      break;
  }
};
```

---

## 3. Backend 아키텍처

### 3.1 API Routes 설계

```typescript
// app/api/analyze/route.ts
export async function POST(request: Request) {
  const { content, type } = await request.json();

  // 1. 세션 생성
  const sessionId = generateSessionId();

  // 2. Agent A 시작 (오케스트레이터)
  const analyzer = new Analyzer(sessionId);
  await analyzer.start(content, type);

  return Response.json({ sessionId });
}
```

### 3.2 에이전트 오케스트레이션

```typescript
// lib/agents/orchestrator.ts
class AgentOrchestrator {
  private analyzer: Analyzer;
  private sourceVerifier: SourceVerifier;
  private perspectiveExplorer: PerspectiveExplorer;
  private socrates: Socrates;

  async run(content: string, type: ContentType) {
    // 1. Agent A: 분석 및 지시 생성
    const analysis = await this.analyzer.analyze(content, type);

    // 2. Agent B, C 병렬 실행
    const [sourceResult, perspectiveResult] = await Promise.all([
      this.sourceVerifier.verify(analysis.sources),
      this.perspectiveExplorer.explore(analysis.topic, analysis.claims)
    ]);

    // 3. 결과 통합 및 편향 분석
    const biasResult = await this.analyzer.analyzeBias(
      analysis,
      sourceResult,
      perspectiveResult
    );

    // 4. Agent D 준비 (대화용)
    await this.socrates.prepare(analysis, biasResult);

    return { sourceResult, perspectiveResult, biasResult };
  }
}
```

### 3.3 SSE 스트리밍

```typescript
// app/api/stream/[sessionId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // 에이전트 상태 구독
      const unsubscribe = subscribeToSession(params.sessionId, send);

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

---

## 4. Gemini API 통합

### 4.1 클라이언트 설정

```typescript
// lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiPro = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',  // 해커톤용 모델
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 8192,
  }
});

export const geminiProWithSearch = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
  tools: [{ googleSearch: {} }],  // Search Grounding
});
```

### 4.2 기능별 활용

| Gemini 기능 | 활용 위치 | 목적 |
|------------|----------|------|
| Multimodal Vision | Agent A | 스크린샷/이미지 분석 |
| Deep Think | Agent A, 편향 분석 | 논리 구조 파악, 다층적 추론 |
| Search Grounding | Agent B, C | 원본 소스 탐색, 반대 관점 수집 |
| Structured Output | 모든 에이전트 | UI 패널용 JSON 생성 |
| Thought Signatures | Agent D | 멀티턴 대화 일관성 |

---

## 5. 데이터 플로우

### 5.1 분석 플로우

```
사용자 입력 (URL/텍스트/스크린샷)
         │
         ▼
┌─────────────────────┐
│    Agent A          │  ← Multimodal Vision
│    (Analyzer)       │  ← Deep Think
└─────────────────────┘
         │
         │ 분석 결과 + 지시
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐  ┌─────────┐
│ Agent B │  │ Agent C │  ← Search Grounding (병렬)
│ Source  │  │ Perspec │
└─────────┘  └─────────┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────────┐
│   편향 분석 통합     │  ← Deep Think
└─────────────────────┘
         │
         │ SSE 스트리밍
         │
         ▼
┌─────────────────────┐
│   3패널 UI 업데이트  │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Agent D 대화 시작  │  ← Thought Signatures
│   (Socrates)        │
└─────────────────────┘
```

### 5.2 데이터 타입

```typescript
// lib/types/analysis.ts

// 분석 세션
interface AnalysisSession {
  id: string;
  createdAt: Date;
  content: ContentInput;
  status: SessionStatus;
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

// 분석 결과
interface AnalysisResult {
  source: SourcePanelData;
  perspective: PerspectivePanelData;
  bias: BiasPanelData;
  steelMan: SteelManOutput;
}

// Primary Source 패널
interface SourcePanelData {
  originalSources: Source[];
  verificationStatus: 'verified' | 'distorted' | 'context_missing';
  trustScore: number;
  comparison?: SourceComparison;
}

// 다른 관점 패널
interface PerspectivePanelData {
  perspectives: Perspective[];
  spectrumMap: SpectrumPosition[];
  commonFacts: string[];
  divergencePoints: string[];
}

// 편향 분석 패널
interface BiasPanelData {
  biasScores: BiasScore[];  // Hans Rosling 10 Instincts
  dominantBiases: string[];
  textExamples: BiasExample[];
  alternativeFraming?: string;
}
```

---

## 6. 보안 고려사항

### 6.1 API 키 관리
- 환경 변수로 관리 (`GEMINI_API_KEY`)
- 클라이언트에 노출 금지
- 서버 사이드에서만 Gemini API 호출

### 6.2 입력 검증
- URL 유효성 검사
- 콘텐츠 길이 제한
- XSS 방지

### 6.3 Rate Limiting
- Gemini API 호출 제한
- 세션당 분석 횟수 제한 (해커톤 크레딧 관리)

---

## 참조 문서

- [PRD 요약](PRD.md)
- [AI 에이전트 설계](AGENTS.md)
- [UI/UX 설계](UI.md)
- [API 설계](API.md)
- [클린 코드 패턴](PATTERNS.md)
