import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import { CampaignCard } from '@/components/campaign/CampaignCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { Campaign, CampaignStats } from '@/lib/types/campaign';
import { useRequireRole } from '@/lib/withRoleGuard';

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

interface CampaignWithStats {
  campaign: Campaign;
  stats: CampaignStats;
}

export default function CampaignsPage() {
  const router = useRouter();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member', 'activity-admin', 'system-admin']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [items, setItems] = useState<CampaignWithStats[]>([]);

  const loadCampaigns = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const campaigns = await mockApi.campaigns.listCampaigns();
      const stats = await Promise.all(
        campaigns.map((campaign) => mockApi.campaigns.getCampaignStats(campaign.id)),
      );

      const nextItems = campaigns.map((campaign, index) => ({
        campaign,
        stats: stats[index],
      }));

      setItems(nextItems);
      setStatus(nextItems.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Không thể tải danh sách campaign.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadCampaigns();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isAuthorized, loadCampaigns]);

  if (guardLoading || !isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Chiến dịch · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Chiến dịch">
        <PageHead
          title="Chiến dịch"
          description="Mỗi chiến dịch hoạt động như một nhóm có bảng tin riêng. Bài đăng trong chiến dịch cũng hiển thị trên Bảng tin trường."
        />

        {status === 'loading' ? <LoadingState message="Đang tải chiến dịch..." /> : null}

        {status === 'error' ? (
          <ErrorState
            message={errorMessage || 'Không thể tải danh sách campaign.'}
            onRetry={() => {
              void loadCampaigns();
            }}
          />
        ) : null}

        {status === 'empty' ? <EmptyState message="Chưa có chiến dịch." /> : null}

        {status === 'ready' ? (
          <section className="grid cols-3">
            {items.map(({ campaign, stats }) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                stats={stats}
                onOpen={(id) => void router.push(`/member/campaigns/${id}`)}
              />
            ))}
          </section>
        ) : null}
      </DashboardLayout>
    </>
  );
}
