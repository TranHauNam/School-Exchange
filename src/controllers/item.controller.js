const Item = require('../models/Item');
const Post = require('../models/Post');

exports.createItem = async (req, res) => {
  const post = await Post.findById(req.body.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.memberId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You cannot add item to this post' });
  }
  const item = await Item.create(req.body);
  post.postStatus = 'pending';
  await post.save();
  res.status(201).json(item);
};

exports.getItems = async (req, res) => {
  const filter = {};
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  if (req.query.status) filter.itemStatus = req.query.status;
  const items = await Item.find(filter)
    .populate('postId', 'title postType postStatus memberId')
    .populate('categoryId', 'categoryName')
    .sort({ createdAt: -1 });
  res.json(items);
};

exports.getItemById = async (req, res) => {
  const item = await Item.findById(req.params.id)
    .populate('postId')
    .populate('categoryId', 'categoryName');
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
};

exports.updateItem = async (req, res) => {
  const item = await Item.findById(req.params.id).populate('postId');
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (item.postId.memberId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'You cannot update this item' });
  }
  Object.assign(item, req.body);
  await item.save();
  res.json(item);
};

exports.deleteItem = async (req, res) => {
  const item = await Item.findById(req.params.id).populate('postId');
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (item.postId.memberId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'You cannot delete this item' });
  }
  item.itemStatus = 'hidden';
  await item.save();
  res.json({ message: 'Item hidden', item });
};
