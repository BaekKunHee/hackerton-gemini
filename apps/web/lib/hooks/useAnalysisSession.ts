'use client';

import { useCallback, useState } from 'react';
import { useAnalysisStore } from '@/lib/store/useAnalysisStore';
import { useAgentStore } from '@/lib/store/useAgentStore';
import { useChatStore } from '@/lib/store/useChatStore';
import {
  startAnalysis as apiStartAnalysis,
  sendChatMessage,
  sendConfirmation,
} from '@/lib/api/analysis.service';
import type { ChatMessage } from '@/lib/types';

interface UseAnalysisSessionReturn {
  // State
  sessionId: string | null;
  analysisStatus: 'idle' | 'analyzing' | 'done' | 'error';
  isStarting: boolean;
  chatLoading: boolean;

  // Actions
  startAnalysis: (input: { type: 'url' | 'text' | 'image'; content: string }) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  handleConfirmation: (agreed: boolean) => Promise<void>;
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
  const setAwaitingConfirmation = useChatStore((s) => s.setAwaitingConfirmation);
  const setUserAgreed = useChatStore((s) => s.setUserAgreed);
  const setSearching = useChatStore((s) => s.setSearching);
  const setAwaitingBeliefScore = useChatStore((s) => s.setAwaitingBeliefScore);
  const resetChat = useChatStore((s) => s.reset);

  const startAnalysis = useCallback(
    async (input: { type: 'url' | 'text' | 'image'; content: string }) => {
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

        // Handle awaitingConfirmation
        if (response.awaitingConfirmation) {
          setAwaitingConfirmation(true);
        }

        // Handle searching state
        if (response.isSearching) {
          setSearching(true);
        }

        if (response.isComplete) {
          // Trigger belief_after score input before completing
          setAwaitingBeliefScore('after');
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
    [
      sessionId,
      addMessage,
      setStep,
      setChatLoading,
      setAwaitingConfirmation,
      setSearching,
      setAwaitingBeliefScore,
    ]
  );

  const handleConfirmation = useCallback(
    async (agreed: boolean) => {
      if (!sessionId) return;

      // Add user's choice as a message
      const userMessage: ChatMessage = {
        role: 'user',
        content: agreed ? '네, 동의해요' : '아니요',
        timestamp: new Date(),
      };
      addMessage(userMessage);
      setUserAgreed(agreed);
      setChatLoading(true);

      try {
        const response = await sendConfirmation(sessionId, agreed);

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        };
        addMessage(assistantMessage);

        if (response.isSearching) {
          setSearching(true);
          // Simulate search delay
          setTimeout(async () => {
            try {
              if (useChatStore.getState().isComplete) {
                return;
              }

              // Send another message to get search results
              const followUpResponse = await sendChatMessage(
                sessionId,
                '__SEARCH_COMPLETE__'
              );
              const resultMessage: ChatMessage = {
                role: 'assistant',
                content: followUpResponse.response,
                timestamp: new Date(),
              };
              addMessage(resultMessage);
              if (followUpResponse.isComplete) {
                // Trigger belief_after score input before completing
                setAwaitingBeliefScore('after');
              }
            } catch {
              const errorMessage: ChatMessage = {
                role: 'assistant',
                content: '죄송합니다. 응답을 처리하는 중 오류가 발생했습니다.',
                timestamp: new Date(),
              };
              addMessage(errorMessage);
            } finally {
              setSearching(false);
            }
          }, 2000);
        } else {
          // No search, just continue to next step
          if (response.isComplete) {
            // Trigger belief_after score input before completing
            setAwaitingBeliefScore('after');
          }
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
    [
      sessionId,
      addMessage,
      setUserAgreed,
      setChatLoading,
      setSearching,
      setAwaitingBeliefScore,
    ]
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
    handleConfirmation,
    reset,
  };
}
