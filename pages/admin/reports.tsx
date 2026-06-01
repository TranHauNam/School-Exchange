import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BarChart } from '@/components/admin/BarChart';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatCard } from '@/components/admin/StatCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Tabs } from '@/components/common/Tabs';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type {
  ReportOverview,
  PostStatsDetail,
  PostDetailRow,
  TransactionStats,
  TransactionByType,
  FeeDetailRow,
  CampaignStatsReport,
  CampaignPerformanceRow,
} from '@/lib/types/report';
import {
  typeLabel,
  postStatusLabel,
  categoryLabelVi,
  campaignStatusLabel,
} from '@/lib/utils/post-labels';
import { formatDate } from '@/lib/utils/formatDate';
import { money } from '@/lib/utils/money';
import { useRequireRole } from '@/lib/withRoleGuard';

// ============================================================================
// Helpers
// ============================================================================

type LoadStatus = 'loading' | 'ready' | 'error';

interface ReportsData {
  overview: ReportOverview | null;
  postStats: PostStatsDetail | null;
  transactionStats: TransactionStats | null;
  campaignStats: CampaignStatsReport | null;
}

const REPORT_TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'posts', label: 'Bài đăng' },
  { id: 'transactions', label: 'Giao dịch' },
  { id: 'campaigns', label: 'Chiến dịch' },
] as const;

type TabId = (typeof REPORT_TABS)[number]['id'];

function heightPct(value: number, max: number): number {
  if (max <= 0) return 12;
  return Math.max(12, Math.round((value / max) * 100));
}

/** Map status to bar chart colour. */
function statusColor(status: string): string | undefined {
  if (status === 'Approved' || status === 'Đã duyệt') return 'var(--success)';
  if (status === 'Pending' || status === 'Chờ duyệt') return 'var(--warning)';
  if (status === 'Rejected' || status === 'Từ chối') return 'var(--danger)';
  if (status === 'Removed' || status === 'Đã gỡ') return 'var(--removed)';
  return undefined;
}

/** Derive bar colour from index (for category/type charts). */
const CHART_COLORS = [
  'var(--primary)',
  'var(--success)',
  'var(--warning)',
  'var(--danger)',
  'var(--removed)',
  '#8B5CF6',
];

// ============================================================================
// Tab components
// ============================================================================

function OverviewTab({ data }: { data: ReportOverview }) {
  const maxPostStatus = Math.max(...data.postsByStatus.map((c) => c.count), 0);
  const maxPostCat = Math.max(...data.postsByCategory.map((c) => c.count), 0);
  const maxPostType = Math.max(...data.postsByType.map((c) => c.count), 0);
  const maxPostMonth = Math.max(...data.postsByMonth.map((c) => c.count), 0);
  const maxTxMonth = Math.max(...data.transactionsByMonth.map((c) => c.count), 0);

  return (
    <div className="stack">
      {/* KPI row 1 */}
      <div className="stats">
        <StatCard label="Tổng số bài" value={data.totalPosts} />
        <StatCard label="Chờ duyệt" value={data.pendingApprovals} />
        <StatCard label="Đã duyệt" value={data.approvedPosts} />
        <StatCard label="Giao dịch hoàn tất" value={data.totalTransactions} />
      </div>

      {/* KPI row 2 */}
      <div className="stats">
        <StatCard label="Tổng doanh thu" value={money(data.totalTransactionVolume)} />
        <StatCard label="Phí thu được" value={money(data.totalFeeRevenue)} />
        <StatCard label="Chiến dịch đang hoạt động" value={data.activeCampaigns} />
        <StatCard label="Bài bị từ chối" value={data.rejectedPosts} />
      </div>

      {/* Charts row 1 */}
      <div className="grid cols-2">
        <article className="card">
          <h2>Bài đăng theo trạng thái</h2>
          <BarChart
            bars={data.postsByStatus.map((c) => ({
              label: postStatusLabel(c.label),
              heightPct: heightPct(c.count, maxPostStatus),
              color: statusColor(c.label),
            }))}
          />
        </article>
        <article className="card">
          <h2>Bài đăng theo danh mục</h2>
          <BarChart
            bars={data.postsByCategory.map((c, i) => ({
              label: categoryLabelVi(c.label),
              heightPct: heightPct(c.count, maxPostCat),
              color: CHART_COLORS[i % CHART_COLORS.length],
            }))}
          />
        </article>
      </div>

      {/* Charts row 2 */}
      <div className="grid cols-2">
        <article className="card">
          <h2>Bài đăng theo loại giao dịch</h2>
          <BarChart
            bars={data.postsByType.map((c) => ({
              label: typeLabel(c.label),
              heightPct: heightPct(c.count, maxPostType),
              color:
                c.label === 'Sale'
                  ? 'var(--primary)'
                  : c.label === 'Exchange'
                    ? 'var(--success)'
                    : 'var(--warning)',
            }))}
          />
        </article>
        <article className="card">
          <h2>Giao dịch theo tháng</h2>
          <BarChart
            bars={data.transactionsByMonth.map((c) => ({
              label: c.label,
              heightPct: heightPct(c.count, maxTxMonth),
            }))}
          />
        </article>
      </div>

      {/* Charts row 3 */}
      <div className="grid cols-2">
        <article className="card">
          <h2>Bài đăng theo tháng</h2>
          <BarChart
            bars={data.postsByMonth.map((c) => ({
              label: c.label,
              heightPct: heightPct(c.count, maxPostMonth),
            }))}
          />
        </article>
      </div>
    </div>
  );
}

