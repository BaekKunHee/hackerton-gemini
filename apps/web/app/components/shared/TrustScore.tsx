'use client';

import { motion } from 'framer-motion';

interface TrustScoreProps {
  score: number;
}

function getScoreColor(score: number): string {
  if (score > 70) return 'var(--green-400)';
  if (score >= 40) return 'var(--amber-400)';
  return 'var(--red-400)';
}

export default function TrustScore({ score }: TrustScoreProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;
  const color = getScoreColor(clampedScore);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-2xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {clampedScore}
        </motion.span>
        <span className="text-[10px] text-[var(--text-muted)]">신뢰도</span>
      </div>
    </div>
  );
}
