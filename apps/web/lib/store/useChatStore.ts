'use client';

import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatStoreState {
  messages: ChatMessage[];
  step: number; // 1-4 소크라테스 질문 단계
  isLoading: boolean;
  isComplete: boolean;

  addMessage: (message: ChatMessage) => void;
  setStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setComplete: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [],
  step: 1,
  isLoading: false,
  isComplete: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setStep: (step) => set({ step }),

  setLoading: (isLoading) => set({ isLoading }),

  setComplete: () => set({ isComplete: true }),

  reset: () =>
    set({ messages: [], step: 1, isLoading: false, isComplete: false }),
}));