function PostsTab({ data }: { data: PostStatsDetail }) {
  const maxStatus = Math.max(...data.postsByStatus.map((c) => c.count), 0);
  const maxCat = Math.max(...data.postsByCategory.map((c) => c.count), 0);
  const maxType = Math.max(...data.postsByType.map((c) => c.count), 0);
  const maxMonth = Math.max(...data.postsByMonth.map((c) => c.count), 0);

  const totalPosts = data.postDetailRows.length;
  const approved = data.postsByStatus.find((s) => s.label === 'Approved')?.count ?? 0;
  const pending = data.postsByStatus.find((s) => s.label === 'Pending')?.count ?? 0;
  const rejected = data.postsByStatus.find((s) => s.label === 'Rejected')?.count ?? 0;

  const postColumns: DataTableColumn<PostDetailRow>[] = [
    { header: 'Tên bài đăng', render: (r) => r.title },
    { header: 'Người đăng', render: (r) => r.owner },
    { header: 'Danh mục', render: (r) => categoryLabelVi(r.category) },
    {
      header: 'Loại',
      render: (r) => <Badge status={r.type} label={typeLabel(r.type)} />,
    },
    {
      header: 'Trạng thái',
      render: (r) => <Badge status={r.status} label={postStatusLabel(r.status)} />,
    },
    { header: 'Ngày', render: (r) => formatDate(r.date) },
    { header: 'Chiến dịch', render: (r) => r.campaignName ?? '—' },
  ];

  return (
    <div className="stack">
      <div className="stats">
        <StatCard label="Tổng số bài" value={totalPosts} />
        <StatCard label="Đã duyệt" value={approved} />
        <StatCard label="Chờ duyệt" value={pending} />
        <StatCard label="Từ chối" value={rejected} />
      </div>

      <div className="grid cols-2">
        <article className="card">
          <h2>Bài đăng theo trạng thái</h2>
          <BarChart
            bars={data.postsByStatus.map((c) => ({
              label: postStatusLabel(c.label),
              heightPct: heightPct(c.count, maxStatus),
              color: statusColor(c.label),
            }))}
          />
        </article>
        <article className="card">
          <h2>Bài đăng theo danh mục</h2>
          <BarChart
            bars={data.postsByCategory.map((c, i) => ({
              label: categoryLabelVi(c.label),
              heightPct: heightPct(c.count, maxCat),
              color: CHART_COLORS[i % CHART_COLORS.length],
            }))}
          />
        </article>
        <article className="card">
          <h2>Bài đăng theo loại</h2>
          <BarChart
            bars={data.postsByType.map((c) => ({
              label: typeLabel(c.label),
              heightPct: heightPct(c.count, maxType),
              color:
                c.label === 'Sale'
                  ? 'var(--primary)'
                  : c.label === 'Exchange'
                    ? 'var(--success)'
                    : 'var(--warning)',
            }))}
          />
        </article>
        <article className="card">
          <h2>Bài đăng theo tháng</h2>
          <BarChart
            bars={data.postsByMonth.map((c) => ({
              label: c.label,
              heightPct: heightPct(c.count, maxMonth),
            }))}
          />
        </article>
      </div>

      <article className="card">
        <h2>Danh sách bài đăng</h2>
        <DataTable
          columns={postColumns}
          rows={data.postDetailRows}
          rowKey={(r) => r.id}
          empty={<EmptyState message="Không có bài đăng nào." />}
        />
      </article>
    </div>
  );
}

function TransactionsTab({ data }: { data: TransactionStats }) {
  const maxType = Math.max(...data.transactionsByType.map((t) => t.count), 0);
  const maxMonth = Math.max(...data.transactionsByMonth.map((t) => t.count), 0);

  const feeColumns: DataTableColumn<FeeDetailRow>[] = [
    { header: 'Mã giao dịch', render: (r) => `#${r.transactionId}` },
    { header: 'Số tiền', render: (r) => money(r.amount) },
    { header: 'Phí (5%)', render: (r) => money(r.fee) },
    {
      header: 'Loại',
      render: (r) => <Badge status={r.type} label={typeLabel(r.type)} />,
    },
    { header: 'Ngày', render: (r) => formatDate(r.date) },
    { header: 'Ghi chú', render: (r) => r.note },
  ];

  return (
    <div className="stack">
      <div className="stats">
        <StatCard label="Tổng giao dịch" value={data.totalTransactions} />
        <StatCard label="Tổng giá trị" value={money(data.totalVolume)} />
        <StatCard label="Tổng phí thu" value={money(data.totalFees)} />
        <StatCard label="Phí trung bình" value={`${data.averageFeePct}%`} />
      </div>

      <div className="grid cols-2">
        <article className="card">
          <h2>Giao dịch theo loại</h2>
          <BarChart
            bars={data.transactionsByType.map((t) => ({
              label: typeLabel(t.type),
              heightPct: heightPct(t.count, maxType),
              color:
                t.type === 'Sale'
                  ? 'var(--primary)'
                  : t.type === 'Exchange'
                    ? 'var(--success)'
                    : 'var(--warning)',
            }))}
          />
        </article>
        <article className="card">
          <h2>Giao dịch theo tháng</h2>
          <BarChart
            bars={data.transactionsByMonth.map((t) => ({
              label: t.label,
              heightPct: heightPct(t.count, maxMonth),
            }))}
          />
        </article>
      </div>

      <article className="card">
        <h2>Chi tiết phí giao dịch</h2>
        <DataTable
          columns={feeColumns}
          rows={data.feeDetails}
          rowKey={(r) => String(r.transactionId)}
          empty={<EmptyState message="Chưa có phí giao dịch nào." />}
        />
      </article>
    </div>
  );
}

