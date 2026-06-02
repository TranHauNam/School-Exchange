const Transaction = require("../models/Transaction");
const Post = require("../models/Post");
const Item = require("../models/Item");
const Campaign = require("../models/Campaign");
const { ok, fail } = require("../utils/apiResponse");
const { addToFund, resolveFundRecipient, calculateFundAmount } = require("../utils/fundService");

// Allowed payment methods (extend when adding real gateways)
const ALLOWED_METHODS = ["simulated"];

/**
 * POST /api/payments/checkout/:requestId
 *
 * Returns checkout information for the buyer, including product details,
 * fee breakdown, and available payment methods.
 * Only the requester may access this endpoint.
 */
exports.checkout = async (req, res) => {
  const tx = await Transaction.findById(req.params.requestId)
    .populate("itemId", "itemName price")
    .populate("ownerId", "fullName")
    .populate("requesterId", "fullName")
    .populate("postId", "title campaignId");

  if (!tx) return fail(res, 404, "NOT_FOUND", "Request not found");

  // Only the requester (buyer) can checkout
  if (String(tx.requesterId._id) !== String(req.user._id)) {
    return fail(res, 403, "FORBIDDEN", "Only the requester can checkout this request");
  }

  // Only sell transactions require payment
  if (tx.transactionType !== "sell") {
    return fail(res, 400, "INVALID_STATE", "Payment only applies to Sale transactions");
  }

  // Must be accepted
  if (tx.transactionStatus !== "accepted") {
    return fail(res, 400, "INVALID_STATE", "Request must be accepted before checkout");
  }

  // Must be unpaid
  if (tx.paymentStatus === "paid") {
    return fail(res, 409, "CONFLICT", "This request has already been paid");
  }

  let campaign = null;
  if (tx.postId?.campaignId) {
    campaign = await Campaign.findById(tx.postId.campaignId);
  }

  const productPrice = tx.amount || 0;
  const fee = calculateFundAmount(tx, campaign);
  const sellerReceives = productPrice - fee;

  const data = {
    requestId: String(tx._id),
    productName: tx.itemId?.itemName || tx.postId?.title || "",
    productPrice,
    fee,
    total: productPrice, // buyer pays product price; fee is deducted from seller
    sellerReceives: sellerReceives > 0 ? sellerReceives : 0,
    paymentMethods: ALLOWED_METHODS,
    buyerName: tx.requesterId?.fullName || "",
    sellerName: tx.ownerId?.fullName || ""
  };

  return ok(res, data);
};

/**
 * POST /api/payments/confirm/:requestId
 *
 * Simulates payment processing. Marks the transaction as paid,
 * creates fund entries, and completes the transaction.
 *
 * Body: { paymentMethod: "simulated" }
 */
exports.confirm = async (req, res) => {
  const { paymentMethod = "simulated" } = req.body || {};

  if (!ALLOWED_METHODS.includes(paymentMethod)) {
    return fail(res, 400, "VALIDATION", `Unsupported payment method. Allowed: ${ALLOWED_METHODS.join(", ")}`);
  }

  const tx = await Transaction.findById(req.params.requestId)
    .populate("postId", "title campaignId postStatus")
    .populate("itemId", "itemName itemStatus");

  if (!tx) return fail(res, 404, "NOT_FOUND", "Request not found");

  // Only the requester (buyer) can confirm payment
  if (String(tx.requesterId) !== String(req.user._id)) {
    return fail(res, 403, "FORBIDDEN", "Only the requester can confirm payment");
  }

  // Only sell transactions require payment
  if (tx.transactionType !== "sell") {
    return fail(res, 400, "INVALID_STATE", "Payment only applies to Sale transactions");
  }

  // Must be accepted
  if (tx.transactionStatus !== "accepted") {
    return fail(res, 400, "INVALID_STATE", "Request must be accepted before payment");
  }

  // Idempotency: already paid
  if (tx.paymentStatus === "paid") {
    // Return the existing result instead of reprocessing
    return ok(res, {
      transactionId: String(tx._id),
      status: tx.paymentStatus,
      amount: tx.amount,
      fee: tx.fee,
      paymentMethod: tx.paymentMethod,
      paymentDate: tx.paymentDate
    });
  }

  // ---- Process payment ----

  let campaign = null;
  const post = await Post.findById(tx.postId?._id || tx.postId);
  if (post?.campaignId) {
    campaign = await Campaign.findById(post.campaignId);
    tx.campaignId = post.campaignId;
  }

  const fee = calculateFundAmount(tx, campaign);

  // Update transaction
  tx.paymentMethod = paymentMethod;
  tx.paymentStatus = "paid";
  tx.paymentDate = new Date();
  tx.fee = fee;
  tx.transactionStatus = "completed";

  // Update item status → sold
  const item = await Item.findById(tx.itemId?._id || tx.itemId);
  if (item) {
    item.itemStatus = "sold";
    await item.save();
  }

  // Update post status → completed
  if (post) {
    post.postStatus = "completed";
    await post.save();
  }

  // Process fund (platform fee)
  if (fee > 0) {
    const recipientId = await resolveFundRecipient(post);
    if (recipientId) await addToFund(recipientId, fee);
    if (campaign) {
      campaign.currentFund = (campaign.currentFund || 0) + fee;
      await campaign.save();
    }
  }

  tx.fundAmount = fee;
  await tx.save();

  return ok(res, {
    transactionId: String(tx._id),
    status: tx.paymentStatus,
    amount: tx.amount,
    fee: tx.fee,
    paymentMethod: tx.paymentMethod,
    paymentDate: tx.paymentDate
  });
};

/**
 * GET /api/payments/history
 *
 * Returns payment history for the current user (both as buyer and seller).
 * Only includes paid transactions of type "sell".
 */
exports.getHistory = async (req, res) => {
  const filter = {
    transactionType: "sell",
    paymentStatus: "paid"
  };

  if (req.user.role === "member") {
    filter.$or = [
      { ownerId: req.user._id },
      { requesterId: req.user._id }
    ];
  }

  const list = await Transaction.find(filter)
    .populate("itemId", "itemName price")
    .populate("ownerId", "fullName")
    .populate("requesterId", "fullName")
    .sort({ paymentDate: -1 });

  const data = list.map((tx) => ({
    transactionId: String(tx._id),
    status: tx.paymentStatus,
    amount: tx.amount || 0,
    fee: tx.fee || 0,
    paymentMethod: tx.paymentMethod,
    paymentDate: tx.paymentDate,
    productName: tx.itemId?.itemName || "",
    buyerName: tx.requesterId?.fullName || "",
    sellerName: tx.ownerId?.fullName || ""
  }));

  return ok(res, data);
};
