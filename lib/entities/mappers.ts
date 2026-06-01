/**
 * Entity-to-UI-view-model mappers.
 *
 * Pure functions that convert entity types (database layer) into UI types
 * (Post, Campaign, ProductRequest, Category, CampaignStats).
 *
 * ID bridge helpers convert between numeric entity IDs and string UI IDs
 * with prefix conventions: products -> 'p1', campaigns -> 'c1', requests -> 'r1'.
 */
import type { Post, TransactionType } from '@/lib/types/post';
import type { Campaign, CampaignStats } from '@/lib/types/campaign';
import type { ProductRequest, RequestType } from '@/lib/types/request';
import type { Category } from '@/lib/types/category';
import type { ProductEntity } from './product';
import type { CampaignEntity } from './campaign';
import type { RequestEntity } from './request';
import type { UserEntity } from './user';
import type { CategoryEntity } from './category';

// ============================================================================
// ID bridge helpers
// ============================================================================

/** Convert numeric productId to UI post id ("p1", "p2", ...). */
export function toPostId(productId: number): string {
  return `p${productId}`;
}

/** Parse UI post id back to numeric productId. */
export function toProductId(postId: string): number {
  return parseInt(postId.replace(/^p/i, ''), 10);
}

/** Convert numeric campaignId to UI campaign id. */
export function toCampaignId(campaignId: number): string {
  return `c${campaignId}`;
}

/** Parse UI campaign id back to numeric campaignId. */
export function toEntityCampaignId(campaignId: string): number {
  return parseInt(campaignId.replace(/^c/i, ''), 10);
}

/** Convert numeric requestId to UI request id. */
export function toRequestId(requestId: number): string {
  return `r${requestId}`;
}

/** Parse UI request id back to numeric requestId. */
export function toEntityRequestId(requestId: string): number {
  return parseInt(requestId.replace(/^r/i, ''), 10);
}

/** Generate a new numeric product id from timestamp. */
export function newProductId(): number {
  return Date.now();
}

/** Generate a new numeric request id from timestamp. */
export function newRequestId(): number {
  return Date.now();
}

/** Generate a new numeric transaction id from timestamp. */
export function newTransactionId(): number {
  return Date.now();
}

/** Generate a new numeric fee id from timestamp. */
export function newFeeId(): number {
  return Date.now();
}

// ============================================================================
// Entity → UI view model converters
// ============================================================================

/**
 * Map a ProductEntity (+ joins) to a UI Post.
 *
 * @param product  The product entity row.
 * @param user     The owner (joined via product.userId).
 * @param category The category (joined via product.categoryId).
 * @param campaign Optional campaign (joined via product.campaignId).
 */
export function toPostView(
  product: ProductEntity,
  user: UserEntity,
  category: CategoryEntity,
  campaign?: CampaignEntity,
): Post {
  return {
    id: toPostId(product.productId),
    title: product.title,
    icon: product.image,
    type: product.type,
    price: product.price,
    category: category.categoryName,
    owner: user.fullName,
    ownerRole: user.ownerRole ?? 'Student',
    status: product.status,
    campaignId: campaign ? toCampaignId(campaign.campaignId) : undefined,
    campaignName: campaign?.title,
    date: product.createdAt,
    content: product.description,
    description: product.description,
    contact: product.contact,
    reason: product.reason,
  };
}

/**
 * Map a CampaignEntity (+ organizer name) to a UI Campaign.
 *
 * The `organizer` field on CampaignEntity is a mock extension (DOCX schema
 * only has `createdBy` userId). We use it directly here; in a real backend
 * the mapper would join the Users table via `createdBy`.
 */
export function toCampaignView(campaign: CampaignEntity): Campaign {
  return {
    id: toCampaignId(campaign.campaignId),
    name: campaign.title,
    organizer: campaign.organizer,
    type: campaign.type,
    is_free: campaign.isFree,
    intermediary_fee: campaign.intermediaryFee ?? 0,
    start: campaign.startDate,
    end: campaign.endDate,
    status: campaign.status,
    cover: campaign.cover,
    description: campaign.description,
  };
}

/**
 * Map a RequestEntity (+ joins) to a UI ProductRequest.
 */
export function toRequestView(
  request: RequestEntity,
  product: ProductEntity,
  sender: UserEntity,
  receiver: UserEntity,
): ProductRequest {
  return {
    id: toRequestId(request.requestId),
    productId: toPostId(product.productId),
    product: product.title,
    sender: sender.fullName,
    receiver: receiver.fullName,
    type: request.type as RequestType,
    status: request.status,
    date: request.createdAt,
  };
}

/**
 * Map a CategoryEntity + computed product count to a UI Category.
 */
export function toCategoryView(
  category: CategoryEntity,
  productCount: number,
): Category {
  return {
    name: category.categoryName,
    desc: category.description,
    status: category.status,
    count: productCount,
  };
}

/**
 * Compute CampaignStats from a list of UI Posts belonging to one campaign.
 * This is a convenience function; the caller filters posts by campaignId.
 */
export function toCampaignStatsView(posts: Post[]): CampaignStats {
  return {
    total: posts.length,
    approved: posts.filter((p) => p.status === 'Approved').length,
    pending: posts.filter((p) => p.status === 'Pending Approval').length,
  };
}

// ============================================================================
// Business logic helpers (shared between mockApi methods)
// ============================================================================

/** Map Post.type to corresponding Request.type. */
export function mapRequestType(type: TransactionType): RequestType {
  if (type === 'Sale') {
    return 'Purchase';
  }
  return type;
}

/** Compute the platform fee for a Sale transaction (5% of amount, rounded). */
export function computeFee(amount: number): number {
  return Math.round(amount * 0.05);
}
