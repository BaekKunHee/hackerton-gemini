# Flipside - AI 에이전트 설계

---

## 1. 에이전트 시스템 개요

Flipside는 4개의 AI 에이전트가 독립적으로 + 협력하여 작동합니다.

```
입력: URL / 텍스트 / 스크린샷
         │
         ▼
┌─────────────────────────────────────────────────┐
│          Agent A: Analyzer (오케스트레이터)      │
│  • 핵심 주장 추출  • 논리 구조 파악              │
│  • 인용 소스 식별  • 편향 패턴 사전 감지         │
└─────────────────────────────────────────────────┘
         │           │           │
         ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Agent B   │ │   Agent C   │ │   Agent D   │
│   Source    │ │ Perspective │ │  Socrates   │
│  Verifier   │ │  Explorer   │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
         │           │           │
         └───────────┴───────────┘
                     │
                     ▼
           실시간 UI 패널 채움
```

---

## 2. Agent A: Analyzer (오케스트레이터)

### 역할
모든 에이전트의 출발점. **사용자에게 보이지 않음** (백그라운드).

### 작업 상세

| 작업 | 방법 | Gemini 기능 |
|------|------|------------|
| 콘텐츠 파싱 | URL → 본문 추출, 스크린샷 → 텍스트+이미지 동시 분석 | Multimodal Vision |
| 주장 구조화 | 핵심 주장 3개, 근거, 인용 소스 추출 | Deep Think |
| 편향 사전 감지 | 어떤 본능/편향 패턴이 작동 중인지 분류 | Structured Output |
| 에이전트 지시 | B, C, D에게 무엇을 탐색할지 지시 | Agentic Orchestration |

### 프롬프트 템플릿

```typescript
// lib/gemini/prompts.ts
export const ANALYZER_PROMPT = `
당신은 콘텐츠 분석 전문가입니다. 주어진 콘텐츠를 분석하여 다음을 추출하세요:

## 분석 항목
1. **핵심 주장 (최대 3개)**: 콘텐츠의 main argument
2. **근거**: 각 주장을 뒷받침하는 evidence
3. **인용 소스**: 언급된 데이터, 연구, 전문가 등
4. **논리 구조**: 주장이 어떻게 연결되는지
5. **사전 편향 감지**: Hans Rosling 10 Instincts 중 어떤 패턴이 보이는지

## Hans Rosling 10 Instincts
1. Gap Instinct (이분법 본능)
2. Negativity Instinct (부정 본능)
3. Straight Line Instinct (직선 본능)
4. Fear Instinct (공포 본능)
5. Size Instinct (크기 본능)
6. Generalization Instinct (일반화 본능)
7. Destiny Instinct (운명 본능)
8. Single Perspective Instinct (단일관점 본능)
9. Blame Instinct (비난 본능)
10. Urgency Instinct (다급함 본능)

## 출력 형식 (JSON)
{
  "claims": [
    { "id": 1, "text": "...", "evidence": "...", "sources": [...] }
  ],
  "logicStructure": "...",
  "detectedBiases": [
    { "type": "blame_instinct", "confidence": 0.8, "example": "..." }
  ],
  "agentInstructions": {
    "sourceVerifier": { "sources": [...], "checkFor": [...] },
    "perspectiveExplorer": { "topic": "...", "keywords": [...] }
  }
}
`;
```

### 출력 타입

```typescript
// lib/types/agent.ts
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
```

---

## 3. Agent B: Source Verifier

### 역할
**Primary Source 패널**을 채우는 에이전트. 인용된 소스의 원본을 검증합니다.

### 작업 상세

| 작업 | 방법 | 출력 |
|------|------|------|
| 원본 소스 탐색 | Google Search Grounding으로 인용 원본 자율 탐색 | 원본 링크 + 실제 내용 |
| 왜곡 감지 | 원본 vs 기사 인용 비교 분석 | 일치/왜곡/맥락 누락 판정 |
| 신뢰도 스코어 | 소스 발행처, 날짜, 인용 횟수 기반 | 신뢰도 점수 0-100 |

### 프롬프트 템플릿

```typescript
export const SOURCE_VERIFIER_PROMPT = `
당신은 팩트체킹 전문가입니다. 주어진 인용/주장의 원본 소스를 찾아 검증하세요.

## 검증할 소스
{sources}

## 검증 작업
1. **원본 탐색**: 인용된 연구/데이터/발언의 실제 원본 찾기
2. **인용 정확성 확인**: 원본 내용과 인용된 내용 비교
3. **맥락 확인**: 원본의 맥락이 보존되었는지 확인
4. **신뢰도 평가**: 소스의 신뢰성 평가

## 판정 기준
- **verified**: 정확하게 인용됨
- **distorted**: 내용이 왜곡됨
- **context_missing**: 중요한 맥락이 누락됨
- **unverifiable**: 원본을 찾을 수 없음

