import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SubmitCampaignPost } from '@/components/campaign/SubmitCampaignPost';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { useToast } from '@/components/common/Toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { ApiError, mockApi, type SubmitCampaignPostInput } from '@/lib/services/mockApi';
import type { Campaign } from '@/lib/types/campaign';
import type { Post } from '@/lib/types/post';
import { useRequireRole } from '@/lib/withRoleGuard';

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

export default function SubmitCampaignPostPage() {
  const router = useRouter();
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [myApprovedPosts, setMyApprovedPosts] = useState<Post[]>([]);

  const campaignId = useMemo(() => {
    const id = router.query.campaignId;
    return typeof id === 'string' ? id : undefined;
  }, [router.query.campaignId]);

  const loadData = useCallback(async () => {
    if (!campaignId) {
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    try {
      const [campaignData, myPosts] = await Promise.all([
        mockApi.campaigns.getCampaign(campaignId),
        mockApi.posts.listMyPosts(),
      ]);

      setCampaign(campaignData);
      setMyApprovedPosts(myPosts.filter((post) => post.status === 'Approved'));
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể tải dữ liệu submit campaign post.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, [campaignId]);

  useEffect(() => {
    if (!isAuthorized || !campaignId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadData();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [campaignId, isAuthorized, loadData]);

  const handleSubmit = async (input: SubmitCampaignPostInput) => {
    try {
      await mockApi.campaigns.submitCampaignPost(input);
      show('Đã gửi bài vào chiến dịch. Trạng thái: Chờ duyệt.', 'success');
      await router.push(`/member/campaigns/${input.campaignId}`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể gửi campaign post. Vui lòng thử lại.';
      show(message, 'error');
      throw error;
    }
  };

  if (guardLoading || !isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Gửi bài vào chiến dịch · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Gửi bài vào chiến dịch">
        <PageHead
          title="Gửi bài vào chiến dịch"
          description="Chọn một bài đã duyệt hoặc viết nội dung mới. Sau khi gửi, bài sẽ ở trạng thái Chờ duyệt."
        />

        {status === 'loading' ? (
          <LoadingState message="Đang tải dữ liệu..." />
        ) : null}

        {status === 'error' ? (
          <ErrorState
            message={errorMessage || 'Không thể tải dữ liệu.'}
            onRetry={() => {
              void loadData();
            }}
          />
        ) : null}

        {status === 'empty' ? <EmptyState message="Không tìm thấy chiến dịch." /> : null}

        {status === 'ready' && campaign ? (
          <SubmitCampaignPost
            campaign={campaign}
            myApprovedPosts={myApprovedPosts}
            onSubmit={handleSubmit}
          />
        ) : null}
      </DashboardLayout>
    </>
  );
}
