const Post = require("../models/Post");
const Item = require("../models/Item");
const Category = require("../models/Category");
const Campaign = require("../models/Campaign");
const CampaignItem = require("../models/CampaignItem");
const Transaction = require("../models/Transaction");
const { ok, fail } = require("../utils/apiResponse");
const { mapPost, apiToType, apiToStatus } = require("../utils/mappers");

async function hydratePosts(filter = {}, query = {}) {
  let posts = await Post.find(filter)
    .populate("memberId", "fullName email role userType")
    .populate("campaignId", "campaignName")
    .sort({ createdAt: -1 });

  const result = [];
  for (const post of posts) {
    const item = await Item.findOne({ postId: post._id }).populate("categoryId", "categoryName description status").sort({ createdAt: 1 });
    if (!item) continue;
    result.push(await mapPost(post, item, item.categoryId, post.campaignId));
  }

  let data = result;
  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    data = data.filter(p => [p.title, p.content, p.description, p.owner].some(v => (v || "").toLowerCase().includes(kw)));
  }
  if (query.category && query.category !== "All") data = data.filter(p => p.category === query.category);
  if (query.type && query.type !== "All") data = data.filter(p => p.type === query.type);
  if (query.status && query.status !== "All") data = data.filter(p => p.status === query.status);

  if (query.sort === "Price low to high") data.sort((a, b) => a.price - b.price);
  else if (query.sort === "Price high to low") data.sort((a, b) => b.price - a.price);
  else data.sort((a, b) => new Date(b.date) - new Date(a.date));

  return data;
}

exports.getAllPosts = async (req, res) => ok(res, await hydratePosts({}, req.query));

exports.getFeed = async (req, res) => ok(res, await hydratePosts({ postStatus: "approved" }, req.query));

exports.getMyPosts = async (req, res) => {
  const filter = { memberId: req.user._id };
  if (req.query.status && req.query.status !== "All") filter.postStatus = apiToStatus[req.query.status] || req.query.status;
  return ok(res, await hydratePosts(filter, req.query));
};

exports.getPostById = async (req, res) => {
  const post = await Post.findById(req.params.postId || req.params.id)
    .populate("memberId", "fullName email role userType")
    .populate("campaignId", "campaignName");

  if (!post) return fail(res, 404, "NOT_FOUND", "Post not found");

  const item = await Item.findOne({ postId: post._id }).populate("categoryId", "categoryName description status");
  return ok(res, await mapPost(post, item, item?.categoryId, post.campaignId));
};

exports.createPost = async (req, res) => {
  try {
    const { title, content, description, imageName, type, postType, price = 0, category, categoryId, contact, campaignId } = req.body;

    if (!content && !description) return fail(res, 400, "VALIDATION_ERROR", "content is required");
    if (!imageName && !req.body.imageUrl) return fail(res, 400, "VALIDATION_ERROR", "imageName is required");
    if (!contact) return fail(res, 400, "VALIDATION_ERROR", "contact is required");

    const finalType = apiToType[type] || postType;
    if (!["sell", "exchange", "donate"].includes(finalType)) return fail(res, 400, "VALIDATION_ERROR", "Invalid type");

    let cat = null;
    if (categoryId) cat = await Category.findById(categoryId);
    else cat = await Category.findOne({ categoryName: category, status: "active" });

    if (!cat || cat.status !== "active") return fail(res, 400, "VALIDATION_ERROR", "Category must be active");

    const post = await Post.create({
      memberId: req.user._id,
      title: title || (content || description).slice(0, 60),
      description: description || content,
      content: content || description,
      contact,
      imageName,
      postType: finalType,
      campaignId: campaignId || null,
      postStatus: "pending"
    });

    const item = await Item.create({
      postId: post._id,
      categoryId: cat._id,
      itemName: title || (content || description).slice(0, 60),
      itemDescription: description || content,
      price: finalType === "sell" ? Number(price || 0) : 0,
      imageUrl: imageName ? [imageName] : (req.body.imageUrl || []),
      itemStatus: "available"
    });

    if (campaignId) {
      await CampaignItem.create({
        campaignId,
        itemId: item._id,
        memberId: req.user._id,
        description: req.body.note || "",
        status: "pending"
      }).catch(() => null);
    }

    const populatedPost = await Post.findById(post._id).populate("memberId", "fullName email role userType").populate("campaignId", "campaignName");
    const populatedItem = await Item.findById(item._id).populate("categoryId", "categoryName");
    return ok(res, await mapPost(populatedPost, populatedItem, populatedItem.categoryId, populatedPost.campaignId), 201);
  } catch (error) {
    return fail(res, 400, "BAD_REQUEST", error.message);
  }
};

