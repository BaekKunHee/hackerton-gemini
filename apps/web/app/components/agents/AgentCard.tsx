'use client';

import { motion } from 'framer-motion';
import type { AgentState, AgentId } from '@/lib/types';
import ProgressBar from '@/app/components/shared/ProgressBar';

interface AgentCardProps {
  agent: AgentState;
}

interface AgentConfig {
  icon: string;
  name: string;
  color: string;
  bgColor: string;
}

const agentConfigs: Record<AgentId, AgentConfig> = {
  analyzer: {
    icon: '\uD83E\uDDE0',
    name: '분석기',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  source: {
    icon: '\uD83D\uDD0D',
    name: '소스 검증',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  perspective: {
    icon: '\uD83C\uDF10',
    name: '관점 탐색',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
  socrates: {
    icon: '\uD83D\uDCAC',
    name: '소크라테스',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
};

const statusLabels: Record<AgentState['status'], string> = {
  idle: '대기 중',
  thinking: '사고 중...',
  searching: '검색 중...',
  analyzing: '분석 중...',
  done: '완료',
  error: '오류',
};

export default function AgentCard({ agent }: AgentCardProps) {
  const config = agentConfigs[agent.id];
  const isActive = ['thinking', 'searching', 'analyzing'].includes(agent.status);
  const isDone = agent.status === 'done';
  const isError = agent.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass rounded-xl p-3 transition-all ${
        isActive ? 'border-white/[0.12]' : ''
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        {/* Icon */}
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${config.bgColor} ${
            isActive ? 'animate-agent-pulse' : ''
          }`}
        >
          {isDone ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-[var(--green-400)] text-sm"
            >
              &#10003;
            </motion.span>
          ) : (
            config.icon
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${config.color}`}>
            {config.name}
          </p>
          <p
            className={`text-[11px] truncate ${
              isError
                ? 'text-[var(--red-400)]'
                : isActive
                ? 'text-[var(--text-secondary)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {agent.message || statusLabels[agent.status]}
          </p>
        </div>

        {/* Status indicator */}
        {isActive && (
          <motion.div
            className="h-2 w-2 rounded-full bg-[var(--cyan-400)]"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Progress bar */}
      {agent.progress !== undefined && agent.progress > 0 && (
        <ProgressBar progress={agent.progress} />
      )}
    </motion.div>
  );
}
