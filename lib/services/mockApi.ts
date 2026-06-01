// ============================================================================
// mockApi.ts — Mock API Client (the SINGLE SEAM between UI and the data source).
//
// ARCHITECTURE RULE (from design.md):
//   - Components/pages MUST NEVER import `lib/mock-data/*` or
//     `lib/services/mockStore.ts` directly. They depend ONLY on the typed
//     `ApiClient` interface exported here.
//   - This module (`mockApi.ts`) is the ONLY module allowed to import
//     `mockStore`. Every method returns a `Promise` with a simulated network
//     delay (via `delay()`) so the UI exercises loading/empty/error states from
//     day one.
//
// INTERNALS (entity layer):
//   This module works with entity types internally (mirrors DOCX database
//   schema) and maps to UI types via `@/lib/entities/mappers`. The `ApiClient`
//   interface is unchanged — only the implementation body uses entities.
//
// SWAP PATH TO A JAVA REST API (the single seam):
//   1. Create `lib/services/httpApi.ts` implementing the SAME `ApiClient`
//      interface, but calling `fetch`/REST against the Java backend.
//   2. Change the export below from `mockApi` to `httpApi` (or select via an
//      env var such as NEXT_PUBLIC_API_MODE).
//   3. UI/components/pages need NO changes — they only depend on the
//      `ApiClient` type, not on how data is fetched.
// ============================================================================

import { ROLE_DISPLAY_NAME, ROLE_LABEL } from '@/lib/types/role';
import type { RoleKey } from '@/lib/types/role';
import type { Post, TransactionType } from '@/lib/types/post';
import type { Campaign } from '@/lib/types/campaign';
import type { ProductRequest } from '@/lib/types/request';
import type { Category } from '@/lib/types/category';
import type {
  ReportOverview,
  PostStatsDetail,
  PostDetailRow,
  TransactionStats,
  TransactionByType,
  FeeDetailRow,
  CampaignStatsReport,
  CampaignPerformanceRow,
  ChartBar,
} from '@/lib/types/report';
import type { ProductEntity } from '@/lib/entities/product';
import type { CampaignEntity } from '@/lib/entities/campaign';
import type { RequestEntity } from '@/lib/entities/request';
import type { TransactionEntity } from '@/lib/entities/transaction';
import type { FeeEntity } from '@/lib/entities/fee';
import {
  getDatabase,
  updateDatabase,
  getRoleKey,
  setRoleKey,
  getUserById,
  getCategoryById,
  getProductById,
  getCampaignById,
  getCategoryByName,
  getCurrentUser,
} from '@/lib/services/mockStore';
import type { MockDatabase } from '@/lib/services/mockStore';
import {
  toPostView,
  toCampaignView,
  toRequestView,
  toCategoryView,
  toCampaignStatsView,
  mapRequestType,
  computeFee,
  toPostId,
  toCampaignId,
  toProductId,
  toEntityCampaignId,
  toEntityRequestId,
  newProductId,
  newRequestId,
  newTransactionId,
  newFeeId,
} from '@/lib/entities/mappers';
import type {
  ApiClient,
  FeedFilters,
  PostManagementFilters,
  CreatePostInput,
  CreateCampaignInput,
  SubmitCampaignPostInput,
  Session,
  UserProfile,
  UpdateProfileInput,
} from '@/lib/services/apiTypes';

// Re-export shared types for backward compatibility (all existing imports
// still do `import { mockApi, type Session, ... } from '@/lib/services/mockApi'`)
export {
  ApiError,
  type ApiErrorCode,
  type ApiClient,
  type Session,
  type UserProfile,
  type UpdateProfileInput,
  type FeedFilters,
  type PostManagementFilters,
  type CreatePostInput,
  type CreateCampaignInput,
  type SubmitCampaignPostInput,
} from '@/lib/services/apiTypes';

// ---------------------------------------------------------------------------
// Simulated network delay
// ---------------------------------------------------------------------------

/** Await a simulated network delay (default 300ms). SSR-safe. */
export async function delay(ms = 300): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ============================================================================
// Internal helpers
// ============================================================================

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function sessionFor(roleKey: RoleKey): Session {
  return {
    roleKey,
    role: ROLE_LABEL[roleKey],
    userName: ROLE_DISPLAY_NAME[roleKey],
    token: 'mock-token',
    id: roleKey === 'member' ? '1' : roleKey === 'system-admin' ? '2' : '3',
    email: roleKey === 'member' ? 'an@student.school.edu' : roleKey === 'system-admin' ? 'huy@school.edu' : 'greenlife@school.edu',
  };
}

/** Resolve the current user's numeric ID. Throws if no current user. */
function currentUserId(db: MockDatabase): number {
  const user = getCurrentUser(db);
  if (!user) throw new ApiError('FORBIDDEN', 'Không tìm thấy người dùng hiện tại.');
  return user.userId;
}

function assertMemberRole(): void {
  if (getRoleKey() !== 'member') {
    throw new ApiError('FORBIDDEN', 'Chức năng này chỉ dành cho Member');
  }
}

function assertSystemAdminRole(): void {
  if (getRoleKey() !== 'system-admin') {
    throw new ApiError('FORBIDDEN', 'Chức năng này chỉ dành cho System Admin');
  }
}

function deriveCampaignStatus(start: string, end: string, now = todayIso()): CampaignEntity['status'] {
  if (now < start) return 'Upcoming';
  if (now > end) return 'Ended';
  return 'Active';
}

function canManageCampaign(campaign: CampaignEntity): boolean {
  const roleKey = getRoleKey();
  if (roleKey === 'system-admin') return true;
  if (roleKey === 'activity-admin') {
    const db = getDatabase();
    const uid = currentUserId(db);
    return campaign.createdBy === uid;
  }
  return false;
}

// ============================================================================
// Entity → UI mapping helpers (join + map patterns)
// ============================================================================

/** Join a product with its user, category, and optional campaign, then map to UI Post. */
function postToView(db: MockDatabase, product: ProductEntity): Post {
  const user = getUserById(db, product.userId);
  if (!user) throw new ApiError('NOT_FOUND', `Không tìm thấy người dùng: ${product.userId}`);
  const category = getCategoryById(db, product.categoryId);
  if (!category) throw new ApiError('NOT_FOUND', `Không tìm thấy danh mục: ${product.categoryId}`);
  const campaign = product.campaignId ? getCampaignById(db, product.campaignId) : undefined;
  return toPostView(product, user, category, campaign);
}

/** Map a list of products to UI Posts (with joins). */
function postsToViews(db: MockDatabase, products: ProductEntity[]): Post[] {
  return products.map((p) => postToView(db, p));
}

