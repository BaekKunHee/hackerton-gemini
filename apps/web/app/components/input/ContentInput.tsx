'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ContentInput as ContentInputType } from '@/lib/types';
import GlassPanel from '@/app/components/shared/GlassPanel';

interface ContentInputProps {
  onSubmit: (input: ContentInputType) => void;
  isLoading: boolean;
}

type InputTab = 'url' | 'text';

export default function ContentInput({ onSubmit, isLoading }: ContentInputProps) {
  const [activeTab, setActiveTab] = useState<InputTab>('url');
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    onSubmit({
      type: activeTab,
      value: trimmed,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && activeTab === 'url') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <GlassPanel animate className="w-full max-w-2xl mx-auto">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 mb-4">
        {(['url', 'text'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setValue('');
            }}
            className={`relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="input-tab-indicator"
                className="absolute inset-0 rounded-lg bg-white/[0.06] border border-white/[0.08]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {tab === 'url' ? 'URL' : '텍스트'}
            </span>
          </button>
        ))}
      </div>

      {/* Input area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'url' ? (
            <input
              type="url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="분석할 기사나 게시물 URL을 붙여넣으세요"
              disabled={isLoading}
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] focus:outline-none focus:ring-1 focus:ring-[var(--indigo-500)]/30 transition-colors disabled:opacity-50"
            />
          ) : (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="분석할 텍스트를 붙여넣으세요"
              disabled={isLoading}
              rows={6}
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] focus:outline-none focus:ring-1 focus:ring-[var(--indigo-500)]/30 transition-colors resize-none disabled:opacity-50"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: !value.trim() || isLoading
            ? 'rgba(255, 255, 255, 0.06)'
            : 'linear-gradient(135deg, var(--indigo-500), var(--cyan-400))',
        }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
            />
            에이전트 출동 중...
          </span>
        ) : (
          '분석 시작'
        )}
      </motion.button>
    </GlassPanel>
  );
}
