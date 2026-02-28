"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { PerspectivePanelData, Perspective } from "@/lib/types";
import GlassPanel from "@/app/components/shared/GlassPanel";
import Skeleton from "@/app/components/shared/Skeleton";

interface PerspectivePanelProps {
  data: PerspectivePanelData | null;
  isLoading?: boolean;
}

function SpectrumDot({ perspective }: { perspective: Perspective }) {
  // Map political (-1 to 1) to percentage (0 to 100)
  const x = ((perspective.spectrum.political + 1) / 2) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: "50%" }}
      title={`${perspective.source.publisher}: ${perspective.frame}`}
    >
      <div className="relative group">
        <div className="h-3.5 w-3.5 rounded-full bg-[var(--cyan-400)] border-2 border-[var(--bg-primary)] cursor-pointer" />
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
          <div className="glass rounded-lg px-3 py-2 text-[11px] text-[var(--text-primary)] whitespace-nowrap">
            {perspective.source.publisher}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PerspectivePanel({
  data,
  isLoading,
}: PerspectivePanelProps) {
  if (isLoading || !data) {
    return (
      <GlassPanel className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">3</span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            다른 관점 탐색
          </h3>
        </div>
        <Skeleton lines={5} />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel animate className="h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-400/10 text-xs font-bold text-cyan-400">
          3
        </span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          다른 관점 탐색
        </h3>
      </div>

      {/* Spectrum map */}
      {data.spectrumVisualization?.imageDataUrl && (
        <div className="mb-5 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <p className="text-[11px] text-[var(--text-muted)] mb-3">
            AI 관점 차트
          </p>
          <Image
            src={data.spectrumVisualization.imageDataUrl}
            alt="관점 스펙트럼 시각화"
            width={1200}
            height={800}
            className="w-full rounded-lg border border-white/[0.08]"
          />
          {data.spectrumVisualization.caption && (
            <p className="mt-2 text-[11px] text-[var(--text-muted)] leading-relaxed">
              {data.spectrumVisualization.caption}
            </p>
          )}
        </div>
      )}

      {/* Perspective cards */}
      <div className="space-y-3 mb-5 mt-8">
        {data.perspectives.map((perspective, index) => (
          <motion.div
            key={perspective.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.12 }}
            className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
          >
            {/* Source + frame */}
            <div className="flex items-center justify-between mb-2">
              <a
                href={perspective.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--cyan-400)] hover:underline font-medium"
              >
                {perspective.source.publisher}
              </a>
              <span className="text-[10px] text-[var(--text-muted)] bg-white/[0.04] rounded-full px-2.5 py-0.5">
                {perspective.frame}
              </span>
            </div>

            {/* Main claim */}
            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">
              {perspective.mainClaim}
            </p>

            {/* Key points */}
            <ul className="space-y-1.5">
              {perspective.keyPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--text-muted)] shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Common facts */}
      <div className="mb-4">
        <p className="text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider">
          공통 사실
        </p>
        <ul className="space-y-1.5">
          {data.commonFacts.map((fact, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-[var(--green-400)]"
            >
              <span className="mt-0.5 shrink-0">&#10003;</span>
              {fact}
            </li>
          ))}
        </ul>
      </div>

      {/* Divergence points */}
      <div>
        <p className="text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider">
          관점 차이
        </p>
        {data.divergencePoints.map((point, index) => (
          <div key={index} className="mb-3 rounded-lg bg-white/[0.02] p-3">
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">
              {point.topic}
            </p>
            <div className="space-y-1">
              {Object.entries(point.positions).map(([label, position]) => (
                <div key={label} className="flex items-start gap-2 text-[11px]">
                  <span className="text-[var(--amber-400)] shrink-0 font-medium min-w-[2.5rem]">
                    {label}
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {position}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