/** Join a request with its product, sender, receiver, then map to UI ProductRequest. */
function requestToView(db: MockDatabase, request: RequestEntity): ProductRequest {
  const product = getProductById(db, request.productId);
  if (!product) throw new ApiError('NOT_FOUND', `Không tìm thấy sản phẩm: ${request.productId}`);
  const sender = getUserById(db, request.senderId);
  if (!sender) throw new ApiError('NOT_FOUND', `Không tìm thấy người gửi: ${request.senderId}`);
  const receiver = getUserById(db, request.receiverId);
  if (!receiver) throw new ApiError('NOT_FOUND', `Không tìm thấy người nhận: ${request.receiverId}`);
  return toRequestView(request, product, sender, receiver);
}

/** Compute category product counts and map to UI Category list. */
function categoriesToViews(db: MockDatabase): Category[] {
  return db.categories.map((cat) => {
    const count = db.products.filter((p) => p.categoryId === cat.categoryId).length;
    return toCategoryView(cat, count);
  });
}

// Import these inside the mock closure to avoid circular issues
import { ApiError } from '@/lib/services/apiTypes';

// ============================================================================
// Report helpers (used by reports domain)
// ============================================================================

/**
 * Generate last-6-months labels as YYYY-MM strings.
 * Locked to a fixed reference window for deterministic results.
 */
