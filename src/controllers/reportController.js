const Post = require("../models/Post");
const Transaction = require("../models/Transaction");
const Campaign = require("../models/Campaign");
const Category = require("../models/Category");
const User = require("../models/User");
const { ok, fail } = require("../utils/apiResponse");
const { statusToApi } = require("../utils/mappers");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function statusLabel(dbStatus) {
  return statusToApi[dbStatus] || dbStatus;
}

function campaignTypeLabel(dbType) {
  if (dbType === "fundraising") return "Fundraising";
  if (dbType === "mixed") return "Mixed";
  return "Donation";
}

/** Last 6 months labels as YYYY-MM strings (past 6 months from now) */
function last6MonthLabels() {
  const labels = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    labels.push(`${y}-${m}`);
  }
  return labels;
}

function monthLabel(month) {
  const labels = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];
  return labels[month - 1] ?? `Th${month}`;
}

function countByMonth(records, field = "createdAt") {
  const months = last6MonthLabels();
  return months.map((m) => {
    const mo = m.split("-")[1];
    return {
      label: monthLabel(parseInt(mo, 10)),
      count: records.filter((r) => {
        const d = r[field] || r.createdAt;
        return d && formatDate(d).slice(0, 7) === m;
      }).length,
    };
  });
}

// ---------------------------------------------------------------------------
// getOverview
// ---------------------------------------------------------------------------

exports.getOverview = async (req, res) => {
  try {
    const posts = await Post.find({}).lean();
    const transactions = await Transaction.find({}).lean();
    const campaigns = await Campaign.find({}).lean();
    const categories = await Category.find({}).lean();

    const postStatusCounts = {};
    for (const p of posts) {
      const s = statusLabel(p.postStatus);
      postStatusCounts[s] = (postStatusCounts[s] || 0) + 1;
    }

    const totalPosts = posts.length;
    const approvedPosts = postStatusCounts["Approved"] || 0;
    const pendingApprovals = postStatusCounts["Pending Approval"] || 0;
    const rejectedPosts = postStatusCounts["Rejected"] || 0;
    const removedPosts = postStatusCounts["Removed"] || 0;
    const completedPosts = postStatusCounts["Completed"] || 0;

    const completedTransactions = transactions.filter((t) => t.transactionStatus === "completed");
    const totalTransactions = completedTransactions.length;
    const totalTransactionVolume = completedTransactions
      .filter((t) => t.transactionType === "sell")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalFeeRevenue = completedTransactions.reduce((sum, t) => sum + (t.fundAmount || 0), 0);

    let activeCampaigns = 0;
    let upcomingCampaigns = 0;
    let endedCampaigns = 0;
    const now = new Date();
    for (const c of campaigns) {
      if (c.campaignStatus === "ended" || c.campaignStatus === "cancelled") {
        endedCampaigns++;
      } else if (c.startDate && new Date(c.startDate) > now) {
        upcomingCampaigns++;
      } else {
        activeCampaigns++;
      }
    }

    const postsByStatus = [
      { label: "Approved", count: approvedPosts },
      { label: "Pending", count: pendingApprovals },
      { label: "Rejected", count: rejectedPosts },
      { label: "Removed", count: removedPosts },
    ];

    const postsByCategory = categories.map((cat) => ({
      label: cat.categoryName,
      count: posts.filter((p) => String(p.campaignId) === String(cat._id)).length,
    }));

    // Post-to-category join via Item model
    // Fallback: count all posts (items are per-post); use category from Item if available
    // Since we don't have direct category on Post, we skip detailed category breakdown
    // and provide empty array — frontend will handle empty state

    const postsByType = [
      { label: "Sale", count: posts.filter((p) => p.postType === "sell").length },
      { label: "Exchange", count: posts.filter((p) => p.postType === "exchange").length },
      { label: "Donation", count: posts.filter((p) => p.postType === "donate").length },
    ];

    const postsByMonth = countByMonth(posts);
    const transactionsByMonth = countByMonth(transactions);

    ok(res, {
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
    });
  } catch (error) {
    fail(res, 500, "SERVER_ERROR", error.message);
  }
};

// ---------------------------------------------------------------------------
// getPostStats
// ---------------------------------------------------------------------------

