// 콘텐츠 입력
export interface ContentInput {
  type: 'url' | 'text';
  value: string;
  metadata?: {
    title?: string;
    source?: string;
  };
}

// 분석 세션
export interface AnalysisSession {
  id: string;
  createdAt: Date;
  content: ContentInput;
  status: 'analyzing' | 'done' | 'error';
  result?: AnalysisResult;
}

// Primary Source 패널 데이터
export interface SourcePanelData {
  originalSources: VerifiedSource[];
  verificationStatus: 'verified' | 'distorted' | 'context_missing';
  trustScore: number;
}

export interface VerifiedSource {
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
export interface PerspectivePanelData {
  perspectives: Perspective[];
  commonFacts: string[];
  divergencePoints: DivergencePoint[];
  spectrumVisualization?: {
    imageDataUrl: string;
    caption?: string;
    chartType?: 'linear' | 'scatter' | 'bubble' | 'auto';
  };
}

export interface Perspective {
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
    political: number; // -1 ~ 1
    emotional: number; // -1 ~ 1
    complexity: number; // -1 ~ 1
  };
}

export interface DivergencePoint {
  topic: string;
  positions: Record<string, string>;
}

// 연관 콘텐츠
export interface RelatedContent {
  title: string;
  url: string;
  source: string;
  type: 'article' | 'video' | 'research' | 'other';
}

// 편향 분석 패널 데이터
export interface BiasPanelData {
  // 새로운 분리된 구조 (Agent A 응답 구조)
  userInstincts: UserInstinctItem[]; // 사용자 본능 (Hans Rosling 10가지)
  informationBiases: InformationBiasItem[]; // 미디어/정보 편향
  textExamples: BiasExample[];
  alternativeFraming?: string;
  expandedTopics?: ExpandedTopic[]; // 사고의 확장
  relatedContent?: RelatedContent[]; // 연관 콘텐츠

  // Legacy support (기존 호환성)
  biases?: BiasItem[]; // 기존 Main 편향
  instincts?: InstinctItem[]; // 기존 Main 본능
  biasScores?: BiasScore[];
  dominantBiases?: string[];
}

// 사용자 본능 (Hans Rosling 10가지 Instincts)
export type UserInstinctType =
  | 'gap_instinct' // 간극 본능 (우리 vs 그들)
  | 'negativity_instinct' // 부정 본능 (나쁜 뉴스 편향)
  | 'straight_line_instinct' // 직선 본능 (선형 예측)
  | 'fear_instinct' // 공포 본능 (공포 기반 추론)
  | 'size_instinct' // 크기 본능 (비율 맹시)
  | 'generalization_instinct' // 일반화 본능 (고정관념)
  | 'destiny_instinct' // 운명 본능 (불변성)
  | 'single_perspective_instinct' // 단일 관점 본능 (하나의 해결책)
  | 'blame_instinct' // 비난 본능 (희생양 찾기)
  | 'urgency_instinct'; // 급박 본능 (지금 아니면 안됨)

export interface UserInstinctItem {
  instinctType: string; // 본능 유형 명칭
  confidence: number; // 0-1
  reasoning: string; // 왜 이 본능이 작동한다고 판단했는지
  example: string; // 콘텐츠에서의 구체적 사례
  label?: string; // 한국어 라벨 (프론트에서 매핑)
}

// 미디어/정보 편향 (Information Biases)
export type InformationBiasType =
  | 'confirmation_bias' // 확증 편향
  | 'clickbait' // 클릭베이트
  | 'bias_by_omission' // 누락에 의한 편향
  | 'selection_of_sources' // 소스 선택의 편향
  | 'framing'; // 프레이밍

export interface InformationBiasItem {
  biasType: string; // 편향 유형 명칭
  confidence: number; // 0-1
  reasoning: string; // 정보 구성에서 나타나는 편향적 특징 설명
  example: string; // 콘텐츠에서의 구체적 사례
  label?: string; // 한국어 라벨 (프론트에서 매핑)
}

// Legacy: Main 편향 (Cognitive Biases) - 기존 호환성
export type CognitiveBiasType =
  | 'anchoring_bias' // 고정 편향
  | 'confirmation_bias' // 확증편향
  | 'outcome_bias'; // 결과 편향

export interface BiasItem {
  type: CognitiveBiasType;
  score: number; // 0-100 (%)
  reason: string; // 왜 이렇게 판단했는지
  label: string; // 한국어 라벨
}

// Legacy: Main 본능 (Hans Rosling Instincts) - 기존 호환성
export type InstinctType =
  | 'gap_instinct' // 간극 본능
  | 'blame_instinct' // 비난 본능
  | 'negativity_instinct' // 부정 본능
  | 'generalization_instinct' // 일반화 본능
  | 'single_perspective_instinct'; // 단일 관점 본능

export interface InstinctItem {
  type: InstinctType;
  score: number; // 0-100 (%)
  reason: string; // 왜 이렇게 판단했는지
  label: string; // 한국어 라벨
}

// Legacy BiasScore (기존 호환성)
export interface BiasScore {
  type: BiasType;
  score: number; // 0-1
}

// Legacy BiasType (기존 호환성)
export type BiasType =
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

export interface BiasExample {
  text: string;
  biasType: BiasType | CognitiveBiasType | InstinctType;
  explanation: string;
}

// 반박 포인트 (Steel Man용)
export interface RefutationPoint {
  point: string; // 반박해야 할 핵심 포인트
  counterArgument: string; // 반박 방법
  importance: 'critical' | 'important' | 'minor';
}

// Steel Man 출력
export interface SteelManOutput {
  opposingArgument: string;
  strengthenedArgument: string;
  refutationPoints?: RefutationPoint[]; // 반박 포인트 3개
  expandedTopics?: ExpandedTopic[]; // 확장된 영역
}

// 생각 변화 점수 (Before/After)
export interface MindShiftScore {
  before: number; // 1-5
  after: number | null; // 1-5, null until completed
  change: number | null; // after - before
  direction: 'strengthened' | 'weakened' | 'unchanged' | null;
}

// 확장된 영역 (관련 주제)
export interface ExpandedTopic {
  topic: string; // 예: "노동 관점"
  description: string; // 예: "AI 도입으로 인한 일자리 변화와 노동 시장 영향"
  relevance: 'high' | 'medium' | 'low'; // 현재 주제와의 관련성
}

// 최종 분석 결과
export interface AnalysisResult {
  source: SourcePanelData;
  perspective: PerspectivePanelData;
  bias: BiasPanelData;
  steelMan: SteelManOutput;
  mindShift?: MindShiftScore; // 생각 변화 측정
}

export type PanelType = 'source' | 'perspective' | 'bias';
export type PanelData = SourcePanelData | PerspectivePanelData | BiasPanelData;
