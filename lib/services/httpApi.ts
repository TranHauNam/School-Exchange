// ============================================================================
// httpApi.ts — HTTP API Client (Real Backend)
//
// Implements ApiClient interface by calling the Node.js/Express backend via
// fetch(). This is the PRODUCTION seam — swap mockApi for httpApi via the
// NEXT_PUBLIC_API_MODE env var.
//
// Every method returns a Promise. Auth-protected endpoints automatically
// attach `Authorization: Bearer <token>` from localStorage.
// ============================================================================

import type { RoleKey } from '@/lib/types/role';
import { normalizeRoleKey } from '@/lib/types/role';
import type { Post, TransactionType } from '@/lib/types/post';
import type { Campaign, CampaignStats } from '@/lib/types/campaign';
import type { ProductRequest } from '@/lib/types/request';
import type { Category } from '@/lib/types/category';
import type {
  ReportOverview,
  PostStatsDetail,
  TransactionStats,
  CampaignStatsReport,
} from '@/lib/types/report';
import {
  ApiError,
  type ApiClient,
  type Session,
  type FeedFilters,
  type PostManagementFilters,
  type CreatePostInput,
  type CreateCampaignInput,
  type SubmitCampaignPostInput,
  type UserProfile,
  type UpdateProfileInput,
} from '@/lib/services/apiTypes';

// ---------------------------------------------------------------------------
// Token management (SSR-safe)
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'schoolItemExchangeTokenV1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

class HttpApiError extends ApiError {
  readonly httpStatus: number;

  constructor(code: string, message: string, status: number) {
    // Map backend error codes to frontend ApiErrorCode where possible
    const mapped: ApiError['code'] =
      code === 'INVALID_CREDENTIALS' || code === 'UNAUTHORIZED'
        ? 'INVALID_CREDENTIALS'
        : code === 'ACCOUNT_DISABLED'
          ? 'ACCOUNT_DISABLED'
          : code === 'FORBIDDEN'
            ? 'FORBIDDEN'
            : code === 'NOT_FOUND'
              ? 'NOT_FOUND'
              : code === 'CONFLICT'
                ? 'CONFLICT'
                : 'VALIDATION';
    super(mapped, message);
    this.name = 'ApiError';
    this.httpStatus = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge with any custom headers passed in options
  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (error) {
    throw new ApiError('VALIDATION', 'Không thể kết nối tới máy chủ. Vui lòng thử lại.');
  }

  let json: { success: boolean; data?: T; code?: string; message?: string };
  try {
    json = await res.json();
  } catch {
    throw new ApiError('VALIDATION', `Server error (${res.status})`);
  }

  if (!json.success) {
    throw new HttpApiError(json.code || 'SERVER_ERROR', json.message || 'Lỗi không xác định', res.status);
  }

  return json.data as T;
}

/** GET request (no body) */
async function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

/** POST request with JSON body */
async function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** PATCH request with JSON body */
async function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** DELETE request (no body) */
async function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Query string builder
// ---------------------------------------------------------------------------

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, value);
    }
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

// ---------------------------------------------------------------------------
// Data adapters (backend shape → frontend shape)
// ---------------------------------------------------------------------------

/** Map backend Category status "Hidden" → frontend "Inactive" */
function adaptCategory(c: Category): Category {
  const statusStr: string = c.status;
  return {
    ...c,
    status: (statusStr === 'Hidden' ? 'Inactive' : statusStr) as Category['status'],
  };
}

/** Build a Session object from backend login/me response */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSession(data: any, tokenOverride?: string): Session {
  const s = data.session || data;
  return {
    roleKey: normalizeRoleKey(s.roleKey || 'member'),
    role: (s.role || 'Member') as Session['role'],
    userName: s.userName || '',
    token: tokenOverride || data.token || '',
    id: s.id || '',
    email: s.email || '',
  };
}

// ============================================================================
// httpApi implementation
// ============================================================================

