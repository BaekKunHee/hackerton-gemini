'use client';

import dynamic from 'next/dynamic';
import type { BiasScore, BiasType } from '@/lib/types';

const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const RadarChart = dynamic(
  () => import('recharts').then((mod) => mod.RadarChart),
  { ssr: false }
);
const PolarGrid = dynamic(
  () => import('recharts').then((mod) => mod.PolarGrid),
  { ssr: false }
);
const PolarAngleAxis = dynamic(
  () => import('recharts').then((mod) => mod.PolarAngleAxis),
  { ssr: false }
);
const PolarRadiusAxis = dynamic(
  () => import('recharts').then((mod) => mod.PolarRadiusAxis),
  { ssr: false }
);
const Radar = dynamic(
  () => import('recharts').then((mod) => mod.Radar),
  { ssr: false }
);

interface BiasRadarChartProps {
  biasScores: BiasScore[];
}

const biasLabels: Record<BiasType, string> = {
  gap_instinct: '이분법',
  negativity_instinct: '부정성',
  straight_line_instinct: '직선',
  fear_instinct: '공포',
  size_instinct: '과장',
  generalization_instinct: '일반화',
  destiny_instinct: '운명',
  single_perspective_instinct: '단일 관점',
  blame_instinct: '비난',
  urgency_instinct: '긴급성',
};

export default function BiasRadarChart({ biasScores }: BiasRadarChartProps) {
  const chartData = biasScores.map((bs) => ({
    bias: biasLabels[bs.type],
    score: Math.round(bs.score * 100),
    fullMark: 100,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid
            stroke="rgba(255, 255, 255, 0.06)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="bias"
            tick={{
              fill: 'var(--text-muted)',
              fontSize: 10,
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="편향 점수"
            dataKey="score"
            stroke="var(--indigo-500)"
            fill="var(--indigo-500)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
