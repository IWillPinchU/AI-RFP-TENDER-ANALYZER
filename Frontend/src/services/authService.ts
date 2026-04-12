/* ── Auth Service ── */
/* Wired to Spring Boot /api/auth/** endpoints */

import { fetcher } from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenResponse,
  TwoFactorVerifyRequest,
  User,
} from '@/types/auth.types';

export const authService = {
  // POST /api/auth/login
  async login(data: LoginRequest): Promise<LoginResponse> {
    return fetcher<LoginResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(data),
    });
  },

  // POST /api/auth/login/verify-2fa
  async verify2fa(data: TwoFactorVerifyRequest): Promise<LoginResponse> {
    return fetcher<LoginResponse>('/auth/login/verify-2fa', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(data),
    });
  },

  // POST /api/auth/register
  async register(data: RegisterRequest): Promise<{ message: string }> {
    return fetcher<{ message: string }>('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(data),
    });
  },

  // GET /api/auth/verify-email?token=...
  async verifyEmail(token: string): Promise<{ message: string }> {
    return fetcher<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      skipAuth: true,
    });
  },

  // POST /api/auth/forgot-password
  async forgotPassword(email: string): Promise<{ message: string }> {
    return fetcher<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email }),
    });
  },

  // POST /api/auth/reset-password
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return fetcher<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ token, newPassword }),
    });
  },

  // POST /api/auth/refresh-token
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return fetcher<RefreshTokenResponse>('/auth/refresh-token', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ refreshToken }),
    });
  },

  // POST /api/auth/logout
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('rfp_refresh_token');
    await fetcher<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {
      // Best-effort — clear local state regardless of server response
    });
  },

  // GET /api/user/me
  async getMe(): Promise<User> {
    return fetcher<User>('/user/me');
  },
};
