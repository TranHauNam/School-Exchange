import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BarChart } from '@/components/admin/BarChart';
import { StatCard } from '@/components/admin/StatCard';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { Campaign } from '@/lib/types/campaign';
import type { Post, PostStatus } from '@/lib/types/post';
import type { ProductRequest } from '@/lib/types/request';
import { useRequireRole } from '@/lib/withRoleGuard';

type LoadStatus = 'loading' | 'ready' | 'error';

interface DashboardData {
  posts: Post[];
  campaigns: Campaign[];
  completedRequests: ProductRequest[];
}

const POST_STATUSES: PostStatus[] = [
  'Approved',
  'Pending Approval',
  'Rejected',
  'Removed',
];

function heightPct(value: number, max: number): number {
  if (max <= 0) {
    return 12;
  }
  return Math.max(12, Math.round((value / max) * 100));
}

export default function AdminDashboardPage() {
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['system-admin']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState<DashboardData>({
    posts: [],
    campaigns: [],
    completedRequests: [],
  });

  const loadDashboard = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const [posts, campaigns, completedRequests] = await Promise.all([
        mockApi.posts.listAllPosts(),
        mockApi.campaigns.listAllCampaigns(),
        mockApi.requests.listCompleted(),
      ]);

      setData({ posts, campaigns, completedRequests });
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Không thể tải dashboard.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isAuthorized, loadDashboard]);

  const derived = useMemo(() => {
    const pendingApprovals = data.posts.filter(
      (post) => post.status === 'Pending Approval',
    ).length;
    const approvedPosts = data.posts.filter((post) => post.status === 'Approved').length;
    const activeCampaigns = data.campaigns.filter(
      (campaign) => campaign.status === 'Active',
    ).length;

    const statusCounts = POST_STATUSES.map((postStatus) => ({
      label: postStatus === 'Pending Approval' ? 'Pending' : postStatus,
      count: data.posts.filter((post) => post.status === postStatus).length,
      color:
        postStatus === 'Pending Approval'
          ? 'var(--warning)'
          : postStatus === 'Rejected'
            ? 'var(--danger)'
            : postStatus === 'Removed'
              ? 'var(--removed)'
              : undefined,
    }));

    const maxStatus = Math.max(...statusCounts.map((item) => item.count), 0);
    const requestMonths = ['Th2', 'Th3', 'Th4', 'Th5', 'Th6'];
    const monthCounts = requestMonths.map((label) => ({
      label,
      count: data.completedRequests.filter((request) => {
        const month = request.date.slice(5, 7);
        return (
          (label === 'Feb' && month === '02') ||
          (label === 'Mar' && month === '03') ||
          (label === 'Apr' && month === '04') ||
          (label === 'May' && month === '05') ||
          (label === 'Jun' && month === '06')
        );
      }).length,
    }));
    const maxMonths = Math.max(...monthCounts.map((item) => item.count), 0);

    return {
      totalPosts: data.posts.length,
      pendingApprovals,
      approvedPosts,
      completedTransactions: data.completedRequests.length,
      activeCampaigns,
      statusBars: statusCounts.map((item) => ({
        label: item.label,
        heightPct: heightPct(item.count, maxStatus),
        color: item.color,
      })),
      requestBars: monthCounts.map((item) => ({
        label: item.label,
        heightPct: heightPct(item.count, maxMonths),
      })),
    };
  }, [data]);

  if (guardLoading || !isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Quản trị hệ thống" title="Tổng quan">
        <PageHead
          title="Tổng quan"
          description="Tổng quan số liệu cơ bản cho post feed, request và campaign."
        />

        {status === 'loading' ? <LoadingState message="Đang tải dashboard..." /> : null}

        {status === 'error' ? (
          <ErrorState
            message={errorMessage || 'Không thể tải dashboard.'}
            onRetry={() => {
              void loadDashboard();
            }}
          />
        ) : null}

        {status === 'ready' ? (
          <section className="stack">
            <div className="stats">
              <StatCard label="Tổng số bài" value={derived.totalPosts} />
              <StatCard label="Chờ duyệt" value={derived.pendingApprovals} />
              <StatCard label="Đã duyệt" value={derived.approvedPosts} />
              <StatCard
                label="Giao dịch hoàn tất"
                value={derived.completedTransactions}
              />
              <StatCard label="Chiến dịch đang hoạt động" value={derived.activeCampaigns} />
            </div>

            <div className="grid cols-2">
              <article className="card">
                <h2>Bài đăng theo trạng thái</h2>
                <BarChart bars={derived.statusBars} />
              </article>
              <article className="card">
                <h2>Yêu cầu theo tháng</h2>
                <BarChart bars={derived.requestBars} />
              </article>
            </div>
          </section>
        ) : null}
      </DashboardLayout>
    </>
  );
}
