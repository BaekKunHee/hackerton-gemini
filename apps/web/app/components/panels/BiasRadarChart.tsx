'use client';

import { useEffect, useState } from 'react';
import type { BiasScore, BiasType } from '@/lib/types';

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

interface RechartsModule {
  ResponsiveContainer: typeof import('recharts').ResponsiveContainer;
  RadarChart: typeof import('recharts').RadarChart;
  PolarGrid: typeof import('recharts').PolarGrid;
  PolarAngleAxis: typeof import('recharts').PolarAngleAxis;
  PolarRadiusAxis: typeof import('recharts').PolarRadiusAxis;
  Radar: typeof import('recharts').Radar;
}

export default function BiasRadarChart({ biasScores }: BiasRadarChartProps) {
  const [recharts, setRecharts] = useState<RechartsModule | null>(null);

  useEffect(() => {
    import('recharts').then((mod) => {
      setRecharts({
        ResponsiveContainer: mod.ResponsiveContainer,
        RadarChart: mod.RadarChart,
        PolarGrid: mod.PolarGrid,
        PolarAngleAxis: mod.PolarAngleAxis,
        PolarRadiusAxis: mod.PolarRadiusAxis,
        Radar: mod.Radar,
      });
    });
  }, []);

  const chartData = biasScores.map((bs) => ({
    bias: biasLabels[bs.type],
    score: Math.round(bs.score * 100),
    fullMark: 100,
  }));

  if (!recharts) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-shimmer rounded-full h-48 w-48" />
      </div>
    );
  }

  const {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
  } = recharts;

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
