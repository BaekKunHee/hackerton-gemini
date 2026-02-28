import type { AgentId, AgentStatus } from './agent';
import type {
  AnalysisResult,
  BiasPanelData,
  PanelType,
  PerspectivePanelData,
  SourcePanelData,
} from './analysis';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// SSE 이벤트 (Discriminated Union)
export type StreamEvent =
  | AgentStatusEvent
  | PanelUpdateEvent
  | AnalysisCompleteEvent
  | StreamErrorEvent;

export interface AgentStatusEvent {
  type: 'agent_status';
  payload: {
    agentId: AgentId;
    status: AgentStatus;
    message?: string;
    progress?: number;
  };
}

export interface PanelUpdateEvent {
  type: 'panel_update';
  panel: PanelType;
  payload: SourcePanelData | PerspectivePanelData | BiasPanelData;
}

export interface AnalysisCompleteEvent {
  type: 'analysis_complete';
  payload: {
    sessionId: string;
    result: AnalysisResult;
  };
}

export interface StreamErrorEvent {
  type: 'error';
  payload: {
    code: string;
    message: string;
    agentId?: string;
  };
}

export interface AnalyzeRequest {
  type: 'url' | 'text';
  content: string;
}

export interface AnalyzeResponse {
  sessionId: string;
  status: 'started';
  streamUrl: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatResponse {
  response: string;
  step: number;
  isComplete: boolean;
}
