import { EventEmitter } from 'events';
import type { AnalysisResult, PanelType } from './types';
import type { AgentId, AgentStatus } from './types';

interface SessionData {
  id: string;
  status: 'analyzing' | 'done' | 'error';
  result?: AnalysisResult;
  createdAt: number;
}

interface SessionCallbacks {
  onAgentStatus: (status: {
    agentId: AgentId;
    status: AgentStatus;
    message?: string;
    progress?: number;
  }) => void;
  onPanelUpdate: (
    panel: PanelType,
    data: unknown
  ) => void;
  onComplete: (result: { sessionId: string; result: AnalysisResult }) => void;
  onError: (error: { code: string; message: string; agentId?: string }) => void;
}

const sessions = new Map<string, SessionData>();
const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createSession(id: string): SessionData {
  const session: SessionData = {
    id,
    status: 'analyzing',
    createdAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): SessionData | undefined {
  return sessions.get(id);
}

export function updateSession(
  id: string,
  update: Partial<SessionData>
): void {
  const session = sessions.get(id);
  if (session) {
    Object.assign(session, update);
  }
}

export function subscribeToSession(
  sessionId: string,
  callbacks: SessionCallbacks
): () => void {
  const onAgent = (data: Parameters<SessionCallbacks['onAgentStatus']>[0]) =>
    callbacks.onAgentStatus(data);
  const onPanel = (panel: PanelType, data: unknown) =>
    callbacks.onPanelUpdate(panel, data);
  const onComplete = (
    result: Parameters<SessionCallbacks['onComplete']>[0]
  ) => callbacks.onComplete(result);
  const onError = (error: Parameters<SessionCallbacks['onError']>[0]) =>
    callbacks.onError(error);

  emitter.on(`${sessionId}:agent`, onAgent);
  emitter.on(`${sessionId}:panel`, onPanel);
  emitter.on(`${sessionId}:complete`, onComplete);
  emitter.on(`${sessionId}:error`, onError);

  return () => {
    emitter.off(`${sessionId}:agent`, onAgent);
    emitter.off(`${sessionId}:panel`, onPanel);
    emitter.off(`${sessionId}:complete`, onComplete);
    emitter.off(`${sessionId}:error`, onError);
  };
}

export function emitAgentStatus(
  sessionId: string,
  status: {
    agentId: AgentId;
    status: AgentStatus;
    message?: string;
    progress?: number;
  }
): void {
  emitter.emit(`${sessionId}:agent`, status);
}

export function emitPanelUpdate(
  sessionId: string,
  panel: PanelType,
  data: unknown
): void {
  emitter.emit(`${sessionId}:panel`, panel, data);
}

export function emitComplete(
  sessionId: string,
  result: AnalysisResult
): void {
  updateSession(sessionId, { status: 'done', result });
  emitter.emit(`${sessionId}:complete`, { sessionId, result });
}

export function emitError(
  sessionId: string,
  error: { code: string; message: string; agentId?: string }
): void {
  updateSession(sessionId, { status: 'error' });
  emitter.emit(`${sessionId}:error`, error);
}
