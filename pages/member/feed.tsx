import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { PostCard } from '@/components/feed/PostCard';
import { RequestModal } from '@/components/feed/RequestModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useAuth } from '@/lib/auth-context';
import {
  ApiError,
  mockApi,
  type FeedFilters as FeedFiltersValue,
} from '@/lib/services/mockApi';
import { useRequireRole } from '@/lib/withRoleGuard';
import type { Campaign } from '@/lib/types/campaign';
import type { Category } from '@/lib/types/category';
import type { Post } from '@/lib/types/post';
import { useToast } from '@/components/common/Toast';
import { categoryLabelVi } from '@/lib/utils/post-labels';

type DataStatus = 'loading' | 'ready' | 'empty' | 'error';

const DEFAULT_FILTERS: FeedFiltersValue = {
  keyword: '',
  category: 'All',
  type: 'All',
  sort: 'Newest',
};

export default function MemberFeedPage() {
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member']);
  const { session } = useAuth();
  const { show } = useToast();

  const [filters, setFilters] = useState<FeedFiltersValue>(DEFAULT_FILTERS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [status, setStatus] = useState<DataStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestPost, setRequestPost] = useState<Post | null>(null);

  const loadFeed = useCallback(async (nextFilters: FeedFiltersValue) => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const [feedPosts, activeCategories, allCampaigns] = await Promise.all([
        mockApi.posts.listFeed(nextFilters),
        mockApi.categories.listActive(),
        mockApi.campaigns.listCampaigns(),
      ]);

      setPosts(feedPosts);
      setCategories(activeCategories);
      setCampaigns(allCampaigns.filter((c) => c.status === 'Active'));
      setStatus(feedPosts.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể tải Bảng tin. Vui lòng thử lại.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadFeed(filters);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [filters, isAuthorized, loadFeed]);

  // Derived counts for sidebar quick stats
  const activeCampaignCount = campaigns.length;
  const saleCount = posts.filter((p) => p.type === 'Sale').length;
  const exchangeCount = posts.filter((p) => p.type === 'Exchange').length;
  const donationCount = posts.filter((p) => p.type === 'Donation').length;

  const feedBody = useMemo(() => {
    if (status === 'loading') {
      return <LoadingState message="Đang tải Bảng tin..." />;
    }

    if (status === 'error') {
      return (
        <ErrorState
          message={errorMessage || 'Không thể tải Bảng tin. Vui lòng thử lại.'}
          onRetry={() => void loadFeed(filters)}
        />
      );
    }

    if (status === 'empty') {
      return (
        <EmptyState message="Không có bài đăng phù hợp. Thử bỏ bớt bộ lọc hoặc tìm từ khóa khác." />
      );
    }

    return (
      <div className="post-feed">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isOwn={post.owner === session?.userName}
            onRequest={(selectedPost) => {
              setRequestPost(selectedPost);
              setRequestOpen(true);
            }}
          />
        ))}
      </div>
    );
  }, [status, errorMessage, filters, posts, session?.userName, loadFeed]);

  if (guardLoading || !isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Bảng tin · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Bảng tin">
        <PageHead
          title="Bảng tin"
          description="Bảng tin bài đăng trong trường: bán lại, trao đổi, quyên góp và bài chiến dịch đã được duyệt."
          actions={
            <Link className="btn primary" href="/member/create-post">
              Tạo bài đăng
            </Link>
          }
        />

        <section className="feed-layout">
          {/* ---- Main feed column ---- */}
          <div className="stack">
            {/* Composer */}
            <article className="card post-composer">
              <span className="avatar">
                {session?.userName
                  ? String(session.userName)
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(-2)
                      .map((t) => t[0]?.toUpperCase() ?? '')
                      .join('') || 'U'
                  : 'U'}
              </span>
              <Link className="input" href="/member/create-post">
                Bạn muốn chia sẻ đồ dùng học đường nào?
              </Link>
            </article>

            {/* Quick actions */}
            <div className="quick-actions">
              <Link
                className="quick-action"
                href="/member/create-post?type=Sale"
              >
                <span className="quick-action-icon">💰</span>
                <span>Bán lại</span>
              </Link>
              <Link
                className="quick-action"
                href="/member/create-post?type=Exchange"
              >
                <span className="quick-action-icon">🔄</span>
                <span>Trao đổi</span>
              </Link>
              <Link
                className="quick-action"
                href="/member/create-post?type=Donation"
              >
                <span className="quick-action-icon">💝</span>
                <span>Quyên góp</span>
              </Link>
            </div>

            {/* Filters */}
            <section className="card">
              <FeedFilters
                categories={categories}
                value={filters}
                onChange={setFilters}
              />
            </section>

            {/* Feed */}
            {feedBody}
          </div>

          {/* ---- Right sidebar ---- */}
          <aside className="feed-side">
            {/* Active Campaigns */}
            <article className="card stack">
              <h3>Chiến dịch đang diễn ra</h3>
              {activeCampaignCount === 0 ? (
                <p className="muted small">
                  Hiện không có chiến dịch nào đang hoạt động.
                </p>
              ) : (
                campaigns.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    className="campaign-mini"
                    href={`/member/campaigns/${c.id}`}
                  >
                    <span className="campaign-mini-cover">
                      {c.cover ? c.cover.slice(0, 2).toUpperCase() : 'CG'}
                    </span>
                    <span className="campaign-mini-body">
                      <strong>{c.name}</strong>
                      <span>{c.description}</span>
                    </span>
                  </Link>
                ))
              )}
              {activeCampaignCount > 0 ? (
                <Link
                  className="btn ghost"
                  href="/member/campaigns"
                  style={{ justifyContent: 'center', width: '100%' }}
                >
                  Xem tất cả chiến dịch
                </Link>
              ) : null}
            </article>

            {/* Categories */}
            <article className="card stack">
              <h3>Danh mục</h3>
              {categories.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`category-chip${
                    filters.category === c.name ? ' active' : ''
                  }`}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      category: prev.category === c.name ? 'All' : c.name,
                    }))
                  }
                >
                  {categoryLabelVi(c.name)}
                  <span className="muted">{c.count}</span>
                </button>
              ))}
            </article>

            {/* Quick stats */}
            <article className="card stack">
              <h3>Thống kê nhanh</h3>
              <div className="stats-mini">
                <div className="stat-mini">
                  <span className="stat-mini-value">{posts.length}</span>
                  <span className="muted small">Bài đăng hiển thị</span>
                </div>
                <div className="stat-mini">
                  <span className="stat-mini-value">{saleCount}</span>
                  <span className="muted small">Bán lại</span>
                </div>
                <div className="stat-mini">
                  <span className="stat-mini-value">{exchangeCount}</span>
                  <span className="muted small">Trao đổi</span>
                </div>
                <div className="stat-mini">
                  <span className="stat-mini-value">{donationCount}</span>
                  <span className="muted small">Quyên góp</span>
                </div>
              </div>
            </article>
          </aside>
        </section>

        {requestPost ? (
          <RequestModal
            open={requestOpen}
            post={requestPost}
            onClose={() => {
              setRequestOpen(false);
              setRequestPost(null);
            }}
            onSubmit={async (message, contact) => {
              try {
                await mockApi.requests.sendRequest(
                  requestPost.id,
                  message,
                  contact,
                );
                show(
                  'Đã gửi yêu cầu. Chủ bài đăng sẽ thấy trong My Requests.',
                  'success',
                );
                setRequestOpen(false);
                setRequestPost(null);
              } catch (error) {
                const errorText =
                  error instanceof ApiError
                    ? error.message
                    : 'Không thể gửi yêu cầu. Vui lòng thử lại.';
                show(errorText, 'error');
                throw error;
              }
            }}
          />
        ) : null}
      </DashboardLayout>
    </>
  );
}
