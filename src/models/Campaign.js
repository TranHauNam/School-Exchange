const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaignName: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  campaignType: { type: String, enum: ['donation', 'fundraising'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  targetFund: { type: Number, default: 0, min: 0 },
  currentFund: { type: Number, default: 0, min: 0 },
  campaignStatus: { type: String, enum: ['active', 'ended', 'cancelled'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
