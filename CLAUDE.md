# Flipside - 에이전틱 개발 가이드

> "논쟁에서 이기고 싶으면, 먼저 상대를 이해하세요"
> "같은 팩트, 다른 결론. 당신은 왜 그 결론에 도달했나요?"

## 프로젝트 개요

**Flipside**는 Gemini 3 Seoul Hackathon 2026 (Gemini for Good 트랙)을 위한 **비판적 사고 분석 플랫폼**입니다.

### 핵심 철학

기존 미디어 리터러시 도구들은 "당신이 편향됐다"고 말해서 실패했습니다. Flipside는 다릅니다:

| 기존 접근 | Flipside 접근 |
|---------|-------------|
| '당신이 편향됐어요' | '논쟁에서 이기려면 상대를 알아야죠' |
| 공부하러 옴 | 이기러 옴 |
| 방어적 반응 | 자발적 참여 |
| 외부 강요 | 내적 동기 |

### 이게 챗봇이 아닌 이유

- **3패널 분석 대시보드**: 대화창이 아닌 실시간 분석 패널
- **4개 AI 에이전트 협력**: 사용자가 에이전트 작동을 직접 볼 수 있음
- **공유 가능한 분석 카드**: 논쟁 상대에게 바로 보낼 수 있는 결과물

---

## 기술 스택

```
Frontend     : Next.js 16 (App Router) + React 19
Styling      : Tailwind CSS 4
State        : Zustand (클라이언트 상태관리)
AI Core      : Gemini 3 Pro API (Deep Think mode)
Search       : Google Search Grounding
Language     : TypeScript 5
Deployment   : Vercel
```

---

## 프로젝트 구조

```
/
├── CLAUDE.md                    # 이 파일 - 에이전틱 개발 지침
├── docs/
│   ├── PRD.md                   # PRD 요약
│   ├── ARCHITECTURE.md          # 시스템 아키텍처
│   ├── AGENTS.md                # AI 에이전트 설계
│   ├── UI.md                    # UI/UX 설계
│   └── API.md                   # API 설계
├── app/
│   ├── page.tsx                 # 메인 페이지 (3패널 대시보드)
│   ├── layout.tsx               # 루트 레이아웃
│   ├── globals.css              # 글로벌 스타일
│   ├── api/
│   │   ├── analyze/route.ts     # 분석 시작 API
│   │   ├── stream/route.ts      # SSE 스트리밍
│   │   └── agents/              # 에이전트 관련 API
│   └── components/
│       ├── panels/              # 3개 분석 패널
│       │   ├── SourcePanel.tsx  # Primary Source 검증
│       │   ├── PerspectivePanel.tsx  # 다른 관점 탐색
│       │   └── BiasPanel.tsx    # 편향 분석
│       ├── agents/              # 에이전트 상태 표시
│       ├── input/               # 콘텐츠 입력 영역
│       ├── chat/                # 소크라테스 대화
│       └── shared/              # 공통 컴포넌트
├── lib/
│   ├── gemini/                  # Gemini API 클라이언트
│   │   ├── client.ts            # API 클라이언트
│   │   └── prompts.ts           # 에이전트 프롬프트
│   ├── agents/                  # 에이전트 로직
│   │   ├── analyzer.ts          # Agent A: 분석기
│   │   ├── source-verifier.ts   # Agent B: 소스 검증
│   │   ├── perspective.ts       # Agent C: 관점 탐색
│   │   └── socrates.ts          # Agent D: 대화
│   ├── store/                   # Zustand 스토어
│   │   ├── useAnalysisStore.ts  # 분석 상태
│   │   ├── useAgentStore.ts     # 에이전트 상태
│   │   └── useChatStore.ts      # 대화 상태
│   └── types/                   # 타입 정의
│       ├── analysis.ts          # 분석 결과 타입
│       ├── agent.ts             # 에이전트 타입
│       └── api.ts               # API 타입
└── public/                      # 정적 파일
```

