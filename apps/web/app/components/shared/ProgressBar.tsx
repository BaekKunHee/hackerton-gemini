'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div
        className="h-full rounded-full"
        style={{
          background: 'linear-gradient(90deg, var(--indigo-500), var(--cyan-400))',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}