function CampaignsTab({ data }: { data: CampaignStatsReport }) {
  const totalPosts = data.campaigns.reduce((s, c) => s + c.totalPosts, 0);
  const totalActive = data.campaigns.filter((c) => c.status === 'Active').length;
  const totalFees = data.campaigns.reduce((s, c) => s + c.totalFees, 0);
  const totalVolume = data.campaigns.reduce((s, c) => s + c.totalVolume, 0);

  const campaignColumns: DataTableColumn<CampaignPerformanceRow>[] = [
    { header: 'Tên chiến dịch', render: (r) => r.campaignName },
    { header: 'Đơn vị tổ chức', render: (r) => r.organizer },
    { header: 'Loại', render: (r) => typeLabel(r.type) },
    {
      header: 'Trạng thái',
      render: (r) => (
        <Badge status={r.status} label={campaignStatusLabel(r.status)} />
      ),
    },
    {
      header: 'Thời gian',
      render: (r) => `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`,
    },
    { header: 'Tổng bài', render: (r) => r.totalPosts },
    { header: 'Đã duyệt', render: (r) => r.approvedPosts },
    { header: 'Chờ duyệt', render: (r) => r.pendingPosts },
    { header: 'Giao dịch', render: (r) => r.completedTransactions },
    { header: 'Doanh thu', render: (r) => money(r.totalVolume) },
    { header: 'Phí thu', render: (r) => money(r.totalFees) },
  ];

  return (
    <div className="stack">
      <div className="stats">
        <StatCard label="Tổng chiến dịch" value={data.campaigns.length} />
        <StatCard label="Đang hoạt động" value={totalActive} />
        <StatCard label="Tổng bài đăng" value={totalPosts} />
        <StatCard label="Phí thu được" value={money(totalFees)} />
      </div>

      <article className="card">
        <h2>Hiệu suất chiến dịch</h2>
        <DataTable
          columns={campaignColumns}
          rows={data.campaigns}
          rowKey={(r) => r.campaignId}
          empty={<EmptyState message="Không có chiến dịch nào." />}
        />
      </article>
    </div>
  );
}

// ============================================================================
// Page component
// ============================================================================

export default function AdminReportsPage() {
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['system-admin']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState<ReportsData>({
    overview: null,
    postStats: null,
    transactionStats: null,
    campaignStats: null,
  });
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const loadReports = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const [overview, postStats, transactionStats, campaignStats] =
        await Promise.all([
          mockApi.reports.getOverview(),
          mockApi.reports.getPostStats(),
          mockApi.reports.getTransactionStats(),
          mockApi.reports.getCampaignStats(),
        ]);

      setData({ overview, postStats, transactionStats, campaignStats });
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Không thể tải báo cáo.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;

    const timeout = window.setTimeout(() => {
      void loadReports();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isAuthorized, loadReports]);

  if (guardLoading || !isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Báo cáo · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Quản trị hệ thống" title="Báo cáo">
        <PageHead
          title="Báo cáo"
          description="Thống kê và báo cáo dữ liệu toàn hệ thống."
        />

        {status === 'loading' ? (
          <LoadingState message="Đang tải báo cáo..." />
        ) : null}

        {status === 'error' ? (
          <ErrorState
            message={errorMessage || 'Không thể tải báo cáo.'}
            onRetry={() => {
              void loadReports();
            }}
          />
        ) : null}

        {status === 'ready' ? (
          <section className="stack">
            <Tabs
              tabs={REPORT_TABS as unknown as { id: string; label: string }[]}
              active={activeTab}
              onChange={(id) => setActiveTab(id as TabId)}
            />

            {activeTab === 'overview' && data.overview && (
              <OverviewTab data={data.overview} />
            )}
            {activeTab === 'posts' && data.postStats && (
              <PostsTab data={data.postStats} />
            )}
            {activeTab === 'transactions' && data.transactionStats && (
              <TransactionsTab data={data.transactionStats} />
            )}
            {activeTab === 'campaigns' && data.campaignStats && (
              <CampaignsTab data={data.campaignStats} />
            )}
          </section>
        ) : null}
      </DashboardLayout>
    </>
  );
}
