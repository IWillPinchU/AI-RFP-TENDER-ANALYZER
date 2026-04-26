


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
  
  async login(data: LoginRequest): Promise<LoginResponse> {
    return fetcher<LoginResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(data),
    });
  },

  
  async verify2fa(data: TwoFactorVerifyRequest): Promise<LoginResponse> {
    return fetcher<LoginResponse>('/auth/login/verify-2fa', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(data),
    });
  },

  
  async register(data: RegisterRequest): Promise<{ message: string }> {
    return fetcher<{ message: string }>('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(data),
    });
  },

  
  async verifyEmail(token: string): Promise<{ message: string }> {
    return fetcher<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      skipAuth: true,
    });
  },

  
  async forgotPassword(email: string): Promise<{ message: string }> {
    return fetcher<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email }),
    });
  },

  
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return fetcher<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ token, newPassword }),
    });
  },

  
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return fetcher<RefreshTokenResponse>('/auth/refresh-token', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ refreshToken }),
    });
  },

  
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('rfp_refresh_token');
    await fetcher<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {
      
    });
  },

  
  async getMe(): Promise<User> {
    return fetcher<User>('/user/me');
  },
};
