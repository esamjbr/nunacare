import { apiRequest } from './client';
import type { AuthResponse, AuthUser } from '../types/auth';

export function login(username: string, password: string) {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
    skipAuth: true,
  });
}

export function logout(refreshToken: string) {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  });
}

export function getMe() {
  return apiRequest<AuthUser>('/api/auth/me');
}

export function changePassword(newPassword: string) {
  return apiRequest<AuthResponse>('/api/auth/change-password', {
    method: 'POST',
    body: { newPassword },
  });
}
