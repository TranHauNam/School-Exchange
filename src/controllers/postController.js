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
    const { title, content, description, type, postType, contact, campaignId, items } = req.body;

    if (!content && !description) return fail(res, 400, "VALIDATION_ERROR", "content is required");
    if (!contact) return fail(res, 400, "VALIDATION_ERROR", "contact is required");

    // Require at least 1 item
    const itemsArray = items || [];
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
      // Fallback: old-style single-item post
      const { imageName, price = 0, category, categoryId } = req.body;
      if (!imageName && !req.body.imageUrl) return fail(res, 400, "VALIDATION_ERROR", "items array or imageName is required");
      // Push a single item from old fields
      itemsArray.push({
        name: title || (content || description || "").slice(0, 60),
        category: category || "",
        categoryId: categoryId || null,
        price: price,
        condition: "used_good",
        imageName: imageName || "",
      });
    }

    const finalType = apiToType[type] || postType;
    if (!["sell", "exchange", "donate"].includes(finalType)) return fail(res, 400, "VALIDATION_ERROR", "Invalid type");

    // Validate & resolve categories for each item
    const resolvedItems = [];
    for (const item of itemsArray) {
      let cat = null;
      if (item.categoryId) cat = await Category.findById(item.categoryId);
      else cat = await Category.findOne({ categoryName: item.category, status: "active" });
      if (!cat || cat.status !== "active") return fail(res, 400, "VALIDATION_ERROR", `Category "${item.category || item.categoryId}" must be active`);

      // Handle base64 image -> replace with placeholder
      const isBase64 = item.imageName && (item.imageName.startsWith("data:") || item.imageName.length > 200);
      const resolvedImage = isBase64 ? "IMAGE" : (item.imageName || "");

      resolvedItems.push({
        categoryId: cat._id,
        itemName: item.name || "Sản phẩm mới",
        itemDescription: item.description || content || "",
        price: finalType === "sell" ? Number(item.price || 0) : 0,
        condition: item.condition || "used_good",
        imageUrl: resolvedImage ? [resolvedImage] : [],
      });
    }

    const post = await Post.create({
      memberId: req.user._id,
      title: title || (itemsArray[0]?.name || (content || description || "").slice(0, 60)),
      description: description || content,
      content: content || description,
      contact,
      imageName: resolvedItems[0]?.imageUrl?.[0] || "IMAGE",
      postType: finalType,
      campaignId: campaignId || null,
      postStatus: "pending"
    });

    // Create an Item for each resolved item
    const createdItems = [];
    for (const ri of resolvedItems) {
      const created = await Item.create({
        postId: post._id,
        categoryId: ri.categoryId,
        itemName: ri.itemName,
        itemDescription: ri.itemDescription,
        price: ri.price,
        condition: ri.condition,
        imageUrl: ri.imageUrl,
        itemStatus: "available"
      });
      createdItems.push(created);

      if (campaignId) {
        await CampaignItem.create({
          campaignId,
          itemId: created._id,
          memberId: req.user._id,
          description: req.body.note || "",
          status: "pending"
        }).catch(() => null);
      }
    }

    const populatedPost = await Post.findById(post._id).populate("memberId", "fullName email role userType").populate("campaignId", "campaignName");
    const populatedItems = await Item.find({ postId: post._id }).populate("categoryId", "categoryName");
    return ok(res, await mapPost(populatedPost, populatedItems[0], populatedItems[0]?.categoryId, populatedPost.campaignId), 201);
  } catch (error) {
    return fail(res, 400, "BAD_REQUEST", error.message);
  }
};

