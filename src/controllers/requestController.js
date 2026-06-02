const Transaction = require("../models/Transaction");
const Post = require("../models/Post");
const Item = require("../models/Item");
const Campaign = require("../models/Campaign");
const { ok, fail } = require("../utils/apiResponse");
const { mapRequest } = require("../utils/mappers");
const { addToFund, resolveFundRecipient, calculateFundAmount } = require("../utils/fundService");

async function populateTx(query) {
  return query
    .populate("postId", "title postType postStatus")
    .populate("itemId", "itemName price")
    .populate("ownerId", "fullName")
    .populate("requesterId", "fullName")
    .sort({ createdAt: -1 });
}

exports.sent = async (req, res) => {
  const list = await populateTx(Transaction.find({ requesterId: req.user._id }));
  ok(res, list.map(mapRequest));
};

exports.received = async (req, res) => {
  const list = await populateTx(Transaction.find({ ownerId: req.user._id, transactionStatus: { $ne: "completed" } }));
  ok(res, list.map(mapRequest));
};

exports.completed = async (req, res) => {
  const filter = { transactionStatus: "completed" };
  if (req.user.role === "member") filter.$or = [{ ownerId: req.user._id }, { requesterId: req.user._id }];
  const list = await populateTx(Transaction.find(filter));
  ok(res, list.map(mapRequest));
};

exports.accept = async (req, res) => changeStatus(req, res, "accepted");
exports.reject = async (req, res) => changeStatus(req, res, "rejected");

async function changeStatus(req, res, status) {
  const tx = await Transaction.findById(req.params.requestId);
  if (!tx) return fail(res, 404, "NOT_FOUND", "Request not found");
  if (String(tx.ownerId) !== String(req.user._id)) return fail(res, 403, "FORBIDDEN", "Only receiver can update request");
  if (tx.transactionStatus !== "pending") return fail(res, 400, "INVALID_STATE", "Request must be pending");

  tx.transactionStatus = status;
  await tx.save();
  return ok(res, { id: String(tx._id), status: status === "accepted" ? "Accepted" : "Rejected" });
}

exports.complete = async (req, res) => {
  const tx = await Transaction.findById(req.params.requestId);
  if (!tx) return fail(res, 404, "NOT_FOUND", "Request not found");
  if (String(tx.ownerId) !== String(req.user._id)) return fail(res, 403, "FORBIDDEN", "Only receiver can complete request");
  if (tx.transactionStatus !== "accepted") return fail(res, 400, "INVALID_STATE", "Request must be accepted");

  // Sell transactions must go through the payment flow instead
  if (tx.transactionType === "sell") {
    return fail(res, 400, "INVALID_STATE", "Sale transactions must be completed via payment. The buyer needs to checkout and pay first.");
  }

  tx.transactionStatus = "completed";

  const item = await Item.findById(tx.itemId);
  if (item) {
    item.itemStatus = tx.transactionType === "exchange" ? "exchanged" : "donated";
    await item.save();
  }

  const post = await Post.findById(tx.postId || item?.postId);
  if (post) {
    post.postStatus = "completed";
    await post.save();
  }

  let campaign = null;
  if (post?.campaignId) {
    campaign = await Campaign.findById(post.campaignId);
    tx.campaignId = post.campaignId;
  }

  const fundAmount = calculateFundAmount(tx, campaign);
  tx.fundAmount = fundAmount;

  if (fundAmount > 0) {
    const recipientId = await resolveFundRecipient(post);
    if (recipientId) await addToFund(recipientId, fundAmount);
    if (campaign) {
      campaign.currentFund += fundAmount;
      await campaign.save();
    }
  }

  await tx.save();

  return ok(res, { id: String(tx._id), status: "Completed", fundAmount });
};
