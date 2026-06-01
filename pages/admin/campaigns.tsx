import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { Campaign, CampaignStats } from '@/lib/types/campaign';
import { useRequireRole } from '@/lib/withRoleGuard';
import { campaignStatusLabel } from '@/lib/utils/post-labels';

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

interface CampaignRow {
  campaign: Campaign;
  stats: CampaignStats;
}

export default function CampaignManagementPage() {
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['system-admin']);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [rows, setRows] = useState<CampaignRow[]>([]);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const campaigns = await mockApi.campaigns.listAllCampaigns();
      const stats = await Promise.all(campaigns.map(c => mockApi.campaigns.getCampaignStats(c.id)));
      setRows(campaigns.map((c, i) => ({ campaign: c, stats: stats[i] })));
      setStatus(campaigns.length > 0 ? 'ready' : 'empty');
    } catch (e) { setErrorMessage(e instanceof ApiError? e.message : 'Lỗi tải campaign.'); setStatus('error'); }
  }, []);

  useEffect(() => { if (!isAuthorized) return; const t = setTimeout(() => { void load(); }, 120); return () => clearTimeout(t); }, [isAuthorized, load]);

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head><title>Quản lý chiến dịch · School Item Exchange</title></Head>
      <DashboardLayout eyebrow="Quản trị hệ thống" title="Quản lý chiến dịch">
        <PageHead title="Quản lý chiến dịch" description="Quản lý toàn bộ campaign trong hệ thống." />

        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={() => { void load(); }} />}
        {status === 'ready' || status === 'empty' ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tên</th><th>Thời gian</th><th>Trạng thái</th><th>Tổng số bài</th><th>Chờ duyệt</th><th>Thao tác</th></tr></thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={6}><EmptyState message="Chưa có campaign." /></td></tr> :
                  rows.map(({ campaign, stats }) => (
                    <tr key={campaign.id}>
                      <td><strong>{campaign.name}</strong></td>
                      <td>{campaign.start} → {campaign.end}</td>
                      <td><Badge status={campaign.status} label={campaignStatusLabel(campaign.status)} /></td>
                      <td>{stats.total}</td>
                      <td>{stats.pending}</td>
                      <td>
                        <div className="row">
                          <Link className="btn secondary" href={`/member/campaigns/${campaign.id}`}>Xem</Link>
                          <Button variant="secondary" onClick={async () => {
                            try { await mockApi.campaigns.endCampaign(campaign.id); show('Đã kết thúc campaign.', 'success'); await load(); }
                            catch(e) { show(e instanceof ApiError? e.message: 'Lỗi kết thúc campaign.','error'); }
                          }}>Kết thúc</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </DashboardLayout>
    </>
  );
}
