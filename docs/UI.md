# Flipside - UI/UX 설계

---

## 1. 디자인 철학

### 핵심 원칙

1. **플랫폼 ≠ 챗봇**: 대화창이 아닌 분석 대시보드
2. **에이전트 가시성**: AI가 뭘 하는지 실시간으로 보여줌
3. **순차적 공개**: 3개 레이어가 순서대로 채워짐
4. **공유 가능**: 분석 결과를 논쟁 상대에게 보낼 수 있음

### 차별화 포인트

| 일반 AI 챗봇 | Flipside |
|-------------|----------|
| 대화창 중심 | 3패널 대시보드 |
| AI 작업 안 보임 | 에이전트 실시간 상태 표시 |
| 텍스트 답변 | 시각화된 분석 카드 |
| 공유 불가 | 분석 카드 공유 |

---

## 2. 메인 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER                                   │
│  [Logo: Flipside]                              [분석 히스토리]  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     콘텐츠 입력 영역                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ URL / 텍스트 / 스크린샷 붙여넣기                         │   │
│  │ [URL 입력]  [텍스트 입력]  [이미지 업로드]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                            [분석 시작 버튼]     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    에이전트 상태 표시 바                        │
│  🔍 Agent B: 원본 소스 탐색 중...                              │
│  🌐 Agent C: 반대 관점 3개 수집 중...                          │
│  🧠 Agent D: 질문 준비 중...                                   │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────┬───────────────────┬───────────────────────┐
│   PRIMARY SOURCE  │    다른 관점       │      편향 분석        │
│                   │                    │                       │
│   ┌───────────┐   │   관점A ●────────● │   [레이더 차트]       │
│   │ 원본 ✓    │   │   관점B ●────────● │                       │
│   │ 인용 ✗    │   │   관점C ●────────● │   크기본능 ████       │
│   │ 맥락 △    │   │                    │   단일관점 ███        │
│   └───────────┘   │   [스펙트럼 맵]    │   비난본능 █          │
│                   │                    │                       │
│   신뢰도: 72/100  │   관점 다양성: 낮음 │   주요 편향: 비난본능 │
└───────────────────┴───────────────────┴───────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    소크라테스 대화 영역                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💬 '이 주장에서 가장 말이 안 된다고 생각하는             │   │
│  │    부분이 어디예요?'                                     │   │
│  │                                                          │   │
│  │ [답변 입력창]                                [전송]      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 컴포넌트 상세

### 3.1 콘텐츠 입력 영역

```tsx
// app/components/input/ContentInput.tsx
'use client';

interface ContentInputProps {
  onSubmit: (content: ContentInput) => void;
  isLoading: boolean;
}

export default function ContentInput({ onSubmit, isLoading }: ContentInputProps) {
  const [inputType, setInputType] = useState<'url' | 'text' | 'image'>('url');
  const [value, setValue] = useState('');

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      {/* 입력 타입 선택 탭 */}
      <div className="mb-4 flex gap-2">
        <TabButton active={inputType === 'url'} onClick={() => setInputType('url')}>
          🔗 URL
        </TabButton>
        <TabButton active={inputType === 'text'} onClick={() => setInputType('text')}>
          📝 텍스트
        </TabButton>
        <TabButton active={inputType === 'image'} onClick={() => setInputType('image')}>
          🖼️ 이미지
        </TabButton>
      </div>

      {/* 입력 필드 */}
      {inputType === 'url' && (
        <input
          type="url"
          placeholder="분석할 기사 URL을 붙여넣으세요"
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-blue-500 focus:outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}

      {inputType === 'text' && (
        <textarea
          placeholder="분석할 텍스트를 붙여넣으세요"
          className="min-h-[120px] w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-blue-500 focus:outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}

      {inputType === 'image' && (
        <ImageDropzone onUpload={(file) => setValue(file)} />
      )}

      {/* 분석 시작 버튼 */}
      <button
        onClick={() => onSubmit({ type: inputType, value })}
        disabled={isLoading || !value}
        className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300"
      >
        {isLoading ? '분석 중...' : '분석 시작'}
      </button>
    </div>
  );
}
```

### 3.2 에이전트 상태 표시 바

