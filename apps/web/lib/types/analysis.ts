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

// 편향 분석 패널 데이터
export interface BiasPanelData {
  biasScores: BiasScore[];
  dominantBiases: string[];
  textExamples: BiasExample[];
  alternativeFraming?: string;
}

export interface BiasScore {
  type: BiasType;
  score: number; // 0-1
}

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
  biasType: BiasType;
  explanation: string;
}

// Steel Man 출력
export interface SteelManOutput {
  opposingArgument: string;
  strengthenedArgument: string;
}

// 최종 분석 결과
export interface AnalysisResult {
  source: SourcePanelData;
  perspective: PerspectivePanelData;
  bias: BiasPanelData;
  steelMan: SteelManOutput;
}

export type PanelType = 'source' | 'perspective' | 'bias';
export type PanelData = SourcePanelData | PerspectivePanelData | BiasPanelData;
