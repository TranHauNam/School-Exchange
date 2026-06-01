const mongoose = require('mongoose');

const campaignItemSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, default: '' },
  addedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'removed'], default: 'pending' },
  note: { type: String, default: '' }
}, { timestamps: true });

campaignItemSchema.index({ campaignId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('Campaign-Item', campaignItemSchema);
