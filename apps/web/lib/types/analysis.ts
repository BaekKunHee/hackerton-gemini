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
  // 새로운 분리된 구조
  biases: BiasItem[]; // Main 편향 (인지적 편향)
  instincts: InstinctItem[]; // Main 본능 (Hans Rosling)
  textExamples: BiasExample[];
  alternativeFraming?: string;
  expandedTopics?: ExpandedTopic[]; // 사고의 확장
  relatedContent?: RelatedContent[]; // 연관 콘텐츠

  // Legacy support (기존 호환성)
  biasScores?: BiasScore[];
  dominantBiases?: string[];
}

// Main 편향 (Cognitive Biases)
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

// Main 본능 (Hans Rosling Instincts)
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
