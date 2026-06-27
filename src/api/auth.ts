import { apiClient, unwrap } from './client';
import type { Admin, LoginApiResponse, LoginResponse, TwoFactorSetupData } from './types';

export const authApi = {
  login: (username: string, password: string) =>
    unwrap<LoginApiResponse>(apiClient.post('/admin/auth/login', { username, password })),

  me: () => unwrap<{ admin: Admin }>(apiClient.get('/admin/auth/me')).then((d) => d.admin),

  logout: (refreshToken: string) => apiClient.post('/admin/auth/logout', { refreshToken }),

  // ── 2FA ──────────────────────────────────────────────────────────────────
  setup2FA: () => unwrap<TwoFactorSetupData>(apiClient.post('/admin/auth/2fa/setup')),

  enable2FA: (code: string) =>
    unwrap<{ enabled: boolean }>(apiClient.post('/admin/auth/2fa/enable', { code })),

  disable2FA: (code: string) =>
    unwrap<{ enabled: boolean }>(apiClient.post('/admin/auth/2fa/disable', { code })),

  verify2FA: (twoFactorToken: string, code: string) =>
    unwrap<LoginResponse>(apiClient.post('/admin/auth/2fa/verify', { twoFactorToken, code })),
};
