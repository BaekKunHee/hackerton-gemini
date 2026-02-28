'use client';

import { motion } from 'framer-motion';
import type { BiasPanelData, BiasItem, InstinctItem, BiasType } from '@/lib/types';
import GlassPanel from '@/app/components/shared/GlassPanel';
import Skeleton from '@/app/components/shared/Skeleton';

interface BiasPanelProps {
  data: BiasPanelData | null;
  isLoading?: boolean;
}

// Legacy labels for backward compatibility
const legacyBiasLabels: Record<BiasType, string> = {
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
  // score is 0-100
  if (score >= 70) return 'var(--red-400)';
  if (score >= 40) return 'var(--amber-400)';
  return 'var(--green-400)';
}

function getBarBgColor(score: number): string {
  if (score >= 70) return 'rgba(248, 113, 113, 0.1)';
  if (score >= 40) return 'rgba(251, 191, 36, 0.1)';
  return 'rgba(74, 222, 128, 0.1)';
}

interface BiasBarItemProps {
  label: string;
  score: number;
  reason: string;
  index: number;
}

function BiasBarItem({ label, score, reason, index }: BiasBarItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-4 last:mb-0"
    >
      {/* Label and Score */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[var(--text-primary)]">
          {label}
        </span>
        <span
          className="text-xs font-mono font-semibold"
          style={{ color: getBarColor(score) }}
        >
          {score}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06] mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getBarColor(score) }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: index * 0.1 }}
        />
      </div>

      {/* Reason */}
      <div
        className="rounded-lg p-2.5 text-xs leading-relaxed"
        style={{ backgroundColor: getBarBgColor(score) }}
      >
        <span className="text-[var(--text-secondary)]">→ </span>
        <span className="text-[var(--text-secondary)]">{reason}</span>
      </div>
    </motion.div>
  );
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

  // Use new structure if available, fallback to legacy
  const hasBiases = data.biases && data.biases.length > 0;
  const hasInstincts = data.instincts && data.instincts.length > 0;

  return (
    <GlassPanel animate className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-400/10 text-xs font-bold text-purple-400">
          3
        </span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          편향 분석
        </h3>
      </div>

      {/* New Structure: Biases + Instincts separated */}
      {(hasBiases || hasInstincts) ? (
        <>
          {/* Main Biases (Cognitive Biases) */}
          {hasBiases && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">🎯</span>
                <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Main 편향
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                {data.biases!.map((bias: BiasItem, index: number) => (
                  <BiasBarItem
                    key={bias.type}
                    label={bias.label}
                    score={bias.score}
                    reason={bias.reason}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main Instincts (Hans Rosling) */}
          {hasInstincts && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">🧠</span>
                <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Main 본능
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                {data.instincts!.map((instinct: InstinctItem, index: number) => (
                  <BiasBarItem
                    key={instinct.type}
                    label={instinct.label}
                    score={instinct.score}
                    reason={instinct.reason}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Legacy fallback: use biasScores */
        data.biasScores && data.biasScores.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] text-[var(--text-muted)] mb-3 uppercase tracking-wider">
              주요 편향 패턴
            </p>
            <div className="space-y-3">
              {[...data.biasScores]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((bias, index) => (
                  <motion.div
                    key={bias.type}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {legacyBiasLabels[bias.type]}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: getBarColor(bias.score * 100) }}
                      >
                        {Math.round(bias.score * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: getBarColor(bias.score * 100) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${bias.score * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )
      )}

      {/* Text examples */}
      {data.textExamples && data.textExamples.length > 0 && (
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
                    {typeof example.biasType === 'string' && legacyBiasLabels[example.biasType as BiasType]
                      ? legacyBiasLabels[example.biasType as BiasType]
                      : example.biasType}
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
