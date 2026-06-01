const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  postType: { type: String, enum: ['sell', 'exchange', 'donate'], required: true },
  postStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'hidden', 'completed'], default: 'pending' },
  rejectReason: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
