export type CampaignType = 'Fundraising' | 'Donation' | 'Mixed';
export type CampaignStatus = 'Upcoming' | 'Active' | 'Ended' | 'Cancelled';

export interface Campaign {
  id: string;                 // 'c1', 'c2', 'c' + Date.now()
  name: string;
  organizer: string;          // đơn vị tổ chức (mặc định 'CLB Green Life')
  type: CampaignType;
  is_free: boolean;           // Free Participation (Yes/No)
  intermediary_fee?: number; // Phí tham gia (%) — only applies when is_free = false
  start: string;              // ISO date 'YYYY-MM-DD'
  end: string;                // ISO date, phải sau start
  status: CampaignStatus;     // suy ra từ start/end (xem State Models)
  cover: string;              // placeholder ảnh bìa dạng text (STUDY, SPORT, GREEN...)
  description: string;
}

// Thống kê suy ra (derived) — KHÔNG lưu độc lập; tính từ products có campaignId === campaign.id
// (giống campaignStats() trong js/app.js).
export interface CampaignStats {
  total: number;              // tổng Campaign Post của campaign
  approved: number;           // số Post 'Approved'
  pending: number;            // số Post 'Pending Approval'
}
