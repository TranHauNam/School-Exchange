import { Role, RoleKey, ROLE_DISPLAY_NAME, ROLE_LABEL } from '@/lib/types/role';
import { OwnerRole } from '@/lib/types/post';

// Người dùng hiển thị cố định theo vai trò (tái tạo currentUserName() trong js/app.js).
// Tên hiển thị lấy nguyên văn từ ROLE_DISPLAY_NAME để giữ một nguồn chân lý duy nhất.
export interface MockUser {
  roleKey: RoleKey;       // khóa role nội bộ
  role: Role;             // nhãn vai trò hiển thị
  name: string;           // tên hiển thị cố định
  ownerRole?: OwnerRole;  // Student | Teacher — chỉ áp dụng cho Member khi đăng bài
}

export const seedUsers: Record<RoleKey, MockUser> = {
  'member': {
    roleKey: 'member',
    role: ROLE_LABEL['member'],
    name: ROLE_DISPLAY_NAME['member'], // 'Nguyễn Minh An'
    ownerRole: 'Student',
  },
  'system-admin': {
    roleKey: 'system-admin',
    role: ROLE_LABEL['system-admin'],
    name: ROLE_DISPLAY_NAME['system-admin'], // 'Lê Quốc Huy'
  },
  'activity-admin': {
    roleKey: 'activity-admin',
    role: ROLE_LABEL['activity-admin'],
    name: ROLE_DISPLAY_NAME['activity-admin'], // 'CLB Green Life'
  },
};
