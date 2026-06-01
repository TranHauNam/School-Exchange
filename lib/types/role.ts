// Vai trò nghiệp vụ (hiển thị) — 3 vai trò.
export type Role = 'Member' | 'System Admin' | 'Activity Admin';

// Khóa role nội bộ của prototype (dùng cho session/localStorage & navFor()).
export type RoleKey = 'member' | 'system-admin' | 'activity-admin';

// Tên hiển thị cố định theo vai trò (giống currentUserName() trong js/app.js).
export const ROLE_DISPLAY_NAME: Record<RoleKey, string> = {
  'member': 'Nguyễn Minh An',
  'system-admin': 'Lê Quốc Huy',
  'activity-admin': 'CLB Green Life',
};

export const ROLE_LABEL: Record<RoleKey, Role> = {
  'member': 'Member',
  'system-admin': 'System Admin',
  'activity-admin': 'Activity Admin',
};

/**
 * Normalize roleKey from backend (MongoDB raw values) to frontend RoleKey.
 * Backend stores: member | super_admin | activity_admin
 * Frontend uses:  member | system-admin | activity-admin
 */
export function normalizeRoleKey(raw: string): RoleKey {
  if (raw === 'super_admin' || raw === 'system-admin') return 'system-admin';
  if (raw === 'activity_admin' || raw === 'activity-admin') return 'activity-admin';
  return 'member';
}
