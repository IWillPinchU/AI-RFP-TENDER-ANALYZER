


import { fetcher } from './api';

interface ApiResponse {
  success: boolean;
  message: string;
}

interface TwoFactorSetupResponse {
  secret: string;
  qrCodeImage: string; 
}

export const userService = {
  
  async updatePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return fetcher<ApiResponse>('/user/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  
  async enable2fa(): Promise<TwoFactorSetupResponse> {
    return fetcher<TwoFactorSetupResponse>('/user/enable-2fa', {
      method: 'POST',
    });
  },

  
  async verify2faSetup(code: string): Promise<ApiResponse> {
    return fetcher<ApiResponse>(`/user/verify-2fa-setup?code=${encodeURIComponent(code)}`, {
      method: 'POST',
    });
  },

  
  async disable2fa(code: string): Promise<ApiResponse> {
    return fetcher<ApiResponse>(`/user/disable-2fa?code=${encodeURIComponent(code)}`, {
      method: 'POST',
    });
  },
};
