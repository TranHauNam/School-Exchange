const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  feeType: { type: String, enum: ['transaction_fee', 'campaign_fund'], required: true },
  feeAmount: { type: Number, default: 0, min: 0 },
  fundAmount: { type: Number, default: 0, min: 0 },
  feeStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  confirmedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
