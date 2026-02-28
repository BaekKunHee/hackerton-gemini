'use client';

type BadgeStatus = 'verified' | 'distorted' | 'context_missing' | 'unverifiable';

interface BadgeProps {
  status: BadgeStatus;
}

const badgeConfig: Record<
  BadgeStatus,
  { icon: string; label: string; color: string; bg: string }
> = {
  verified: {
    icon: '\u2713',
    label: '일치',
    color: 'text-[var(--green-400)]',
    bg: 'bg-[var(--green-400)]/10',
  },
  distorted: {
    icon: '\u2717',
    label: '왜곡',
    color: 'text-[var(--red-400)]',
    bg: 'bg-[var(--red-400)]/10',
  },
  context_missing: {
    icon: '\u25B3',
    label: '맥락 누락',
    color: 'text-[var(--amber-400)]',
    bg: 'bg-[var(--amber-400)]/10',
  },
  unverifiable: {
    icon: '?',
    label: '확인 불가',
    color: 'text-[var(--text-muted)]',
    bg: 'bg-white/5',
  },
};

export default function Badge({ status }: BadgeProps) {
  const config = badgeConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.color} ${config.bg}`}
    >
      <span className="text-sm leading-none">{config.icon}</span>
      {config.label}
    </span>
  );
}
