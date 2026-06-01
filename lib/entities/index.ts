/**
 * Barrel export for all entity types, seed data, and mappers.
 *
 * Components and pages MUST NOT import from this module directly.
 * Only `lib/services/mockStore.ts` and `lib/services/mockApi.ts` may import entities.
 */
export type { RoleEntity } from './role';
export type { UserEntity, UserStatus } from './user';
export type { CategoryEntity, CategoryEntityStatus } from './category';
export type { ProductEntity } from './product';
export type { CampaignEntity, CampaignEntityStatus } from './campaign';
export type { RequestEntity, RequestEntityType, RequestEntityStatus } from './request';
export type { TransactionEntity, TransactionEntityType } from './transaction';
export type { FeeEntity } from './fee';

export { createSeedDatabase } from './seed';
export {
  // ID bridge helpers
  toPostId,
  toProductId,
  toCampaignId,
  toEntityCampaignId,
  toRequestId,
  toEntityRequestId,
  // ID generators
  newProductId,
  newRequestId,
  newTransactionId,
  newFeeId,
  // Entity → UI view model converters
  toPostView,
  toCampaignView,
  toRequestView,
  toCategoryView,
  toCampaignStatsView,
  // Business logic helpers
  mapRequestType,
  computeFee,
} from './mappers';