---

## 4개 AI 에이전트

### Agent A: Analyzer (오케스트레이터)
- **역할**: 콘텐츠 파싱, 주장 구조화, 편향 사전 감지, 다른 에이전트 지시
- **Gemini 기능**: Multimodal Vision, Deep Think, Structured Output
- **사용자에게**: 보이지 않음 (백그라운드)

### Agent B: Source Verifier
- **역할**: Primary Source 검증, 인용 원본 탐색, 왜곡 감지
- **Gemini 기능**: Google Search Grounding
- **출력**: 원본 링크, 일치/왜곡/맥락누락 판정, 신뢰도 점수

### Agent C: Perspective Explorer
- **역할**: 반대 관점 수집, 프레임 분석, 스펙트럼 매핑
- **Gemini 기능**: Search Grounding, Deep Think
- **출력**: 관점 카드 리스트, 프레임 차이 시각화, 스펙트럼 맵

### Agent D: Socrates (대화 에이전트)
- **역할**: 사용자와 대화, 분석 결과 기반 질문
- **Gemini 기능**: Thought Signatures (멀티턴 일관성)
- **질문 순서**:
  - Q1: "이 주장에서 가장 말이 안 된다고 생각하는 부분이 어디예요?"
  - Q2: "원본 데이터 보니까 어떤 생각이 들어요?"
  - Q3: "반대 관점 중 가장 말이 되는 게 뭐예요?"
  - Q4: "지금도 처음이랑 같은 생각이에요?"

---

## 3개 분석 레이어 (순서 중요!)

### Layer 1: Primary Source 검증
> "이 주장의 근거가 진짜인가?"

- 인용된 소스의 원본 자율 탐색
- 인용 왜곡/맥락 누락 확인
- 감정이 아닌 팩트 레벨에서 시작 → 방어심 낮음

### Layer 2: 다른 관점 탐색
> "같은 사실을 왜 다르게 해석하는가?"

- 같은 팩트, 다른 프레임으로 보는 관점들
- Layer 1 경험 후라 '팩트는 같다'가 전제된 상태

### Layer 3: 편향 분석
> "나는 왜 이 관점에 끌렸는가?"

- Hans Rosling 10 Instincts 기반 편향 패턴 진단
- Layer 1, 2 경험 후라 방어적이지 않음

**순서 자체가 설득의 구조입니다. 3번을 먼저 보여주면 방어적 반응, 1-2를 먼저 경험하면 자연스러운 자기 인식.**

---

## 개발 컨벤션

### 파일 네이밍
- 컴포넌트: `PascalCase.tsx`
- 유틸리티/훅: `camelCase.ts`
- 타입: `types/kebab-case.ts`
- API 라우트: `route.ts`

### 컴포넌트 패턴
```tsx
// 서버 컴포넌트 (기본)
export default async function ComponentName() { ... }

// 클라이언트 컴포넌트 (상호작용 필요시)
'use client'
export default function ComponentName() { ... }
```

### 에이전트 상태 타입
```typescript
type AgentStatus = 'idle' | 'thinking' | 'searching' | 'analyzing' | 'done' | 'error';

interface AgentState {
  id: 'analyzer' | 'source' | 'perspective' | 'socrates';
  status: AgentStatus;
  message?: string;
  progress?: number;
  result?: unknown;
}
```

### API 응답 형식
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

## 상태 관리 (Zustand)

### 분석 스토어

