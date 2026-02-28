'use client';

import { motion } from 'framer-motion';
import type { BiasPanelData, BiasType } from '@/lib/types';
import GlassPanel from '@/app/components/shared/GlassPanel';
import Skeleton from '@/app/components/shared/Skeleton';
import BiasRadarChart from './BiasRadarChart';

interface BiasPanelProps {
  data: BiasPanelData | null;
  isLoading?: boolean;
}

const biasLabels: Record<BiasType, string> = {
  gap_instinct: '이분법 본능',
  negativity_instinct: '부정 본능',
  straight_line_instinct: '직선 본능',
  fear_instinct: '공포 본능',
  size_instinct: '과장 본능',
  generalization_instinct: '일반화 본능',
  destiny_instinct: '운명 본능',
  single_perspective_instinct: '단일 관점 본능',
  blame_instinct: '비난 본능',
  urgency_instinct: '급박함 본능',
};

function getBarColor(score: number): string {
  if (score >= 0.7) return 'var(--red-400)';
  if (score >= 0.4) return 'var(--amber-400)';
  return 'var(--green-400)';
}

export default function BiasPanel({ data, isLoading }: BiasPanelProps) {
  if (isLoading || !data) {
    return (
      <GlassPanel className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">3</span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            편향 분석
          </h3>
        </div>
        <Skeleton lines={5} />
      </GlassPanel>
    );
  }

  // Top 3 biases
  const topBiases = [...data.biasScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <GlassPanel animate className="h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-400/10 text-xs font-bold text-purple-400">
          3
        </span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          편향 분석
        </h3>
      </div>

      {/* Radar chart */}
      <div className="mb-5">
        <BiasRadarChart biasScores={data.biasScores} />
      </div>

      {/* Top biases */}
      <div className="mb-5">
        <p className="text-[11px] text-[var(--text-muted)] mb-3 uppercase tracking-wider">
          주요 편향 패턴
        </p>
        <div className="space-y-3">
          {topBiases.map((bias, index) => (
            <motion.div
              key={bias.type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {biasLabels[bias.type]}
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: getBarColor(bias.score) }}
                >
                  {Math.round(bias.score * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: getBarColor(bias.score) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${bias.score * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Text examples */}
      {data.textExamples.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] text-[var(--text-muted)] mb-3 uppercase tracking-wider">
            텍스트 예시
          </p>
          <div className="space-y-3">
            {data.textExamples.map((example, index) => (
              <div
                key={index}
                className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3"
              >
                <p className="text-sm text-[var(--text-primary)] mb-2 border-l-2 border-[var(--amber-400)] pl-3 italic">
                  &ldquo;{example.text}&rdquo;
                </p>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] text-[var(--amber-400)] bg-[var(--amber-400)]/10 rounded-full px-2 py-0.5">
                    {biasLabels[example.biasType]}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {example.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative framing */}
      {data.alternativeFraming && (
        <div>
          <p className="text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider">
            대안적 프레이밍
          </p>
          <div className="rounded-lg bg-[var(--indigo-500)]/5 border border-[var(--indigo-500)]/20 p-3">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {data.alternativeFraming}
            </p>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
