import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ApprovalActions } from '@/components/admin/ApprovalActions';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import { formatDate } from '@/lib/utils/formatDate';
import { money } from '@/lib/utils/money';
import {
  avatarText,
  categoryLabelVi,
  typeBadgeStatus,
  typeLabel,
} from '@/lib/utils/post-labels';
import type { Post } from '@/lib/types/post';
import { useRequireRole } from '@/lib/withRoleGuard';

type LoadStatus = 'loading' | 'ready' | 'error';

const GRID_COLS = 'minmax(0, 1fr) 120px 110px 100px 120px 260px';

function postKind(post: Post): string {
  return post.campaignId ? 'Bài chiến dịch' : 'Bài thường';
}

function displayPrice(post: Post): string {
  if (post.type === 'Sale') return money(post.price);
  return typeLabel(post.type);
}

export default function PostApprovalPage() {
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } =
    useRequireRole(['system-admin']);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPending = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const pending = await mockApi.posts.listPendingPosts();
      setPosts(pending);
      setStatus('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Không thể tải danh sách chờ duyệt.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    const t = setTimeout(() => {
      void loadPending();
    }, 120);
    return () => clearTimeout(t);
  }, [isAuthorized, loadPending]);

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head>
        <title>Duyệt bài · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Quản trị hệ thống" title="Duyệt bài">
        <PageHead
          title="Duyệt bài đăng"
          description="Xem nội dung bài đăng và quyết định duyệt hoặc từ chối trước khi bài hiển thị trên bảng tin."
        />

        {status === 'loading' && (
          <LoadingState message="Đang tải danh sách chờ duyệt..." />
        )}
        {status === 'error' && (
          <ErrorState
            message={errorMessage}
            onRetry={() => {
              void loadPending();
            }}
          />
        )}

        {status === 'ready' && (
          <>
            {posts.length === 0 ? (
              <EmptyState message="Không có bài đăng chờ duyệt." />
            ) : (
              <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
              <div className="approval-grid">
                {/* ---- Header ---- */}
                <div
                  className="approval-header"
                  style={{ gridTemplateColumns: GRID_COLS }}
                >
                  <div>Bài đăng</div>
                  <div>Danh mục</div>
                  <div>Hình thức</div>
                  <div>Giá</div>
                  <div>Ngày gửi</div>
                  <div>Thao tác</div>
                </div>

                {/* ---- Rows ---- */}
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="approval-row"
                    style={{ gridTemplateColumns: GRID_COLS }}
                  >
                    {/* ---- Post info ---- */}
                    <div className="approval-cell">
                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          alignItems: 'flex-start',
                          minWidth: 0,
                          width: '100%',
                        }}
                      >
                        <div className="avatar" style={{ flexShrink: 0 }}>
                          {avatarText(post.owner)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong style={{ fontSize: 14 }}>
                            {post.owner}
                          </strong>
                          <div className="meta" style={{ marginTop: 2 }}>
                            <Badge
                              status={
                                post.campaignId ? 'pending' : 'sale'
                              }
                              label={postKind(post)}
                            />
                          </div>
                          <p
                            className="small muted"
                            style={{
                              marginTop: 4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                            }}
                          >
                            {(post.content ||
                              post.description ||
                              post.title
                            ).slice(0, 140)}
                            {(post.content ||
                              post.description ||
                              post.title).length > 140
                              ? '…'
                              : ''}
                          </p>
                          {post.campaignId && (
                            <Link
                              className="campaign-tag"
                              href={`/member/campaigns/${post.campaignId}`}
                              style={{ marginTop: 6 }}
                            >
                              <svg
                                className="campaign-tag-icon"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M12 20V10" />
                                <path d="M18 20V4" />
                                <path d="M6 20v-4" />
                              </svg>
                              <span>Chiến dịch</span>
                              {post.campaignName}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ---- Category ---- */}
                    <div className="approval-cell" style={{ fontSize: 13 }}>
                      {categoryLabelVi(post.category)}
                    </div>

                    {/* ---- Type ---- */}
                    <div className="approval-cell">
                      <Badge
                        status={typeBadgeStatus(post.type)}
                        label={typeLabel(post.type)}
                      />
                    </div>

                    {/* ---- Price ---- */}
                    <div
                      className="approval-cell small"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {displayPrice(post)}
                    </div>

                    {/* ---- Date ---- */}
                    <div
                      className="approval-cell small muted"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {formatDate(post.date)}
                    </div>

                    {/* ---- Actions ---- */}
                    <div className="approval-cell">
                      <ApprovalActions
                        onView={() => {
                          window.open(
                            `/products/${post.id}`,
                            '_blank',
                          );
                        }}
                        onApprove={async () => {
                          try {
                            await mockApi.posts.approvePost(post.id);
                            show(
                              'Đã duyệt bài. Bài đăng sẽ xuất hiện trên bảng tin.',
                              'success',
                            );
                            await loadPending();
                          } catch (e) {
                            show(
                              e instanceof ApiError
                                ? e.message
                                : 'Lỗi duyệt bài.',
                              'error',
                            );
                          }
                        }}
                        onReject={async (reason) => {
                          try {
                            await mockApi.posts.rejectPost(
                              post.id,
                              reason,
                            );
                            show(
                              'Đã từ chối bài đăng kèm lý do.',
                              'success',
                            );
                            await loadPending();
                          } catch (e) {
                            show(
                              e instanceof ApiError
                                ? e.message
                                : 'Lỗi từ chối bài.',
                              'error',
                            );
                            throw e;
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )}
          </>
        )}
      </DashboardLayout>
    </>
  );
}