## 출력 형식 (JSON)
{
  "sources": [
    {
      "originalClaim": "기사에서 인용한 내용",
      "originalSource": {
        "url": "원본 URL",
        "title": "원본 제목",
        "publisher": "발행처",
        "date": "발행일",
        "relevantQuote": "실제 원본 내용"
      },
      "verification": {
        "status": "verified|distorted|context_missing|unverifiable",
        "explanation": "판정 근거",
        "comparison": {
          "claimed": "인용된 내용",
          "actual": "실제 내용"
        }
      },
      "trustScore": 85
    }
  ],
  "overallTrustScore": 72,
  "summary": "전체 검증 요약"
}
`;
```

### 출력 타입

```typescript
interface SourceVerifierOutput {
  sources: VerifiedSource[];
  overallTrustScore: number;
  summary: string;
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
```

---

## 4. Agent C: Perspective Explorer

### 역할
**다른 관점 패널**을 채우는 에이전트. 동일 이슈의 다양한 관점을 탐색합니다.

### 작업 상세

| 작업 | 방법 | 출력 |
|------|------|------|
| 반대 관점 수집 | 동일 이슈 다른 프레임 소스 3-5개 자율 탐색 | 관점 카드 리스트 |
| 프레임 분석 | 같은 팩트를 왜 다르게 해석하는지 추출 | 프레임 차이 시각화 |
| 스펙트럼 매핑 | 좌-우, 공포-희망, 단순-복잡 축으로 배치 | 관점 스펙트럼 맵 |

### 프롬프트 템플릿

```typescript
export const PERSPECTIVE_EXPLORER_PROMPT = `
당신은 다양한 관점을 탐색하는 전문가입니다. 주어진 주제에 대해 다양한 시각을 찾아주세요.

## 탐색할 주제
{topic}

## 원본 콘텐츠의 주요 주장
{claims}

## 탐색 작업
1. **반대 관점 찾기**: 같은 팩트를 다르게 해석하는 소스 3-5개
2. **프레임 분석**: 각 관점이 어떤 프레임(frame)을 사용하는지
3. **공통점 추출**: 모든 관점이 동의하는 팩트
4. **차이점 분석**: 어디서 결론이 갈리는지

## 스펙트럼 축
- 정치적: 진보(-1) ~ 보수(+1)
- 감정적: 공포(-1) ~ 희망(+1)
- 복잡성: 단순(-1) ~ 복잡(+1)

## 출력 형식 (JSON)
{
  "perspectives": [
    {
      "id": 1,
      "source": { "url": "...", "title": "...", "publisher": "..." },
      "mainClaim": "이 관점의 핵심 주장",
      "frame": "사용하는 프레임 (예: 경제적 관점, 환경적 관점)",
      "keyPoints": ["주요 포인트 1", "주요 포인트 2"],
      "spectrum": {
        "political": 0.3,
        "emotional": -0.5,
        "complexity": 0.7
      }
    }
  ],
  "commonFacts": ["모든 관점이 동의하는 팩트"],
  "divergencePoints": [
    {
      "topic": "의견이 갈리는 지점",
      "positions": { "A": "...", "B": "..." }
    }
  ],
  "summary": "관점 다양성 요약"
}
`;
```

### 출력 타입

```typescript
interface PerspectiveExplorerOutput {
  perspectives: Perspective[];
  commonFacts: string[];
  divergencePoints: DivergencePoint[];
  summary: string;
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
    political: number;  // -1 ~ 1
    emotional: number;  // -1 ~ 1
    complexity: number; // -1 ~ 1
  };
}

interface DivergencePoint {
  topic: string;
  positions: Record<string, string>;
}
```

---

## 5. Agent D: Socrates (대화 에이전트)

### 역할
분석 결과를 바탕으로 사용자와 대화하는 에이전트. **Agent B, C와 실시간 협력**.

### 핵심 원칙
> Agent D는 분석을 바로 주지 않습니다. **먼저 물어봅니다.**

### 질문 순서

| 단계 | 질문 | 목적 |
|------|------|------|
| Q1 (Layer 1 전) | "이 주장에서 가장 말이 안 된다고 생각하는 부분이 어디예요?" | 초기 인식 파악 |
| Q2 (Layer 1 후) | "원본 데이터 보니까 어떤 생각이 들어요?" | 팩트 반응 확인 |
| Q3 (Layer 2 후) | "반대 관점 중 가장 말이 되는 게 뭐예요?" | 관점 수용성 확인 |
| Q4 (Layer 3 후) | "지금도 처음이랑 같은 생각이에요?" | 변화 측정 |

### 에이전트 간 실시간 협력

Agent B, C가 팩트를 찾으면 바로 대화에 삽입하는 게 아닙니다:

1. Agent B/C → Agent D에게 먼저 전달
2. Agent D가 '지금 이 팩트 넣을 타이밍인가?' 판단
3. 대화 흐름에 자연스럽게 삽입

```typescript
// 예시: Agent D의 팩트 삽입 판단
if (userJustAnswered && relevantFactAvailable) {
  return `참고로, 방금 원본 데이터를 찾아봤는데요... ${fact}`;
}
```

### 사용자 포기 대응

