import { Campaign } from '@/lib/types/campaign';

// Seed nguyên văn từ seedState.campaigns trong open_design/js/app.js (c1–c3).
// Lưu ý: seed gốc không có cờ `is_free`; bổ sung theo design với quy ước nhất quán:
//   Donation -> is_free = true; Fundraising -> false; Mixed -> false.
export const seedCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'Góc học tập cho học sinh mới',
    organizer: 'CLB Green Life',
    type: 'Donation',
    is_free: true,
    start: '2026-06-05',
    end: '2026-06-25',
    status: 'Active',
    cover: 'STUDY',
    description:
      'Nhóm/campaign nhận sách, đèn học và dụng cụ học tập còn tốt để hỗ trợ học sinh lớp 10 mới.',
  },
  {
    id: 'c2',
    name: 'Quỹ thể thao mùa hè',
    organizer: 'Hội học sinh',
    type: 'Fundraising',
    is_free: false,
    intermediary_fee: 5,
    start: '2026-06-20',
    end: '2026-07-10',
    status: 'Upcoming',
    cover: 'SPORT',
    description:
      'Bảng tin gây quỹ bằng vật phẩm thể thao cũ để mua bóng, lưới và dụng cụ mới cho CLB.',
  },
  {
    id: 'c3',
    name: 'Tuần lễ đồng phục xanh',
    organizer: 'Nhà trường',
    type: 'Mixed',
    is_free: false,
    intermediary_fee: 2,
    start: '2026-05-01',
    end: '2026-05-20',
    status: 'Ended',
    cover: 'GREEN',
    description:
      'Chủ đề trao đổi và quyên góp đồng phục còn sử dụng tốt, giảm lãng phí trong trường.',
  },
];
