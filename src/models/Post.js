const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  title: { type: String, required: true },
  description: { type: String, default: "" },
  content: { type: String, default: "" },
  contact: { type: String, default: "" },
  imageName: { type: String, default: "" },

  postType: {
    type: String,
    enum: ["sell", "exchange", "donate"],
    required: true
  },
  postStatus: {
    type: String,
    enum: ["pending", "approved", "rejected", "hidden", "completed", "removed"],
    default: "pending"
  },
  rejectReason: { type: String, default: null },
  removeReason: { type: String, default: null },

  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema, "posts");
