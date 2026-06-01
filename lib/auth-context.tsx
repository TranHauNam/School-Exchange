import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { mockApi as api, type Session } from '@/lib/services/mockApi';

const AUTH_SESSION_KEY = 'schoolItemExchangeAuthSessionV1';

export type { Session } from '@/lib/services/mockApi';

export interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  ready: boolean;
  login: (email: string, password: string, isAdmin?: boolean) => Promise<Session>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readPersistedSession(): Session | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function persistSession(session: Session | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      try {
        // Try to restore session from backend via stored JWT token.
        // The httpApi stores the token internally; getSession() calls GET /api/auth/me.
        console.log('[auth-context.bootstrap] calling api.auth.getSession()');
        const restored = await api.auth.getSession();
        console.log('[auth-context.bootstrap] restored session:', restored);
        if (!mounted) return;

        if (restored) {
          setSession(restored);
        }
        // If no token or token expired, session stays null (logged-out view).
      } catch {
        // Network error or server down — try fallback from localStorage.
        if (mounted) {
          const persisted = readPersistedSession();
          console.log('[auth-context.bootstrap] fallback to localStorage:', persisted);
          setSession(persisted);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, isAdmin?: boolean) => {
    console.log('[auth-context.login] calling api.auth.login with:', { email, isAdmin });
    const nextSession = await api.auth.login(email, password, isAdmin);
    console.log('[auth-context.login] session received:', nextSession);
    setSession(nextSession);
    persistSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore errors during logout
    }
    setSession(null);
    persistSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      ready: !isLoading,
      login,
      logout,
    }),
    [session, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