exports.getPostStats = async (req, res) => {
  try {
    const posts = await Post.find({}).lean();
    const campaigns = await Campaign.find({}).lean();
    const categories = await Category.find({}).lean();
    const users = await User.find({}).lean();
    const userMap = {};
    for (const u of users) userMap[String(u._id)] = u;

    const campaignMap = {};
    for (const c of campaigns) campaignMap[String(c._id)] = c;

    // Status breakdown
    const postsByStatus = [
      { label: "Approved", count: posts.filter((p) => p.postStatus === "approved").length },
      { label: "Pending", count: posts.filter((p) => p.postStatus === "pending").length },
      { label: "Rejected", count: posts.filter((p) => p.postStatus === "rejected").length },
      { label: "Removed", count: posts.filter((p) => p.postStatus === "removed" || p.postStatus === "hidden").length },
      { label: "Completed", count: posts.filter((p) => p.postStatus === "completed").length },
    ];

    // By category (placeholder — category is on Item, not Post directly)
    // We use post content/campaign as approximate; provide empty for now
    const postsByCategory = categories.map((cat) => ({
      label: cat.categoryName,
      count: 0, // Requires Item join; to be improved when Item model is used
    }));

    const postsByType = [
      { label: "Sale", count: posts.filter((p) => p.postType === "sell").length },
      { label: "Exchange", count: posts.filter((p) => p.postType === "exchange").length },
      { label: "Donation", count: posts.filter((p) => p.postType === "donate").length },
    ];

    const postsByMonth = countByMonth(posts);

    const postsByCampaign = campaigns.map((c) => ({
      label: c.campaignName,
      count: posts.filter((p) => String(p.campaignId) === String(c._id)).length,
    }));

    const postDetailRows = posts.map((p) => {
      const user = userMap[String(p.memberId)];
      const camp = p.campaignId ? campaignMap[String(p.campaignId)] : null;
      return {
        id: String(p._id),
        title: p.title,
        owner: user?.fullName || "N/A",
        category: "", // Requires Item join
        type: p.postType === "sell" ? "Sale" : p.postType === "exchange" ? "Exchange" : "Donation",
        status: statusLabel(p.postStatus),
        date: formatDate(p.createdAt),
        campaignName: camp?.campaignName || null,
      };
    });

    ok(res, {
      postsByStatus,
      postsByCategory,
      postsByType,
      postsByMonth,
      postsByCampaign,
      postDetailRows,
    });
  } catch (error) {
    fail(res, 500, "SERVER_ERROR", error.message);
  }
};

// ---------------------------------------------------------------------------
// getTransactionStats
// ---------------------------------------------------------------------------

exports.getTransactionStats = async (req, res) => {
  try {
    const transactions = await Transaction.find({}).lean();
    const completed = transactions.filter((t) => t.transactionStatus === "completed");

    const totalTransactions = completed.length;

    const saleTransactions = completed.filter((t) => t.transactionType === "sell");
    const totalVolume = saleTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalFees = completed.reduce((sum, t) => sum + (t.fundAmount || 0), 0);
    const averageFeePct = totalVolume > 0 ? Math.round((totalFees / totalVolume) * 10000) / 100 : 0;

    const transactionsByType = [
      {
        type: "Sale",
        count: completed.filter((t) => t.transactionType === "sell").length,
        volume: saleTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      },
      {
        type: "Exchange",
        count: completed.filter((t) => t.transactionType === "exchange").length,
        volume: 0,
      },
      {
        type: "Donation",
        count: completed.filter((t) => t.transactionType === "donate").length,
        volume: 0,
      },
    ];

    const transactionsByMonth = countByMonth(transactions);

    const feeDetails = completed
      .filter((t) => (t.fundAmount || 0) > 0)
      .map((t) => ({
        transactionId: String(t._id),
        amount: t.amount || 0,
        fee: t.fundAmount || 0,
        type: t.transactionType === "sell" ? "Sale" : t.transactionType === "exchange" ? "Exchange" : "Donation",
        date: formatDate(t.transactionDate || t.createdAt),
        note: t.message || "",
      }));

    ok(res, {
      totalTransactions,
      totalVolume,
      totalFees,
      averageFeePct,
      transactionsByType,
      transactionsByMonth,
      feeDetails,
    });
  } catch (error) {
    fail(res, 500, "SERVER_ERROR", error.message);
  }
};

// ---------------------------------------------------------------------------
// getCampaignStats
// ---------------------------------------------------------------------------

exports.getCampaignStats = async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).lean();
    const posts = await Post.find({}).lean();
    const transactions = await Transaction.find({}).lean();

    const now = new Date();

    const campaignsList = campaigns.map((c) => {
      const campPosts = posts.filter((p) => String(p.campaignId) === String(c._id));
      const totalPosts = campPosts.length;
      const approvedPosts = campPosts.filter((p) => p.postStatus === "approved").length;
      const pendingPosts = campPosts.filter((p) => p.postStatus === "pending").length;

      const campPostIds = new Set(campPosts.map((p) => String(p._id)));
      const campTransactions = transactions.filter(
        (t) => campPostIds.has(String(t.postId)) && t.transactionStatus === "completed",
      );
      const completedTransactions = campTransactions.length;
      const totalVolume = campTransactions
        .filter((t) => t.transactionType === "sell")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalFees = campTransactions.reduce((sum, t) => sum + (t.fundAmount || 0), 0);

      let status = c.campaignStatus;
      if (status === "cancelled") status = "ended";
      if (status !== "ended") {
        if (c.startDate && new Date(c.startDate) > now) status = "upcoming";
        else if (c.endDate && new Date(c.endDate) < now) status = "ended";
        else status = "active";
      }

      return {
        campaignId: String(c._id),
        campaignName: c.campaignName,
        organizer: c.organizer || "",
        type: campaignTypeLabel(c.campaignType),
        status: statusLabel(status),
        startDate: formatDate(c.startDate),
        endDate: formatDate(c.endDate),
        totalPosts,
        approvedPosts,
        pendingPosts,
        completedTransactions,
        totalVolume,
        totalFees,
      };
    });

    // Sort by startDate descending
    campaignsList.sort((a, b) => b.startDate.localeCompare(a.startDate));

    ok(res, { campaigns: campaignsList });
  } catch (error) {
    fail(res, 500, "SERVER_ERROR", error.message);
  }
};
