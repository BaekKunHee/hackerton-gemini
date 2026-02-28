'use client';

import { motion } from 'framer-motion';

interface TabNavProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
  disabledTabs?: boolean[];
}

export default function TabNav({ tabs, activeTab, onChange, disabledTabs }: TabNavProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
      {tabs.map((tab, index) => {
        const isDisabled = disabledTabs?.[index] ?? false;
        return (
          <button
            key={tab}
            onClick={() => !isDisabled && onChange(index)}
            disabled={isDisabled}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isDisabled
                ? 'text-[var(--text-muted)]/40 cursor-not-allowed opacity-40'
                : activeTab === index
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {activeTab === index && !isDisabled && (
              <motion.div
                layoutId="tab-indicator"
                className="gradient-border absolute inset-0 rounded-lg bg-white/[0.06]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab}
              {isDisabled && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/20 animate-pulse" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
