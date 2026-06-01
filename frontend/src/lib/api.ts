const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface AuthApiUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'DEVELOPER';
}

export interface AuthApiResponse {
  user: AuthApiUser;
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
  };

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message ?? response.statusText;
    throw new ApiError(message, response.status);
  }

  return data;
}

export async function apiSignup(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthApiResponse> {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  return parseResponse<AuthApiResponse>(response);
}

export async function apiLogin(payload: {
  email: string;
  password: string;
}): Promise<AuthApiResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  return parseResponse<AuthApiResponse>(response);
}

export async function apiRefresh(refreshToken: string): Promise<AuthApiResponse> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    credentials: 'include',
  });

  return parseResponse<AuthApiResponse>(response);
}

export async function apiLogout(accessToken: string): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });
}

export async function apiGetProfile(accessToken: string): Promise<AuthApiUser> {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  return parseResponse<AuthApiUser>(response);
}

export function getApiUrl() {
  return API_URL;
}
