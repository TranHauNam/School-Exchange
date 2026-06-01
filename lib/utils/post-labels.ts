/**
 * Shared Vietnamese labels for posts, categories, types, and statuses.
 * Single source of truth — used by PostCard, PostPreview, FeedFilters, and table pages.
 */

// ---- category labels ----

export const CATEGORY_LABEL_VI: Record<string, string> = {
  Books: 'Sách',
  Uniforms: 'Đồng phục',
  'Study electronics': 'Điện tử học tập',
  'Sports equipment': 'Đồ thể thao',
  'School supplies': 'Đồ học tập',
  'Other allowed items': 'Khác',
};

export function categoryLabelVi(name: string): string {
  return CATEGORY_LABEL_VI[name] ?? name;
}

// ---- transaction type labels ----

export type TransactionType = 'Sale' | 'Exchange' | 'Donation';

export function typeLabel(type: string): string {
  if (type === 'Sale') return 'Bán lại';
  if (type === 'Exchange') return 'Trao đổi';
  return 'Quyên góp';
}

export function typeBadgeStatus(type: string): string {
  if (type === 'Sale') return 'sale';
  if (type === 'Exchange') return 'exchange';
  return 'donation';
}

// ---- post status labels ----

export function postStatusLabel(status: string): string {
  const map: Record<string, string> = {
    'Pending Approval': 'Chờ duyệt',
    Approved: 'Đã duyệt',
    Rejected: 'Từ chối',
    Completed: 'Hoàn tất',
    Removed: 'Đã gỡ',
  };
  return map[status] ?? status;
}

// ---- request status labels ----

export function requestStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Pending: 'Đang chờ',
    Accepted: 'Đã chấp nhận',
    Rejected: 'Từ chối',
    Completed: 'Hoàn tất',
    Cancelled: 'Đã hủy',
  };
  return map[status] ?? status;
}

// ---- campaign status labels ----

export function campaignStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Active: 'Đang hoạt động',
    Upcoming: 'Sắp diễn ra',
    Ended: 'Đã kết thúc',
  };
  return map[status] ?? status;
}

// ---- category status labels ----

export function categoryStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Active: 'Đang hoạt động',
    Inactive: 'Không hoạt động',
  };
  return map[status] ?? status;
}

// ---- avatar text ----

export function avatarText(name: string): string {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((t) => t[0]?.toUpperCase() ?? '')
    .join('') || 'U';
}

// ---- request type labels ----

export function requestTypeLabel(type: string): string {
  if (type === 'Sale' || type === 'Purchase') return 'Mua';
  if (type === 'Exchange') return 'Trao đổi';
  return 'Quyên góp';
}
