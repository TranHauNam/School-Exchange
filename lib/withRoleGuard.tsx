import { useRouter } from 'next/router';
import { useEffect, useMemo, type ComponentType } from 'react';

import { useAuth, type Session } from '@/lib/auth-context';
import type { RoleKey } from '@/lib/types/role';

const AUTH_SESSION_KEY = 'schoolItemExchangeAuthSessionV1';

function readPersistedSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

interface RequireRoleResult {
  isLoading: boolean;
  isAuthorized: boolean;
}

export function useRequireRole(allowedRoles: RoleKey[]): RequireRoleResult {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  // Use localStorage as fallback when React context is stale during navigation.
  const effectiveSession = useMemo(() => {
    if (session) return session;
    const persisted = readPersistedSession();
    if (persisted && allowedRoles.includes(persisted.roleKey)) return persisted;
    return session;
  }, [session, allowedRoles]);

  const isAuthorized =
    Boolean(effectiveSession) &&
    Boolean(effectiveSession && allowedRoles.includes(effectiveSession.roleKey));

  console.log('[useRequireRole]', {
    isLoading,
    hasSession: Boolean(session),
    sessionRoleKey: session?.roleKey,
    effectiveRoleKey: effectiveSession?.roleKey,
    allowedRoles,
    isAuthorized,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!effectiveSession) {
      console.log('[useRequireRole] redirecting to /login (no session)');
      void router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(effectiveSession.roleKey)) {
      console.log('[useRequireRole] redirecting to /403 (role mismatch)');
      void router.replace('/403');
    }
  }, [allowedRoles, isLoading, effectiveSession, router]);

  return { isLoading, isAuthorized };
}

export function withRoleGuard<P extends object>(
  Component: ComponentType<P>,
  allowedRoles: RoleKey[],
) {
  return function GuardedComponent(props: P) {
    const { isLoading, isAuthorized } = useRequireRole(allowedRoles);

    if (isLoading || !isAuthorized) {
      return (
        <main className="main">
          <div className="card stack">
            <p className="eyebrow">Access check</p>
            <h1>Đang kiểm tra quyền truy cập...</h1>
            <p className="muted">Vui lòng chờ trong giây lát.</p>
          </div>
        </main>
      );
    }

    return <Component {...props} />;
  };
}
