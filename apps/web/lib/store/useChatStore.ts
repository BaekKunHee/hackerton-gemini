'use client';

import { create } from 'zustand';
import type { ChatMessage } from '../types';

export type ChatPhase =
  | 'belief_before' // 시작 전 점수 입력
  | 'questions' // Q1-Q4 소크라테스 질문
  | 'confirmation' // "동의하시나요?" Y/N 분기
  | 'followup' // Y/N 선택 후 후속 대화
  | 'belief_after' // 완료 후 점수 입력
  | 'complete'; // 대화 완료

interface ChatStoreState {
  messages: ChatMessage[];
  step: number; // 1-6 확장된 단계
  phase: ChatPhase;
  isLoading: boolean;
  isComplete: boolean;

  // Y/N 분기 상태
  awaitingConfirmation: boolean;
  userAgreed: boolean | null;
  isSearching: boolean; // 검색 트리거 중

  // Mind Shift 점수 (Before/After)
  beliefScoreBefore: number | null;
  beliefScoreAfter: number | null;
  awaitingBeliefScore: 'before' | 'after' | null;

  addMessage: (message: ChatMessage) => void;
  setStep: (step: number) => void;
  setPhase: (phase: ChatPhase) => void;
  setLoading: (loading: boolean) => void;
  setComplete: () => void;
  setAwaitingConfirmation: (awaiting: boolean) => void;
  setUserAgreed: (agreed: boolean) => void;
  setSearching: (searching: boolean) => void;
  setBeliefScoreBefore: (score: number) => void;
  setBeliefScoreAfter: (score: number) => void;
  setAwaitingBeliefScore: (phase: 'before' | 'after' | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [],
  step: 1,
  phase: 'belief_before',
  isLoading: false,
  isComplete: false,
  awaitingConfirmation: false,
  userAgreed: null,
  isSearching: false,
  beliefScoreBefore: null,
  beliefScoreAfter: null,
  awaitingBeliefScore: 'before',

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setStep: (step) => set({ step }),

  setPhase: (phase) => set({ phase }),

  setLoading: (isLoading) => set({ isLoading }),

  setComplete: () => set({ isComplete: true, phase: 'complete' }),

  setAwaitingConfirmation: (awaitingConfirmation) =>
    set({ awaitingConfirmation, phase: awaitingConfirmation ? 'confirmation' : 'followup' }),

  setUserAgreed: (userAgreed) =>
    set({ userAgreed, awaitingConfirmation: false, phase: 'followup' }),

  setSearching: (isSearching) => set({ isSearching }),

  setBeliefScoreBefore: (score) =>
    set({ beliefScoreBefore: score, awaitingBeliefScore: null, phase: 'questions' }),

  setBeliefScoreAfter: (score) =>
    set({ beliefScoreAfter: score, awaitingBeliefScore: null, phase: 'complete', isComplete: true }),

  setAwaitingBeliefScore: (phase) => set({ awaitingBeliefScore: phase }),

  reset: () =>
    set({
      messages: [],
      step: 1,
      phase: 'belief_before',
      isLoading: false,
      isComplete: false,
      awaitingConfirmation: false,
      userAgreed: null,
      isSearching: false,
      beliefScoreBefore: null,
      beliefScoreAfter: null,
      awaitingBeliefScore: 'before',
    }),
}));
