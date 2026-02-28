'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/lib/store/useChatStore';
import ChatMessage from './ChatMessage';
import LoadingDots from '@/app/components/shared/LoadingDots';
import GlassPanel from '@/app/components/shared/GlassPanel';

interface SocratesChatProps {
  onSend: (message: string) => void;
}

export default function SocratesChat({ onSend }: SocratesChatProps) {
  const { messages, isLoading, isComplete } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isComplete) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <GlassPanel animate className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/[0.06]">
        <span className="text-lg">{'\uD83D\uDCAC'}</span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          생각 나누기
        </h3>
        {isComplete && (
          <span className="ml-auto text-[10px] text-[var(--green-400)] bg-[var(--green-400)]/10 rounded-full px-2.5 py-0.5">
            대화 완료
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {messages.length === 0 && (
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

      {/* Input */}
      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isComplete ? '대화가 종료되었습니다' : '생각을 자유롭게 적어주세요...'
            }
            disabled={isLoading || isComplete}
            className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] focus:outline-none focus:ring-1 focus:ring-[var(--indigo-500)]/30 transition-colors disabled:opacity-50"
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isComplete}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background:
                !input.trim() || isLoading || isComplete
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
    </GlassPanel>
  );
}
