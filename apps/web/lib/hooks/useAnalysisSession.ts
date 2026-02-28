'use client';

import { useCallback, useState } from 'react';
import { useAnalysisStore } from '@/lib/store/useAnalysisStore';
import { useAgentStore } from '@/lib/store/useAgentStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { startAnalysis as apiStartAnalysis, sendChatMessage } from '@/lib/api/analysis.service';
import type { ChatMessage } from '@/lib/types';

interface UseAnalysisSessionReturn {
  // State
  sessionId: string | null;
  analysisStatus: 'idle' | 'analyzing' | 'done' | 'error';
  isStarting: boolean;
  chatLoading: boolean;

  // Actions
  startAnalysis: (input: { type: 'url' | 'text'; content: string }) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  reset: () => void;
}

export function useAnalysisSession(): UseAnalysisSessionReturn {
  const [isStarting, setIsStarting] = useState(false);

  const sessionId = useAnalysisStore((s) => s.sessionId);
  const analysisStatus = useAnalysisStore((s) => s.status);
  const storeStartAnalysis = useAnalysisStore((s) => s.startAnalysis);
  const storeSetError = useAnalysisStore((s) => s.setError);
  const resetAnalysis = useAnalysisStore((s) => s.reset);

  const resetAgents = useAgentStore((s) => s.resetAgents);

  const addMessage = useChatStore((s) => s.addMessage);
  const setStep = useChatStore((s) => s.setStep);
  const chatLoading = useChatStore((s) => s.isLoading);
  const setChatLoading = useChatStore((s) => s.setLoading);
  const setChatComplete = useChatStore((s) => s.setComplete);
  const resetChat = useChatStore((s) => s.reset);

  const startAnalysis = useCallback(
    async (input: { type: 'url' | 'text'; content: string }) => {
      setIsStarting(true);
      try {
        const response = await apiStartAnalysis(input.type, input.content);
        storeStartAnalysis(response.sessionId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to start analysis';
        storeSetError(message);
      } finally {
        setIsStarting(false);
      }
    },
    [storeStartAnalysis, storeSetError]
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!sessionId) return;

      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      addMessage(userMessage);
      setChatLoading(true);

      try {
        const response = await sendChatMessage(sessionId, message);

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        };
        addMessage(assistantMessage);
        setStep(response.step);

        if (response.isComplete) {
          setChatComplete();
        }
      } catch {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: '죄송합니다. 응답을 처리하는 중 오류가 발생했습니다.',
          timestamp: new Date(),
        };
        addMessage(errorMessage);
      } finally {
        setChatLoading(false);
      }
    },
    [sessionId, addMessage, setStep, setChatLoading, setChatComplete]
  );

  const reset = useCallback(() => {
    resetAnalysis();
    resetAgents();
    resetChat();
  }, [resetAnalysis, resetAgents, resetChat]);

  return {
    sessionId,
    analysisStatus,
    isStarting,
    chatLoading,
    startAnalysis,
    sendMessage,
    reset,
  };
}
