import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth-context';
import type { RoleKey } from '@/lib/types/role';

const ROUTE_BY_ROLE: Record<RoleKey, string> = {
  member: '/member/feed',
  'system-admin': '/admin/dashboard',
  'activity-admin': '/activity-admin/my-campaigns',
};

export default function Home() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!session) {
      void router.replace('/login');
      return;
    }

    const route = ROUTE_BY_ROLE[session.roleKey];
    if (route) {
      void router.replace(route);
    } else {
      console.warn('[index] Unknown roleKey:', session.roleKey);
      void router.replace('/login');
    }
  }, [isLoading, session, router]);

  return (
    <>
      <Head>
        <title>School Item Exchange</title>
        <meta
          name="description"
          content="School Item Exchange — frontend prototype"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="main">
        <section className="card stack">
          <p className="eyebrow">Launcher</p>
          <h1>School Item Exchange</h1>
          <p className="muted">Đang điều hướng theo phiên đăng nhập...</p>
        </section>
      </main>
    </>
  );
}
