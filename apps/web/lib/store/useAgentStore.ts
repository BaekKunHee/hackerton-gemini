'use client';

import { create } from 'zustand';
import type { AgentId, AgentState } from '../types';

interface AgentStoreState {
  agents: Record<AgentId, AgentState>;
  updateAgent: (id: AgentId, state: Partial<AgentState>) => void;
  resetAgents: () => void;
}

const createInitialAgents = (): Record<AgentId, AgentState> => ({
  analyzer: { id: 'analyzer', status: 'idle' },
  source: { id: 'source', status: 'idle' },
  perspective: { id: 'perspective', status: 'idle' },
  socrates: { id: 'socrates', status: 'idle' },
});

export const useAgentStore = create<AgentStoreState>((set) => ({
  agents: createInitialAgents(),

  updateAgent: (id, state) =>
    set((prev) => ({
      agents: {
        ...prev.agents,
        [id]: { ...prev.agents[id], ...state },
      },
    })),

  resetAgents: () => set({ agents: createInitialAgents() }),
}));
