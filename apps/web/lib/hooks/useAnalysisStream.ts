'use client';

import { useCallback } from 'react';
import { useSSE } from './useSSE';
import { useAnalysisStore } from '@/lib/store/useAnalysisStore';
import { useAgentStore } from '@/lib/store/useAgentStore';
import type { StreamEvent, PanelType, PanelData, AgentId, AgentStatus } from '@/lib/types';

interface UseAnalysisStreamReturn {
  isConnected: boolean;
  error: string | null;
}

export function useAnalysisStream(
  sessionId: string | null
): UseAnalysisStreamReturn {
  const updatePanel = useAnalysisStore((s) => s.updatePanel);
  const setComplete = useAnalysisStore((s) => s.setComplete);
  const setError = useAnalysisStore((s) => s.setError);
  const updateAgent = useAgentStore((s) => s.updateAgent);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as StreamEvent;

        switch (data.type) {
          case 'agent_status':
            updateAgent(data.payload.agentId as AgentId, {
              status: data.payload.status as AgentStatus,
              message: data.payload.message,
              progress: data.payload.progress,
            });
            break;

          case 'panel_update':
            updatePanel(data.panel as PanelType, data.payload as PanelData);
            break;

          case 'analysis_complete':
            setComplete(data.payload.result);
            break;

          case 'error':
            setError(data.payload.message);
            break;
        }
      } catch {
        // Ignore parse errors for non-JSON messages
      }
    },
    [updatePanel, setComplete, setError, updateAgent]
  );

  const url = sessionId ? `/api/stream/${sessionId}` : null;

  const { isConnected, error } = useSSE(url, {
    onMessage: handleMessage,
  });

  return { isConnected, error };
}