exports.updatePost = async (req, res) => {
  const post = await Post.findById(req.params.postId || req.params.id);
  if (!post) return fail(res, 404, "NOT_FOUND", "Post not found");
  if (String(post.memberId) !== String(req.user._id) && req.user.role !== "super_admin") return fail(res, 403, "FORBIDDEN", "Forbidden");

  ["title", "description", "content", "contact"].forEach(k => {
    if (req.body[k] !== undefined) post[k] = req.body[k];
  });
  if (req.body.imageName !== undefined) {
    const isBase64 = req.body.imageName.startsWith("data:") || req.body.imageName.length > 200;
    post.imageName = isBase64 ? "IMAGE" : req.body.imageName;
  }
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
  try {
    const post = await Post.findById(req.params.postId || req.params.id);
    if (!post) return fail(res, 404, "NOT_FOUND", "Post not found");
    if (post.postStatus === "completed") return fail(res, 400, "INVALID_STATE", "Cannot remove completed post");

    const isOwner = String(post.memberId) === String(req.user._id);
    const isSuperAdmin = req.user.role === "super_admin";
    let isActivityAdminOfCampaign = false;
    if (req.user.role === "activity_admin" && post.campaignId) {
      const campaign = await Campaign.findOne({ _id: post.campaignId, organizerId: req.user._id });
      isActivityAdminOfCampaign = !!campaign;
    }

    if (!isOwner && !isSuperAdmin && !isActivityAdminOfCampaign) {
      return fail(res, 403, "FORBIDDEN", "Forbidden");
    }

    post.postStatus = "removed";
    post.removeReason = (req.body && req.body.reason) || null;
    await post.save();
    await Item.updateMany({ postId: post._id }, { itemStatus: "removed" });

    return ok(res, { id: String(post._id), status: "Removed", reason: post.removeReason });
  } catch (error) {
    return fail(res, 500, "SERVER_ERROR", error.message);
  }
};

// Build filter for activity_admin: only posts from campaigns they own.
async function activityAdminCampaignFilter(user) {
  const campaigns = await Campaign.find({ organizerId: user._id }).select("_id");
  return campaigns.map((c) => c._id);
}

exports.adminPending = async (req, res) => {
  const filter = { postStatus: "pending" };
  if (req.user.role === "activity_admin") {
    filter.campaignId = { $in: await activityAdminCampaignFilter(req.user) };
  }
  return ok(res, await hydratePosts(filter, req.query));
};

exports.adminPosts = async (req, res) => {
  const filter = {};
  if (req.user.role === "activity_admin") {
    filter.campaignId = { $in: await activityAdminCampaignFilter(req.user) };
  }
  return ok(res, await hydratePosts(filter, req.query));
};

async function requireCampaignPostAccess(postId, user) {
  const post = await Post.findById(postId);
  if (!post) return { error: fail, code: "NOT_FOUND", message: "Post not found" };

  if (user.role === "activity_admin") {
    if (!post.campaignId) return { error: fail, code: "FORBIDDEN", message: "Not a campaign post" };
    const campaign = await Campaign.findOne({ _id: post.campaignId, organizerId: user._id });
    if (!campaign) return { error: fail, code: "FORBIDDEN", message: "Not your campaign post" };
  }
  return { post };
}

exports.approvePost = async (req, res) => {
  const result = await requireCampaignPostAccess(req.params.postId, req.user);
  if (result.error) return result.error(res, 403, result.code, result.message);

  const post = result.post;
  post.postStatus = "approved";
  post.moderatorId = req.user._id;
  post.rejectReason = null;
  await post.save();

  const item = await Item.findOne({ postId: post._id });
  if (item) await CampaignItem.updateMany({ itemId: item._id }, { status: "approved" });

  return ok(res, { id: String(post._id), status: "Approved" });
};

exports.rejectPost = async (req, res) => {
  const reason = req.body && req.body.reason;
  if (!reason) return fail(res, 400, "VALIDATION_ERROR", "reason is required");

  const result = await requireCampaignPostAccess(req.params.postId, req.user);
  if (result.error) return result.error(res, 403, result.code, result.message);

  const post = result.post;
  if (post.postStatus !== "pending") return fail(res, 400, "INVALID_STATE", "Only pending post can be rejected");

  post.postStatus = "rejected";
  post.moderatorId = req.user._id;
  post.rejectReason = reason;
  await post.save();

  return ok(res, { id: String(post._id), status: "Rejected", reason });
};

exports.adminRemove = async (req, res) => {
  if (!req.body || !req.body.reason) return fail(res, 400, "VALIDATION_ERROR", "reason is required");

  const result = await requireCampaignPostAccess(req.params.postId, req.user);
  if (result.error) return result.error(res, 403, result.code, result.message);

  req.params.id = req.params.postId;
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
