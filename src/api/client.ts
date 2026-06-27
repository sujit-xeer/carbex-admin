import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE } from '@/lib/constants';
import { tokenStore } from './tokenStore';
import type { ApiEnvelope, ApiError, RefreshResponse } from './types';

/** Callback invoked when refresh fails — wired up by AuthContext to force logout. */
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: () => void) {
  onAuthFailure = fn;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request: attach access token ─────────────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response: refresh-on-401 (once), then retry ──────────────────────────────
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  // Bare axios call so this request is not itself intercepted/retried.
  const res = await axios.post<ApiEnvelope<RefreshResponse>>(
    `${API_BASE}/admin/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const { accessToken, refreshToken: newRefresh } = res.data.data;
  tokenStore.setTokens(accessToken, newRefresh);
  return accessToken;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    // Don't try to refresh on the login/refresh endpoints themselves.
    const url = original?.url ?? '';
    const isAuthEndpoint = url.includes('/admin/auth/login') || url.includes('/admin/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        tokenStore.clear();
        onAuthFailure?.();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

/** Pull a human-readable message out of an axios error for toasts. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Unwrap the { success, message, data } envelope and return `data`. */
export async function unwrap<T>(promise: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const res = await promise;
  return res.data.data;
}
