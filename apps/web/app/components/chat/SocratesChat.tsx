'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/lib/store/useChatStore';
import ChatMessage from './ChatMessage';
import BeliefScoreSlider from './BeliefScoreSlider';
import LoadingDots from '@/app/components/shared/LoadingDots';
import GlassPanel from '@/app/components/shared/GlassPanel';

interface SocratesChatProps {
  onSend: (message: string) => void;
  onConfirmation?: (agreed: boolean) => void;
  onBeliefScore?: (score: number, phase: 'before' | 'after') => void;
  onEndConversation?: () => void;
}

export default function SocratesChat({
  onSend,
  onConfirmation,
  onBeliefScore,
  onEndConversation,
}: SocratesChatProps) {
  const {
    messages,
    isLoading,
    isComplete,
    awaitingConfirmation,
    isSearching,
    beliefScoreBefore,
    awaitingBeliefScore,
    setBeliefScoreBefore,
    setBeliefScoreAfter,
  } = useChatStore();

  const handleBeliefScore = (score: number) => {
    if (awaitingBeliefScore === 'before') {
      setBeliefScoreBefore(score);
      onBeliefScore?.(score, 'before');
    } else if (awaitingBeliefScore === 'after') {
      setBeliefScoreAfter(score);
      onBeliefScore?.(score, 'after');
    }
  };
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, awaitingConfirmation]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isComplete || awaitingConfirmation) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmation = (agreed: boolean) => {
    onConfirmation?.(agreed);
  };

  return (
    <GlassPanel animate className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/[0.06]">
        <span className="text-lg">{'\uD83D\uDCAC'}</span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          생각 나누기
        </h3>
        {!isComplete && (
          <button
            type="button"
            onClick={onEndConversation}
            className="ml-auto rounded-lg border border-white/15 px-2.5 py-1 text-[10px] text-[var(--text-secondary)] transition-colors hover:border-white/25 hover:text-[var(--text-primary)]"
          >
            대화 종료
          </button>
        )}
        {isComplete && (
          <span className="ml-auto text-[10px] text-[var(--green-400)] bg-[var(--green-400)]/10 rounded-full px-2.5 py-0.5">
            대화 완료
          </span>
        )}
        {isSearching && (
          <span className="ml-auto text-[10px] text-[var(--cyan-400)] bg-[var(--cyan-400)]/10 rounded-full px-2.5 py-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="10" />
            </svg>
            정보 검색 중...
          </span>
        )}
      </div>

      {/* Belief Score Input - After */}
      {awaitingBeliefScore === 'after' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <BeliefScoreSlider
            phase="after"
            onSubmit={handleBeliefScore}
            previousScore={beliefScoreBefore ?? undefined}
          />
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {messages.length === 0 && awaitingBeliefScore !== 'after' && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-[var(--text-muted)] text-center">
              분석이 완료되면 대화가 시작됩니다
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
              <LoadingDots />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Y/N Confirmation Buttons */}
      {awaitingConfirmation && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 pt-3 border-t border-white/[0.06]"
        >
          <p className="text-xs text-[var(--text-secondary)] mb-3 text-center">
            제 분석에 대해 동의하시나요?
          </p>
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={() => handleConfirmation(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 max-w-[140px] rounded-xl px-4 py-3 text-sm font-medium text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--green-500), var(--emerald-400))',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                네, 동의해요
              </span>
            </motion.button>
            <motion.button
              onClick={() => handleConfirmation(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 max-w-[140px] rounded-xl px-4 py-3 text-sm font-medium text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--amber-500), var(--orange-400))',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                아니요
              </span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Input */}
      {!awaitingConfirmation && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isComplete
                  ? '대화가 종료되었습니다'
                  : isSearching
                  ? '정보를 검색하는 중입니다...'
                  : '생각을 자유롭게 적어주세요...'
              }
              disabled={isLoading || isComplete || isSearching}
              className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] focus:outline-none focus:ring-1 focus:ring-[var(--indigo-500)]/30 transition-colors disabled:opacity-50"
            />
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isComplete || isSearching}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background:
                  !input.trim() || isLoading || isComplete || isSearching
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'linear-gradient(135deg, var(--indigo-500), var(--cyan-400))',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </motion.button>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
