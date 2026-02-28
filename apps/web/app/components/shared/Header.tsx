'use client';

import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]"
    >
      <div className="flex items-center gap-3">
        <h1 className="gradient-text text-2xl font-bold tracking-tight">
          Flipside
        </h1>
        <span className="text-sm text-[var(--text-muted)] hidden sm:inline">
          |
        </span>
        <p className="text-sm text-[var(--text-secondary)] hidden sm:inline">
          같은 팩트, 다른 결론
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[var(--green-400)]" />
        <span className="text-xs text-[var(--text-muted)]">Gemini 3 Pro</span>
      </div>
    </motion.header>
  );
}
