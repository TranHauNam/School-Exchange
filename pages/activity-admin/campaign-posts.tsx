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
import type { Post } from '@/lib/types/post';
import { useRequireRole } from '@/lib/withRoleGuard';
import { postStatusLabel } from '@/lib/utils/post-labels';
import { money } from '@/lib/utils/money';

type LoadStatus = 'loading' | 'ready' | 'error';

function typeLabel(type: Post['type']): string {
  if (type === 'Sale') return 'Bán lại';
  if (type === 'Exchange') return 'Trao đổi';
  return 'Quyên góp';
}

function displayPrice(post: Post): string {
  if (post.type === 'Sale') return money(post.price);
  return typeLabel(post.type);
}

function avatarText(name: string): string {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((t) => t[0]?.toUpperCase() ?? '')
    .join('') || 'U';
}

export default function CampaignPostsPage() {
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['activity-admin']);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      // listAllPosts for activity-admin automatically filters to only
      // posts belonging to campaigns they manage.
      const all = await mockApi.posts.listAllPosts();
      // Sort: newest first
      all.sort((a, b) => b.date.localeCompare(a.date));
      setPosts(all);
      setStatus('ready');
    } catch (e) {
      setErrorMessage(
        e instanceof ApiError
          ? e.message
          : 'Không thể tải danh sách campaign posts.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    const t = setTimeout(() => { void loadPosts(); }, 120);
    return () => clearTimeout(t);
  }, [isAuthorized, loadPosts]);

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head>
        <title>Bài chiến dịch · School Item Exchange</title>
      </Head>
      <DashboardLayout eyebrow="Quản trị hoạt động" title="Bài chiến dịch">
        <PageHead
          eyebrow="Quản trị hoạt động"
          title="Bài chiến dịch"
          description="Duyệt hoặc từ chối Campaign Post trước khi xuất hiện trong Campaign Feed và School Feed."
        />

        {status === 'loading' && (
          <LoadingState message="Đang tải danh sách campaign posts..." />
        )}
        {status === 'error' && (
          <ErrorState
            message={errorMessage}
            onRetry={() => { void loadPosts(); }}
          />
        )}
        {status === 'ready' && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Bài đăng / Mặt hàng</th>
                  <th>Người gửi</th>
                  <th>Chiến dịch</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState message="Không có campaign post nào để hiển thị." />
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="thumb">{post.icon}</div>
                      </td>
                      <td>
                        <div className="row">
                          <div className="avatar">{avatarText(post.owner)}</div>
                          <div>
                            <strong>
                              {(post.content || post.description || post.title).slice(0, 72)}
                              {(post.content || post.description || post.title).length > 72
                                ? '…'
                                : ''}
                            </strong>
                            <p className="small muted">
                              {typeLabel(post.type)} · {displayPrice(post)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{post.owner}</td>
                      <td>
                        {post.campaignName && (
                          <Link
                            className="campaign-tag"
                            href={`/member/campaigns/${post.campaignId}`}
                          >
                            <span>Campaign</span>
                            {post.campaignName}
                          </Link>
                        )}
                      </td>
                      <td>{post.date}</td>
                      <td>
                        <Badge status={post.status} label={postStatusLabel(post.status)} />
                      </td>
                      <td>
                        <ApprovalActions
                          onView={() => {
                            window.open(`/products/${post.id}`, '_blank');
                          }}
                          onApprove={async () => {
                            try {
                              await mockApi.posts.approvePost(post.id);
                              show('Đã duyệt campaign post. Bài sẽ hiển thị trên feed.', 'success');
                              await loadPosts();
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
                              await mockApi.posts.rejectPost(post.id, reason);
                              show('Đã từ chối campaign post kèm lý do.', 'success');
                              await loadPosts();
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}
