/**
 * RoleEntity — mirrors the Roles table from DOCX schema.
 * Stored internally in mockStore; never exposed directly to UI.
 */
export interface RoleEntity {
  roleId: number;
  roleName: string; // 'Member' | 'System Admin' | 'Activity Admin'
  roleKey: string; // 'member' | 'system-admin' | 'activity-admin'
  description: string;
}
