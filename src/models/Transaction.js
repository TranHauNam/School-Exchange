const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionType: { type: String, enum: ['sell', 'exchange', 'donate'], required: true },
  transactionStatus: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'], default: 'pending' },
  amount: { type: Number, default: 0, min: 0 },
  exchangeItemDescription: { type: String, default: null },
  message: { type: String, default: null },
  serviceFee: { type: Number, default: 0, min: 0 },
  transactionDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
