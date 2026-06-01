import type { CampaignType } from '@/lib/types/campaign';

/**
 * CampaignEntity — mirrors the Campaigns table from DOCX schema.
 *
 * Mock extensions (not in DOCX):
 *   - `type`: Fundraising | Donation | Mixed — required by UI Campaign.
 *   - `isFree`: boolean — Free Participation flag required by UI Campaign.
 *   - `organizer`: display name of the organising entity — required by UI Campaign.
 *   - `cover`: icon placeholder string — required by UI Campaign display.
 *   - `status` is derived from startDate/endDate at runtime, but also stored
 *     for direct query. DOCX lists status values: 'Đang diễn ra' | 'Kết thúc'
 *     | 'Hủy'. The UI uses 'Upcoming' | 'Active' | 'Ended'.
 */
export type CampaignEntityStatus = 'Upcoming' | 'Active' | 'Ended';

export interface CampaignEntity {
  campaignId: number;
  title: string;
  description: string;
  createdBy: number; // FK -> UserEntity.userId (activity-admin)
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date, must be after startDate
  status: CampaignEntityStatus;
  targetFund?: number; // DOCX field; optional for mock
  organizer: string; // mock extension — display name of organising entity
  cover: string; // mock extension — icon placeholder
  type: CampaignType; // mock extension — Fundraising | Donation | Mixed
  isFree: boolean; // mock extension — Free Participation
  intermediaryFee?: number; // mock extension — Phí tham gia (%), only meaningful when isFree is false
}
