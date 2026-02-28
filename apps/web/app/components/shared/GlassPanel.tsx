'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export default function GlassPanel({
  children,
  className = '',
  animate = false,
}: GlassPanelProps) {
  if (animate) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`glass rounded-2xl p-6 ${className}`}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}
