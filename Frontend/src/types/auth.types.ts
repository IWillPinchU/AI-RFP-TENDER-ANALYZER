

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  twoFactorEnabled: boolean;
  provider: string;
  hasPassword: boolean;
  roles: string[];
  verified: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresTwoFactor?: boolean;
  tempToken?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface TwoFactorVerifyRequest {
  tempToken: string;
  code: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
