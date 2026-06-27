import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { setAuthFailureHandler, getErrorMessage } from '@/api/client';
import { tokenStore } from '@/api/tokenStore';
import type { Admin } from '@/api/types';

// ── Return type for login ─────────────────────────────────────────────────────
export type LoginResult =
  | { ok: true }
  | { ok: false }
  | { requiresTwoFactor: true; twoFactorToken: string };

interface AuthContextValue {
  admin: Admin | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loggingIn: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  verify2FA: (twoFactorToken: string, code: string) => Promise<boolean>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_ROLES = ['admin', 'superadmin'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => tokenStore.getAdmin());
  const [loggingIn, setLoggingIn] = useState(false);

  // Force logout when token refresh fails inside the axios interceptor.
  useEffect(() => {
    setAuthFailureHandler(() => {
      tokenStore.clear();
      setAdmin(null);
      toast.error('Session expired. Please sign in again.');
    });
  }, []);

  // Keep React state in sync with the token store (multi-tab / interceptor updates).
  useEffect(() => {
    return tokenStore.subscribe(() => setAdmin(tokenStore.getAdmin()));
  }, []);

  // If we rehydrated from storage, revalidate the session against /me in the
  // background so a stale/expired token surfaces immediately.
  useEffect(() => {
    if (!tokenStore.getAccessToken()) return;
    authApi
      .me()
      .then((fresh) => tokenStore.setAdmin(fresh))
      .catch(() => {
        /* interceptor handles refresh/logout */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    setLoggingIn(true);
    try {
      const result = await authApi.login(username.trim(), password);

      if ('requiresTwoFactor' in result) {
        return { requiresTwoFactor: true, twoFactorToken: result.twoFactorToken };
      }

      if (!ADMIN_ROLES.includes(result.admin.role)) {
        toast.error('Not an admin account.');
        return { ok: false };
      }

      tokenStore.setSession(result.accessToken, result.refreshToken, result.admin);
      setAdmin(result.admin);
      toast.success(`Welcome, ${result.admin.name || result.admin.username}`);
      return { ok: true };
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'));
      return { ok: false };
    } finally {
      setLoggingIn(false);
    }
  };

  const verify2FA = async (twoFactorToken: string, code: string): Promise<boolean> => {
    setLoggingIn(true);
    try {
      const result = await authApi.verify2FA(twoFactorToken, code);

      if (!ADMIN_ROLES.includes(result.admin.role)) {
        toast.error('Not an admin account.');
        return false;
      }

      tokenStore.setSession(result.accessToken, result.refreshToken, result.admin);
      setAdmin(result.admin);
      toast.success(`Welcome, ${result.admin.name || result.admin.username}`);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid code. Please try again.'));
      return false;
    } finally {
      setLoggingIn(false);
    }
  };

  const refreshAdmin = async () => {
    try {
      const fresh = await authApi.me();
      tokenStore.setAdmin(fresh);
      setAdmin(fresh);
    } catch {
      // silently ignore — session is still valid
    }
  };

  const logout = async () => {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Best-effort; clear locally regardless.
    } finally {
      tokenStore.clear();
      setAdmin(null);
      toast.success('Signed out');
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      isAuthenticated: !!admin && !!tokenStore.getAccessToken(),
      isAdmin: !!admin && ADMIN_ROLES.includes(admin.role),
      loggingIn,
      login,
      logout,
      verify2FA,
      refreshAdmin,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admin, loggingIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