exports.updatePost = async (req, res) => {
  const post = await Post.findById(req.params.postId || req.params.id);
  if (!post) return fail(res, 404, "NOT_FOUND", "Post not found");
  if (String(post.memberId) !== String(req.user._id) && req.user.role !== "super_admin") return fail(res, 403, "FORBIDDEN", "Forbidden");

  ["title", "description", "content", "contact", "imageName"].forEach(k => {
    if (req.body[k] !== undefined) post[k] = req.body[k];
  });
  if (req.body.type) post.postType = apiToType[req.body.type] || post.postType;
  if (req.user.role === "member") post.postStatus = "pending";
  await post.save();
  return ok(res, await hydratePostById(post._id));
};

async function hydratePostById(id) {
  const post = await Post.findById(id).populate("memberId", "fullName email role userType").populate("campaignId", "campaignName");
  const item = await Item.findOne({ postId: id }).populate("categoryId", "categoryName");
  return mapPost(post, item, item?.categoryId, post?.campaignId);
}

exports.removePost = async (req, res) => {
  const post = await Post.findById(req.params.postId || req.params.id);
  if (!post) return fail(res, 404, "NOT_FOUND", "Post not found");
  if (post.postStatus === "completed") return fail(res, 400, "INVALID_STATE", "Cannot remove completed post");
  if (String(post.memberId) !== String(req.user._id) && req.user.role !== "super_admin") return fail(res, 403, "FORBIDDEN", "Forbidden");

  post.postStatus = "removed";
  post.removeReason = req.body.reason || null;
  await post.save();
  await Item.updateMany({ postId: post._id }, { itemStatus: "removed" });

  return ok(res, { id: String(post._id), status: "Removed", reason: post.removeReason });
};

exports.adminPending = async (req, res) => ok(res, await hydratePosts({ postStatus: "pending" }, req.query));

exports.adminPosts = async (req, res) => ok(res, await hydratePosts({}, req.query));

exports.approvePost = async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return fail(res, 404, "NOT_FOUND", "Post not found");
  post.postStatus = "approved";
  post.moderatorId = req.user._id;
  post.rejectReason = null;
  await post.save();

  const item = await Item.findOne({ postId: post._id });
  if (item) await CampaignItem.updateMany({ itemId: item._id }, { status: "approved" });

  return ok(res, { id: String(post._id), status: "Approved" });
};

exports.rejectPost = async (req, res) => {
  const { reason } = req.body;
  if (!reason) return fail(res, 400, "VALIDATION_ERROR", "reason is required");

  const post = await Post.findById(req.params.postId);
  if (!post) return fail(res, 404, "NOT_FOUND", "Post not found");
  if (post.postStatus !== "pending") return fail(res, 400, "INVALID_STATE", "Only pending post can be rejected");

  post.postStatus = "rejected";
  post.moderatorId = req.user._id;
  post.rejectReason = reason;
  await post.save();

  return ok(res, { id: String(post._id), status: "Rejected", reason });
};

exports.adminRemove = async (req, res) => {
  if (!req.body.reason) return fail(res, 400, "VALIDATION_ERROR", "reason is required");
  return exports.removePost(req, res);
};

exports.createPostRequest = async (req, res) => {
  const { message, contact } = req.body;
  if (!message || !contact) return fail(res, 400, "VALIDATION_ERROR", "message and contact are required");

  const post = await Post.findById(req.params.postId).populate("memberId", "fullName email role userType");
  if (!post) return fail(res, 404, "NOT_FOUND", "Post not found");
  if (post.postStatus !== "approved") return fail(res, 400, "INVALID_STATE", "Post must be approved");
  if (String(post.memberId._id || post.memberId) === String(req.user._id)) return fail(res, 400, "INVALID_REQUEST", "Cannot request your own post");

  const item = await Item.findOne({ postId: post._id });
  if (!item) return fail(res, 404, "NOT_FOUND", "Item not found");

  const tx = await Transaction.create({
    itemId: item._id,
    postId: post._id,
    ownerId: post.memberId._id || post.memberId,
    requesterId: req.user._id,
    transactionType: post.postType,
    transactionStatus: "pending",
    amount: item.price || 0,
    message,
    contact
  });

  const populated = await Transaction.findById(tx._id)
    .populate("postId", "title")
    .populate("itemId", "itemName")
    .populate("ownerId", "fullName")
    .populate("requesterId", "fullName");

  const { mapRequest } = require("../utils/mappers");
  return ok(res, mapRequest(populated), 201);
};

exports.getCampaignPosts = async (req, res) => {
  const campaignItems = await CampaignItem.find({ campaignId: req.params.campaignId, status: "approved" }).populate("itemId");
  const postIds = campaignItems.map(ci => ci.itemId?.postId).filter(Boolean);
  const filter = { _id: { $in: postIds }, campaignId: req.params.campaignId, postStatus: "approved" };
  return ok(res, await hydratePosts(filter, req.query));
};