function getLast6MonthLabels(): string[] {
  const months: string[] = [];
  const d = new Date(2026, 5, 1); // June 2026
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const y = m.getFullYear();
    const mo = String(m.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${mo}`);
  }
  return months;
}

/** Convert month number (1-12) to Vietnamese label. */
function monthLabel(month: number): string {
  const labels = [
    'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
    'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12',
  ];
  return labels[month - 1] ?? `Th${month}`;
}

// ============================================================================
// Mock implementation
// ============================================================================

const mockApiImpl: ApiClient = {
  // -----------------------------------------------------------------------
  // auth
  // -----------------------------------------------------------------------
  auth: {
    async login(email: string, password: string, isAdmin?: boolean) {
      await delay();
      console.log('[mockApi.login] input:', { email, isAdmin, passwordMatches: password === 'school123' });
      // Map demo credentials to roleKey for mock mode.
      // Admin login sends username; member login sends email.
      const CREDENTIALS: { login: string; roleKey: RoleKey; isAdmin: boolean }[] = [
        { login: 'an@student.school.edu', roleKey: 'member', isAdmin: false },
        { login: 'huyle',                roleKey: 'system-admin', isAdmin: true },
        { login: 'huy@school.edu',       roleKey: 'system-admin', isAdmin: false },
        { login: 'greenlife',            roleKey: 'activity-admin', isAdmin: true },
        { login: 'greenlife@school.edu', roleKey: 'activity-admin', isAdmin: false },
      ];
      const match = CREDENTIALS.find(
        (c) => c.login === email.toLowerCase() && c.isAdmin === Boolean(isAdmin),
      );
      console.log('[mockApi.login] match:', match);
      if (!match || password !== 'school123') {
        throw new ApiError('INVALID_CREDENTIALS', 'Thông tin đăng nhập không chính xác.');
      }
      setRoleKey(match.roleKey);
      const session = sessionFor(match.roleKey);
      console.log('[mockApi.login] session returned:', session);
      return session;
    },
    async logout() {
      await delay();
      // No-op: session clearing is handled by auth-context.
    },
    async getSession() {
      await delay();
      const rk = getRoleKey();
      const s = sessionFor(rk);
      console.log('[mockApi.getSession] roleKey from store:', rk, 'session:', s);
      return s;
    },
    async getProfile() {
      await delay();
      const db = getDatabase();
      const user = getCurrentUser(db);
      if (!user) throw new ApiError('NOT_FOUND', 'Không tìm thấy người dùng.');
      const rk = getRoleKey();
      return {
        id: String(user.userId),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: ROLE_LABEL[rk],
        roleKey: rk,
        status: user.status,
        ownerRole: user.ownerRole,
        createdAt: user.createdAt,
      } satisfies UserProfile;
    },
    async updateProfile(input: UpdateProfileInput) {
      await delay();
      let profile: UserProfile | undefined;
      updateDatabase((nextDb) => {
        const rk = getRoleKey();
        const role = nextDb.roles.find((r) => r.roleKey === rk);
        if (!role) return;
        const user = nextDb.users.find((u) => u.roleId === role.roleId);
        if (!user) return;

        if (input.fullName !== undefined) {
          if (!input.fullName.trim()) throw new ApiError('VALIDATION', 'Họ tên không được để trống.');
          user.fullName = input.fullName.trim();
        }
        if (input.phone !== undefined) {
          if (!input.phone.trim()) throw new ApiError('VALIDATION', 'Số điện thoại không được để trống.');
          user.phone = input.phone.trim();
        }

        profile = {
          id: String(user.userId),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: ROLE_LABEL[rk],
          roleKey: rk,
          status: user.status,
          ownerRole: user.ownerRole,
          createdAt: user.createdAt,
        };
      });

      if (!profile) throw new ApiError('NOT_FOUND', 'Không tìm thấy người dùng.');
      return profile;
    },
  },

  // -----------------------------------------------------------------------
  // posts
  // -----------------------------------------------------------------------
  posts: {
    async listFeed(filters: FeedFilters) {
      await delay();
      const db = getDatabase();
      const keyword = (filters.keyword ?? '').trim().toLowerCase();
      const category = filters.category ?? 'All';
      const type = filters.type ?? 'All';
      const sort = filters.sort ?? 'Newest';

      // Only Approved posts appear on the School Feed.
      const approvedProducts = db.products.filter((p) => p.status === 'Approved');

      // Map to UI Posts for filtering (keyword/category match on display values).
      let posts = postsToViews(db, approvedProducts);

      if (keyword) {
        posts = posts.filter((p) =>
          `${p.title} ${p.category} ${p.owner} ${p.content} ${p.campaignName ?? ''}`
            .toLowerCase()
            .includes(keyword),
        );
      }
      if (category !== 'All') {
        posts = posts.filter((p) => p.category === category);
      }
      if (type !== 'All') {
        posts = posts.filter((p) => p.type === type);
      }

      if (sort === 'Price low to high') {
        posts = [...posts].sort((a, b) => a.price - b.price);
      } else if (sort === 'Price high to low') {
        posts = [...posts].sort((a, b) => b.price - a.price);
      } else {
        posts = [...posts].sort((a, b) => b.date.localeCompare(a.date));
      }

      return posts;
    },

    async getPost(postId: string) {
      await delay();
      const db = getDatabase();
      const pid = toProductId(postId);
      if (Number.isNaN(pid)) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);
      const product = getProductById(db, pid);
      if (!product) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);
      return postToView(db, product);
    },

    async createPost(input: CreatePostInput) {
      await delay();
      assertMemberRole();

      const content = input.content.trim();
      if (!content) throw new ApiError('VALIDATION', 'Vui lòng nhập nội dung bài đăng.');

      const db = getDatabase();
      const category = getCategoryByName(db, input.category);
      if (!category || category.status !== 'Active') {
        throw new ApiError('VALIDATION', 'Vui lòng chọn danh mục đang hoạt động.');
      }

      if (input.type === 'Sale' && (input.price ?? 0) < 0) {
        throw new ApiError('VALIDATION', 'Giá phải lớn hơn hoặc bằng 0.');
      }

      let campaignEntity: CampaignEntity | undefined;
      if (input.campaignId) {
        const cid = toEntityCampaignId(input.campaignId);
        campaignEntity = getCampaignById(db, cid);
        if (!campaignEntity) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${input.campaignId}`);
      }

      const uid = currentUserId(db);
      const title =
        input.title?.trim() ||
        content.split(/[.!?\n]/)[0]?.slice(0, 64) ||
        'Bài đăng mới';
      const price = input.type === 'Sale' ? input.price ?? 0 : 0;

      const newProduct: ProductEntity = {
        productId: newProductId(),
        userId: uid,
        categoryId: category.categoryId,
        title,
        description: content,
        image: input.imageName || 'POST',
        price,
        type: input.type,
        status: 'Pending Approval',
        contact: input.contact,
        campaignId: campaignEntity?.campaignId,
        createdAt: todayIso(),
      };

      updateDatabase((nextDb) => {
        nextDb.products.unshift(newProduct);
      });

      // Re-read to get fresh joins
      const freshDb = getDatabase();
      return postToView(freshDb, newProduct);
    },

    async updatePost(postId: string, input: Partial<CreatePostInput>) {
      await delay();
      assertMemberRole();

      const pid = toProductId(postId);
      if (Number.isNaN(pid)) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);

      const db = getDatabase();
      const current = getProductById(db, pid);
      if (!current) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);

      const uid = currentUserId(db);
      if (current.userId !== uid) throw new ApiError('FORBIDDEN', 'Bạn chỉ có thể sửa bài đăng của chính mình.');
      if (current.status !== 'Pending Approval' && current.status !== 'Rejected') {
        throw new ApiError('CONFLICT', 'Chỉ có thể sửa bài ở trạng thái Pending Approval hoặc Rejected.');
      }

      let updated: ProductEntity | undefined;
      updateDatabase((nextDb) => {
        const product = nextDb.products.find((p) => p.productId === pid);
        if (!product) return;

        if (input.category !== undefined) {
          const cat = getCategoryByName(nextDb, input.category);
          if (!cat || cat.status !== 'Active') {
            throw new ApiError('VALIDATION', 'Vui lòng chọn danh mục đang hoạt động.');
          }
          product.categoryId = cat.categoryId;
        }
        if (input.title !== undefined) product.title = input.title.trim() || product.title;
        if (input.content !== undefined) {
          const c = input.content.trim();
          if (!c) throw new ApiError('VALIDATION', 'Vui lòng nhập nội dung bài đăng.');
          product.description = c;
        }
        if (input.contact !== undefined) product.contact = input.contact;
        if (input.type !== undefined) product.type = input.type;
        if (input.imageName !== undefined) product.image = input.imageName;

        if (input.campaignId !== undefined) {
          if (input.campaignId) {
            const cid = toEntityCampaignId(input.campaignId);
            const camp = getCampaignById(nextDb, cid);
            if (!camp) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${input.campaignId}`);
            product.campaignId = camp.campaignId;
          } else {
            delete product.campaignId;
          }
        }

        if (product.type === 'Sale') {
          const nextPrice = input.price ?? product.price;
          if (nextPrice < 0) throw new ApiError('VALIDATION', 'Giá phải lớn hơn hoặc bằng 0.');
          product.price = nextPrice;
        } else {
          product.price = 0;
        }

        product.status = 'Pending Approval';
        delete product.reason;
        updated = product;
      });

      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);
      return postToView(getDatabase(), updated);
    },

    async removePost(postId: string) {
      await delay();
      assertMemberRole();

      const pid = toProductId(postId);
      if (Number.isNaN(pid)) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);

      const db = getDatabase();
      const existing = getProductById(db, pid);
      if (!existing) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);

      const uid = currentUserId(db);
      if (existing.userId !== uid) throw new ApiError('FORBIDDEN', 'Bạn chỉ có thể gỡ bài đăng của chính mình.');
      if (existing.status === 'Completed') throw new ApiError('CONFLICT', 'Không thể gỡ bài đã hoàn tất');

      let updated: ProductEntity | undefined;
      updateDatabase((nextDb) => {
        const product = nextDb.products.find((p) => p.productId === pid);
        if (!product) return;
        product.status = 'Removed';
        updated = product;
      });

      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);
      return postToView(getDatabase(), updated);
    },

    async listMyPosts() {
      await delay();
      const db = getDatabase();
      const uid = currentUserId(db);
      const myProducts = db.products.filter((p) => p.userId === uid);
      return postsToViews(db, myProducts);
    },

    async listPendingPosts() {
      await delay();
      const db = getDatabase();
      const roleKey = getRoleKey();

      if (roleKey === 'system-admin') {
        const pending = db.products.filter((p) => p.status === 'Pending Approval');
        return postsToViews(db, pending);
      }

      if (roleKey === 'activity-admin') {
        const pending = db.products.filter((p) => {
          if (p.status !== 'Pending Approval' || !p.campaignId) return false;
          const campaign = getCampaignById(db, p.campaignId);
          return Boolean(campaign && canManageCampaign(campaign));
        });
        return postsToViews(db, pending);
      }

      throw new ApiError('FORBIDDEN', 'Bạn không có quyền xem danh sách chờ duyệt.');
    },

    async approvePost(postId: string) {
      await delay();
      const pid = toProductId(postId);
      if (Number.isNaN(pid)) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);

      let updated: ProductEntity | undefined;
      updateDatabase((nextDb) => {
        const product = nextDb.products.find((p) => p.productId === pid);
        if (!product) return;
        if (product.status !== 'Pending Approval') {
          throw new ApiError('CONFLICT', 'Chỉ có thể duyệt bài đang chờ duyệt.');
        }

        const rk = getRoleKey();
        if (rk === 'system-admin') {
          product.status = 'Approved';
          updated = product;
          return;
        }
        if (rk === 'activity-admin') {
          if (!product.campaignId) throw new ApiError('FORBIDDEN', 'Activity Admin chỉ duyệt campaign post.');
          const campaign = getCampaignById(nextDb, product.campaignId);
          if (!campaign || !canManageCampaign(campaign)) {
            throw new ApiError('FORBIDDEN', 'Bạn không đủ quyền truy cập campaign này.');
          }
          product.status = 'Approved';
          updated = product;
          return;
        }
        throw new ApiError('FORBIDDEN', 'Bạn không có quyền duyệt bài đăng.');
      });

      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);
      return postToView(getDatabase(), updated);
    },

    async rejectPost(postId: string, reason: string) {
      await delay();
      const trimmedReason = reason.trim();
      if (!trimmedReason) throw new ApiError('VALIDATION', 'Cần nhập lý do từ chối.');

      const pid = toProductId(postId);
      if (Number.isNaN(pid)) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);

      let updated: ProductEntity | undefined;
      updateDatabase((nextDb) => {
        const product = nextDb.products.find((p) => p.productId === pid);
        if (!product) return;
        if (product.status !== 'Pending Approval') {
          throw new ApiError('CONFLICT', 'Chỉ có thể từ chối bài đang chờ duyệt.');
        }

        const rk = getRoleKey();
        if (rk === 'system-admin') {
          product.status = 'Rejected';
          product.reason = trimmedReason;
          updated = product;
          return;
        }
        if (rk === 'activity-admin') {
          if (!product.campaignId) throw new ApiError('FORBIDDEN', 'Activity Admin chỉ từ chối campaign post.');
          const campaign = getCampaignById(nextDb, product.campaignId);
          if (!campaign || !canManageCampaign(campaign)) {
            throw new ApiError('FORBIDDEN', 'Bạn không đủ quyền truy cập campaign này.');
          }
          product.status = 'Rejected';
          product.reason = trimmedReason;
          updated = product;
          return;
        }
        throw new ApiError('FORBIDDEN', 'Bạn không có quyền từ chối bài đăng.');
      });

      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);
      return postToView(getDatabase(), updated);
    },

    async listAllPosts(filters?: PostManagementFilters) {
      await delay();
      const db = getDatabase();
      const roleKey = getRoleKey();

      let products = db.products;
      if (roleKey === 'activity-admin') {
        products = products.filter((p) => {
          if (!p.campaignId) return false;
          const campaign = getCampaignById(db, p.campaignId);
          return Boolean(campaign && canManageCampaign(campaign));
        });
      } else if (roleKey !== 'system-admin') {
        throw new ApiError('FORBIDDEN', 'Bạn không có quyền xem danh sách bài đăng.');
      }

      let posts = postsToViews(db, products);

      if (!filters) return posts;

      const keyword = (filters.keyword ?? '').trim().toLowerCase();
      const status = filters.status ?? 'All';
      const category = filters.category ?? 'All';
      const type = filters.type ?? 'All';

      if (keyword) {
        posts = posts.filter((p) =>
          `${p.title} ${p.owner} ${p.category} ${p.content} ${p.campaignName ?? ''}`
            .toLowerCase()
            .includes(keyword),
        );
      }
      if (status !== 'All') posts = posts.filter((p) => p.status === status);
      if (category !== 'All') posts = posts.filter((p) => p.category === category);
      if (type !== 'All') posts = posts.filter((p) => p.type === type);

      return posts;
    },

    async hideRemovePost(postId: string, reason: string) {
      await delay();
      assertSystemAdminRole();

      const trimmedReason = reason.trim();
      if (!trimmedReason) throw new ApiError('VALIDATION', 'Cần nhập lý do ẩn/xóa bài vi phạm.');

      const pid = toProductId(postId);
      if (Number.isNaN(pid)) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);

      const db = getDatabase();
      const existing = getProductById(db, pid);
      if (!existing) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);
      if (existing.status === 'Completed') throw new ApiError('CONFLICT', 'Không thể ẩn/xóa bài đã hoàn tất.');

      let updated: ProductEntity | undefined;
      updateDatabase((nextDb) => {
        const product = nextDb.products.find((p) => p.productId === pid);
        if (!product) return;
        product.status = 'Removed';
        product.reason = trimmedReason;
        updated = product;
      });

      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);
      return postToView(getDatabase(), updated);
    },
  },

  // -----------------------------------------------------------------------
  // requests
  // -----------------------------------------------------------------------
  requests: {
    async sendRequest(postId: string, message: string, contact: string) {
      await delay();
      assertMemberRole();

      if (!message.trim() || !contact.trim()) {
        throw new ApiError('VALIDATION', 'Vui lòng nhập lời nhắn và thông tin liên hệ.');
      }

      const pid = toProductId(postId);
      if (Number.isNaN(pid)) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);

      const db = getDatabase();
      const product = getProductById(db, pid);
      if (!product) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đăng: ${postId}`);

      const uid = currentUserId(db);
      if (product.userId === uid) {
        throw new ApiError('FORBIDDEN', 'Bạn không thể gửi yêu cầu cho bài đăng của chính mình.');
      }
      if (product.status !== 'Approved') {
        throw new ApiError('CONFLICT', 'Chỉ có thể gửi yêu cầu tới bài đã được duyệt.');
      }

      const createdRequest: RequestEntity = {
        requestId: newRequestId(),
        productId: product.productId,
        senderId: uid,
        receiverId: product.userId,
        type: mapRequestType(product.type),
        status: 'Pending',
        message: message.trim(),
        contact: contact.trim(),
        createdAt: todayIso(),
      };

      updateDatabase((nextDb) => {
        nextDb.requests.unshift(createdRequest);
      });

      return requestToView(getDatabase(), createdRequest);
    },

    async listSent() {
      await delay();
      assertMemberRole();
      const db = getDatabase();
      const uid = currentUserId(db);
      const sent = db.requests.filter((r) => r.senderId === uid);
      return sent.map((r) => requestToView(db, r));
    },

    async listReceived() {
      await delay();
      assertMemberRole();
      const db = getDatabase();
      const uid = currentUserId(db);
      const received = db.requests.filter((r) => r.receiverId === uid);
      return received.map((r) => requestToView(db, r));
    },

    async listCompleted() {
      await delay();
      const roleKey = getRoleKey();
      if (roleKey !== 'member' && roleKey !== 'system-admin') {
        throw new ApiError('FORBIDDEN', 'Chức năng này không khả dụng.');
      }
      const db = getDatabase();
      if (roleKey === 'system-admin') {
        const completed = db.requests.filter((r) => r.status === 'Completed');
        return completed.map((r) => requestToView(db, r));
      }
      const uid = currentUserId(db);
      const completed = db.requests.filter(
        (r) => r.status === 'Completed' && (r.senderId === uid || r.receiverId === uid),
      );
      return completed.map((r) => requestToView(db, r));
    },

    async acceptRequest(requestId: string) {
      await delay();
      assertMemberRole();

      const rid = toEntityRequestId(requestId);
      if (Number.isNaN(rid)) throw new ApiError('NOT_FOUND', `Không tìm thấy yêu cầu: ${requestId}`);

      let updated: RequestEntity | undefined;
      updateDatabase((nextDb) => {
        const request = nextDb.requests.find((r) => r.requestId === rid);
        if (!request) return;

        const uid = currentUserId(nextDb);
        if (request.receiverId !== uid) {
          throw new ApiError('FORBIDDEN', 'Bạn không có quyền xử lý yêu cầu này.');
        }
        if (request.status !== 'Pending') {
          throw new ApiError('CONFLICT', 'Chỉ có thể chấp nhận yêu cầu đang Pending.');
        }
        request.status = 'Accepted';
        updated = request;
      });

      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy yêu cầu: ${requestId}`);
      return requestToView(getDatabase(), updated);
    },

    async rejectRequest(requestId: string) {
      await delay();
      assertMemberRole();

      const rid = toEntityRequestId(requestId);
      if (Number.isNaN(rid)) throw new ApiError('NOT_FOUND', `Không tìm thấy yêu cầu: ${requestId}`);

      let updated: RequestEntity | undefined;
      updateDatabase((nextDb) => {
        const request = nextDb.requests.find((r) => r.requestId === rid);
        if (!request) return;

        const uid = currentUserId(nextDb);
        if (request.receiverId !== uid) {
          throw new ApiError('FORBIDDEN', 'Bạn không có quyền xử lý yêu cầu này.');
        }
        if (request.status !== 'Pending') {
          throw new ApiError('CONFLICT', 'Chỉ có thể từ chối yêu cầu đang Pending.');
        }
        request.status = 'Rejected';
        updated = request;
      });

      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy yêu cầu: ${requestId}`);
      return requestToView(getDatabase(), updated);
    },

    async completeRequest(requestId: string) {
      await delay();
      assertMemberRole();

      const rid = toEntityRequestId(requestId);
      if (Number.isNaN(rid)) throw new ApiError('NOT_FOUND', `Không tìm thấy yêu cầu: ${requestId}`);

      let updated: RequestEntity | undefined;
      updateDatabase((nextDb) => {
        const request = nextDb.requests.find((r) => r.requestId === rid);
        if (!request) return;

        const uid = currentUserId(nextDb);
        if (request.receiverId !== uid) {
          throw new ApiError('FORBIDDEN', 'Bạn không có quyền xử lý yêu cầu này.');
        }
        if (request.status !== 'Accepted') {
          throw new ApiError('CONFLICT', 'Chỉ có thể hoàn tất yêu cầu đang Accepted.');
        }

        request.status = 'Completed';
        updated = request;

        const product = nextDb.products.find((p) => p.productId === request.productId);
        if (product) {
          const isSale = product.type === 'Sale';
          const fee = isSale ? computeFee(product.price) : 0;

          const transaction: TransactionEntity = {
            transactionId: newTransactionId(),
            productId: product.productId,
            sellerId: request.receiverId,
            buyerId: request.senderId,
            transactionType: product.type,
            amount: product.price,
            fee,
            status: 'Completed',
            createdAt: todayIso(),
          };
          nextDb.transactions.unshift(transaction);

          if (isSale && fee > 0) {
            const feeEntity: FeeEntity = {
              feeId: newFeeId(),
              transactionId: transaction.transactionId,
              amount: fee,
              note: `5% phí giao dịch từ sản phẩm "${product.title}"`,
              createdAt: todayIso(),
            };
            nextDb.fees.unshift(feeEntity);
          }

          if (product.status === 'Approved') {
            product.status = 'Completed';
          }
        }
      });

      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy yêu cầu: ${requestId}`);
      return requestToView(getDatabase(), updated);
    },
  },

  // -----------------------------------------------------------------------
  // campaigns
  // -----------------------------------------------------------------------
  campaigns: {
    async listCampaigns() {
      await delay();
      const db = getDatabase();
      return db.campaigns.map((c) => {
        const camp: CampaignEntity = { ...c, status: deriveCampaignStatus(c.startDate, c.endDate) };
        return toCampaignView(camp);
      });
    },

    async getCampaign(campaignId: string) {
      await delay();
      const cid = toEntityCampaignId(campaignId);
      if (Number.isNaN(cid)) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);
      const db = getDatabase();
      const campaign = getCampaignById(db, cid);
      if (!campaign) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);
      const camp: CampaignEntity = { ...campaign, status: deriveCampaignStatus(campaign.startDate, campaign.endDate) };
      return toCampaignView(camp);
    },

    async getCampaignStats(campaignId: string) {
      await delay();
      const cid = toEntityCampaignId(campaignId);
      if (Number.isNaN(cid)) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);
      const db = getDatabase();
      const campaign = getCampaignById(db, cid);
      if (!campaign) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);
      const linkedProducts = db.products.filter((p) => p.campaignId === campaign.campaignId);
      const linkedPosts = postsToViews(db, linkedProducts);
      return toCampaignStatsView(linkedPosts);
    },

    async listCampaignPosts(campaignId: string, type: TransactionType | 'All' = 'All') {
      await delay();
      const cid = toEntityCampaignId(campaignId);
      if (Number.isNaN(cid)) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);
      const db = getDatabase();
      const campaign = getCampaignById(db, cid);
      if (!campaign) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);

      let products = db.products.filter(
        (p) => p.campaignId === campaign.campaignId && p.status === 'Approved',
      );
      if (type !== 'All') products = products.filter((p) => p.type === type);
      return postsToViews(db, products);
    },

    async createCampaign(input: CreateCampaignInput) {
      await delay();
      if (getRoleKey() !== 'activity-admin') {
        throw new ApiError('FORBIDDEN', 'Chỉ Activity Admin được tạo campaign.');
      }

      const name = input.name.trim();
      if (!name) throw new ApiError('VALIDATION', 'Vui lòng nhập tên hoạt động.');
      if (new Date(input.end).getTime() <= new Date(input.start).getTime()) {
        throw new ApiError('VALIDATION', 'Ngày kết thúc phải sau ngày bắt đầu.');
      }

      const db = getDatabase();
      const uid = currentUserId(db);
      const user = getCurrentUser(db);
      const organizer = input.organizer.trim() || user?.fullName || 'CLB Green Life';

      const createdCampaign: CampaignEntity = {
        campaignId: Date.now(),
        title: name,
        organizer,
        description: input.description,
        createdBy: uid,
        startDate: input.start,
        endDate: input.end,
        status: 'Upcoming',
        targetFund: 0,
        cover: 'GROUP',
        type: input.type,
        isFree: input.is_free,
        intermediaryFee: input.intermediary_fee ?? 0,
      };

      updateDatabase((nextDb) => {
        nextDb.campaigns.unshift(createdCampaign);
      });

      const camp: CampaignEntity = { ...createdCampaign, status: deriveCampaignStatus(createdCampaign.startDate, createdCampaign.endDate) };
      return toCampaignView(camp);
    },

    async updateCampaign(campaignId: string, input: Partial<CreateCampaignInput>) {
      await delay();
      const cid = toEntityCampaignId(campaignId);
      if (Number.isNaN(cid)) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);

      let updated: CampaignEntity | undefined;
      updateDatabase((nextDb) => {
        const campaign = nextDb.campaigns.find((c) => c.campaignId === cid);
        if (!campaign) return;
        if (!canManageCampaign(campaign)) {
          throw new ApiError('FORBIDDEN', 'Bạn không đủ quyền truy cập campaign này.');
        }

        const nextName = input.name !== undefined ? input.name.trim() : campaign.title;
        const nextOrganizer = input.organizer !== undefined ? input.organizer.trim() || campaign.organizer : campaign.organizer;
        const nextDescription = input.description !== undefined ? input.description : campaign.description;
        const nextType = input.type ?? campaign.type;
        const nextIsFree = input.is_free ?? campaign.isFree;
        const nextIntermediaryFee = input.intermediary_fee ?? campaign.intermediaryFee ?? 0;
        const nextStart = input.start ?? campaign.startDate;
        const nextEnd = input.end ?? campaign.endDate;

        if (!nextName) throw new ApiError('VALIDATION', 'Vui lòng nhập tên hoạt động.');
        if (new Date(nextEnd).getTime() <= new Date(nextStart).getTime()) {
          throw new ApiError('VALIDATION', 'Ngày kết thúc phải sau ngày bắt đầu.');
        }

        campaign.title = nextName;
        campaign.organizer = nextOrganizer;
        campaign.description = nextDescription;
        campaign.type = nextType;
        campaign.isFree = nextIsFree;
        campaign.intermediaryFee = nextIntermediaryFee;
        campaign.startDate = nextStart;
        campaign.endDate = nextEnd;
        campaign.status = deriveCampaignStatus(nextStart, nextEnd);
        updated = campaign;
      });

      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);
      const camp: CampaignEntity = { ...updated, status: deriveCampaignStatus(updated.startDate, updated.endDate) };
      return toCampaignView(camp);
    },

    async endCampaign(campaignId: string) {
      await delay();
      const cid = toEntityCampaignId(campaignId);
      if (Number.isNaN(cid)) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);

      let ended: CampaignEntity | undefined;
      updateDatabase((nextDb) => {
        const campaign = nextDb.campaigns.find((c) => c.campaignId === cid);
        if (!campaign) return;
        if (!canManageCampaign(campaign)) {
          throw new ApiError('FORBIDDEN', 'Bạn không đủ quyền truy cập campaign này.');
        }
        campaign.endDate = todayIso();
        campaign.status = 'Ended';
        ended = campaign;
      });

      if (!ended) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${campaignId}`);
      return toCampaignView({ ...ended, status: 'Ended' as const });
    },

    async listMyCampaigns() {
      await delay();
      if (getRoleKey() !== 'activity-admin') {
        throw new ApiError('FORBIDDEN', 'Chức năng này chỉ dành cho Activity Admin.');
      }
      const db = getDatabase();
      const uid = currentUserId(db);
      const mine = db.campaigns.filter((c) => c.createdBy === uid);
      return mine.map((c) => {
        const camp = { ...c, status: deriveCampaignStatus(c.startDate, c.endDate) };
        return toCampaignView(camp);
      });
    },

    async listAllCampaigns() {
      await delay();
      assertSystemAdminRole();
      const db = getDatabase();
      return db.campaigns.map((c) => {
        const camp: CampaignEntity = { ...c, status: deriveCampaignStatus(c.startDate, c.endDate) };
        return toCampaignView(camp);
      });
    },

    async submitCampaignPost(input: SubmitCampaignPostInput) {
      await delay();
      assertMemberRole();

      const cid = toEntityCampaignId(input.campaignId);
      if (Number.isNaN(cid)) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${input.campaignId}`);

      const db = getDatabase();
      const campaign = getCampaignById(db, cid);
      if (!campaign) throw new ApiError('NOT_FOUND', `Không tìm thấy campaign: ${input.campaignId}`);

      const uid = currentUserId(db);
      let sourceProduct: ProductEntity | undefined;
      if (input.fromApprovedPostId) {
        const spid = toProductId(input.fromApprovedPostId);
        sourceProduct = getProductById(db, spid);
        if (!sourceProduct) throw new ApiError('NOT_FOUND', `Không tìm thấy bài đã duyệt: ${input.fromApprovedPostId}`);
        if (sourceProduct.userId !== uid) throw new ApiError('FORBIDDEN', 'Chỉ được chọn bài Approved của chính bạn.');
        if (sourceProduct.status !== 'Approved') throw new ApiError('CONFLICT', 'Chỉ được chọn bài đã Approved.');
      }

      const content = input.content?.trim() ?? '';
      if (!sourceProduct && !content) {
        throw new ApiError('VALIDATION', 'Vui lòng chọn bài đã duyệt hoặc nhập nội dung bài mới.');
      }

      const resolvedContent = content || sourceProduct?.description || sourceProduct?.title || 'Campaign post mới';
      const createdProduct: ProductEntity = {
        productId: newProductId(),
        userId: uid,
        categoryId: sourceProduct?.categoryId ?? 5,
        title: sourceProduct?.title ?? resolvedContent.split(/[.!?\n]/)[0]?.slice(0, 64) ?? 'Campaign post mới',
        description: resolvedContent,
        image: sourceProduct?.image ?? input.imageName ?? 'POST',
        price: sourceProduct?.type === 'Sale' ? sourceProduct.price : 0,
        type: sourceProduct?.type ?? 'Donation',
        status: 'Pending Approval',
        campaignId: campaign.campaignId,
        contact: sourceProduct?.contact ?? 'an@student.school.edu',
        createdAt: todayIso(),
      };

      updateDatabase((nextDb) => {
        nextDb.products.unshift(createdProduct);
      });

      return postToView(getDatabase(), createdProduct);
    },
  },

  // -----------------------------------------------------------------------
  // categories
  // -----------------------------------------------------------------------
  categories: {
    async list() {
      await delay();
      assertSystemAdminRole();
      return categoriesToViews(getDatabase());
    },

    async listActive() {
      await delay();
      const db = getDatabase();
      return categoriesToViews(db).filter((c) => c.status === 'Active');
    },

    async create(name: string, desc: string) {
      await delay();
      assertSystemAdminRole();

      const normalizedName = name.trim();
      if (!normalizedName) throw new ApiError('VALIDATION', 'Vui lòng nhập tên danh mục.');

      const db = getDatabase();
      const exists = db.categories.some(
        (c) => c.categoryName.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (exists) throw new ApiError('CONFLICT', 'Tên danh mục đã tồn tại.');

      updateDatabase((nextDb) => {
        const nextId = Math.max(0, ...nextDb.categories.map((c) => c.categoryId)) + 1;
        nextDb.categories.push({
          categoryId: nextId,
          categoryName: normalizedName,
          description: desc,
          status: 'Active',
        });
      });

      const freshDb = getDatabase();
      const created = freshDb.categories.find((c) => c.categoryName === normalizedName);
      if (!created) throw new ApiError('NOT_FOUND', `Không tìm thấy danh mục vừa tạo: ${normalizedName}`);
      return toCategoryView(created, 0);
    },

    async update(name: string, input: Partial<Category>) {
      await delay();
      assertSystemAdminRole();

      let nextCategoryName = name;
      updateDatabase((nextDb) => {
        const category = nextDb.categories.find((c) => c.categoryName === name);
        if (!category) return;

        const requestedName = input.name?.trim();
        if (requestedName !== undefined) {
          if (!requestedName) throw new ApiError('VALIDATION', 'Vui lòng nhập tên danh mục.');
          const duplicated = nextDb.categories.some(
            (c) => c.categoryName !== name && c.categoryName.toLowerCase() === requestedName.toLowerCase(),
          );
          if (duplicated) throw new ApiError('CONFLICT', 'Tên danh mục đã tồn tại.');
          category.categoryName = requestedName;
          nextCategoryName = requestedName;
        }
        if (input.desc !== undefined) category.description = input.desc;
        if (input.status !== undefined) category.status = input.status;
      });

      const freshDb = getDatabase();
      const updated = freshDb.categories.find((c) => c.categoryName === nextCategoryName);
      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy danh mục: ${name}`);
      const count = freshDb.products.filter((p) => p.categoryId === updated.categoryId).length;
      return toCategoryView(updated, count);
    },

    async toggleActive(name: string) {
      await delay();
      assertSystemAdminRole();

      updateDatabase((nextDb) => {
        const category = nextDb.categories.find((c) => c.categoryName === name);
        if (!category) return;
        category.status = category.status === 'Active' ? 'Inactive' : 'Active';
      });

      const freshDb = getDatabase();
      const updated = freshDb.categories.find((c) => c.categoryName === name);
      if (!updated) throw new ApiError('NOT_FOUND', `Không tìm thấy danh mục: ${name}`);
      const count = freshDb.products.filter((p) => p.categoryId === updated.categoryId).length;
      return toCategoryView(updated, count);
    },

    async remove(name: string) {
      await delay();
      assertSystemAdminRole();

      const db = getDatabase();
      const category = db.categories.find((c) => c.categoryName === name);
      if (!category) throw new ApiError('NOT_FOUND', `Không tìm thấy danh mục: ${name}`);

      const inUse = db.products.some((p) => p.categoryId === category.categoryId);
      if (inUse) throw new ApiError('CONFLICT', 'Danh mục đang được sử dụng.');

      updateDatabase((nextDb) => {
        nextDb.categories = nextDb.categories.filter((c) => c.categoryName !== name);
      });
    },
  },

  // -----------------------------------------------------------------------
  // reports
  // -----------------------------------------------------------------------
  reports: {
    async getOverview() {
      await delay();
      assertSystemAdminRole();
      const db = getDatabase();

      // --- Post counts by status ---
      const totalPosts = db.products.length;
      const approvedPosts = db.products.filter((p) => p.status === 'Approved').length;
      const pendingApprovals = db.products.filter((p) => p.status === 'Pending Approval').length;
      const rejectedPosts = db.products.filter((p) => p.status === 'Rejected').length;
      const removedPosts = db.products.filter((p) => p.status === 'Removed').length;
      const completedPosts = db.products.filter((p) => p.status === 'Completed').length;

      // --- Transaction totals ---
      const totalTransactions = db.transactions.length;
      const totalTransactionVolume = db.transactions
        .filter((t) => t.transactionType === 'Sale')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalFeeRevenue = db.fees.reduce((sum, f) => sum + f.amount, 0);

      // --- Campaign counts ---
      const activeCampaigns = db.campaigns.filter(
        (c) => deriveCampaignStatus(c.startDate, c.endDate) === 'Active',
      ).length;
      const upcomingCampaigns = db.campaigns.filter(
        (c) => deriveCampaignStatus(c.startDate, c.endDate) === 'Upcoming',
      ).length;
      const endedCampaigns = db.campaigns.filter(
        (c) => deriveCampaignStatus(c.startDate, c.endDate) === 'Ended',
      ).length;

      // --- Chart data helpers ---
      const last6Months = getLast6MonthLabels();

      function countByMonth(entities: { createdAt: string }[]): ChartBar[] {
        return last6Months.map((m) => {
          const mo = m.split('-')[1];
          return {
            label: monthLabel(parseInt(mo, 10)),
            count: entities.filter((e) => e.createdAt.slice(0, 7) === m).length,
          };
        });
      }

      // Posts by status
      const postsByStatus: ChartBar[] = [
        { label: 'Approved', count: approvedPosts },
        { label: 'Pending', count: pendingApprovals },
        { label: 'Rejected', count: rejectedPosts },
        { label: 'Removed', count: removedPosts },
      ];

      // Posts by category
      const postsByCategory: ChartBar[] = db.categories.map((cat) => ({
        label: cat.categoryName,
        count: db.products.filter((p) => p.categoryId === cat.categoryId).length,
      }));

      // Posts by type
      const postsByType: ChartBar[] = [
        { label: 'Sale', count: db.products.filter((p) => p.type === 'Sale').length },
        { label: 'Exchange', count: db.products.filter((p) => p.type === 'Exchange').length },
        { label: 'Donation', count: db.products.filter((p) => p.type === 'Donation').length },
      ];

      // Posts by month
      const postsByMonth = countByMonth(db.products);

      // Transactions by month
      const transactionsByMonth = countByMonth(db.transactions);

      const overview: ReportOverview = {
        totalPosts,
        approvedPosts,
        pendingApprovals,
        rejectedPosts,
        removedPosts,
        completedPosts,
        totalTransactions,
        totalFeeRevenue,
        totalTransactionVolume,
        activeCampaigns,
        upcomingCampaigns,
        endedCampaigns,
        postsByStatus,
        postsByCategory,
        postsByType,
        postsByMonth,
        transactionsByMonth,
      };

      return overview;
    },

    async getPostStats() {
      await delay();
      assertSystemAdminRole();
      const db = getDatabase();

      const last6Months = getLast6MonthLabels();

      const postsByStatus: ChartBar[] = [
        { label: 'Approved', count: db.products.filter((p) => p.status === 'Approved').length },
        { label: 'Pending', count: db.products.filter((p) => p.status === 'Pending Approval').length },
        { label: 'Rejected', count: db.products.filter((p) => p.status === 'Rejected').length },
        { label: 'Removed', count: db.products.filter((p) => p.status === 'Removed').length },
        { label: 'Completed', count: db.products.filter((p) => p.status === 'Completed').length },
      ];

      const postsByCategory: ChartBar[] = db.categories.map((cat) => ({
        label: cat.categoryName,
        count: db.products.filter((p) => p.categoryId === cat.categoryId).length,
      }));

      const postsByType: ChartBar[] = [
        { label: 'Sale', count: db.products.filter((p) => p.type === 'Sale').length },
        { label: 'Exchange', count: db.products.filter((p) => p.type === 'Exchange').length },
        { label: 'Donation', count: db.products.filter((p) => p.type === 'Donation').length },
      ];

      const postsByMonth: ChartBar[] = last6Months.map((m) => {
        const mo = m.split('-')[1];
        return {
          label: monthLabel(parseInt(mo, 10)),
          count: db.products.filter((p) => p.createdAt.slice(0, 7) === m).length,
        };
      });

      // Posts by campaign
      const postsByCampaign: ChartBar[] = db.campaigns.map((camp) => ({
        label: camp.title,
        count: db.products.filter((p) => p.campaignId === camp.campaignId).length,
      }));

      // Post detail rows
      const postDetailRows: PostDetailRow[] = db.products.map((product) => {
        const user = getUserById(db, product.userId);
        const category = getCategoryById(db, product.categoryId);
        const campaign = product.campaignId ? getCampaignById(db, product.campaignId) : undefined;
        return {
          id: toPostId(product.productId),
          title: product.title,
          owner: user?.fullName ?? 'N/A',
          category: category?.categoryName ?? 'N/A',
          type: product.type,
          status: product.status,
          date: product.createdAt,
          campaignName: campaign?.title,
        };
      });

      const result: PostStatsDetail = {
        postsByStatus,
        postsByCategory,
        postsByType,
        postsByMonth,
        postsByCampaign,
        postDetailRows,
      };

      return result;
    },

    async getTransactionStats() {
      await delay();
      assertSystemAdminRole();
      const db = getDatabase();

      const last6Months = getLast6MonthLabels();

      const totalTransactions = db.transactions.length;
      const saleTransactions = db.transactions.filter((t) => t.transactionType === 'Sale');
      const totalVolume = saleTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalFees = db.fees.reduce((sum, f) => sum + f.amount, 0);
      const averageFeePct = totalVolume > 0 ? Math.round((totalFees / totalVolume) * 10000) / 100 : 0;

      const transactionsByType: TransactionByType[] = [
        {
          type: 'Sale',
          count: db.transactions.filter((t) => t.transactionType === 'Sale').length,
          volume: saleTransactions.reduce((sum, t) => sum + t.amount, 0),
        },
        {
          type: 'Exchange',
          count: db.transactions.filter((t) => t.transactionType === 'Exchange').length,
          volume: 0,
        },
        {
          type: 'Donation',
          count: db.transactions.filter((t) => t.transactionType === 'Donation').length,
          volume: 0,
        },
      ];

      const transactionsByMonth: ChartBar[] = last6Months.map((m) => {
        const mo = m.split('-')[1];
        return {
          label: monthLabel(parseInt(mo, 10)),
          count: db.transactions.filter((t) => t.createdAt.slice(0, 7) === m).length,
        };
      });

      const feeDetails: FeeDetailRow[] = db.fees.map((fee) => {
        const tx = db.transactions.find((t) => t.transactionId === fee.transactionId);
        return {
          transactionId: fee.transactionId,
          amount: tx?.amount ?? 0,
          fee: fee.amount,
          type: tx?.transactionType ?? 'Sale',
          date: fee.createdAt,
          note: fee.note,
        };
      });

      const result: TransactionStats = {
        totalTransactions,
        totalVolume,
        totalFees,
        averageFeePct,
        transactionsByType,
        transactionsByMonth,
        feeDetails,
      };

      return result;
    },

    async getCampaignStats() {
      await delay();
      assertSystemAdminRole();
      const db = getDatabase();

      const campaigns: CampaignPerformanceRow[] = db.campaigns.map((camp) => {
        const campProducts = db.products.filter((p) => p.campaignId === camp.campaignId);
        const totalPosts = campProducts.length;
        const approvedPosts = campProducts.filter((p) => p.status === 'Approved').length;
        const pendingPosts = campProducts.filter((p) => p.status === 'Pending Approval').length;

        // Find transactions linked to this campaign's products
        const campProductIds = new Set(campProducts.map((p) => p.productId));
        const campTransactions = db.transactions.filter((t) => campProductIds.has(t.productId));
        const completedTransactions = campTransactions.length;
        const totalVolume = campTransactions
          .filter((t) => t.transactionType === 'Sale')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalFees = campTransactions.reduce((sum, t) => sum + t.fee, 0);

        return {
          campaignId: toCampaignId(camp.campaignId),
          campaignName: camp.title,
          organizer: camp.organizer,
          type: camp.type,
          status: deriveCampaignStatus(camp.startDate, camp.endDate),
          startDate: camp.startDate,
          endDate: camp.endDate,
          totalPosts,
          approvedPosts,
          pendingPosts,
          completedTransactions,
          totalVolume,
          totalFees,
        };
      });

      // Sort by startDate descending
      campaigns.sort((a, b) => b.startDate.localeCompare(a.startDate));

      const result: CampaignStatsReport = { campaigns };

      return result;
    },
  },
};

// ============================================================================
// Conditional export — choose real API or mock based on env var.
// ============================================================================

import { httpApi } from './httpApi';

function resolveApiClient(): ApiClient {
  const mode = typeof window !== 'undefined'
    ? (window as any).__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_API_MODE || process.env.NEXT_PUBLIC_API_MODE
    : process.env.NEXT_PUBLIC_API_MODE;
  console.log('[resolveApiClient] NEXT_PUBLIC_API_MODE =', process.env.NEXT_PUBLIC_API_MODE, '→ using', process.env.NEXT_PUBLIC_API_MODE === 'http' ? 'httpApi' : 'mockApiImpl');
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_MODE === 'http') {
    return httpApi;
  }
  if (process.env.NEXT_PUBLIC_API_MODE === 'http') {
    return httpApi;
  }
  return mockApiImpl;
}

const resolvedApi: ApiClient = resolveApiClient();

// Re-export the resolved API client under the same name so all existing imports
// work without changes.
export { resolvedApi as mockApi };
