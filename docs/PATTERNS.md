# Flipside - 클린 코드 & 아키텍처 패턴

---

## 1. 아키텍처 원칙

### 1.1 Feature-Sliced Design

기능 단위로 코드를 구성합니다. 레이어별이 아닌 **기능별** 구조.

```
app/
├── (analysis)/              # 분석 기능 그룹
│   ├── page.tsx             # 메인 분석 페이지
│   ├── components/          # 분석 전용 컴포넌트
│   ├── hooks/               # 분석 전용 훅
│   └── actions/             # 분석 서버 액션
│
├── api/                     # API Routes (Backend)
│   ├── analyze/
│   ├── stream/
│   └── chat/
│
└── components/              # 공유 컴포넌트
    └── ui/                  # 기본 UI 컴포넌트
```

### 1.2 단방향 의존성

```
Components → Hooks → Services → API
     ↓          ↓         ↓
   Types ←←←←←←←←←←←←←←←←←
```

**규칙:**
- 상위 레이어는 하위 레이어를 import 가능
- 하위 레이어는 상위 레이어를 import 불가
- Types는 모든 레이어에서 import 가능

---

## 2. 컴포넌트 패턴

### 2.1 Compound Component Pattern

관련된 컴포넌트들을 하나의 네임스페이스로 묶습니다.

```tsx
// components/Panel/index.tsx
import { PanelRoot } from './PanelRoot';
import { PanelHeader } from './PanelHeader';
import { PanelContent } from './PanelContent';
import { PanelFooter } from './PanelFooter';

export const Panel = {
  Root: PanelRoot,
  Header: PanelHeader,
  Content: PanelContent,
  Footer: PanelFooter,
};

// 사용 예시
<Panel.Root>
  <Panel.Header title="Primary Source" />
  <Panel.Content>
    <SourceList sources={sources} />
  </Panel.Content>
  <Panel.Footer>
    <TrustScore score={72} />
  </Panel.Footer>
</Panel.Root>
```

### 2.2 Container/Presentational 분리

**Container (Smart)**: 데이터 fetching, 상태 관리
**Presentational (Dumb)**: UI 렌더링만

```tsx
// containers/SourcePanelContainer.tsx
'use client';

export function SourcePanelContainer({ sessionId }: { sessionId: string }) {
  const { data, isLoading, error } = useSourcePanel(sessionId);

  if (error) return <PanelError error={error} />;

  return <SourcePanel data={data} isLoading={isLoading} />;
}

// components/SourcePanel.tsx (Presentational)
interface SourcePanelProps {
  data: SourcePanelData | null;
  isLoading: boolean;
}

export function SourcePanel({ data, isLoading }: SourcePanelProps) {
  // 순수 UI 렌더링만
  if (isLoading) return <PanelSkeleton />;
  if (!data) return <EmptyPanel />;

  return (
    <Panel.Root>
      {/* ... */}
    </Panel.Root>
  );
}
```

### 2.3 Props 인터페이스 패턴

```tsx
// 기본 Props 패턴
interface ComponentProps {
  // Required props first
  id: string;
  title: string;

  // Optional props
  className?: string;
  disabled?: boolean;

  // Callbacks (on* prefix)
  onClick?: () => void;
  onSubmit?: (data: FormData) => void;

  // Children
  children?: React.ReactNode;
}

// Polymorphic Component (as prop)
interface ButtonProps<T extends React.ElementType = 'button'> {
  as?: T;
  children: React.ReactNode;
}

type Props<T extends React.ElementType> = ButtonProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonProps>;

export function Button<T extends React.ElementType = 'button'>({
  as,
  children,
  ...props
}: Props<T>) {
  const Component = as || 'button';
  return <Component {...props}>{children}</Component>;
}
```

---

## 3. 커스텀 훅 패턴

### 3.1 데이터 Fetching 훅

```tsx
// hooks/useAnalysis.ts
interface UseAnalysisOptions {
  onSuccess?: (data: AnalysisResult) => void;
  onError?: (error: Error) => void;
}

interface UseAnalysisReturn {
  data: AnalysisResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAnalysis(
  sessionId: string,
  options?: UseAnalysisOptions
): UseAnalysisReturn {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAnalysis(sessionId);
      setData(result);
      options?.onSuccess?.(result);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Unknown error');
      setError(err);
      options?.onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, options]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
```

### 3.2 SSE 연결 훅

```tsx
// hooks/useSSE.ts
interface UseSSEOptions<T> {
  onMessage: (data: T) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
}

export function useSSE<T>(url: string, options: UseSSEOptions<T>) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      options.onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        options.onMessage(data);
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    eventSource.onerror = (error) => {
      options.onError?.(error);
    };

    return () => {
      eventSource.close();
    };
  }, [url]); // options는 의도적으로 제외 (매 렌더마다 새 객체)

  const close = useCallback(() => {
    eventSourceRef.current?.close();
  }, []);

  return { close };
}

// 사용 예시
function AnalysisStream({ sessionId }: { sessionId: string }) {
  const [agents, setAgents] = useState<AgentState[]>([]);

  useSSE<StreamEvent>(`/api/stream/${sessionId}`, {
    onMessage: (event) => {
      if (event.type === 'agent_status') {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === event.payload.agentId ? { ...a, ...event.payload } : a
          )
        );
      }
    },
  });

  return <AgentStatusBar agents={agents} />;
}
```

