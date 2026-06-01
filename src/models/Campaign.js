const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  campaignName: { type: String, required: true },
  organizer: { type: String, default: "" },
  description: { type: String, default: "" },
  campaignType: {
    type: String,
    enum: ["fundraising", "donation", "mixed"],
    default: "donation"
  },
  isFree: { type: Boolean, default: true },
  cover: { type: String, default: "STUDY" },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  targetFund: { type: Number, default: 0 },
  currentFund: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0.05 },
  campaignStatus: {
    type: String,
    enum: ["upcoming", "active", "ended", "cancelled"],
    default: "upcoming"
  }
}, { timestamps: true });

module.exports = mongoose.model("Campaign", campaignSchema, "campaigns");