export const httpApi: ApiClient = {
  // -------------------------------------------------------------------------
  // auth
  // -------------------------------------------------------------------------
  auth: {
    async login(email: string, password: string, isAdmin?: boolean) {
      const endpoint = isAdmin ? '/api/auth/admin-login' : '/api/auth/login';
      const body = isAdmin
        ? { username: email, password }
        : { email, password };
      console.log('[httpApi.login]', { endpoint, body });
      const data = await post<{ token: string; session: { id: string; roleKey: string; role: string; userName: string; email: string } }>(endpoint, body);
      console.log('[httpApi.login] data from backend:', data);
      setToken(data.token);
      const session = buildSession(data, data.token);
      console.log('[httpApi.login] built session:', session);
      return session;
    },

    async logout() {
      try {
        await post('/api/auth/logout');
      } catch {
        // Ignore errors during logout
      }
      setToken(null);
    },

    async getSession() {
      const token = getToken();
      if (!token) return null;
      try {
        const data = await get<{ id: string; roleKey: string; role: string; userName: string; email: string }>('/api/auth/me');
        return buildSession(data, token);
      } catch {
        setToken(null);
        return null;
      }
    },

    async getProfile() {
      return get<UserProfile>('/api/auth/profile');
    },

    async updateProfile(input: UpdateProfileInput) {
      return patch<UserProfile>('/api/auth/profile', {
        fullName: input.fullName,
        phone: input.phone,
      });
    },
  },

  // -------------------------------------------------------------------------
  // posts
  // -------------------------------------------------------------------------
  posts: {
    async listFeed(filters: FeedFilters) {
      return get<Post[]>(
        `/api/posts/feed${qs({
          keyword: filters.keyword || undefined,
          category: filters.category,
          type: filters.type,
          sort: filters.sort,
        })}`,
      );
    },

    async getPost(postId: string) {
      return get<Post>(`/api/posts/${postId}`);
    },

    async createPost(input: CreatePostInput) {
      return post<Post>('/api/posts', {
        title: input.title,
        content: input.content,
        imageName: input.imageName,
        type: input.type,
        price: input.price,
        category: input.category,
        contact: input.contact,
        campaignId: input.campaignId,
      });
    },

    async updatePost(postId: string, input: Partial<CreatePostInput>) {
      const body: Record<string, unknown> = {};
      if (input.title !== undefined) body.title = input.title;
      if (input.content !== undefined) body.content = input.content;
      if (input.imageName !== undefined) body.imageName = input.imageName;
      if (input.type !== undefined) body.type = input.type;
      if (input.price !== undefined) body.price = input.price;
      if (input.category !== undefined) body.category = input.category;
      if (input.contact !== undefined) body.contact = input.contact;
      if (input.campaignId !== undefined) body.campaignId = input.campaignId;
      return patch<Post>(`/api/posts/${postId}`, body);
    },

    async removePost(postId: string) {
      return post<Post>(`/api/posts/${postId}/remove`);
    },

    async listMyPosts() {
      return get<Post[]>('/api/posts/my');
    },

    async listPendingPosts() {
      return get<Post[]>('/api/admin/posts/pending');
    },

    async approvePost(postId: string) {
      return post<Post>(`/api/admin/posts/${postId}/approve`);
    },

    async rejectPost(postId: string, reason: string) {
      return post<Post>(`/api/admin/posts/${postId}/reject`, { reason });
    },

    async listAllPosts(filters?: PostManagementFilters) {
      return get<Post[]>(
        `/api/admin/posts${qs({
          keyword: filters?.keyword || undefined,
          status: filters?.status,
          category: filters?.category,
          type: filters?.type,
        })}`,
      );
    },

    async hideRemovePost(postId: string, reason: string) {
      return post<Post>(`/api/admin/posts/${postId}/remove`, { reason });
    },
  },

  // -------------------------------------------------------------------------
  // requests
  // -------------------------------------------------------------------------
  requests: {
    async sendRequest(postId: string, message: string, contact: string) {
      return post<ProductRequest>(`/api/posts/${postId}/requests`, { message, contact });
    },

    async listSent() {
      return get<ProductRequest[]>('/api/requests/sent');
    },

    async listReceived() {
      return get<ProductRequest[]>('/api/requests/received');
    },

    async listCompleted() {
      return get<ProductRequest[]>('/api/requests/completed');
    },

    async acceptRequest(requestId: string) {
      return post<ProductRequest>(`/api/requests/${requestId}/accept`);
    },

    async rejectRequest(requestId: string) {
      return post<ProductRequest>(`/api/requests/${requestId}/reject`);
    },

    async completeRequest(requestId: string) {
      return post<ProductRequest>(`/api/requests/${requestId}/complete`);
    },
  },

  // -------------------------------------------------------------------------
  // campaigns
  // -------------------------------------------------------------------------
  campaigns: {
    async listCampaigns() {
      return get<Campaign[]>('/api/campaigns');
    },

    async getCampaign(campaignId: string) {
      return get<Campaign>(`/api/campaigns/${campaignId}`);
    },

    async getCampaignStats(campaignId: string) {
      return get<CampaignStats>(`/api/campaigns/${campaignId}/stats`);
    },

    async listCampaignPosts(campaignId: string, type?: TransactionType | 'All') {
      return get<Post[]>(`/api/campaigns/${campaignId}/posts${qs({ type: type || 'All' })}`);
    },

    async createCampaign(input: CreateCampaignInput) {
      return post<Campaign>('/api/campaigns', {
        name: input.name,
        organizer: input.organizer,
        description: input.description,
        type: input.type,
        is_free: input.is_free,
        start: input.start,
        end: input.end,
      });
    },

    async updateCampaign(campaignId: string, input: Partial<CreateCampaignInput>) {
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.organizer !== undefined) body.organizer = input.organizer;
      if (input.description !== undefined) body.description = input.description;
      if (input.type !== undefined) body.type = input.type;
      if (input.is_free !== undefined) body.is_free = input.is_free;
      if (input.start !== undefined) body.start = input.start;
      if (input.end !== undefined) body.end = input.end;
      return patch<Campaign>(`/api/campaigns/${campaignId}`, body);
    },

    async endCampaign(campaignId: string) {
      return post<Campaign>(`/api/campaigns/${campaignId}/end`);
    },

    async listMyCampaigns() {
      return get<Campaign[]>('/api/activity-admin/campaigns');
    },

    async listAllCampaigns() {
      return get<Campaign[]>('/api/admin/campaigns');
    },

    async submitCampaignPost(input: SubmitCampaignPostInput) {
      return post<Post>(`/api/campaigns/${input.campaignId}/submissions`, {
        fromApprovedPostId: input.fromApprovedPostId,
        content: input.content,
        imageName: input.imageName,
        note: input.note,
      });
    },
  },

  // -------------------------------------------------------------------------
  // categories
  // -------------------------------------------------------------------------
  categories: {
    async list() {
      const cats = await get<Category[]>('/api/admin/categories');
      return cats.map(adaptCategory);
    },

    async listActive() {
      const cats = await get<Category[]>('/api/categories/active');
      return cats.map(adaptCategory);
    },

    async create(name: string, desc: string) {
      const cat = await post<Category>('/api/admin/categories', { name, desc });
      return adaptCategory(cat);
    },

    async update(name: string, input: Partial<Category>) {
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.desc !== undefined) body.desc = input.desc;
      const cat = await patch<Category>(`/api/admin/categories/${encodeURIComponent(name)}`, body);
      return adaptCategory(cat);
    },

    async toggleActive(name: string) {
      const cat = await post<Category>(`/api/admin/categories/${encodeURIComponent(name)}/toggle-active`);
      return adaptCategory(cat);
    },

    async remove(name: string) {
      await del(`/api/admin/categories/${encodeURIComponent(name)}`);
    },
  },

  // -------------------------------------------------------------------------
  // reports
  // -------------------------------------------------------------------------
  reports: {
    async getOverview() {
      return get<ReportOverview>('/api/admin/reports/overview');
    },

    async getPostStats() {
      return get<PostStatsDetail>('/api/admin/reports/posts');
    },

    async getTransactionStats() {
      return get<TransactionStats>('/api/admin/reports/transactions');
    },

    async getCampaignStats() {
      return get<CampaignStatsReport>('/api/admin/reports/campaigns');
    },
  },
};