```typescript
// lib/store/useAnalysisStore.ts
import { create } from 'zustand';

interface AnalysisState {
  sessionId: string | null;
  status: 'idle' | 'analyzing' | 'done' | 'error';
  panels: {
    source: SourcePanelData | null;
    perspective: PerspectivePanelData | null;
    bias: BiasPanelData | null;
  };

  // Actions
  startAnalysis: (sessionId: string) => void;
  updatePanel: (panel: PanelType, data: PanelData) => void;
  setComplete: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  sessionId: null,
  status: 'idle',
  panels: { source: null, perspective: null, bias: null },

  startAnalysis: (sessionId) => set({ sessionId, status: 'analyzing' }),
  updatePanel: (panel, data) => set((state) => ({
    panels: { ...state.panels, [panel]: data }
  })),
  setComplete: () => set({ status: 'done' }),
  reset: () => set({ sessionId: null, status: 'idle', panels: { source: null, perspective: null, bias: null } }),
}));
```

### 에이전트 스토어

```typescript
// lib/store/useAgentStore.ts
interface AgentStoreState {
  agents: Record<AgentId, AgentState>;
  updateAgent: (id: AgentId, state: Partial<AgentState>) => void;
  resetAgents: () => void;
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  agents: {
    analyzer: { id: 'analyzer', status: 'idle' },
    source: { id: 'source', status: 'idle' },
    perspective: { id: 'perspective', status: 'idle' },
    socrates: { id: 'socrates', status: 'idle' },
  },

  updateAgent: (id, state) => set((prev) => ({
    agents: { ...prev.agents, [id]: { ...prev.agents[id], ...state } }
  })),

  resetAgents: () => set({
    agents: {
      analyzer: { id: 'analyzer', status: 'idle' },
      source: { id: 'source', status: 'idle' },
      perspective: { id: 'perspective', status: 'idle' },
      socrates: { id: 'socrates', status: 'idle' },
    }
  }),
}));
```

### 사용 예시

```tsx
'use client';

function AnalysisPage() {
  const { status, panels, startAnalysis } = useAnalysisStore();
  const { agents, updateAgent } = useAgentStore();

  // SSE 이벤트 핸들링
  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(`/api/stream/${sessionId}`);
    eventSource.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === 'agent_status') {
        updateAgent(event.payload.agentId, event.payload);
      }
    };

    return () => eventSource.close();
  }, [sessionId]);

  return (/* ... */);
}
```

---

## 클린 코드 패턴 요약

> 상세 내용은 [docs/PATTERNS.md](docs/PATTERNS.md) 참조

### 핵심 원칙

1. **Feature-Sliced Design**: 기능 단위로 코드 구성
2. **단방향 의존성**: Components → Hooks → Services → API
3. **Container/Presentational 분리**: 데이터 로직과 UI 분리

### 컴포넌트 패턴

```tsx
// Compound Component Pattern
<Panel.Root>
  <Panel.Header title="Primary Source" />
  <Panel.Content>{/* ... */}</Panel.Content>
</Panel.Root>
```

### 에러 핸들링

```typescript
// Result 타입 패턴
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### 타입 안전성

```typescript
// Discriminated Unions
type StreamEvent =
  | { type: 'agent_status'; payload: AgentStatusPayload }
  | { type: 'panel_update'; panel: PanelType; payload: PanelData };
```

---

## 환경 변수

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key
```

---

## 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

---

## 해커톤 MVP 우선순위

| 우선순위 | 기능 | 이유 |
|---------|------|------|
| 필수 | 3패널 UI + Agent A | 데모 자체가 안 됨 |
| 높음 | Agent B (Source) + Agent C (관점) | 있으면 훨씬 강함 |
| 중간 | Agent D 소크라테스 대화 | 텍스트 Q&A로 대체 가능 |
| 낮음 | 라이브러리, 히스토리, 공유 | 슬라이드로 비전 보여주기 |

---

## 문서 참조

- [PRD 요약](docs/PRD.md)
- [시스템 아키텍처](docs/ARCHITECTURE.md)
- [AI 에이전트 설계](docs/AGENTS.md)
- [UI/UX 설계](docs/UI.md)
- [API 설계](docs/API.md)
- [클린 코드 패턴](docs/PATTERNS.md)

---

## 연락처

Gemini 3 Seoul Hackathon 2026 | Track: Gemini for Good
