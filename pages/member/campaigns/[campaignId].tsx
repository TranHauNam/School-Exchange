import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CampaignFeed } from '@/components/campaign/CampaignFeed';
import { CampaignHeader } from '@/components/campaign/CampaignHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { RequestModal } from '@/components/feed/RequestModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { Campaign, CampaignStats } from '@/lib/types/campaign';
import type { Post, TransactionType } from '@/lib/types/post';
import { useRequireRole } from '@/lib/withRoleGuard';

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

export default function CampaignDetailPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member', 'activity-admin', 'system-admin']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'All'>('All');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestPost, setRequestPost] = useState<Post | null>(null);

  const campaignId = useMemo(() => {
    const id = router.query.campaignId;
    return typeof id === 'string' ? id : undefined;
  }, [router.query.campaignId]);

  const loadCampaignDetail = useCallback(async () => {
    if (!campaignId) {
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    try {
      const [campaignData, campaignStats, campaignPosts] = await Promise.all([
        mockApi.campaigns.getCampaign(campaignId),
        mockApi.campaigns.getCampaignStats(campaignId),
        mockApi.campaigns.listCampaignPosts(campaignId, typeFilter),
      ]);

      setCampaign(campaignData);
      setStats(campaignStats);
      setPosts(campaignPosts);
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Không thể tải chi tiết campaign.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, [campaignId, typeFilter]);

  useEffect(() => {
    if (!isAuthorized || !campaignId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadCampaignDetail();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [campaignId, isAuthorized, loadCampaignDetail]);

  if (guardLoading || !isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Chiến dịch · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Chiến dịch">
        {status === 'loading' ? <LoadingState message="Đang tải chiến dịch..." /> : null}

        {status === 'error' ? (
          <ErrorState
            message={errorMessage || 'Không thể tải chi tiết chiến dịch.'}
            onRetry={() => {
              void loadCampaignDetail();
            }}
          />
        ) : null}

        {status === 'empty' ? <EmptyState message="Không tìm thấy chiến dịch." /> : null}

        {status === 'ready' && campaign && stats ? (
          <>
            <CampaignHeader
              campaign={campaign}
              stats={stats}
              onCreatePost={() =>
                void router.push(`/member/create-post?campaign=${campaign.id}`)
              }
              onSubmit={() =>
                void router.push(`/member/campaigns/${campaign.id}/submit`)
              }
            />

            <CampaignFeed
              posts={posts}
              currentUserName={session?.userName}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              onRequest={(post) => {
                setRequestPost(post);
                setRequestOpen(true);
              }}
            />

            {posts.length === 0 ? (
              <div style={{ marginTop: 16 }}>
                <EmptyState message="Chiến dịch này chưa có bài đăng được duyệt theo bộ lọc hiện tại." />
              </div>
            ) : null}

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
                    await mockApi.requests.sendRequest(requestPost.id, message, contact);
                    show('Đã gửi yêu cầu. Chủ bài đăng sẽ thấy trong My Requests.', 'success');
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
          </>
        ) : null}
      </DashboardLayout>
    </>
  );
}
