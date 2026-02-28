'use client';

import { motion } from 'framer-motion';
import type { SteelManOutput, ExpandedTopic, RefutationPoint } from '@/lib/types';
import GlassPanel from '@/app/components/shared/GlassPanel';
import ShareButton from './ShareButton';

interface AnalysisCardProps {
  steelMan: SteelManOutput;
}

function getRelevanceColor(relevance: ExpandedTopic['relevance']): string {
  switch (relevance) {
    case 'high':
      return 'var(--indigo-400)';
    case 'medium':
      return 'var(--cyan-400)';
    case 'low':
      return 'var(--text-muted)';
  }
}

function getRelevanceBgColor(relevance: ExpandedTopic['relevance']): string {
  switch (relevance) {
    case 'high':
      return 'rgba(129, 140, 248, 0.1)';
    case 'medium':
      return 'rgba(34, 211, 238, 0.1)';
    case 'low':
      return 'rgba(255, 255, 255, 0.04)';
  }
}

function getImportanceConfig(importance: RefutationPoint['importance']) {
  switch (importance) {
    case 'critical':
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.3)',
        text: '#ef4444',
        label: '필수 반박',
      };
    case 'important':
      return {
        bg: 'rgba(251, 191, 36, 0.1)',
        border: 'rgba(251, 191, 36, 0.3)',
        text: '#fbbf24',
        label: '중요',
      };
    case 'minor':
      return {
        bg: 'rgba(148, 163, 184, 0.1)',
        border: 'rgba(148, 163, 184, 0.3)',
        text: '#94a3b8',
        label: '참고',
      };
  }
}

export default function AnalysisCard({ steelMan }: AnalysisCardProps) {
  const hasExpandedTopics =
    steelMan.expandedTopics && steelMan.expandedTopics.length > 0;
  const hasRefutationPoints =
    steelMan.refutationPoints && steelMan.refutationPoints.length > 0;

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
          관점 확장
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

        {/* Refutation Points */}
        {hasRefutationPoints && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">💡</span>
              <p className="text-[11px] text-amber-400 font-medium uppercase tracking-wider">
                반박해야 할 핵심 포인트
              </p>
            </div>
            <div className="space-y-3">
              {steelMan.refutationPoints!.map((point, index) => {
                const config = getImportanceConfig(point.importance);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.1 }}
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: config.bg,
                      borderLeft: `3px solid ${config.border}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: config.border, color: '#fff' }}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                      {point.point}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      → {point.counterArgument}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Strengthened Argument */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasRefutationPoints ? 0.55 : 0.25 }}
          className="rounded-xl bg-[var(--green-400)]/5 border border-[var(--green-400)]/20 p-4"
        >
          <p className="text-[11px] text-[var(--green-400)] mb-2 font-medium uppercase tracking-wider">
            더 깊은 이해를 위한 제안
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {steelMan.strengthenedArgument}
          </p>
        </motion.div>

        {/* Expanded Topics */}
        {hasExpandedTopics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔗</span>
              <p className="text-[11px] text-[var(--indigo-400)] font-medium uppercase tracking-wider">
                확장된 영역
              </p>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              이 주제는 다양한 관점과 연결됩니다
            </p>
            <div className="flex flex-wrap gap-2">
              {steelMan.expandedTopics!.map((topic, index) => (
                <motion.div
                  key={topic.topic}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="group relative"
                >
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium cursor-default transition-all hover:scale-105"
                    style={{
                      backgroundColor: getRelevanceBgColor(topic.relevance),
                      color: getRelevanceColor(topic.relevance),
                      borderWidth: 1,
                      borderColor:
                        topic.relevance === 'high'
                          ? 'rgba(129, 140, 248, 0.2)'
                          : topic.relevance === 'medium'
                            ? 'rgba(34, 211, 238, 0.2)'
                            : 'rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {topic.relevance === 'high' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                    {topic.topic}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-white/[0.1] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-48 pointer-events-none">
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      {topic.description}
                    </p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[var(--glass-bg)] border-r border-b border-white/[0.1]" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Share button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: hasExpandedTopics ? 0.55 : 0.4 }}
        className="mt-5 flex justify-center"
      >
        <ShareButton
          text={[
            `[Flipside 분석 카드]`,
            ``,
            `상대 주장의 핵심:`,
            steelMan.opposingArgument,
            ``,
            ...(hasRefutationPoints
              ? [
                  `반박 포인트:`,
                  ...steelMan.refutationPoints!.map(
                    (p) => `- [${p.importance}] ${p.point}: ${p.counterArgument}`
                  ),
                  ``,
                ]
              : []),
            `더 깊은 이해를 위한 제안:`,
            steelMan.strengthenedArgument,
            ...(hasExpandedTopics
              ? [
                  ``,
                  `관련 주제: ${steelMan.expandedTopics!.map((t) => t.topic).join(', ')}`,
                ]
              : []),
            ``,
            `— Flipside에서 분석됨`,
          ].join('\n')}
        />
      </motion.div>
    </GlassPanel>
  );
}
