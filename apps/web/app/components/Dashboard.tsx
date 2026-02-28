'use client';

import { useState, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Header from '@/app/components/shared/Header';
import ContentInput from '@/app/components/input/ContentInput';
import AgentStatusBar from '@/app/components/agents/AgentStatusBar';
import SourcePanel from '@/app/components/panels/SourcePanel';
import PerspectivePanel from '@/app/components/panels/PerspectivePanel';
import BiasPanel from '@/app/components/panels/BiasPanel';
import SocratesChat from '@/app/components/chat/SocratesChat';
import AnalysisCard from '@/app/components/result/AnalysisCard';
import TabNav from '@/app/components/shared/TabNav';

import { useAnalysisSession } from '@/lib/hooks/useAnalysisSession';
import { useAnalysisStream } from '@/lib/hooks/useAnalysisStream';
import { useDemoMode } from '@/lib/hooks/useDemoMode';
import { useAnalysisStore } from '@/lib/store/useAnalysisStore';
import { useChatStore } from '@/lib/store/useChatStore';

import { DEMO_SOCRATES_QUESTIONS } from '@/lib/demo/data';
import type { ContentInput as ContentInputType } from '@/lib/types';

const PANEL_TABS = ['소스 검증', '다른 관점', '편향 분석'];

function DashboardInner() {
  const {
    sessionId,
    analysisStatus,
    isStarting,
    startAnalysis,
    sendMessage,
    reset,
  } = useAnalysisSession();

  // SSE stream connection
  useAnalysisStream(sessionId);

  // Demo mode
  useDemoMode({ startAnalysis, analysisStatus });

  // Panel data from store
  const panels = useAnalysisStore((s) => s.panels);
  const steelMan = useAnalysisStore((s) => s.steelMan);
  const chatIsComplete = useChatStore((s) => s.isComplete);
  const chatMessages = useChatStore((s) => s.messages);

  // Active panel tab (mobile view)
  const [activeTab, setActiveTab] = useState(0);

  const isIdle = analysisStatus === 'idle';
  const isAnalyzing = analysisStatus === 'analyzing';
  const isDone = analysisStatus === 'done';
  const hasPanelData = panels.source || panels.perspective || panels.bias;

  const handleSubmit = useCallback(
    (input: ContentInputType) => {
      startAnalysis({ type: input.type, content: input.value });
    },
    [startAnalysis]
  );

  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage]
  );

  // Send first Socrates question when analysis completes and no messages yet
  const handleAnalysisDoneEffect = useCallback(() => {
    if (isDone && chatMessages.length === 0) {
      // Auto-send the first Socrates question
      const firstQuestion = DEMO_SOCRATES_QUESTIONS[0];
      useChatStore.getState().addMessage({
        role: 'assistant',
        content: firstQuestion,
        timestamp: new Date(),
      });
    }
  }, [isDone, chatMessages.length]);

  // Trigger auto-question effect
  if (isDone && chatMessages.length === 0) {
    handleAnalysisDoneEffect();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Content Input - shown when idle */}
          <AnimatePresence mode="wait">
            {isIdle && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-8 pt-12 pb-8"
              >
                {/* Hero text */}
                <div className="text-center space-y-3 max-w-lg">
                  <h2 className="gradient-text text-3xl font-bold tracking-tight sm:text-4xl">
                    논쟁에서 이기고 싶으면,
                    <br />
                    먼저 상대를 이해하세요
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    기사나 텍스트를 입력하면 AI 에이전트들이 소스 검증, 관점 분석,
                    편향 진단을 수행합니다.
                  </p>
                </div>

                <ContentInput
                  onSubmit={handleSubmit}
                  isLoading={isStarting}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent Status Bar - shown when analyzing or done */}
          <AnimatePresence>
            {(isAnalyzing || isDone) && (
              <motion.div
                key="agents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AgentStatusBar />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panel Container - shown when panel data exists */}
          <AnimatePresence>
            {hasPanelData && (
              <motion.div
                key="panels"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {/* Mobile: Tab navigation */}
                <div className="mb-4 lg:hidden">
                  <TabNav
                    tabs={PANEL_TABS}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                  />
                </div>

                {/* Desktop: 3 columns / Mobile: single panel */}
                <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
                  <SourcePanel
                    data={panels.source}
                    isLoading={isAnalyzing && !panels.source}
                  />
                  <PerspectivePanel
                    data={panels.perspective}
                    isLoading={isAnalyzing && !panels.perspective}
                  />
                  <BiasPanel
                    data={panels.bias}
                    isLoading={isAnalyzing && !panels.bias}
                  />
                </div>

                {/* Mobile: single tab panel */}
                <div className="lg:hidden">
                  <AnimatePresence mode="wait">
                    {activeTab === 0 && (
                      <motion.div
                        key="source-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SourcePanel
                          data={panels.source}
                          isLoading={isAnalyzing && !panels.source}
                        />
                      </motion.div>
                    )}
                    {activeTab === 1 && (
                      <motion.div
                        key="perspective-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PerspectivePanel
                          data={panels.perspective}
                          isLoading={isAnalyzing && !panels.perspective}
                        />
                      </motion.div>
                    )}
                    {activeTab === 2 && (
                      <motion.div
                        key="bias-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <BiasPanel
                          data={panels.bias}
                          isLoading={isAnalyzing && !panels.bias}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Socrates Chat + Analysis Card - shown when analysis is done */}
          <AnimatePresence>
            {isDone && (
              <motion.div
                key="chat-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 gap-4 lg:grid-cols-2"
              >
                {/* Socrates Chat */}
                <SocratesChat onSend={handleSendMessage} />

                {/* Analysis Card - shown when chat is complete */}
                <AnimatePresence>
                  {chatIsComplete && steelMan ? (
                    <motion.div
                      key="analysis-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <AnalysisCard steelMan={steelMan} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="card-placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center"
                    >
                      <div className="glass rounded-2xl p-8 text-center w-full">
                        <p className="text-sm text-[var(--text-muted)]">
                          대화를 완료하면 분석 카드가 생성됩니다
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-2 opacity-60">
                          소크라테스와의 대화를 통해 비판적 사고를 경험해보세요
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset button - shown when done */}
          <AnimatePresence>
            {isDone && (
              <motion.div
                key="reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center pt-4 pb-8"
              >
                <button
                  onClick={reset}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors underline underline-offset-4"
                >
                  새로운 분석 시작
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
          <div className="animate-shimmer h-8 w-32 rounded-lg" />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
