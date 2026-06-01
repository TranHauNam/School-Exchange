// ============================================================================
// report.ts — Report view-model types for the System Admin "Báo cáo" page.
//
// These types are derived from raw entity data (products, transactions, fees,
// campaigns) via the ApiClient.reports.* methods. They are NOT stored entities.
// ============================================================================

import type { CampaignStatus } from './campaign';

// ---------------------------------------------------------------------------
// Tab 1: Tổng quan (Overview) — KPI summary + chart data
// ---------------------------------------------------------------------------

export interface ChartBar {
  label: string;
  count: number;
}

export interface ReportOverview {
  // Post counts by status
  totalPosts: number;
  approvedPosts: number;
  pendingApprovals: number;
  rejectedPosts: number;
  removedPosts: number;
  completedPosts: number;

  // Transaction totals
  totalTransactions: number;
  totalFeeRevenue: number; // sum of all FeeEntity.amount
  totalTransactionVolume: number; // sum of TransactionEntity.amount (Sale only)

  // Campaign counts by derived status
  activeCampaigns: number;
  upcomingCampaigns: number;
  endedCampaigns: number;

  // Chart data
  postsByStatus: ChartBar[];
  postsByCategory: ChartBar[];
  postsByType: ChartBar[];
  postsByMonth: ChartBar[]; // last 6 months
  transactionsByMonth: ChartBar[];
}

// ---------------------------------------------------------------------------
// Tab 2: Bài đăng (Posts) — detailed post statistics
// ---------------------------------------------------------------------------

export interface PostDetailRow {
  id: string;
  title: string;
  owner: string;
  category: string;
  type: string;
  status: string;
  date: string;
  campaignName?: string;
}

export interface PostStatsDetail {
  postsByStatus: ChartBar[];
  postsByCategory: ChartBar[];
  postsByType: ChartBar[];
  postsByMonth: ChartBar[];
  postsByCampaign: ChartBar[];
  postDetailRows: PostDetailRow[];
}

// ---------------------------------------------------------------------------
// Tab 3: Giao dịch (Transactions) — financial reports
// ---------------------------------------------------------------------------

export interface FeeDetailRow {
  transactionId: number;
  amount: number;
  fee: number;
  type: string;
  date: string;
  note: string;
}

export interface TransactionByType {
  type: string;
  count: number;
  volume: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalVolume: number; // sum of all Sale transaction amounts
  totalFees: number; // sum of all FeeEntity.amount
  averageFeePct: number; // totalFees / totalVolume * 100 (0 if no volume)
  transactionsByType: TransactionByType[];
  transactionsByMonth: ChartBar[];
  feeDetails: FeeDetailRow[];
}

// ---------------------------------------------------------------------------
// Tab 4: Chiến dịch (Campaigns) — campaign performance comparison
// ---------------------------------------------------------------------------

export interface CampaignPerformanceRow {
  campaignId: string;
  campaignName: string;
  organizer: string;
  type: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  completedTransactions: number;
  totalVolume: number;
  totalFees: number;
}

export interface CampaignStatsReport {
  campaigns: CampaignPerformanceRow[];
}
