const Campaign = require("../models/Campaign");
const CampaignItem = require("../models/CampaignItem");
const Post = require("../models/Post");
const Item = require("../models/Item");
const Category = require("../models/Category");
const { ok, fail } = require("../utils/apiResponse");
const { mapCampaign } = require("../utils/mappers");

exports.getCampaigns = async (req, res) => {
  const campaigns = await Campaign.find().populate("organizerId", "fullName organizationName").sort({ createdAt: -1 });
  ok(res, campaigns.map(mapCampaign));
};

exports.getCampaignById = async (req, res) => {
  const campaign = await Campaign.findById(req.params.campaignId).populate("organizerId", "fullName organizationName");
  if (!campaign) return fail(res, 404, "NOT_FOUND", "Campaign not found");
  ok(res, mapCampaign(campaign));
};

exports.getStats = async (req, res) => {
  const campaignId = req.params.campaignId;
  const total = await CampaignItem.countDocuments({ campaignId });
  const approved = await CampaignItem.countDocuments({ campaignId, status: "approved" });
  const pending = await CampaignItem.countDocuments({ campaignId, status: "pending" });
  ok(res, { total, approved, pending });
};

exports.createCampaign = async (req, res) => {
  try {
    const body = req.body;
    const name = body.name || body.campaignName;
    const type = body.type || body.campaignType || "Donation";
    const start = body.start || body.startDate;
    const end = body.end || body.endDate;

    if (!name || !start || !end) return fail(res, 400, "VALIDATION_ERROR", "name, start, end are required");
    if (new Date(end) <= new Date(start)) return fail(res, 400, "VALIDATION_ERROR", "end must be greater than start");

    const campaign = await Campaign.create({
      organizerId: req.user._id,
      campaignName: name,
      organizer: body.organizer || req.user.organizationName || req.user.fullName,
      description: body.description || "",
      campaignType: String(type).toLowerCase(),
      isFree: body.is_free ?? body.isFree ?? true,
      cover: body.cover || "STUDY",
      startDate: start,
      endDate: end,
      targetFund: body.targetFund || 0,
      campaignStatus: "upcoming"
    });

    ok(res, mapCampaign(campaign), 201);
  } catch (error) {
    fail(res, 400, "BAD_REQUEST", error.message);
  }
};

exports.updateCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.campaignId);
  if (!campaign) return fail(res, 404, "NOT_FOUND", "Campaign not found");
  if (req.user.role === "activity_admin" && String(campaign.organizerId) !== String(req.user._id)) return fail(res, 403, "FORBIDDEN", "Forbidden");

  const b = req.body;
  if (b.name || b.campaignName) campaign.campaignName = b.name || b.campaignName;
  if (b.description !== undefined) campaign.description = b.description;
  if (b.organizer !== undefined) campaign.organizer = b.organizer;
  if (b.type || b.campaignType) campaign.campaignType = String(b.type || b.campaignType).toLowerCase();
  if (b.is_free !== undefined || b.isFree !== undefined) campaign.isFree = b.is_free ?? b.isFree;
  if (b.start || b.startDate) campaign.startDate = b.start || b.startDate;
  if (b.end || b.endDate) campaign.endDate = b.end || b.endDate;
  if (b.cover) campaign.cover = b.cover;

  await campaign.save();
  ok(res, mapCampaign(campaign));
};

exports.endCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.campaignId);
  if (!campaign) return fail(res, 404, "NOT_FOUND", "Campaign not found");
  if (req.user.role === "activity_admin" && String(campaign.organizerId) !== String(req.user._id)) return fail(res, 403, "FORBIDDEN", "Forbidden");

  campaign.campaignStatus = "ended";
  await campaign.save();
  ok(res, { id: String(campaign._id), status: "Ended" });
};

exports.myActivityCampaigns = async (req, res) => {
  const campaigns = await Campaign.find({ organizerId: req.user._id }).sort({ createdAt: -1 });
  ok(res, campaigns.map(mapCampaign));
};

exports.submitToCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.campaignId);
  if (!campaign) return fail(res, 404, "NOT_FOUND", "Campaign not found");

  if (!req.body.fromApprovedPostId && !req.body.content) {
    return fail(res, 400, "VALIDATION_ERROR", "fromApprovedPostId or content is required");
  }

  let post, item;

  if (req.body.fromApprovedPostId) {
    const oldPost = await Post.findById(req.body.fromApprovedPostId);
    if (!oldPost || oldPost.postStatus !== "approved") return fail(res, 400, "INVALID_STATE", "Source post must be approved");
    const oldItem = await Item.findOne({ postId: oldPost._id });

    post = await Post.create({
      memberId: req.user._id,
      title: oldPost.title,
      description: oldPost.description,
      content: oldPost.content,
      contact: oldPost.contact,
      imageName: oldPost.imageName,
      postType: oldPost.postType,
      campaignId: campaign._id,
      postStatus: "pending"
    });
    item = await Item.create({
      postId: post._id,
      categoryId: oldItem.categoryId,
      itemName: oldItem.itemName,
      itemDescription: oldItem.itemDescription,
      price: oldItem.price,
      imageUrl: oldItem.imageUrl
    });
  } else {
    const cat = await Category.findOne({ status: "active" });
    if (!cat) return fail(res, 400, "VALIDATION_ERROR", "No active category exists");
    const rawImageName = req.body.imageName || "";
    const isBase64 = rawImageName.startsWith("data:") || rawImageName.length > 200;
    const fakeImageName = isBase64 ? "IMAGE" : (rawImageName || "");
    post = await Post.create({
      memberId: req.user._id,
      title: req.body.content.slice(0, 60),
      description: req.body.content,
      content: req.body.content,
      imageName: fakeImageName,
      contact: req.user.email,
      postType: "donate",
      campaignId: campaign._id,
      postStatus: "pending"
    });
    item = await Item.create({
      postId: post._id,
      categoryId: cat._id,
      itemName: post.title,
      itemDescription: req.body.content,
      price: 0,
      imageUrl: fakeImageName ? [fakeImageName] : []
    });
  }

  await CampaignItem.create({ campaignId: campaign._id, itemId: item._id, memberId: req.user._id, note: req.body.note || "", status: "pending" });
  const { mapPost } = require("../utils/mappers");
  const populated = await Post.findById(post._id).populate("memberId", "fullName email role userType").populate("campaignId", "campaignName");
  const populatedItem = await Item.findById(item._id).populate("categoryId", "categoryName");
  ok(res, await mapPost(populated, populatedItem, populatedItem.categoryId, populated.campaignId), 201);
};
