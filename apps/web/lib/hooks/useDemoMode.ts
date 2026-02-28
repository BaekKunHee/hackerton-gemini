'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface UseDemoModeOptions {
  startAnalysis: (input: { type: 'url' | 'text'; content: string }) => Promise<void>;
  analysisStatus: 'idle' | 'analyzing' | 'done' | 'error';
}

const DEMO_CONTENT = `[데모 기사] 청년 실업률 25% 시대, 정부 정책은 왜 실패하는가

한국의 청년 실업률이 25%에 달하며, OECD 국가 중 최하위 수준의 출산율을 기록하고 있다.
이 모든 것은 정부의 무능한 정책 때문이다. 정부 정책으로 주거비가 50% 상승했고,
청년들은 더 이상 미래를 꿈꿀 수 없는 상황에 내몰리고 있다.`;

export function useDemoMode({ startAnalysis, analysisStatus }: UseDemoModeOptions): boolean {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (isDemo && analysisStatus === 'idle' && !hasTriggered.current) {
      hasTriggered.current = true;
      // Small delay to ensure hydration is complete
      const timer = setTimeout(() => {
        startAnalysis({ type: 'text', content: DEMO_CONTENT });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isDemo, analysisStatus, startAnalysis]);

  return isDemo;
}
