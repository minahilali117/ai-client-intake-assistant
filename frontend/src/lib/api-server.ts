import { getApiUrl } from './api';
import type { PaginatedResponse } from '@/types/crm';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: 'HTTP_ERROR' | 'NETWORK_ERROR',
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

export async function apiFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });
  } catch {
    throw new ApiRequestError(
      'Service temporarily unavailable. Please try again in a moment.',
      0,
      'NETWORK_ERROR',
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : response.statusText;
    throw new ApiRequestError(message, response.status, 'HTTP_ERROR');
  }

  return data as T;
}

export function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export type { PaginatedResponse };
