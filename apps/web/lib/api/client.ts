import type { ApiResponse } from '@/lib/types';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!json.success || json.error) {
    throw new ApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? 'An unknown error occurred',
      response.status
    );
  }

  return json.data as T;
}
