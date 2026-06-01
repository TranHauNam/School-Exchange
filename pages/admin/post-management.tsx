import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { HideRemoveModal } from '@/components/admin/HideRemoveModal';
import { LoadingState } from '@/components/common/LoadingState';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi, type PostManagementFilters } from '@/lib/services/mockApi';
import type { Post, PostStatus } from '@/lib/types/post';
import type { Category } from '@/lib/types/category';
import { useRequireRole } from '@/lib/withRoleGuard';
import {
  categoryLabelVi,
  postStatusLabel,
  typeLabel,
} from '@/lib/utils/post-labels';

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

const STATUS_OPTIONS: Array<'All' | PostStatus> = [
  'All',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Completed',
  'Removed',
];

const STATUS_LABEL_MAP: Record<string, string> = {
  All: 'Tất cả trạng thái',
  'Pending Approval': 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
  Completed: 'Hoàn tất',
  Removed: 'Đã gỡ',
};

/** Only show a thumbnail if icon is a real image data URL, not a text placeholder. */
function isRealImage(icon: string): boolean {
  return Boolean(icon && icon.startsWith('data:image/'));
}

export default function PostManagementPage() {
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['system-admin']);
  const [dataStatus, setDataStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<
    PostManagementFilters & { keyword?: string }
  >({ keyword: '', status: 'All', category: 'All', type: 'All' });
  const [hideOpen, setHideOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const loadData = useCallback(async () => {
    setDataStatus('loading');
    setErrorMessage('');
    try {
      const [allPosts, activeCategories] = await Promise.all([
        mockApi.posts.listAllPosts(filters),
        mockApi.categories.listActive(),
      ]);
      setPosts(allPosts);
      setCategories(activeCategories);
      setDataStatus(allPosts.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Không thể tải danh sách bài đăng.',
      );
      setDataStatus('error');
    }
  }, [filters]);

  useEffect(() => {
    if (!isAuthorized) return;
    const t = setTimeout(() => {
      void loadData();
    }, 120);
    return () => clearTimeout(t);
  }, [isAuthorized, loadData]);

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head>
        <title>Quản lý bài đăng · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Quản trị hệ thống" title="Quản lý bài đăng">
        <PageHead
          title="Quản lý bài đăng"
          description="Quản lý toàn bộ bài đăng trong hệ thống."
        />

        {/* ---- Filters ---- */}
        <div className="toolbar" style={{ marginBottom: 18 }}>
          <input
            className="input"
            placeholder="Tìm bài đăng, người đăng..."
            value={filters.keyword ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, keyword: e.target.value }))
            }
          />

          <select
            value={filters.status ?? 'All'}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as 'All' | PostStatus,
              }))
            }
            aria-label="Trạng thái"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {STATUS_LABEL_MAP[o] ?? o}
              </option>
            ))}
          </select>

          <select
            value={filters.category ?? 'All'}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value }))
            }
            aria-label="Danh mục"
          >
            <option value="All">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {categoryLabelVi(c.name)}
              </option>
            ))}
          </select>

          <select
            value={filters.type ?? 'All'}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                type: e.target.value as 'All',
              }))
            }
            aria-label="Loại giao dịch"
          >
            <option value="All">Tất cả loại</option>
            <option value="Sale">Bán lại</option>
            <option value="Exchange">Trao đổi</option>
            <option value="Donation">Quyên góp</option>
          </select>
        </div>

        {/* ---- Table / States ---- */}
        {dataStatus === 'loading' && <LoadingState message="Đang tải danh sách bài đăng..." />}

        {dataStatus === 'error' && (
          <ErrorState
            message={errorMessage}
            onRetry={() => {
              void loadData();
            }}
          />
        )}

        {(dataStatus === 'ready' || dataStatus === 'empty') && (
          <div className="table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th style={{ width: '42%' }}>Bài đăng</th>
                  <th>Danh mục</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="Không có bài đăng phù hợp bộ lọc." />
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => {
                    const text =
                      post.content || post.description || post.title || '';
                    const truncated =
                      text.length > 100 ? `${text.slice(0, 100)}…` : text;

                    return (
                      <tr key={post.id}>
                        {/* Post cell: optional thumbnail + text */}
                        <td>
                          <div className="pm-post-cell">
                            {isRealImage(post.icon) ? (
                              <img
                                src={post.icon}
                                alt=""
                                className="pm-thumb"
                              />
                            ) : null}
                            <div className="pm-post-body">
                              <p className="pm-post-title">{truncated}</p>
                              <p className="pm-post-meta">
                                {post.owner} ·{' '}
                                {post.campaignId
                                  ? 'Bài chiến dịch'
                                  : 'Bài thường'}
                              </p>
                              {post.campaignId ? (
                                <Link
                                  className="campaign-tag"
                                  href={`/member/campaigns/${post.campaignId}`}
                                >
                                  <span>Chiến dịch</span>
                                  {post.campaignName}
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="pm-category">
                            {categoryLabelVi(post.category)}
                          </span>
                        </td>

                        <td>{typeLabel(post.type)}</td>

                        <td>
                          <Badge
                            status={post.status}
                            label={postStatusLabel(post.status)}
                          />
                        </td>

                        <td className="pm-actions">
                          <Link
                            className="btn secondary"
                            href={`/products/${post.id}`}
                          >
                            Xem
                          </Link>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelectedPost(post);
                              setHideOpen(true);
                            }}
                          >
                            Ẩn / xóa
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <HideRemoveModal
          open={hideOpen}
          onClose={() => setHideOpen(false)}
          onConfirm={async (reason) => {
            if (!selectedPost) return;
            try {
              await mockApi.posts.hideRemovePost(selectedPost.id, reason);
              show('Đã chuyển bài đăng sang Đã gỡ.', 'success');
              setHideOpen(false);
              setSelectedPost(null);
              await loadData();
            } catch (e) {
              show(
                e instanceof ApiError
                  ? e.message
                  : 'Không thể ẩn/xóa bài.',
                'error',
              );
              throw e;
            }
          }}
        />
      </DashboardLayout>
    </>
  );
}
