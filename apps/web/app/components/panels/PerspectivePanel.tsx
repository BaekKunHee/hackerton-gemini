"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type {
  PerspectivePanelData,
  Perspective,
  EvidenceItem,
  KeyPointDetail,
} from "@/lib/types";
import GlassPanel from "@/app/components/shared/GlassPanel";
import Skeleton from "@/app/components/shared/Skeleton";

// 프레임 유형 라벨 매핑
const FRAME_TYPE_LABELS: Record<string, string> = {
  economic: "경제적",
  social: "사회적",
  political: "정치적",
  ethical: "윤리적",
  scientific: "과학적",
  emotional: "감정적",
  historical: "역사적",
  other: "기타",
};

// 근거 유형 라벨 매핑
const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  statistic: "통계",
  quote: "인용",
  study: "연구",
  example: "사례",
  expert_opinion: "전문가 의견",
};

// 신뢰도 색상 매핑
const RELIABILITY_COLORS: Record<string, string> = {
  high: "text-green-400",
  medium: "text-amber-400",
  low: "text-red-400",
};

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

// 확장된 관점 카드 컴포넌트
function PerspectiveCard({
  perspective,
  index,
}: {
  perspective: Perspective;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExtendedContent =
    perspective.mainClaimReasoning ||
    perspective.frameDescription ||
    (perspective.keyPointDetails && perspective.keyPointDetails.length > 0) ||
    (perspective.evidence && perspective.evidence.length > 0) ||
    perspective.methodology;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12 }}
      className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
    >
      {/* 기본 콘텐츠 */}
      <div className="p-4">
        {/* Source + frame */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <a
              href={perspective.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--cyan-400)] hover:underline font-medium"
            >
              {perspective.source.publisher}
            </a>
            {perspective.source.publishedDate && (
              <span className="text-[10px] text-[var(--text-muted)]">
                {perspective.source.publishedDate}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {perspective.frameType && (
              <span className="text-[10px] text-cyan-400 bg-cyan-400/10 rounded-full px-2 py-0.5">
                {FRAME_TYPE_LABELS[perspective.frameType] ||
                  perspective.frameType}
              </span>
            )}
            <span className="text-[10px] text-[var(--text-muted)] bg-white/[0.04] rounded-full px-2.5 py-0.5">
              {perspective.frame}
            </span>
          </div>
        </div>

        {/* Main claim */}
        <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">
          {perspective.mainClaim}
        </p>

        {/* Key points (기본 3개까지 표시) */}
        <ul className="space-y-1.5">
          {perspective.keyPoints
            .slice(0, isExpanded ? undefined : 3)
            .map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
              >
                <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--text-muted)] shrink-0" />
                {point}
              </li>
            ))}
          {!isExpanded && perspective.keyPoints.length > 3 && (
            <li className="text-[10px] text-[var(--text-muted)] pl-3">
              +{perspective.keyPoints.length - 3}개 더보기
            </li>
          )}
        </ul>

        {/* 확장 버튼 */}
        {hasExtendedContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-[11px] text-[var(--cyan-400)] hover:underline flex items-center gap-1"
          >
            {isExpanded ? "접기" : "상세 분석 보기"}
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 확장된 콘텐츠 */}
      <AnimatePresence>
        {isExpanded && hasExtendedContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06] bg-white/[0.01]"
          >
            <div className="p-4 space-y-4">
              {/* 논증 근거 */}
              {perspective.mainClaimReasoning && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    논증 근거
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {perspective.mainClaimReasoning}
                  </p>
                </div>
              )}

              {/* 프레임 설명 */}
              {perspective.frameDescription && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    프레임 분석
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {perspective.frameDescription}
                  </p>
                </div>
              )}

              {/* 상세 핵심 포인트 */}
              {perspective.keyPointDetails &&
                perspective.keyPointDetails.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      핵심 포인트 상세
                    </p>
                    <div className="space-y-2">
                      {perspective.keyPointDetails.map(
                        (detail: KeyPointDetail, i: number) => (
                          <div
                            key={i}
                            className="rounded-lg bg-white/[0.02] p-2.5"
                          >
                            <p className="text-xs text-[var(--text-primary)] font-medium mb-1">
                              {detail.point}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                              {detail.explanation}
                            </p>
                            {detail.supportingData && (
                              <p className="text-[10px] text-[var(--cyan-400)] mt-1.5 italic">
                                {detail.supportingData}
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* 근거 자료 */}
              {perspective.evidence && perspective.evidence.length > 0 && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    근거 자료
                  </p>
                  <div className="space-y-2">
                    {perspective.evidence.map((ev: EvidenceItem, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-white/[0.02] p-2.5"
                      >
                        <span className="text-[9px] bg-cyan-400/10 text-cyan-400 rounded px-1.5 py-0.5 shrink-0">
                          {EVIDENCE_TYPE_LABELS[ev.type] || ev.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            {ev.content}
                          </p>
                          {ev.source && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                              출처: {ev.source}
                            </p>
                          )}
                        </div>
                        {ev.reliability && (
                          <span
                            className={`text-[9px] shrink-0 ${RELIABILITY_COLORS[ev.reliability]}`}
                          >
                            {ev.reliability === "high"
                              ? "높음"
                              : ev.reliability === "medium"
                                ? "보통"
                                : "낮음"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 접근 방법론 */}
              {perspective.methodology && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    접근 방법론
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {perspective.methodology}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

      {/* Perspective cards - 새로운 확장 카드 사용 */}
      <div className="space-y-3 mb-5 mt-8">
        {data.perspectives.map((perspective, index) => (
          <PerspectiveCard
            key={perspective.id}
            perspective={perspective}
            index={index}
          />
        ))}
      </div>

      {/* Common facts */}
      {data.commonFacts && data.commonFacts.length > 0 && (
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
      )}

      {/* Divergence points */}
      {data.divergencePoints && data.divergencePoints.length > 0 && (
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
      )}
    </GlassPanel>
  );
}
