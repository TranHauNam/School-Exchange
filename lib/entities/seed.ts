/**
 * Seed data for the mock database, translated from the original seed in
 * open_design/js/app.js into entity format per the DOCX schema.
 *
 * This module creates a fresh MockDatabase snapshot. It is only imported by
 * mockStore.ts; components/pages MUST NOT import it directly.
 */
import type { RoleEntity } from './role';
import type { UserEntity } from './user';
import type { CategoryEntity } from './category';
import type { ProductEntity } from './product';
import type { CampaignEntity } from './campaign';
import type { RequestEntity } from './request';
import type { TransactionEntity } from './transaction';
import type { FeeEntity } from './fee';
import type { MockDatabase } from '@/lib/services/mockStore';

// ============================================================================
// Roles (3)
// ============================================================================
const seedRoles: RoleEntity[] = [
  {
    roleId: 1,
    roleName: 'Member',
    roleKey: 'member',
    description: 'Học sinh hoặc giáo viên — đăng bài, gửi request, tham gia campaign.',
  },
  {
    roleId: 2,
    roleName: 'System Admin',
    roleKey: 'system-admin',
    description: 'Quản trị toàn hệ thống — dashboard, duyệt bài, quản lý danh mục và campaign.',
  },
  {
    roleId: 3,
    roleName: 'Activity Admin',
    roleKey: 'activity-admin',
    description: 'Quản lý campaign của CLB/tổ chức — tạo campaign, duyệt campaign post.',
  },
];

// ============================================================================
// Users (4) — 2 members, 1 system-admin, 1 activity-admin
// ============================================================================
const seedUsers: UserEntity[] = [
  {
    userId: 1,
    fullName: 'Nguyễn Minh An',
    email: 'an@student.school.edu',
    password: 'school123',
    phone: '0901000001',
    roleId: 1, // Member
    status: 'Active',
    createdAt: '2026-01-15',
    ownerRole: 'Student',
  },
  {
    userId: 2,
    fullName: 'Lê Quốc Huy',
    email: 'huy@school.edu',
    password: 'school123',
    phone: '0901000002',
    roleId: 2, // System Admin
    status: 'Active',
    createdAt: '2026-01-10',
    ownerRole: null,
  },
  {
    userId: 3,
    fullName: 'CLB Green Life',
    email: 'greenlife@school.edu',
    password: 'school123',
    phone: '0901000003',
    roleId: 3, // Activity Admin
    status: 'Active',
    createdAt: '2026-01-01',
    ownerRole: null,
  },
  {
    userId: 4,
    fullName: 'Trần Thị Mai',
    email: 'mai@school.edu',
    password: 'school123',
    phone: '0901000004',
    roleId: 1, // Member
    status: 'Active',
    createdAt: '2026-02-01',
    ownerRole: 'Teacher',
  },
];

// ============================================================================
// Categories (6)
// ============================================================================
const seedCategories: CategoryEntity[] = [
  {
    categoryId: 1,
    categoryName: 'Books',
    description: 'Sách giáo khoa, sách tham khảo được phép trao đổi.',
    status: 'Active',
  },
  {
    categoryId: 2,
    categoryName: 'Uniforms',
    description: 'Đồng phục còn sử dụng tốt, đúng quy định trường.',
    status: 'Active',
  },
  {
    categoryId: 3,
    categoryName: 'Study electronics',
    description: 'Máy tính, đèn học, thiết bị học tập nhỏ.',
    status: 'Active',
  },
  {
    categoryId: 4,
    categoryName: 'Sports equipment',
    description: 'Dụng cụ thể thao cho CLB và giờ thể dục.',
    status: 'Active',
  },
  {
    categoryId: 5,
    categoryName: 'School supplies',
    description: 'Balo, hộp bút, vở, dụng cụ học tập.',
    status: 'Active',
  },
  {
    categoryId: 6,
    categoryName: 'Other allowed items',
    description: 'Các vật phẩm khác sau khi admin duyệt.',
    status: 'Inactive',
  },
];

