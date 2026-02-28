import type { BiasType } from './analysis';

export type AgentId = 'analyzer' | 'source' | 'perspective' | 'socrates';

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'analyzing'
  | 'done'
  | 'error';

export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  message?: string;
  progress?: number;
  result?: unknown;
  error?: string;
}

export interface AnalyzerOutput {
  claims: Claim[];
  logicStructure: string;
  detectedBiases: DetectedBias[];
  agentInstructions: {
    sourceVerifier: SourceVerifierInstruction;
    perspectiveExplorer: PerspectiveInstruction;
  };
}

export interface Claim {
  id: number;
  text: string;
  evidence: string;
  sources: string[];
}

export interface DetectedBias {
  type: BiasType;
  confidence: number;
  example: string;
}

export interface SourceVerifierInstruction {
  sources: string[];
  checkFor: string[];
}

export interface PerspectiveInstruction {
  topic: string;
  keywords: string[];
}
