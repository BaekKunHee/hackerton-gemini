'use client';

import { create } from 'zustand';
import type {
  SourcePanelData,
  PerspectivePanelData,
  BiasPanelData,
  PanelType,
  AnalysisResult,
  SteelManOutput,
} from '../types';

interface AnalysisState {
  sessionId: string | null;
  status: 'idle' | 'analyzing' | 'done' | 'error';
  panels: {
    source: SourcePanelData | null;
    perspective: PerspectivePanelData | null;
    bias: BiasPanelData | null;
  };
  steelMan: SteelManOutput | null;
  error: string | null;

  startAnalysis: (sessionId: string) => void;
  updatePanel: (panel: PanelType, data: SourcePanelData | PerspectivePanelData | BiasPanelData) => void;
  setComplete: (result?: AnalysisResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  status: 'idle' as const,
  panels: { source: null, perspective: null, bias: null },
  steelMan: null,
  error: null,
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...initialState,

  startAnalysis: (sessionId) =>
    set({ sessionId, status: 'analyzing', error: null }),

  updatePanel: (panel, data) =>
    set((state) => ({
      panels: { ...state.panels, [panel]: data },
    })),

  setComplete: (result) =>
    set({
      status: 'done',
      ...(result && {
        panels: {
          source: result.source ?? null,
          perspective: result.perspective ?? null,
          bias: result.bias ?? null,
        },
        steelMan: result.steelMan ?? null,
      }),
    }),

  setError: (error) => set({ status: 'error', error }),

  reset: () => set(initialState),
}));