// ============================================================================
// Campaigns (3) — seed khớp c1-c3 trong js/app.js
// ============================================================================
const seedCampaigns: CampaignEntity[] = [
  {
    campaignId: 1,
    title: 'Góc học tập cho học sinh mới',
    description:
      'Nhóm/campaign nhận sách, đèn học và dụng cụ học tập còn tốt để hỗ trợ học sinh lớp 10 mới.',
    createdBy: 3, // CLB Green Life
    organizer: 'CLB Green Life',
    startDate: '2026-06-05',
    endDate: '2026-06-25',
    status: 'Active',
    targetFund: 0,
    cover: 'STUDY',
    type: 'Donation',
    isFree: true,
  },
  {
    campaignId: 2,
    title: 'Quỹ thể thao mùa hè',
    description:
      'Bảng tin gây quỹ bằng vật phẩm thể thao cũ để mua bóng, lưới và dụng cụ mới cho CLB.',
    createdBy: 3, // CLB Green Life
    organizer: 'Hội học sinh',
    startDate: '2026-06-20',
    endDate: '2026-07-10',
    status: 'Upcoming',
    targetFund: 5000000,
    cover: 'SPORT',
    type: 'Fundraising',
    isFree: false,
    intermediaryFee: 5,
  },
  {
    campaignId: 3,
    title: 'Tuần lễ đồng phục xanh',
    description:
      'Chủ đề trao đổi và quyên góp đồng phục còn sử dụng tốt, giảm lãng phí trong trường.',
    createdBy: 3, // CLB Green Life
    organizer: 'Nhà trường',
    startDate: '2026-05-01',
    endDate: '2026-05-20',
    status: 'Ended',
    targetFund: 0,
    cover: 'GREEN',
    type: 'Mixed',
    isFree: false,
    intermediaryFee: 2,
  },
];

// ============================================================================
// Products (6) — seed khớp p1-p6 trong js/app.js
// ============================================================================
const seedProducts: ProductEntity[] = [
  {
    productId: 1,
    userId: 1, // Nguyễn Minh An
    categoryId: 3, // Study electronics
    title: 'Máy tính Casio fx-580VN X',
    description:
      'Mình bán lại máy tính Casio fx-580VN X còn dùng tốt. Phù hợp cho các bạn lớp 10–12 cần máy tính để học Toán và Lý.',
    image: '∑',
    price: 280000,
    type: 'Sale',
    status: 'Approved',
    contact: 'an@student.school.edu',
    createdAt: '2026-05-24',
  },
  {
    productId: 2,
    userId: 4, // Trần Thị Mai
    categoryId: 1, // Books
    title: 'Bộ sách giáo khoa lớp 10',
    description:
      'Cô gửi tặng bộ sách giáo khoa lớp 10 cho campaign Góc học tập cho học sinh mới. Sách đã bọc bìa và vẫn còn dùng tốt.',
    image: 'BOOK',
    price: 0,
    type: 'Donation',
    status: 'Approved',
    campaignId: 1, // c1
    contact: 'mai@school.edu',
    createdAt: '2026-05-21',
  },
  {
    productId: 3,
    userId: 1, // Nguyễn Minh An
    categoryId: 2, // Uniforms
    title: 'Áo đồng phục size M',
    description:
      'Mình muốn đổi áo đồng phục size M sang size L. Áo đã giặt sạch, không rách, phù hợp bạn nào cần size M.',
    image: 'UNI',
    price: 0,
    type: 'Exchange',
    status: 'Approved',
    contact: 'an@student.school.edu',
    createdAt: '2026-05-18',
  },
  {
    productId: 4,
    userId: 4, // Trần Thị Mai
    categoryId: 4, // Sports equipment
    title: 'Vợt cầu lông Yonex cũ',
    description:
      'Bán lại vợt cầu lông để đóng góp cho Quỹ thể thao mùa hè. Vợt đã thay dây mới, phù hợp cho CLB hoặc giờ thể dục.',
    image: 'RKT',
    price: 150000,
    type: 'Sale',
    status: 'Approved',
    campaignId: 2, // c2
    contact: 'mai@school.edu',
    createdAt: '2026-05-15',
  },
  {
    productId: 5,
    userId: 1, // Nguyễn Minh An
    categoryId: 5, // School supplies
    title: 'Đèn bàn học chống cận',
    description:
      'Mình muốn đưa đèn LED ba mức sáng vào campaign Góc học tập cho học sinh mới. Đèn còn sáng tốt và phù hợp góc học tập.',
    image: 'LAMP',
    price: 90000,
    type: 'Sale',
    status: 'Pending Approval',
    campaignId: 1, // c1
    contact: 'an@student.school.edu',
    createdAt: '2026-06-01',
  },
  {
    productId: 6,
    userId: 4, // Trần Thị Mai
    categoryId: 6, // Other allowed items
    title: 'Ba lô đi học màu xanh',
    description:
      'Cô muốn quyên góp một ba lô màu xanh còn dùng được cho học sinh cần hỗ trợ.',
    image: 'BAG',
    price: 0,
    type: 'Donation',
    status: 'Rejected',
    reason: 'Ảnh chưa đủ rõ tình trạng sản phẩm.',
    contact: 'mai@school.edu',
    createdAt: '2026-05-10',
  },
];

