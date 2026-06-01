import Link from 'next/link';

import { Badge } from '@/components/common/Badge';
import { campaignStatusLabel } from '@/lib/utils/post-labels';
import type { Campaign, CampaignStats } from '@/lib/types/campaign';

interface CampaignCardProps {
  campaign: Campaign;
  stats: CampaignStats;
  onOpen?: (id: string) => void;
}

export function CampaignCard({ campaign, stats, onOpen }: CampaignCardProps) {
  const content = (
    <>
      <div className="campaign-cover small-cover">{campaign.cover || 'GROUP'}</div>
      <div className="between">
        <h3>{campaign.name}</h3>
        <Badge status={campaign.status} label={campaignStatusLabel(campaign.status)} />
      </div>
      <p>{campaign.description}</p>
      <div className="meta">
        <span>{campaign.organizer}</span>
        <span>•</span>
        <span>
          {campaign.start} → {campaign.end}
        </span>
        <span>•</span>
        <span>{stats.approved} bài đã duyệt</span>
      </div>
    </>
  );

  if (onOpen) {
    return (
      <article className="card campaign-card">
        {content}
        <button type="button" className="btn secondary" onClick={() => onOpen(campaign.id)}>
          Xem chiến dịch
        </button>
      </article>
    );
  }

  return (
    <article className="card campaign-card">
      {content}
      <Link className="btn secondary" href={`/member/campaigns/${campaign.id}`}>
        Xem chiến dịch
      </Link>
    </article>
  );
}