```tsx
// app/components/agents/AgentStatusBar.tsx
'use client';

interface AgentStatusBarProps {
  agents: AgentState[];
}

export default function AgentStatusBar({ agents }: AgentStatusBarProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="space-y-2">
        {agents.map((agent) => (
          <AgentStatusItem key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentStatusItem({ agent }: { agent: AgentState }) {
  const icons = {
    analyzer: '🧠',
    source: '🔍',
    perspective: '🌐',
    socrates: '💬'
  };

  const statusColors = {
    idle: 'text-zinc-400',
    thinking: 'text-yellow-500',
    searching: 'text-blue-500',
    analyzing: 'text-purple-500',
    done: 'text-green-500',
    error: 'text-red-500'
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icons[agent.id]}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className={`font-medium ${statusColors[agent.status]}`}>
            {agent.message || agent.status}
          </span>
          {agent.status !== 'idle' && agent.status !== 'done' && (
            <LoadingDots />
          )}
          {agent.status === 'done' && <span className="text-green-500">✓</span>}
        </div>
        {agent.progress !== undefined && (
          <ProgressBar progress={agent.progress} />
        )}
      </div>
    </div>
  );
}
```

### 3.3 Primary Source 패널

```tsx
// app/components/panels/SourcePanel.tsx
'use client';

interface SourcePanelProps {
  data: SourcePanelData | null;
  isLoading: boolean;
}

export default function SourcePanel({ data, isLoading }: SourcePanelProps) {
  if (isLoading) {
    return <PanelSkeleton title="Primary Source" />;
  }

  if (!data) {
    return <EmptyPanel title="Primary Source" message="분석을 시작하면 결과가 여기에 표시됩니다" />;
  }

  return (
    <div className="h-full rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-4 text-lg font-bold">Primary Source</h3>

      {/* 검증 결과 리스트 */}
      <div className="space-y-3">
        {data.originalSources.map((source, i) => (
          <SourceCard key={i} source={source} />
        ))}
      </div>

      {/* 전체 신뢰도 */}
      <div className="mt-4 border-t border-zinc-100 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">전체 신뢰도</span>
          <TrustScoreBadge score={data.trustScore} />
        </div>
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: VerifiedSource }) {
  const statusBadges = {
    verified: { text: '✓ 일치', color: 'bg-green-100 text-green-700' },
    distorted: { text: '✗ 왜곡', color: 'bg-red-100 text-red-700' },
    context_missing: { text: '△ 맥락 누락', color: 'bg-yellow-100 text-yellow-700' },
    unverifiable: { text: '? 확인 불가', color: 'bg-zinc-100 text-zinc-700' }
  };

  const badge = statusBadges[source.verification.status];

  return (
    <div className="rounded-lg border border-zinc-100 p-3">
      <div className="mb-2 flex items-start justify-between">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.color}`}>
          {badge.text}
        </span>
        <span className="text-xs text-zinc-400">{source.trustScore}/100</span>
      </div>

      <p className="mb-2 text-sm">{source.originalClaim}</p>

      {source.verification.status !== 'verified' && (
        <div className="mt-2 rounded bg-zinc-50 p-2 text-xs">
          <div className="mb-1 text-zinc-500">원본:</div>
          <div className="text-zinc-700">{source.verification.comparison.actual}</div>
        </div>
      )}

      <a
        href={source.originalSource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-xs text-blue-500 hover:underline"
      >
        원본 보기 →
      </a>
    </div>
  );
}
```

### 3.4 다른 관점 패널

```tsx
// app/components/panels/PerspectivePanel.tsx
'use client';

interface PerspectivePanelProps {
  data: PerspectivePanelData | null;
  isLoading: boolean;
}

