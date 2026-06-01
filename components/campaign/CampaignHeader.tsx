import { Badge } from '@/components/common/Badge';
import { campaignStatusLabel } from '@/lib/utils/post-labels';
import type { Campaign, CampaignStats } from '@/lib/types/campaign';

interface CampaignHeaderProps {
  campaign: Campaign;
  stats: CampaignStats;
  onCreatePost: () => void;
  onSubmit: () => void;
}

export function CampaignHeader({
  campaign,
  stats,
  onCreatePost,
  onSubmit,
}: CampaignHeaderProps) {
  return (
    <article className="card campaign-hero">
      <div className="campaign-cover">{campaign.cover || 'GROUP'}</div>
      <div className="campaign-hero-body">
        <div className="between">
          <div className="stack">
            <h1>{campaign.name}</h1>
            <p>
              <strong>{campaign.organizer}</strong> · {campaign.start} → {campaign.end}
            </p>
          </div>
          <Badge status={campaign.status} label={campaignStatusLabel(campaign.status)} />
        </div>

        <p>{campaign.description}</p>

        <div className="stats">
          <div className="card stat">
            <p>Tổng số bài</p>
            <div className="value">{stats.total}</div>
          </div>
          <div className="card stat">
            <p>Đã duyệt</p>
            <div className="value">{stats.approved}</div>
          </div>
          <div className="card stat">
            <p>Chờ duyệt</p>
            <div className="value">{stats.pending}</div>
          </div>
          <div className="card stat">
            <p>Loại chiến dịch</p>
            <div className="value">SIE</div>
          </div>
        </div>

        <div className="row">
          <button type="button" className="btn primary" onClick={onCreatePost}>
            Tạo bài đăng cho chiến dịch
          </button>
          <button type="button" className="btn secondary" onClick={onSubmit}>
            Gửi bài vào chiến dịch
          </button>
        </div>
      </div>
    </article>
  );
}
