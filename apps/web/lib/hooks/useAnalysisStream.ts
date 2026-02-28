'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSSE } from './useSSE';
import { useAnalysisStore } from '@/lib/store/useAnalysisStore';
import { useAgentStore } from '@/lib/store/useAgentStore';
import { getResult } from '@/lib/api/analysis.service';
import type { StreamEvent, PanelType, PanelData, AgentId, AgentStatus } from '@/lib/types';

interface UseAnalysisStreamReturn {
  isConnected: boolean;
  error: string | null;
}

export function useAnalysisStream(
  sessionId: string | null
): UseAnalysisStreamReturn {
  const updatePanel = useAnalysisStore((s) => s.updatePanel);
  const analysisStatus = useAnalysisStore((s) => s.status);
  const setComplete = useAnalysisStore((s) => s.setComplete);
  const setError = useAnalysisStore((s) => s.setError);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const pollingIntervalRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (!sessionId || analysisStatus !== 'analyzing') return;

    let cancelled = false;
    let startTimeout: number | null = null;

    const stopPolling = () => {
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    const pollResult = async () => {
      try {
        const result = await getResult(sessionId);
        if (cancelled) return;

        if (result.status === 'done') {
          setComplete(result.result);
          stopPolling();
          return;
        }
        if (result.status === 'error') {
          setError('Analysis failed');
          stopPolling();
        }
      } catch {
        // Keep polling on transient failures.
      }
    };

    if (!isConnected) {
      // Give SSE a short grace period before polling fallback starts.
      startTimeout = window.setTimeout(() => {
        void pollResult();
        pollingIntervalRef.current = window.setInterval(() => {
          void pollResult();
        }, 5000);
      }, 5000);
    } else {
      stopPolling();
    }

    return () => {
      cancelled = true;
      if (startTimeout !== null) {
        window.clearTimeout(startTimeout);
      }
      stopPolling();
    };
  }, [sessionId, isConnected, analysisStatus, setComplete, setError]);

  return { isConnected, error };
}