### 3.3 상태 머신 훅

```tsx
// hooks/useAnalysisState.ts
type AnalysisState = 'idle' | 'inputting' | 'analyzing' | 'complete' | 'error';

type AnalysisAction =
  | { type: 'START_INPUT' }
  | { type: 'SUBMIT' }
  | { type: 'COMPLETE'; payload: AnalysisResult }
  | { type: 'ERROR'; payload: Error }
  | { type: 'RESET' };

function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (state) {
    case 'idle':
      if (action.type === 'START_INPUT') return 'inputting';
      return state;

    case 'inputting':
      if (action.type === 'SUBMIT') return 'analyzing';
      if (action.type === 'RESET') return 'idle';
      return state;

    case 'analyzing':
      if (action.type === 'COMPLETE') return 'complete';
      if (action.type === 'ERROR') return 'error';
      return state;

    case 'complete':
    case 'error':
      if (action.type === 'RESET') return 'idle';
      return state;

    default:
      return state;
  }
}

export function useAnalysisState() {
  const [state, dispatch] = useReducer(analysisReducer, 'idle');

  const actions = useMemo(() => ({
    startInput: () => dispatch({ type: 'START_INPUT' }),
    submit: () => dispatch({ type: 'SUBMIT' }),
    complete: (result: AnalysisResult) => dispatch({ type: 'COMPLETE', payload: result }),
    error: (err: Error) => dispatch({ type: 'ERROR', payload: err }),
    reset: () => dispatch({ type: 'RESET' }),
  }), []);

  return { state, ...actions };
}
```

---

## 4. 에러 핸들링 패턴

### 4.1 Result 타입 패턴

```tsx
// lib/types/result.ts
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// 헬퍼 함수
function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// 사용 예시
async function analyzeContent(content: string): Promise<Result<AnalysisResult>> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      return err(new Error(`HTTP ${response.status}`));
    }

    const data = await response.json();
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
}

// 컴포넌트에서 사용
const result = await analyzeContent(input);

if (result.success) {
  setData(result.data);
} else {
  setError(result.error.message);
}
```

### 4.2 Error Boundary 패턴

```tsx
// components/ErrorBoundary.tsx
'use client';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset);
      }
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// 사용 예시
<ErrorBoundary
  fallback={(error, reset) => (
    <div className="p-4 bg-red-50 rounded-lg">
      <p className="text-red-600">{error.message}</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  )}
>
  <SourcePanel />
</ErrorBoundary>
```

### 4.3 API 에러 핸들링

```tsx
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// lib/api/client.ts
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An error occurred',
      response.status
    );
  }

  return data.data as T;
}
```

---

## 5. API 레이어 패턴

### 5.1 서비스 레이어 추상화

```tsx
// lib/services/analysis.service.ts
class AnalysisService {
  async start(content: ContentInput): Promise<{ sessionId: string }> {
    return apiRequest('/analyze', {
      method: 'POST',
      body: JSON.stringify(content),
    });
  }

  async getResult(sessionId: string): Promise<AnalysisResult> {
    return apiRequest(`/result/${sessionId}`);
  }

  async sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
    return apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    });
  }

  createStream(sessionId: string): EventSource {
    return new EventSource(`/api/stream/${sessionId}`);
  }
}

export const analysisService = new AnalysisService();

// 사용
const { sessionId } = await analysisService.start({ type: 'url', value: url });
```

### 5.2 Repository 패턴 (에이전트용)

```tsx
// lib/agents/base.ts
interface AgentRepository<TInput, TOutput> {
  process(input: TInput): Promise<TOutput>;
}

abstract class BaseAgent<TInput, TOutput> implements AgentRepository<TInput, TOutput> {
  protected sessionId: string;
  protected emitter: EventEmitter;

  constructor(sessionId: string, emitter: EventEmitter) {
    this.sessionId = sessionId;
    this.emitter = emitter;
  }

  abstract process(input: TInput): Promise<TOutput>;

  protected emit(event: string, data: unknown) {
    this.emitter.emit(event, { sessionId: this.sessionId, data });
  }

  protected async updateStatus(status: AgentStatus, message?: string) {
    this.emit('agent_status', {
      agentId: this.id,
      status,
      message,
    });
  }

  abstract get id(): AgentId;
}
```

---

## 6. 타입 안전성 패턴

### 6.1 Branded Types

