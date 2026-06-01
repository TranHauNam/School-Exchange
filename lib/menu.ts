import type { RoleKey } from '@/lib/types/role';

export interface MenuItem {
  href: string;
  label: string;
  placeholder?: boolean;
}

export const MENU_BY_ROLE: Record<RoleKey, MenuItem[]> = {
  member: [
    { href: '/member/feed', label: 'Bảng tin trường' },
    { href: '/member/create-post', label: 'Tạo bài đăng' },
    { href: '/member/my-posts', label: 'Bài của tôi' },
    { href: '/member/my-requests', label: 'Yêu cầu của tôi' },
    { href: '/member/campaigns', label: 'Chiến dịch' },
    { href: '/member/profile', label: 'Hồ sơ' },
  ],
  'system-admin': [
    { href: '/admin/dashboard', label: 'Tổng quan' },
    { href: '/admin/post-approval', label: 'Duyệt bài' },
    { href: '/admin/post-management', label: 'Quản lý bài đăng' },
    { href: '/admin/categories', label: 'Danh mục' },
    { href: '/admin/campaigns', label: 'Quản lý chiến dịch' },
    { href: '#', label: 'Người dùng', placeholder: true },
    { href: '/admin/reports', label: 'Báo cáo' },
  ],
  'activity-admin': [
    { href: '/activity-admin/my-campaigns', label: 'Chiến dịch của tôi' },
    { href: '/activity-admin/create-campaign', label: 'Tạo chiến dịch' },
    { href: '/activity-admin/campaign-posts', label: 'Bài đăng chiến dịch' },
    { href: '/activity-admin/campaign-results', label: 'Kết quả chiến dịch' },
  ],
};
