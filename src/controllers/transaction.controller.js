const Transaction = require('../models/Transaction');
const Item = require('../models/Item');
const Post = require('../models/Post');

exports.createTransaction = async (req, res) => {
  try {
    const { itemId, transactionType, exchangeItemDescription, message } = req.body;
    const item = await Item.findById(itemId).populate('postId');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.itemStatus !== 'available') return res.status(400).json({ message: 'Item is not available' });
    if (item.postId.postStatus !== 'approved') return res.status(400).json({ message: 'Post is not approved' });

    const ownerId = item.postId.memberId;
    if (ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot request your own item' });
    }

    const amount = transactionType === 'sell' ? item.price : 0;
    const serviceFee = transactionType === 'donate' ? 0 : Math.round(amount * 0.02);

    const transaction = await Transaction.create({
      itemId,
      ownerId,
      requesterId: req.user._id,
      transactionType,
      amount,
      serviceFee,
      exchangeItemDescription,
      message
    });

    item.itemStatus = 'pending_transaction';
    await item.save();
    res.status(201).json(transaction);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.getTransactions = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.transactionStatus = req.query.status;
  const transactions = await Transaction.find(filter)
    .populate('itemId')
    .populate('ownerId', 'fullName email')
    .populate('requesterId', 'fullName email')
    .sort({ createdAt: -1 });
  res.json(transactions);
};

exports.getMyTransactions = async (req, res) => {
  const transactions = await Transaction.find({
    $or: [{ ownerId: req.user._id }, { requesterId: req.user._id }]
  })
    .populate('itemId')
    .populate('ownerId', 'fullName email')
    .populate('requesterId', 'fullName email')
    .sort({ createdAt: -1 });
  res.json(transactions);
};

exports.updateTransactionStatus = async (req, res) => {
  const { transactionStatus } = req.body;
  if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(transactionStatus)) {
    return res.status(400).json({ message: 'Invalid transactionStatus' });
  }
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

  const isOwner = transaction.ownerId.toString() === req.user._id.toString();
  const isRequester = transaction.requesterId.toString() === req.user._id.toString();
  if (!isOwner && !isRequester && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'You cannot update this transaction' });
  }

  if (['accepted', 'rejected'].includes(transactionStatus) && !isOwner && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only item owner can accept/reject' });
  }

  transaction.transactionStatus = transactionStatus;
  transaction.transactionDate = new Date();
  await transaction.save();

  const item = await Item.findById(transaction.itemId);
  if (item) {
    if (transactionStatus === 'rejected' || transactionStatus === 'cancelled') item.itemStatus = 'available';
    if (transactionStatus === 'completed') {
      if (transaction.transactionType === 'sell') item.itemStatus = 'sold';
      if (transaction.transactionType === 'exchange') item.itemStatus = 'exchanged';
      if (transaction.transactionType === 'donate') item.itemStatus = 'donated';
      await Post.findByIdAndUpdate(item.postId, { postStatus: 'completed' });
    }
    await item.save();
  }

  res.json(transaction);
};
