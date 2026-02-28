'use client';

import { motion } from 'framer-motion';
import type { MindShiftScore } from '@/lib/types';

interface MindShiftCardProps {
  mindShift: MindShiftScore;
}

export default function MindShiftCard({ mindShift }: MindShiftCardProps) {
  const { before, after, change, direction } = mindShift;

  const getDirectionConfig = () => {
    switch (direction) {
      case 'strengthened':
        return {
          emoji: '📈',
          text: '생각이 강화됨',
          color: 'var(--green-400)',
          bgGradient: 'from-green-500/10 to-emerald-500/10',
          borderColor: 'border-green-400/20',
        };
      case 'weakened':
        return {
          emoji: '🔄',
          text: '새로운 시각을 얻음',
          color: 'var(--amber-400)',
          bgGradient: 'from-amber-500/10 to-orange-500/10',
          borderColor: 'border-amber-400/20',
        };
      case 'unchanged':
        return {
          emoji: '➡️',
          text: '생각 유지',
          color: 'var(--text-muted)',
          bgGradient: 'from-gray-500/10 to-slate-500/10',
          borderColor: 'border-gray-400/20',
        };
      default:
        return {
          emoji: '❓',
          text: '',
          color: 'var(--text-muted)',
          bgGradient: 'from-gray-500/10 to-slate-500/10',
          borderColor: 'border-gray-400/20',
        };
    }
  };

  const config = getDirectionConfig();

  if (after === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`p-5 rounded-2xl bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{config.emoji}</span>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
          생각의 변화
        </h4>
      </div>

      <div className="flex items-center justify-center gap-8 mb-4">
        {/* Before Score */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <p className="text-3xl font-bold text-[var(--text-secondary)]">
            {before}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">처음</p>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex-1 max-w-[80px] relative"
        >
          <div className="h-0.5 bg-gradient-to-r from-white/20 via-white/40 to-white/20" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40"
          >
            →
          </motion.div>
        </motion.div>

        {/* After Score */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p
            className="text-3xl font-bold"
            style={{ color: config.color }}
          >
            {after}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">지금</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        {change !== null && change !== 0 && (
          <span
            className="text-sm font-medium mr-1"
            style={{ color: config.color }}
          >
            {change > 0 ? '+' : ''}
            {change}점
          </span>
        )}
        <span className="text-xs text-[var(--text-secondary)]">
          {config.text}
        </span>
      </motion.div>
    </motion.div>
  );
}
