import type { OwnerRole } from '@/lib/types/post';

/**
 * UserEntity — mirrors the Users table from DOCX schema.
 *
 * Mock extension: `ownerRole` stores Student/Teacher for member users.
 * The DOCX schema does not define this field; it is added here because the
 * UI Post.ownerRole is required for PostCard rendering.
 */
export type UserStatus = 'Active' | 'Locked';

export interface UserEntity {
  userId: number;
  fullName: string;
  email: string;
  password: string; // plain text for mock only
  phone: string;
  roleId: number; // FK -> RoleEntity.roleId
  status: UserStatus;
  createdAt: string; // ISO date
  /** Mock extension: Student | Teacher for member users, null for admins. */
  ownerRole: OwnerRole | null;
}