| 포기 유형 | 감지 신호 | 에이전트 대응 |
|----------|----------|-------------|
| 귀찮음 | 답변이 짧아짐, 속도 느려짐 | 스냅샷 모드 — 핵심 1개만 30초 요약 |
| 방어적 | '나 설득하려는 거죠?' 반문 | 역설적 개입 — '맞아요, 가장 강한 버전 알아야 이기니까요' |
| 과부하 | '모르겠어요' '너무 복잡해요' | 감정 리셋 — '가장 화나는 부분이 어디예요?' |

### 프롬프트 템플릿

```typescript
export const SOCRATES_PROMPT = `
당신은 소크라테스식 대화를 이끄는 전문가입니다.

## 대화 원칙
1. 바로 답을 주지 않고, 질문으로 이끌기
2. 사용자의 기존 생각을 존중하면서 새로운 관점 제시
3. 절대 "당신이 틀렸다"고 말하지 않기
4. "이기려면 상대를 알아야 한다"는 프레임 유지

## 현재 분석 상태
- 원본 검증 결과: {sourceResult}
- 다른 관점: {perspectives}
- 감지된 편향: {biases}

## 대화 단계
현재 단계: {currentStep}

## 사용자 응답
{userMessage}

## 응답 지침
- 사용자 응답에 공감 표현
- 다음 단계로 자연스럽게 이끌기
- 필요시 분석 결과를 적절히 삽입
- 절대 설교하지 않기
`;
```

### Thought Signatures 활용

Gemini 3의 Thought Signatures로 멀티턴 대화 전체에서 추론 일관성 유지:

```typescript
// 대화 컨텍스트 유지
interface ConversationContext {
  sessionId: string;
  initialReaction: string;       // Q1 답변
  factReaction: string;          // Q2 답변
  perspectiveReaction: string;   // Q3 답변
  thoughtSignature: string;      // Gemini Thought Signature
}
```

---

## 6. 에이전트 상태 관리

### 상태 타입

```typescript
type AgentId = 'analyzer' | 'source' | 'perspective' | 'socrates';
type AgentStatus = 'idle' | 'thinking' | 'searching' | 'analyzing' | 'done' | 'error';

interface AgentState {
  id: AgentId;
  status: AgentStatus;
  message?: string;        // 현재 작업 설명
  progress?: number;       // 0-100
  result?: unknown;        // 에이전트별 결과
  error?: string;
}

// 전체 에이전트 상태
interface AgentsState {
  analyzer: AgentState;
  source: AgentState;
  perspective: AgentState;
  socrates: AgentState;
}
```

### 상태 메시지 예시

```typescript
const AGENT_MESSAGES = {
  analyzer: {
    thinking: '콘텐츠를 분석하고 있어요...',
    analyzing: '핵심 주장을 추출하고 있어요...',
    done: '분석 완료!'
  },
  source: {
    searching: '원본 소스를 찾고 있어요...',
    analyzing: '인용 정확성을 검증하고 있어요...',
    done: '소스 검증 완료!'
  },
  perspective: {
    searching: '다른 관점을 탐색하고 있어요...',
    analyzing: '관점 차이를 분석하고 있어요...',
    done: '관점 탐색 완료!'
  },
  socrates: {
    thinking: '질문을 준비하고 있어요...',
    done: '대화 준비 완료!'
  }
};
```

---

## 7. 구현 코드 예시

### 에이전트 베이스 클래스

```typescript
// lib/agents/base.ts
abstract class BaseAgent<TInput, TOutput> {
  protected sessionId: string;
  protected gemini: GenerativeModel;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.gemini = geminiPro;
  }

  abstract get prompt(): string;
  abstract process(input: TInput): Promise<TOutput>;

  protected async updateStatus(status: AgentStatus, message?: string) {
    await emitAgentStatus(this.sessionId, {
      id: this.id,
      status,
      message
    });
  }

  protected async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const result = await this.gemini.generateContent(prompt);
    const text = result.response.text();
    return schema.parse(JSON.parse(text));
  }
}
```

### Source Verifier 구현

```typescript
// lib/agents/source-verifier.ts
class SourceVerifier extends BaseAgent<
  SourceVerifierInstruction,
  SourceVerifierOutput
> {
  id = 'source' as const;

  async process(instruction: SourceVerifierInstruction): Promise<SourceVerifierOutput> {
    await this.updateStatus('searching', '원본 소스를 찾고 있어요...');

    // Search Grounding으로 원본 탐색
    const searchResults = await this.searchOriginalSources(instruction.sources);

    await this.updateStatus('analyzing', '인용 정확성을 검증하고 있어요...');

    // 검증 수행
    const verifiedSources = await this.verifySources(
      instruction.sources,
      searchResults
    );

    await this.updateStatus('done', '소스 검증 완료!');

    return {
      sources: verifiedSources,
      overallTrustScore: this.calculateOverallScore(verifiedSources),
      summary: this.generateSummary(verifiedSources)
    };
  }

  private async searchOriginalSources(sources: string[]) {
    // Gemini Search Grounding 사용
    const model = geminiProWithSearch;
    // ... 구현
  }
}
```

---

## 참조 문서

- [시스템 아키텍처](ARCHITECTURE.md)
- [UI/UX 설계](UI.md)
- [API 설계](API.md)
