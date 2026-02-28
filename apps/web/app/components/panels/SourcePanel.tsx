'use client';

import { motion } from 'framer-motion';
import type { SourcePanelData } from '@/lib/types';
import GlassPanel from '@/app/components/shared/GlassPanel';
import Badge from '@/app/components/shared/Badge';
import TrustScore from '@/app/components/shared/TrustScore';
import Skeleton from '@/app/components/shared/Skeleton';

interface SourcePanelProps {
  data: SourcePanelData | null;
  isLoading?: boolean;
}

export default function SourcePanel({ data, isLoading }: SourcePanelProps) {
  if (isLoading || !data) {
    return (
      <GlassPanel className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">1</span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Primary Source 검증
          </h3>
        </div>
        <Skeleton lines={5} />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel animate className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-400/10 text-xs font-bold text-blue-400">
            1
          </span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Primary Source 검증
          </h3>
        </div>
        <TrustScore score={data.trustScore} />
      </div>

      {/* Sources list */}
      <div className="space-y-4">
        {data.originalSources.map((source, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
          >
            {/* Claim + Badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed flex-1">
                &ldquo;{source.originalClaim}&rdquo;
              </p>
              <Badge status={source.verification.status} />
            </div>

            {/* Original source info */}
            <div className="mb-3 rounded-lg bg-white/[0.02] p-3">
              <p className="text-[11px] text-[var(--text-muted)] mb-1">
                원본 출처
              </p>
              <a
                href={source.originalSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--cyan-400)] hover:underline"
              >
                {source.originalSource.title} - {source.originalSource.publisher}
              </a>
              <p className="mt-2 text-xs text-[var(--text-secondary)] italic leading-relaxed">
                &ldquo;{source.originalSource.relevantQuote}&rdquo;
              </p>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-lg bg-white/[0.02] p-2.5">
                <p className="text-[10px] text-[var(--text-muted)] mb-1">
                  기사 주장
                </p>
                <p className="text-xs text-[var(--red-400)]">
                  {source.verification.comparison.claimed}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.02] p-2.5">
                <p className="text-[10px] text-[var(--text-muted)] mb-1">
                  실제 데이터
                </p>
                <p className="text-xs text-[var(--green-400)]">
                  {source.verification.comparison.actual}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {source.verification.explanation}
            </p>
          </motion.div>
        ))}
      </div>
    </GlassPanel>
  );
}
