const Fee = require('../models/Fee');
const Campaign = require('../models/Campaign');

exports.createFee = async (req, res) => {
  const fee = await Fee.create(req.body);
  res.status(201).json(fee);
};

exports.getFees = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.feeStatus = req.query.status;
  if (req.query.campaignId) filter.campaignId = req.query.campaignId;
  const fees = await Fee.find(filter)
    .populate('transactionId')
    .populate('campaignId', 'campaignName')
    .populate('confirmedBy', 'fullName email')
    .sort({ createdAt: -1 });
  res.json(fees);
};

exports.confirmFee = async (req, res) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) return res.status(404).json({ message: 'Fee not found' });
  fee.feeStatus = 'confirmed';
  fee.confirmedBy = req.user._id;
  fee.confirmedAt = new Date();
  await fee.save();

  if (fee.campaignId && fee.fundAmount > 0) {
    await Campaign.findByIdAndUpdate(fee.campaignId, { $inc: { currentFund: fee.fundAmount } });
  }
  res.json(fee);
};

exports.cancelFee = async (req, res) => {
  const fee = await Fee.findByIdAndUpdate(req.params.id, { feeStatus: 'cancelled' }, { new: true });
  if (!fee) return res.status(404).json({ message: 'Fee not found' });
  res.json(fee);
};
