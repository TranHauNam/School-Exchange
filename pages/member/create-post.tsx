import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PostComposer } from '@/components/feed/PostComposer';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi, type CreatePostInput } from '@/lib/services/mockApi';
import { useRequireRole } from '@/lib/withRoleGuard';
import type { Campaign } from '@/lib/types/campaign';
import type { Category } from '@/lib/types/category';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function CreatePostPage() {
  const router = useRouter();
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const defaultCampaignId = useMemo(() => {
    const campaign = router.query.campaign;
    if (typeof campaign === 'string') {
      return campaign;
    }
    return undefined;
  }, [router.query.campaign]);

  const loadData = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const [activeCategories, availableCampaigns] = await Promise.all([
        mockApi.categories.listActive(),
        mockApi.campaigns.listCampaigns(),
      ]);

      setCategories(activeCategories);
      setCampaigns(availableCampaigns);
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể tải dữ liệu tạo bài đăng.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadData();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isAuthorized, loadData]);

  const handleCreatePost = async (input: CreatePostInput) => {
    try {
      await mockApi.posts.createPost(input);
      show(
        input.campaignId
          ? 'Đã gửi campaign post. Trạng thái: Chờ duyệt.'
          : 'Đã gửi bài đăng. Trạng thái: Chờ duyệt.',
        'success',
      );
      await router.push('/member/my-posts');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể tạo bài đăng. Vui lòng thử lại.';
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
        <title>Tạo bài đăng · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Tạo bài đăng">
        <PageHead
          title="Tạo bài đăng"
          description="Chia sẻ món đồ bạn muốn bán, trao đổi hoặc quyên góp. Bài đăng sẽ được admin duyệt trước khi hiển thị."
        />

        {status === 'loading' ? (
          <LoadingState message="Đang tải dữ liệu form tạo bài đăng..." />
        ) : null}

        {status === 'error' ? (
          <ErrorState
            message={errorMessage || 'Không thể tải dữ liệu tạo bài đăng.'}
            onRetry={() => {
              void loadData();
            }}
          />
        ) : null}

        {status === 'ready' ? (
          <PostComposer
            categories={categories}
            campaigns={campaigns}
            defaultCampaignId={defaultCampaignId}
            onSubmit={handleCreatePost}
          />
        ) : null}
      </DashboardLayout>
    </>
  );
}
