import { ACCESS_TOKEN_KEY, ADMIN_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants';
import type { Admin } from './types';

/**
 * Access token is held in memory (primary) but mirrored to localStorage so a
 * page reload can rehydrate without forcing a fresh sign-in; refresh token is
 * persisted in localStorage per the spec (memory + storage).
 */
let accessToken: string | null = localStorage.getItem(ACCESS_TOKEN_KEY);

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const tokenStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getAccessToken(): string | null {
    return accessToken;
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getAdmin(): Admin | null {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Admin;
    } catch {
      return null;
    }
  },

  setSession(access: string, refresh: string, admin: Admin) {
    accessToken = access;
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    emit();
  },

  setTokens(access: string, refresh: string) {
    accessToken = access;
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    emit();
  },

  setAdmin(admin: Admin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    emit();
  },

  clear() {
    accessToken = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    emit();
  },
};
