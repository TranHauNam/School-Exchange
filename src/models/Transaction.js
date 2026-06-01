const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },

  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  transactionType: {
    type: String,
    enum: ["sell", "exchange", "donate"],
    required: true
  },
  transactionStatus: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
    default: "pending"
  },

  amount: { type: Number, default: 0 },
  fundAmount: { type: Number, default: 0 },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
  message: { type: String, default: "" },
  contact: { type: String, default: "" },
  exchangeItemDescription: { type: String, default: null },
  transactionDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema, "transactions");
