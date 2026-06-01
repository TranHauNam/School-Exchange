import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { Post, PostStatus } from '@/lib/types/post';
import { useRequireRole } from '@/lib/withRoleGuard';
import { formatDate } from '@/lib/utils/formatDate';
import {
  postStatusLabel,
  typeBadgeStatus,
  typeLabel,
} from '@/lib/utils/post-labels';

type LoadStatus = 'loading' | 'ready' | 'error';

const STATUS_FILTERS: { value: 'All' | PostStatus; label: string }[] = [
  { value: 'All', label: 'Tất cả' },
  { value: 'Pending Approval', label: 'Chờ duyệt' },
  { value: 'Approved', label: 'Đã duyệt' },
  { value: 'Rejected', label: 'Từ chối' },
  { value: 'Completed', label: 'Hoàn tất' },
  { value: 'Removed', label: 'Đã gỡ' },
];

export default function MyPostsPage() {
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | PostStatus>('All');

  const loadMyPosts = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const data = await mockApi.posts.listMyPosts();
      setPosts(data);
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể tải danh sách bài đăng của bạn.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    const timeout = window.setTimeout(() => { void loadMyPosts(); }, 120);
    return () => window.clearTimeout(timeout);
  }, [isAuthorized, loadMyPosts]);

  const filteredPosts = useMemo(() => {
    if (statusFilter === 'All') return posts;
    return posts.filter((p) => p.status === statusFilter);
  }, [posts, statusFilter]);

  const handleRemove = async (postId: string) => {
    try {
      await mockApi.posts.removePost(postId);
      show('Đã gỡ bài đăng.', 'success');
      await loadMyPosts();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể gỡ bài đăng. Vui lòng thử lại.';
      show(message, 'error');
    }
  };

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head>
        <title>Bài của tôi · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Bài của tôi">
        <PageHead
          eyebrow="Bảng tin trường"
          title="Bài của tôi"
          description="Quản lý các bài đăng bạn đã tạo, xem trạng thái duyệt và chỉnh sửa khi cần."
          actions={
            <Link className="btn primary" href="/member/create-post">
              + Tạo bài đăng
            </Link>
          }
        />

        {status === 'loading' && <LoadingState message="Đang tải bài của bạn..." />}
        {status === 'error' && (
          <ErrorState
            message={errorMessage || 'Không thể tải danh sách bài đăng của bạn.'}
            onRetry={() => { void loadMyPosts(); }}
          />
        )}

        {status === 'ready' && (
          <section className="stack">
            {/* ---- Filter ---- */}
            <div className="between">
              <div className="field" style={{ maxWidth: 240 }}>
                <label htmlFor="statusFilter">Lọc trạng thái</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'All' | PostStatus)
                  }
                >
                  {STATUS_FILTERS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ---- Post list ---- */}
            {filteredPosts.length === 0 ? (
              <div className="card">
                <EmptyState message="Chưa có bài đăng ở trạng thái này." />
              </div>
            ) : (
              <div className="my-posts-list">
                {/* Header */}
                <div className="my-posts-header">
                  <span className="my-posts-col-post">Bài đăng</span>
                  <span className="my-posts-col-type">Hình thức</span>
                  <span className="my-posts-col-status">Trạng thái</span>
                  <span className="my-posts-col-date">Ngày tạo</span>
                  <span className="my-posts-col-reason">Lý do từ chối</span>
                  <span className="my-posts-col-actions">Thao tác</span>
                </div>

                {/* Rows */}
                {filteredPosts.map((post) => (
                  <div key={post.id} className="my-posts-row">
                    <div className="my-posts-col-post">
                      <div className="my-post-preview">
                        <p className="my-post-content">
                          {post.content || post.description || post.title}
                        </p>
                        {post.campaignId && (
                          <Link className="campaign-tag" href={`/member/campaigns/${post.campaignId}`}>
                            <svg className="campaign-tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                            </svg>
                            <span>Chiến dịch</span>
                            {post.campaignName}
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="my-posts-col-type">
                      <Badge status={typeBadgeStatus(post.type)} label={typeLabel(post.type)} />
                    </div>

                    <div className="my-posts-col-status">
                      <Badge status={post.status} label={postStatusLabel(post.status)} />
                    </div>

                    <div className="my-posts-col-date muted">{formatDate(post.date)}</div>

                    <div className="my-posts-col-reason muted small">
                      {post.reason ? <span className="my-post-reason">{post.reason}</span> : '—'}
                    </div>

                    <div className="my-posts-col-actions">
                      <Link className="my-post-action my-post-action-view" href={`/products/${post.id}`}>Xem</Link>
                      <Link className="my-post-action my-post-action-edit" href={`/member/create-post?edit=${post.id}`}>Sửa</Link>
                      <button type="button" className="my-post-action my-post-action-remove" onClick={() => void handleRemove(post.id)}>Gỡ</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </DashboardLayout>
    </>
  );
}
