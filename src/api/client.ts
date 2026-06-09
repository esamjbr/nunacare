import { useAuthStore } from '../store/useAuthStore';
import type { ApiErrorResponse, AuthResponse } from '../types/auth';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5225').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = data as Partial<ApiErrorResponse> | null;
    throw new ApiError(
      response.status,
      error?.message || 'Something went wrong.',
      error?.errors || {}
    );
  }

  return data as T;
}

async function refreshAuth(): Promise<boolean> {
  const { refreshToken, setAuth, logout } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const auth = await parseResponse<AuthResponse>(response);
    setAuth({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user,
      role: auth.role,
      mustChangePassword: auth.mustChangePassword,
    });
    return true;
  } catch {
    logout();
    return false;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, skipRefresh, headers, ...init } = options;
  const { accessToken } = useAuthStore.getState();

  const requestHeaders: HeadersInit = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(headers || {}),
    ...(!skipAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    const refreshed = await refreshAuth();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  return parseResponse<T>(response);
}

export { API_BASE_URL };
