import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
}

export function DashboardLayout({
  children,
  eyebrow,
  title,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { session, isLoading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add('drawer-open');
      return;
    }
    document.body.classList.remove('drawer-open');
  }, [drawerOpen]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !session) {
      void router.replace('/login');
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return (
      <main className="main">
        <div className="card stack">
          <p className="eyebrow">Loading</p>
          <h1>Đang tải phiên đăng nhập...</h1>
          <p className="muted">Vui lòng chờ trong giây lát.</p>
        </div>
      </main>
    );
  }

  const handleLogout = async () => {
    await logout();
    await router.replace('/login');
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <div className="drawer-backdrop" onClick={closeDrawer} />
      <div className="shell">
        <Sidebar
          roleKey={session.roleKey}
          activePath={router.pathname}
          onCloseDrawer={closeDrawer}
        />

        <div className="content">
          <Header
            session={session}
            eyebrow={eyebrow}
            title={title}
            onOpenDrawer={() => setDrawerOpen(true)}
            onLogout={handleLogout}
          />
          <main className="main">{children}</main>
        </div>
      </div>
    </>
  );
}
