'use client';

import { motion } from 'framer-motion';

interface TabNavProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
}

export default function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          onClick={() => onChange(index)}
          className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === index
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {activeTab === index && (
            <motion.div
              layoutId="tab-indicator"
              className="gradient-border absolute inset-0 rounded-lg bg-white/[0.06]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab}</span>
        </button>
      ))}
    </div>
  );
}
