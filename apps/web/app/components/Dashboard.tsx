'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Header from '@/app/components/shared/Header';
import ContentInput from '@/app/components/input/ContentInput';
import AgentStatusBar from '@/app/components/agents/AgentStatusBar';
import SourcePanel from '@/app/components/panels/SourcePanel';
import PerspectivePanel from '@/app/components/panels/PerspectivePanel';
import BiasPanel from '@/app/components/panels/BiasPanel';
import SocratesChat from '@/app/components/chat/SocratesChat';
import AnalysisCard from '@/app/components/result/AnalysisCard';
import MindShiftCard from '@/app/components/result/MindShiftCard';
import BeliefScoreSlider from '@/app/components/chat/BeliefScoreSlider';
import TabNav from '@/app/components/shared/TabNav';

import { useAnalysisSession } from '@/lib/hooks/useAnalysisSession';
import { useAnalysisStream } from '@/lib/hooks/useAnalysisStream';
import { useAnalysisStore } from '@/lib/store/useAnalysisStore';
import { useChatStore } from '@/lib/store/useChatStore';

import type { ContentInput as ContentInputType } from '@/lib/types';

const PANEL_TABS = ['소스 검증', '편향 분석', '다른 관점'];

function DashboardInner() {
  const {
    sessionId,
    analysisStatus,
    isStarting,
    startAnalysis,
    sendMessage,
    handleConfirmation,
    reset: sessionReset,
  } = useAnalysisSession();

  // SSE stream connection
  useAnalysisStream(sessionId);

  // Panel data from store
  const panels = useAnalysisStore((s) => s.panels);
  const steelMan = useAnalysisStore((s) => s.steelMan);
  const analysisError = useAnalysisStore((s) => s.error);
  const chatIsComplete = useChatStore((s) => s.isComplete);
  const chatMessages = useChatStore((s) => s.messages);
  const beliefScoreBefore = useChatStore((s) => s.beliefScoreBefore);
  const beliefScoreAfter = useChatStore((s) => s.beliefScoreAfter);
  const phase = useChatStore((s) => s.phase);
  const setChatComplete = useChatStore((s) => s.setComplete);

  // Active panel tab (mobile view)
  const [activeTab, setActiveTab] = useState(0);

  // Pending input: saved when user submits, waiting for belief score
  const [pendingInput, setPendingInput] = useState<ContentInputType | null>(null);

  // CTA: user must click to start Socrates conversation
  const [showChat, setShowChat] = useState(false);

  const isIdle = analysisStatus === 'idle';
  const isAnalyzing = analysisStatus === 'analyzing';
  const isDone = analysisStatus === 'done';
  const isError = analysisStatus === 'error';

  // Step 1: User submits content → show belief score (don't start analysis yet)
  const handleSubmit = useCallback(
    (input: ContentInputType) => {
      setPendingInput(input);
    },
    []
  );

  // Step 2: Belief score submitted → now start analysis
  const handleBeliefScoreBefore = useCallback(
    (score: number) => {
      useChatStore.getState().setBeliefScoreBefore(score);
      if (pendingInput) {
        startAnalysis({ type: pendingInput.type, content: pendingInput.value });
        setPendingInput(null);
      }
    },
    [pendingInput, startAnalysis]
  );

  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage]
  );

  const handleBeliefScore = useCallback(
    (score: number, scorePhase: 'before' | 'after') => {
      console.log(`Belief score ${scorePhase}:`, score);
    },
    []
  );

  const handleEndConversation = useCallback(() => {
    useChatStore.getState().addMessage({
      role: 'assistant',
      content: '대화를 종료했어요. 오른쪽 분석 카드에서 결과를 바로 확인해보세요.',
      timestamp: new Date(),
    });
    setChatComplete();
  }, [setChatComplete]);

  // Send first Socrates question when chat is opened and belief score exists
  useEffect(() => {
    if (showChat && isDone && chatMessages.length === 0 && beliefScoreBefore !== null && phase === 'questions') {
      useChatStore.getState().addMessage({
        role: 'assistant',
        content: '이 주장에서 가장 말이 안 된다고 생각하는 부분이 어디예요?',
        timestamp: new Date(),
      });
    }
  }, [showChat, isDone, chatMessages.length, beliefScoreBefore, phase]);

  // Compute mind shift for display
  const mindShift =
    beliefScoreBefore !== null && beliefScoreAfter !== null
      ? {
          before: beliefScoreBefore,
          after: beliefScoreAfter,
          change: beliefScoreAfter - beliefScoreBefore,
          direction:
            beliefScoreAfter > beliefScoreBefore
              ? ('strengthened' as const)
              : beliefScoreAfter < beliefScoreBefore
                ? ('weakened' as const)
                : ('unchanged' as const),
        }
      : null;

  const reset = useCallback(() => {
    sessionReset();
    setPendingInput(null);
    setShowChat(false);
    setActiveTab(0);
  }, [sessionReset]);

  // Mobile: which tabs are disabled (no data yet)
  const disabledTabs = [
    !panels.source,
    !panels.bias,
    !panels.perspective,
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Content Input - shown when idle/error and no pending belief score */}
          <AnimatePresence mode="wait">
            {(isIdle || isError) && !pendingInput && (
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
                    진짜 설득은
                    <br />
                    상대를 이해하는 것에서 시작됩니다
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    기사나 텍스트를 입력하면 AI 에이전트들이 소스 검증, 관점 분석,
                    편향 진단을 수행합니다.
                  </p>
                </div>

                {isError && (
                  <div className="w-full max-w-2xl rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    분석 중 오류가 발생했습니다.
                    {analysisError ? ` (${analysisError})` : ''}
                  </div>
                )}

                <ContentInput
                  onSubmit={handleSubmit}
                  isLoading={isStarting}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Belief Score BEFORE analysis */}
          <AnimatePresence mode="wait">
            {pendingInput && isIdle && (
              <motion.div
                key="belief-before"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-6 pt-8 pb-8"
              >
                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    분석을 시작하기 전에
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    나중에 생각이 어떻게 변했는지 비교해볼게요
                  </p>
                </div>
                <div className="w-full max-w-md">
                  <BeliefScoreSlider
                    phase="before"
                    onSubmit={handleBeliefScoreBefore}
                  />
                </div>
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

          {/* === Sequential Panel Reveal === */}

          {/* Mobile: Tab navigation - shown when any panel has data */}
          <AnimatePresence>
            {(panels.source || panels.bias || panels.perspective) && (
              <motion.div
                key="mobile-tabs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden"
              >
                <TabNav
                  tabs={PANEL_TABS}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  disabledTabs={disabledTabs}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop: Sequential vertical stack - each panel appears when data arrives */}
          <div className="hidden lg:flex lg:flex-col lg:gap-4">
            <AnimatePresence>
              {panels.source && (
                <motion.div
                  key="panel-source"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <SourcePanel data={panels.source} isLoading={false} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {panels.bias && (
                <motion.div
                  key="panel-bias"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <BiasPanel data={panels.bias} isLoading={false} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {panels.perspective && (
                <motion.div
                  key="panel-perspective"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <PerspectivePanel data={panels.perspective} isLoading={false} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading indicator for next panel */}
            <AnimatePresence>
              {isAnalyzing && (!panels.source || !panels.bias || !panels.perspective) && (
                <motion.div
                  key="panel-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center py-8"
                >
                  <div className="flex items-center gap-3 text-[var(--text-muted)]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="h-4 w-4 rounded-full border-2 border-white/10 border-t-[var(--indigo-500)]"
                    />
                    <span className="text-xs">
                      {!panels.source
                        ? '소스를 검증하고 있어요...'
                        : !panels.bias
                          ? '편향을 분석하고 있어요...'
                          : '다른 관점을 탐색하고 있어요...'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile: single tab panel */}
          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              {activeTab === 0 && panels.source && (
                <motion.div
                  key="source-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SourcePanel data={panels.source} isLoading={false} />
                </motion.div>
              )}
              {activeTab === 1 && panels.bias && (
                <motion.div
                  key="bias-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <BiasPanel data={panels.bias} isLoading={false} />
                </motion.div>
              )}
              {activeTab === 2 && panels.perspective && (
                <motion.div
                  key="perspective-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PerspectivePanel data={panels.perspective} isLoading={false} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile loading indicator */}
            {isAnalyzing && !panels.source && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white/10 border-t-[var(--indigo-500)]"
                  />
                  <span className="text-xs">에이전트가 분석 중이에요...</span>
                </div>
              </div>
            )}
          </div>

          {/* === CTA: Transition to Socrates Chat === */}
          {/* Show CTA when all panels are loaded OR analysis is done */}
          <AnimatePresence>
            {(isDone || (panels.source && panels.bias && panels.perspective)) && !showChat && (
              <motion.div
                key="chat-cta"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex justify-center py-6"
              >
                <motion.button
                  onClick={() => setShowChat(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden rounded-2xl px-8 py-4 text-sm font-semibold text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--indigo-500), var(--cyan-400))',
                  }}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="text-base">{'\uD83D\uDCAC'}</span>
                    <span>
                      분석 결과를 확인했으면, 이제 이야기해볼까요?
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                  />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Socrates Chat + Analysis Card - shown after CTA click */}
          <AnimatePresence>
            {isDone && showChat && (
              <motion.div
                key="chat-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 gap-4 lg:grid-cols-2"
              >
                {/* Socrates Chat */}
                <SocratesChat
                  onSend={handleSendMessage}
                  onConfirmation={handleConfirmation}
                  onBeliefScore={handleBeliefScore}
                  onEndConversation={handleEndConversation}
                />

                {/* Analysis Card + Mind Shift - shown when chat is complete */}
                <AnimatePresence>
                  {chatIsComplete && steelMan ? (
                    <motion.div
                      key="analysis-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-4"
                    >
                      {/* Mind Shift Card - shows belief change */}
                      {mindShift && <MindShiftCard mindShift={mindShift} />}
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

          {/* Reset button - shown when done/error */}
          <AnimatePresence>
            {(isDone || isError) && (
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
