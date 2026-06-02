'use client';

import { getApiUrl } from './api';

async function request<T>(
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
      credentials: 'include',
    });
  } catch {
    throw new Error('Could not reach backend service');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : response.statusText;
    throw new Error(message || 'Request failed');
  }

  return data as T;
}

export const apiClient = {
  post: <T>(path: string, token: string, body?: unknown) =>
    request<T>(path, token, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, token: string, body: unknown) =>
    request<T>(path, token, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, token: string) =>
    request<T>(path, token, { method: 'DELETE' }),
};