```tsx
// lib/types/branded.ts
declare const brand: unique symbol;

type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

// 사용
type SessionId = Brand<string, 'SessionId'>;
type UserId = Brand<string, 'UserId'>;

function createSessionId(id: string): SessionId {
  return id as SessionId;
}

// 컴파일 타임에 잘못된 사용 방지
function getSession(sessionId: SessionId) { /* ... */ }

const sessionId = createSessionId('sess_123');
const userId = 'user_456' as UserId;

getSession(sessionId); // OK
getSession(userId);    // Error!
```

### 6.2 Discriminated Unions

```tsx
// lib/types/events.ts
type StreamEvent =
  | { type: 'agent_status'; payload: AgentStatusPayload }
  | { type: 'panel_update'; panel: PanelType; payload: PanelData }
  | { type: 'analysis_complete'; payload: AnalysisResult }
  | { type: 'error'; payload: ErrorPayload };

// 타입 가드
function isAgentStatusEvent(event: StreamEvent): event is Extract<StreamEvent, { type: 'agent_status' }> {
  return event.type === 'agent_status';
}

// 사용
function handleEvent(event: StreamEvent) {
  switch (event.type) {
    case 'agent_status':
      // event.payload는 자동으로 AgentStatusPayload 타입
      updateAgentStatus(event.payload);
      break;

    case 'panel_update':
      // event.panel과 event.payload 타입 추론
      updatePanel(event.panel, event.payload);
      break;

    // ...
  }
}
```

### 6.3 Zod 스키마 검증

```tsx
// lib/schemas/analysis.ts
import { z } from 'zod';

export const ContentInputSchema = z.object({
  type: z.enum(['url', 'text', 'image']),
  value: z.string().min(1),
});

export const AnalyzeRequestSchema = ContentInputSchema;

export type ContentInput = z.infer<typeof ContentInputSchema>;

// API Route에서 사용
export async function POST(request: Request) {
  const body = await request.json();

  const result = AnalyzeRequestSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: result.error.errors[0].message,
      },
    }, { status: 400 });
  }

  const { type, value } = result.data;
  // 타입 안전하게 사용
}
```

---

## 7. 테스트 패턴

### 7.1 컴포넌트 테스트

```tsx
// __tests__/SourcePanel.test.tsx
import { render, screen } from '@testing-library/react';
import { SourcePanel } from '@/components/panels/SourcePanel';

describe('SourcePanel', () => {
  const mockData: SourcePanelData = {
    originalSources: [
      {
        originalClaim: 'Test claim',
        verification: { status: 'verified', explanation: 'Verified' },
        trustScore: 85,
      },
    ],
    verificationStatus: 'verified',
    trustScore: 85,
  };

  it('renders loading state', () => {
    render(<SourcePanel data={null} isLoading={true} />);
    expect(screen.getByTestId('panel-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<SourcePanel data={null} isLoading={false} />);
    expect(screen.getByText(/분석을 시작하면/)).toBeInTheDocument();
  });

  it('renders sources when data is provided', () => {
    render(<SourcePanel data={mockData} isLoading={false} />);
    expect(screen.getByText('Test claim')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });
});
```

### 7.2 훅 테스트

```tsx
// __tests__/useAnalysis.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useAnalysis } from '@/hooks/useAnalysis';

// Mock fetch
global.fetch = jest.fn();

describe('useAnalysis', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('fetches analysis data', async () => {
    const mockData = { source: {}, perspective: {}, bias: {} };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    const { result } = renderHook(() => useAnalysis('sess_123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
  });
});
```

---

## 8. 성능 패턴

### 8.1 메모이제이션

```tsx
// 컴포넌트 메모이제이션
const SourceCard = memo(function SourceCard({ source }: { source: VerifiedSource }) {
  return (/* ... */);
});

// 비교 함수 커스텀
const PerspectiveCard = memo(
  function PerspectiveCard({ perspective }: { perspective: Perspective }) {
    return (/* ... */);
  },
  (prevProps, nextProps) => prevProps.perspective.id === nextProps.perspective.id
);

// useMemo / useCallback
function AnalysisPanel({ sources }: { sources: VerifiedSource[] }) {
  const sortedSources = useMemo(
    () => [...sources].sort((a, b) => b.trustScore - a.trustScore),
    [sources]
  );

  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return (
    <div>
      {sortedSources.map((s) => (
        <SourceCard key={s.id} source={s} onClick={handleClick} />
      ))}
    </div>
  );
}
```

### 8.2 지연 로딩

```tsx
// 동적 import
const BiasRadarChart = dynamic(
  () => import('@/components/charts/BiasRadarChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // 클라이언트에서만 렌더링
  }
);

// Suspense와 함께
<Suspense fallback={<PanelSkeleton />}>
  <SourcePanel sessionId={sessionId} />
</Suspense>
```

---

## 참조 문서

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 개요
- [ARCHITECTURE.md](ARCHITECTURE.md) - 시스템 아키텍처
- [API.md](API.md) - API 설계
