import type { TransactionType, PostStatus } from '@/lib/types/post';

/**
 * ProductEntity — mirrors the Products table from DOCX schema.
 *
 * In the UI layer this is exposed as `Post` (via mappers).
 * The `image` field stores icon placeholder text (∑, BOOK, etc.) in mock
 * mode; it will carry real image URLs when swapped to a Java REST backend.
 */
export interface ProductEntity {
  productId: number;
  userId: number; // FK -> UserEntity.userId
  categoryId: number; // FK -> CategoryEntity.categoryId
  title: string;
  description: string;
  image: string; // icon placeholder in mock; image URL in production
  price: number;
  type: TransactionType;
  status: PostStatus;
  reason?: string; // rejection / removal reason
  /** FK -> CampaignEntity.campaignId. undefined => Normal Post. */
  campaignId?: number;
  contact: string;
  createdAt: string; // ISO date (YYYY-MM-DD)
}
