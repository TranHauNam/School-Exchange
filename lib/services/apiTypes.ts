// ============================================================================
// apiTypes.ts — Shared types, interfaces, and the ApiError class used by both
// mockApi.ts and httpApi.ts.
//
// Extracted to a separate file to avoid circular imports between the two
// ApiClient implementations.
// ============================================================================

import type { Role, RoleKey } from '@/lib/types/role';
import type { Post, TransactionType, PostStatus } from '@/lib/types/post';
import type { Campaign, CampaignStats, CampaignType } from '@/lib/types/campaign';
import type { ProductRequest } from '@/lib/types/request';
import type { Category } from '@/lib/types/category';
import type {
  ReportOverview,
  PostStatsDetail,
  TransactionStats,
  CampaignStatsReport,
} from '@/lib/types/report';

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DISABLED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION';

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface Session {
  roleKey: RoleKey;
  role: Role;
  userName: string;
  token: string;
  id: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  roleKey: RoleKey;
  status: string;
  ownerRole: string | null;
  createdAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
}

// ---------------------------------------------------------------------------
// Filter / DTO types
// ---------------------------------------------------------------------------

export interface FeedFilters {
  keyword?: string;
  category?: string | 'All';
  type?: TransactionType | 'All';
  sort?: 'Newest' | 'Price low to high' | 'Price high to low';
}

export interface PostManagementFilters {
  keyword?: string;
  status?: PostStatus | 'All';
  category?: string | 'All';
  type?: TransactionType | 'All';
}

export interface CreatePostInput {
  title?: string;
  content: string;
  imageName: string;
  type: TransactionType;
  price?: number;
  category: string;
  contact: string;
  campaignId?: string;
}

export interface CreateCampaignInput {
  name: string;
  organizer: string;
  description: string;
  type: CampaignType;
  is_free: boolean;
  intermediary_fee?: number;
  start: string;
  end: string;
}

export interface SubmitCampaignPostInput {
  campaignId: string;
  fromApprovedPostId?: string;
  content?: string;
  imageName?: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// ApiClient interface (the SINGLE SEAM)
// ---------------------------------------------------------------------------

export interface ApiClient {
  auth: {
    login(email: string, password: string, isAdmin?: boolean): Promise<Session>;
    logout(): Promise<void>;
    getSession(): Promise<Session | null>;
    getProfile(): Promise<UserProfile>;
    updateProfile(input: UpdateProfileInput): Promise<UserProfile>;
  };

  posts: {
    listFeed(filters: FeedFilters): Promise<Post[]>;
    getPost(postId: string): Promise<Post>;
    createPost(input: CreatePostInput): Promise<Post>;
    updatePost(postId: string, input: Partial<CreatePostInput>): Promise<Post>;
    removePost(postId: string): Promise<Post>;
    listMyPosts(): Promise<Post[]>;
    listPendingPosts(): Promise<Post[]>;
    approvePost(postId: string): Promise<Post>;
    rejectPost(postId: string, reason: string): Promise<Post>;
    listAllPosts(filters?: PostManagementFilters): Promise<Post[]>;
    hideRemovePost(postId: string, reason: string): Promise<Post>;
  };

  requests: {
    sendRequest(postId: string, message: string, contact: string): Promise<ProductRequest>;
    listSent(): Promise<ProductRequest[]>;
    listReceived(): Promise<ProductRequest[]>;
    listCompleted(): Promise<ProductRequest[]>;
    acceptRequest(requestId: string): Promise<ProductRequest>;
    rejectRequest(requestId: string): Promise<ProductRequest>;
    completeRequest(requestId: string): Promise<ProductRequest>;
  };

  campaigns: {
    listCampaigns(): Promise<Campaign[]>;
    getCampaign(campaignId: string): Promise<Campaign>;
    getCampaignStats(campaignId: string): Promise<CampaignStats>;
    listCampaignPosts(campaignId: string, type?: TransactionType | 'All'): Promise<Post[]>;
    createCampaign(input: CreateCampaignInput): Promise<Campaign>;
    updateCampaign(campaignId: string, input: Partial<CreateCampaignInput>): Promise<Campaign>;
    endCampaign(campaignId: string): Promise<Campaign>;
    listMyCampaigns(): Promise<Campaign[]>;
    listAllCampaigns(): Promise<Campaign[]>;
    submitCampaignPost(input: SubmitCampaignPostInput): Promise<Post>;
  };

  categories: {
    list(): Promise<Category[]>;
    listActive(): Promise<Category[]>;
    create(name: string, desc: string): Promise<Category>;
    update(name: string, input: Partial<Category>): Promise<Category>;
    toggleActive(name: string): Promise<Category>;
    remove(name: string): Promise<void>;
  };

  reports: {
    getOverview(): Promise<ReportOverview>;
    getPostStats(): Promise<PostStatsDetail>;
    getTransactionStats(): Promise<TransactionStats>;
    getCampaignStats(): Promise<CampaignStatsReport>;
  };
}
