const Campaign = require("../models/Campaign");
const Post = require("../models/Post");
const Item = require("../models/Item");
const CampaignItem = require("../models/CampaignItem");
const { ok, fail } = require("../utils/apiResponse");
const { mapCampaign } = require("../utils/mappers");
const { getOrCreateFund, isActivityAdminOrg } = require("../utils/fundService");
const postController = require("./postController");

exports.getMyFund = async (req, res) => {
  if (!isActivityAdminOrg(req.user)) {
    return fail(res, 403, "FORBIDDEN", "Chỉ quản trị hoạt động Nhà trường/CLB/Hội SV mới có quỹ chung");
  }
  const fund = await getOrCreateFund(req.user._id);
  ok(res, { userId: String(fund.userId), currentBalance: fund.currentBalance });
};

exports.getMyCampaigns = async (req, res) => {
  const campaigns = await Campaign.find({ organizerId: req.user._id }).sort({ createdAt: -1 });
  ok(res, campaigns.map(mapCampaign));
};

exports.endMyCampaign = async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.campaignId, organizerId: req.user._id });
  if (!campaign) return fail(res, 404, "NOT_FOUND", "Campaign not found");
  campaign.campaignStatus = "ended";
  await campaign.save();
  ok(res, { id: String(campaign._id), status: "Ended" });
};

async function ownCampaignPost(req) {
  const post = await Post.findById(req.params.postId);
  if (!post || !post.campaignId) return null;
  const campaign = await Campaign.findOne({ _id: post.campaignId, organizerId: req.user._id });
  return campaign ? post : null;
}

exports.getCampaignPosts = async (req, res) => {
  const campaigns = await Campaign.find({ organizerId: req.user._id }).select("_id");
  const ids = campaigns.map(c => c._id);
  const list = await require("./postController").getAllPostsForFilter?.({ campaignId: { $in: ids } });
  // fallback: frontend may use /api/posts and filter itself, per contract
  ok(res, []);
};

exports.approveCampaignPost = async (req, res) => {
  const post = await ownCampaignPost(req);
  if (!post) return fail(res, 404, "NOT_FOUND", "Campaign post not found");
  post.postStatus = "approved";
  post.moderatorId = req.user._id;
  post.rejectReason = null;
  await post.save();

  const item = await Item.findOne({ postId: post._id });
  if (item) await CampaignItem.updateMany({ itemId: item._id, campaignId: post.campaignId }, { status: "approved" });

  ok(res, { id: String(post._id), status: "Approved" });
};

exports.rejectCampaignPost = async (req, res) => {
  const { reason } = req.body;
  if (!reason) return fail(res, 400, "VALIDATION_ERROR", "reason is required");

  const post = await ownCampaignPost(req);
  if (!post) return fail(res, 404, "NOT_FOUND", "Campaign post not found");

  post.postStatus = "rejected";
  post.moderatorId = req.user._id;
  post.rejectReason = reason;
  await post.save();

  const item = await Item.findOne({ postId: post._id });
  if (item) await CampaignItem.updateMany({ itemId: item._id, campaignId: post.campaignId }, { status: "rejected" });

  ok(res, { id: String(post._id), status: "Rejected", reason });
};
