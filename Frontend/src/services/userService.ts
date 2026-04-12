/* ── User Service ── */
/* Wired to Spring Boot /api/user/** endpoints */

import { fetcher } from './api';

interface ApiResponse {
  success: boolean;
  message: string;
}

interface TwoFactorSetupResponse {
  secret: string;
  qrCodeImage: string; // base64 encoded PNG
}

export const userService = {
  // PUT /api/user/update-password
  async updatePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return fetcher<ApiResponse>('/user/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // POST /api/user/enable-2fa  (Step 1: generate secret + QR code)
  async enable2fa(): Promise<TwoFactorSetupResponse> {
    return fetcher<TwoFactorSetupResponse>('/user/enable-2fa', {
      method: 'POST',
    });
  },

  // POST /api/user/verify-2fa-setup?code=...  (Step 2: confirm with TOTP code)
  async verify2faSetup(code: string): Promise<ApiResponse> {
    return fetcher<ApiResponse>(`/user/verify-2fa-setup?code=${encodeURIComponent(code)}`, {
      method: 'POST',
    });
  },

  // POST /api/user/disable-2fa?code=...
  async disable2fa(code: string): Promise<ApiResponse> {
    return fetcher<ApiResponse>(`/user/disable-2fa?code=${encodeURIComponent(code)}`, {
      method: 'POST',
    });
  },
};
