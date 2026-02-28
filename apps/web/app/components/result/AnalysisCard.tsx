'use client';

import { motion } from 'framer-motion';
import type { SteelManOutput } from '@/lib/types';
import GlassPanel from '@/app/components/shared/GlassPanel';

interface AnalysisCardProps {
  steelMan: SteelManOutput;
}

export default function AnalysisCard({ steelMan }: AnalysisCardProps) {
  return (
    <GlassPanel animate>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-400/10 text-xs font-bold text-green-400">
          &#9878;
        </span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Steel Man 분석
        </h3>
        <span className="ml-auto text-[10px] text-[var(--text-muted)] bg-white/[0.04] rounded-full px-2.5 py-0.5">
          논쟁 강화
        </span>
      </div>

      <div className="space-y-4">
        {/* Opposing Argument */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
        >
          <p className="text-[11px] text-[var(--cyan-400)] mb-2 font-medium uppercase tracking-wider">
            상대 주장의 핵심
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {steelMan.opposingArgument}
          </p>
        </motion.div>

        {/* Strengthened Argument */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl bg-[var(--green-400)]/5 border border-[var(--green-400)]/20 p-4"
        >
          <p className="text-[11px] text-[var(--green-400)] mb-2 font-medium uppercase tracking-wider">
            더 강한 논쟁을 위한 제안
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {steelMan.strengthenedArgument}
          </p>
        </motion.div>
      </div>

      {/* Share button placeholder */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-5 w-full rounded-xl py-3 text-sm font-medium text-[var(--text-secondary)] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.03] transition-all"
      >
        분석 카드 공유하기
      </motion.button>
    </GlassPanel>
  );
}
