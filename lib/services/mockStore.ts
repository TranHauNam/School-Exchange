// ============================================================================
// mockStore.ts — Entity-based in-memory state store backed by localStorage.
//
// ARCHITECTURE RULE (from design.md): components/pages MUST NEVER import this
// module directly. Only `lib/services/mockApi.ts` (the single seam between UI
// and the data source) is allowed to import `mockStore`. When the Java REST API
// is ready, this store is replaced by HTTP calls without touching the UI.
//
// This module is framework-agnostic (no React) and SSR-safe: every access to
// `window`/`localStorage` is guarded so it can run during Next.js server render.
//
// Data shape mirrors the DOCX database schema via entity types. The previous
// MockState (UI types) is replaced by MockDatabase + SessionState.
// ============================================================================

import { createSeedDatabase } from '@/lib/entities/seed';
import type { RoleEntity } from '@/lib/entities/role';
import type { UserEntity } from '@/lib/entities/user';
import type { CategoryEntity } from '@/lib/entities/category';
import type { ProductEntity } from '@/lib/entities/product';
import type { CampaignEntity } from '@/lib/entities/campaign';
import type { RequestEntity } from '@/lib/entities/request';
import type { TransactionEntity } from '@/lib/entities/transaction';
import type { FeeEntity } from '@/lib/entities/fee';
import type { RoleKey } from '@/lib/types/role';

// ============================================================================
// Types
// ============================================================================

/**
 * In-memory representation of the DOCX database.
 * Mirrors tables: Roles, Users, Categories, Products, Campaigns,
 * Requests, Transactions, Fees.
 */
export interface MockDatabase {
  roles: RoleEntity[];
  users: UserEntity[];
  categories: CategoryEntity[];
  products: ProductEntity[];
  campaigns: CampaignEntity[];
  requests: RequestEntity[];
  transactions: TransactionEntity[];
  fees: FeeEntity[];
}

/** Current login session (mock — no real auth). */
interface SessionState {
  roleKey: RoleKey;
}

/** Root shape persisted to localStorage. */
interface PersistedState {
  database: MockDatabase;
  session: SessionState;
}

// ============================================================================
// Constants
// ============================================================================

/** localStorage key (mirrors SIE_KEY in js/app.js). */
export const STORE_KEY = 'schoolItemExchangeStateV2';

/** Legacy key kept for cleanup on reset. */
const LEGACY_STORE_KEY = 'schoolItemExchangeStateV1';

/** Default role on a fresh seed. */
const DEFAULT_ROLE_KEY: RoleKey = 'member';

// ============================================================================
// Seed / clone
// ============================================================================

/**
 * Deep clone the seed database.
 * Uses structuredClone when available, falling back to JSON round-trip.
 */
export function cloneSeedDatabase(): MockDatabase {
  return createSeedDatabase();
}

// ============================================================================
// Persistence (SSR-safe)
// ============================================================================

/**
 * Load persisted state, merging over a fresh seed so new seed fields appear.
 * SSR-safe: returns a fresh seed on the server.
 *
 * If the stored data is from the old MockState format (pre-entity refactor),
 * the merge falls back to seed since `parsed.database` will be undefined.
 */
function loadPersistedState(): PersistedState {
  if (typeof window === 'undefined') {
    return { database: createSeedDatabase(), session: { roleKey: DEFAULT_ROLE_KEY } };
  }

  const raw =
    window.localStorage.getItem(STORE_KEY) ??
    window.localStorage.getItem(LEGACY_STORE_KEY);

  if (!raw) {
    const fresh: PersistedState = {
      database: createSeedDatabase(),
      session: { roleKey: DEFAULT_ROLE_KEY },
    };
    window.localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      database: { ...createSeedDatabase(), ...parsed.database },
      session: { roleKey: DEFAULT_ROLE_KEY, ...parsed.session },
    };
  } catch {
    return { database: createSeedDatabase(), session: { roleKey: DEFAULT_ROLE_KEY } };
  }
}

// ============================================================================
// Database accessors
// ============================================================================

/**
 * Get the current database, ensuring it is persisted.
 * Replaces the old `getState()`.
 */
export function getDatabase(): MockDatabase {
  const persisted = loadPersistedState();
  return persisted.database;
}

/**
 * Apply a mutation to the current database and persist the result.
 * Loads fresh state, runs the mutator on the database portion, saves.
 * Replaces the old `updateState()`.
 */
export function updateDatabase(mutator: (db: MockDatabase) => void): MockDatabase {
  const persisted = loadPersistedState();
  mutator(persisted.database);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(persisted));
  }
  return persisted.database;
}

// ============================================================================
// Session accessors
// ============================================================================

/** Read the current role from session. */
export function getRoleKey(): RoleKey {
  return loadPersistedState().session.roleKey;
}

/** Update the current role in session and persist. */
export function setRoleKey(roleKey: RoleKey): void {
  const persisted = loadPersistedState();
  persisted.session.roleKey = roleKey;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(persisted));
  }
}

// ============================================================================
// Reset
// ============================================================================

/**
 * Reset the demo: remove stored state (and the legacy key) so the next load
 * reseeds from the original seed data.
 */
export function resetDemo(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STORE_KEY);
  window.localStorage.removeItem(LEGACY_STORE_KEY);
}

// ============================================================================
// Lookup helpers (used by mockApi for entity joins)
// ============================================================================

export function getUserById(db: MockDatabase, userId: number): UserEntity | undefined {
  return db.users.find((u) => u.userId === userId);
}

export function getCategoryById(db: MockDatabase, categoryId: number): CategoryEntity | undefined {
  return db.categories.find((c) => c.categoryId === categoryId);
}

export function getProductById(db: MockDatabase, productId: number): ProductEntity | undefined {
  return db.products.find((p) => p.productId === productId);
}

export function getCampaignById(db: MockDatabase, campaignId: number): CampaignEntity | undefined {
  return db.campaigns.find((c) => c.campaignId === campaignId);
}

export function getRequestById(db: MockDatabase, requestId: number): RequestEntity | undefined {
  return db.requests.find((r) => r.requestId === requestId);
}

export function getUserByName(db: MockDatabase, name: string): UserEntity | undefined {
  return db.users.find((u) => u.fullName === name);
}

export function getCategoryByName(db: MockDatabase, name: string): CategoryEntity | undefined {
  return db.categories.find((c) => c.categoryName === name);
}

export function getRoleByKey(db: MockDatabase, roleKey: RoleKey): RoleEntity | undefined {
  return db.roles.find((r) => r.roleKey === roleKey);
}

/**
 * Get the user entity corresponding to the currently active roleKey.
 * Used for ownership checks and display name resolution.
 */
export function getCurrentUser(db: MockDatabase): UserEntity | undefined {
  const roleKey = getRoleKey();
  const role = db.roles.find((r) => r.roleKey === roleKey);
  if (!role) return undefined;
  return db.users.find((u) => u.roleId === role.roleId);
}
