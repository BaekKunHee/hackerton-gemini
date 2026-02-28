import { apiClient } from './client';
import type { AnalyzeResponse, ChatResponse } from '@/lib/types';

export async function startAnalysis(
  type: 'url' | 'text',
  content: string
): Promise<AnalyzeResponse> {
  return apiClient<AnalyzeResponse>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ type, content }),
  });
}

export async function getResult(
  sessionId: string
): Promise<{ status: string; result?: unknown }> {
  return apiClient<{ status: string; result?: unknown }>(
    `/api/result/${sessionId}`
  );
}

export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<ChatResponse> {
  return apiClient<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ sessionId, message }),
  });
}

export async function sendConfirmation(
  sessionId: string,
  agreed: boolean
): Promise<ChatResponse> {
  return apiClient<ChatResponse>('/api/chat', {
    method: 'PUT',
    body: JSON.stringify({ sessionId, agreed }),
  });
}