// ============================================================================
// Requests (4) — seed khớp r1-r4 trong js/app.js
// ============================================================================
const seedRequests: RequestEntity[] = [
  {
    requestId: 1,
    productId: 4, // Vợt cầu lông (p4)
    senderId: 1, // Nguyễn Minh An
    receiverId: 4, // Trần Thị Mai
    type: 'Purchase',
    status: 'Pending',
    message: '',
    contact: '',
    createdAt: '2026-05-29',
  },
  {
    requestId: 2,
    productId: 2, // Bộ SGK (p2)
    senderId: 1, // Nguyễn Minh An
    receiverId: 4, // Trần Thị Mai
    type: 'Donation',
    status: 'Accepted',
    message: '',
    contact: '',
    createdAt: '2026-05-27',
  },
  {
    requestId: 3,
    productId: 1, // Casio (p1) — Sale, Completed
    senderId: 4, // Trần Thị Mai
    receiverId: 1, // Nguyễn Minh An
    type: 'Purchase',
    status: 'Completed',
    message: '',
    contact: '',
    createdAt: '2026-05-25',
  },
  {
    requestId: 4,
    productId: 3, // Áo đồng phục (p3)
    senderId: 4, // Trần Thị Mai
    receiverId: 1, // Nguyễn Minh An
    type: 'Exchange',
    status: 'Pending',
    message: '',
    contact: '',
    createdAt: '2026-05-31',
  },
];

// ============================================================================
// Transactions (1) — seed cho r3 (Completed Sale, p1 Casio 280000)
// ============================================================================
const seedTransactions: TransactionEntity[] = [
  {
    transactionId: 1,
    productId: 1, // p1 Casio
    sellerId: 1, // Nguyễn Minh An (owner)
    buyerId: 4, // Trần Thị Mai (buyer)
    transactionType: 'Sale',
    amount: 280000,
    fee: 14000, // 5% of 280000
    status: 'Completed',
    createdAt: '2026-05-25',
  },
];

// ============================================================================
// Fees (1) — seed cho transaction 1
// ============================================================================
const seedFees: FeeEntity[] = [
  {
    feeId: 1,
    transactionId: 1,
    amount: 14000, // 5% of 280000
    note: '5% phí giao dịch từ sản phẩm "Máy tính Casio fx-580VN X"',
    createdAt: '2026-05-25',
  },
];

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a fresh clone of the seed database.
 * Uses structuredClone when available (browser / Node 17+), with a JSON
 * round-trip fallback for older runtimes.
 */
export function createSeedDatabase(): MockDatabase {
  const seed: MockDatabase = {
    roles: seedRoles,
    users: seedUsers,
    categories: seedCategories,
    products: seedProducts,
    campaigns: seedCampaigns,
    requests: seedRequests,
    transactions: seedTransactions,
    fees: seedFees,
  };

  if (typeof structuredClone === 'function') {
    return structuredClone(seed);
  }
  return JSON.parse(JSON.stringify(seed)) as MockDatabase;
}
