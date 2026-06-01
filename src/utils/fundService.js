const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Fund = require("../models/Fund");

const ACTIVITY_ADMIN_USER_TYPES = ["school_staff", "club", "student_union"];

function isActivityAdminOrg(user) {
  return user?.role === "activity_admin" && ACTIVITY_ADMIN_USER_TYPES.includes(user?.userType);
}

async function getOrCreateFund(userId) {
  let fund = await Fund.findOne({ userId });
  if (!fund) fund = await Fund.create({ userId, currentBalance: 0 });
  return fund;
}

async function addToFund(userId, amount) {
  if (!userId || !amount || amount <= 0) return null;
  const fund = await getOrCreateFund(userId);
  fund.currentBalance += amount;
  await fund.save();
  return fund;
}

async function resolveFundRecipient(post) {
  if (post?.campaignId) {
    const campaign = await Campaign.findById(post.campaignId).populate("organizerId");
    if (campaign?.organizerId && isActivityAdminOrg(campaign.organizerId)) {
      return campaign.organizerId._id;
    }
  }

  const schoolAdmin = await User.findOne({
    role: "activity_admin",
    userType: "school_staff",
    accountStatus: "active"
  });
  return schoolAdmin?._id || null;
}

function calculateFundAmount(tx, campaign) {
  if (tx.transactionType !== "sell") return 0;
  const amount = tx.amount || 0;
  if (amount <= 0) return 0;
  const rate = campaign?.commissionRate ?? 0.05;
  return Math.round(amount * rate);
}

module.exports = {
  ACTIVITY_ADMIN_USER_TYPES,
  isActivityAdminOrg,
  getOrCreateFund,
  addToFund,
  resolveFundRecipient,
  calculateFundAmount
};
