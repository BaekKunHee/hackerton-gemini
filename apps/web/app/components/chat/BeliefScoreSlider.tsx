'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface BeliefScoreSliderProps {
  phase: 'before' | 'after';
  onSubmit: (score: number) => void;
  previousScore?: number;
}

const SCORE_LABELS: Record<number, string> = {
  1: '전혀 동의 안 함',
  2: '별로 동의 안 함',
  3: '보통',
  4: '꽤 동의함',
  5: '완전 동의',
};

export default function BeliefScoreSlider({
  phase,
  onSubmit,
  previousScore,
}: BeliefScoreSliderProps) {
  const [score, setScore] = useState(3);

  const prompt =
    phase === 'before'
      ? '분석을 시작하기 전에, 이 주장에 얼마나 동의하시나요?'
      : '소크라테스와의 대화를 마치고, 지금은 어떠세요?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm"
    >
      <p className="text-sm text-[var(--text-primary)] mb-4 text-center font-medium">
        {prompt}
      </p>

      {phase === 'after' && previousScore && (
        <p className="text-xs text-[var(--text-muted)] mb-4 text-center">
          처음에는 <span className="text-indigo-400 font-semibold">{previousScore}점</span>이라고 하셨어요
        </p>
      )}

      <div className="flex justify-center gap-3 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            onClick={() => setScore(n)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`w-12 h-12 rounded-full text-lg font-bold transition-all duration-200 ${
              score === n
                ? 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/[0.06] text-[var(--text-secondary)] hover:bg-white/[0.1] border border-white/[0.08]'
            }`}
          >
            {n}
          </motion.button>
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)] text-center mb-5 h-4">
        {SCORE_LABELS[score]}
      </p>

      <motion.button
        onClick={() => onSubmit(score)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-shadow"
      >
        {phase === 'before' ? '분석 시작하기' : '결과 보기'}
      </motion.button>
    </motion.div>
  );
}