export default function PerspectivePanel({ data, isLoading }: PerspectivePanelProps) {
  if (isLoading) {
    return <PanelSkeleton title="다른 관점" />;
  }

  if (!data) {
    return <EmptyPanel title="다른 관점" message="분석을 시작하면 결과가 여기에 표시됩니다" />;
  }

  return (
    <div className="h-full rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-4 text-lg font-bold">다른 관점</h3>

      {/* 관점 카드 리스트 */}
      <div className="space-y-3">
        {data.perspectives.map((perspective) => (
          <PerspectiveCard key={perspective.id} perspective={perspective} />
        ))}
      </div>

      {/* 스펙트럼 맵 */}
      <div className="mt-4 border-t border-zinc-100 pt-4">
        <h4 className="mb-2 text-sm font-medium text-zinc-500">관점 스펙트럼</h4>
        <SpectrumMap perspectives={data.perspectives} />
      </div>

      {/* 공통점 / 차이점 */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-green-50 p-2">
          <div className="mb-1 font-medium text-green-700">공통점</div>
          <ul className="text-green-600">
            {data.commonFacts.slice(0, 2).map((fact, i) => (
              <li key={i}>• {fact}</li>
            ))}
          </ul>
        </div>
        <div className="rounded bg-orange-50 p-2">
          <div className="mb-1 font-medium text-orange-700">차이점</div>
          <ul className="text-orange-600">
            {data.divergencePoints.slice(0, 2).map((point, i) => (
              <li key={i}>• {point.topic}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PerspectiveCard({ perspective }: { perspective: Perspective }) {
  return (
    <div className="rounded-lg border border-zinc-100 p-3">
      <div className="mb-1 text-xs text-zinc-400">{perspective.source.publisher}</div>
      <p className="mb-2 text-sm font-medium">{perspective.mainClaim}</p>
      <div className="flex items-center gap-2">
        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {perspective.frame}
        </span>
      </div>
    </div>
  );
}

function SpectrumMap({ perspectives }: { perspectives: Perspective[] }) {
  return (
    <div className="relative h-20 rounded bg-gradient-to-r from-blue-100 via-zinc-100 to-red-100">
      {perspectives.map((p) => (
        <div
          key={p.id}
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600"
          style={{
            left: `${((p.spectrum.political + 1) / 2) * 100}%`,
            top: `${((p.spectrum.emotional + 1) / 2) * 100}%`
          }}
          title={p.mainClaim}
        />
      ))}
      <div className="absolute bottom-0 left-0 text-[10px] text-zinc-400">진보</div>
      <div className="absolute bottom-0 right-0 text-[10px] text-zinc-400">보수</div>
    </div>
  );
}
```

### 3.5 편향 분석 패널

```tsx
// app/components/panels/BiasPanel.tsx
'use client';

interface BiasPanelProps {
  data: BiasPanelData | null;
  isLoading: boolean;
}

export default function BiasPanel({ data, isLoading }: BiasPanelProps) {
  if (isLoading) {
    return <PanelSkeleton title="편향 분석" />;
  }

  if (!data) {
    return <EmptyPanel title="편향 분석" message="분석을 시작하면 결과가 여기에 표시됩니다" />;
  }

  return (
    <div className="h-full rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-4 text-lg font-bold">편향 분석</h3>

      {/* 레이더 차트 */}
      <div className="mb-4 flex justify-center">
        <BiasRadarChart scores={data.biasScores} />
      </div>

      {/* 주요 편향 */}
      <div className="space-y-2">
        {data.biasScores
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((bias) => (
            <BiasBar key={bias.type} bias={bias} />
          ))}
      </div>

      {/* 텍스트 예시 */}
      {data.textExamples.length > 0 && (
        <div className="mt-4 rounded bg-zinc-50 p-3">
          <div className="mb-2 text-xs font-medium text-zinc-500">
            편향이 드러나는 문장
          </div>
          <p className="text-sm text-zinc-700">
            "{data.textExamples[0].text}"
          </p>
          <span className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">
            {data.textExamples[0].biasType}
          </span>
        </div>
      )}
    </div>
  );
}

function BiasBar({ bias }: { bias: BiasScore }) {
  const biasLabels: Record<string, string> = {
    gap_instinct: '이분법 본능',
    negativity_instinct: '부정 본능',
    fear_instinct: '공포 본능',
    size_instinct: '크기 본능',
    generalization_instinct: '일반화 본능',
    single_perspective_instinct: '단일관점 본능',
    blame_instinct: '비난 본능',
    urgency_instinct: '다급함 본능'
  };

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span>{biasLabels[bias.type] || bias.type}</span>
        <span className="text-zinc-400">{Math.round(bias.score * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-red-500"
          style={{ width: `${bias.score * 100}%` }}
        />
      </div>
    </div>
  );
}
```

### 3.6 소크라테스 대화

```tsx
// app/components/chat/SocratesChat.tsx
'use client';

interface SocratesChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function SocratesChat({ messages, onSend, isLoading }: SocratesChatProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <span>💬</span> 생각 나누기
      </h3>

      {/* 메시지 영역 */}
      <div className="mb-4 max-h-60 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-400">
            <LoadingDots />
            <span className="text-sm">생각하는 중...</span>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="생각을 적어주세요..."
          className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300"
        >
          전송
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-100 text-zinc-800'
        }`}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
}
```

---

## 4. 최종 분석 카드

```tsx
// app/components/result/AnalysisCard.tsx
'use client';

interface AnalysisCardProps {
  result: AnalysisResult;
  onShare: () => void;
}

export default function AnalysisCard({ result, onShare }: AnalysisCardProps) {
  return (
    <div className="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-blue-900">Flipside 분석 결과</h2>
      </div>

      <div className="space-y-3">
        {/* Primary Source */}
        <div className="flex items-center gap-2">
          <span>📌</span>
          <span className="font-medium">Primary Source:</span>
          <StatusBadge status={result.source.verificationStatus} />
        </div>

        {/* 관점 다양성 */}
        <div className="flex items-center gap-2">
          <span>🌐</span>
          <span className="font-medium">관점 다양성:</span>
          <span className="text-zinc-600">
            {result.perspective.perspectives.length}개 관점 발견
          </span>
        </div>

        {/* 주요 편향 */}
        <div className="flex items-center gap-2">
          <span>🧠</span>
          <span className="font-medium">주요 편향:</span>
          <span className="text-zinc-600">
            {result.bias.dominantBiases.join(', ')}
          </span>
        </div>
      </div>

      <hr className="my-4 border-zinc-200" />

      {/* Steel Man 버전 */}
      <div className="mb-4">
        <h4 className="mb-2 flex items-center gap-2 font-bold text-blue-800">
          <span>💪</span> 상대 논리 SteelMan 버전
        </h4>
        <p className="rounded-lg bg-white p-3 text-sm text-zinc-700">
          {result.steelMan.opposingArgument}
        </p>
      </div>

      {/* 내 논리 강화 포인트 */}
      <div className="mb-4">
        <h4 className="mb-2 flex items-center gap-2 font-bold text-blue-800">
          <span>🎯</span> 내 주장 강화 포인트
        </h4>
        <p className="rounded-lg bg-white p-3 text-sm text-zinc-700">
          {result.steelMan.strengthenedArgument}
        </p>
      </div>

      {/* 공유 버튼 */}
      <button
        onClick={onShare}
        className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        공유하기
      </button>
    </div>
  );
}
```

---

## 5. 색상 팔레트

```css
/* Tailwind 기반 색상 */
:root {
  /* Primary */
  --blue-50: #eff6ff;
  --blue-100: #dbeafe;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;

  /* Neutral */
  --zinc-50: #fafafa;
  --zinc-100: #f4f4f5;
  --zinc-200: #e4e4e7;
  --zinc-400: #a1a1aa;
  --zinc-500: #71717a;
  --zinc-600: #52525b;
  --zinc-700: #3f3f46;
  --zinc-800: #27272a;

  /* Status */
  --green-100: #dcfce7;
  --green-500: #22c55e;
  --green-700: #15803d;

  --yellow-100: #fef9c3;
  --yellow-500: #eab308;

  --red-100: #fee2e2;
  --red-500: #ef4444;
  --red-700: #b91c1c;
}
```

---

## 6. 반응형 디자인

```tsx
// 3패널 → 모바일에서 탭 전환
<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
  {/* 모바일: 탭 네비게이션 */}
  <div className="lg:hidden">
    <TabNav
      tabs={['Primary Source', '다른 관점', '편향 분석']}
      activeTab={activeTab}
      onChange={setActiveTab}
    />
  </div>

  {/* 데스크톱: 3컬럼 */}
  <div className="hidden lg:block"><SourcePanel /></div>
  <div className="hidden lg:block"><PerspectivePanel /></div>
  <div className="hidden lg:block"><BiasPanel /></div>

  {/* 모바일: 선택된 패널만 */}
  <div className="lg:hidden">
    {activeTab === 0 && <SourcePanel />}
    {activeTab === 1 && <PerspectivePanel />}
    {activeTab === 2 && <BiasPanel />}
  </div>
</div>
```

---

## 참조 문서

- [시스템 아키텍처](ARCHITECTURE.md)
- [AI 에이전트 설계](AGENTS.md)
- [API 설계](API.md)
