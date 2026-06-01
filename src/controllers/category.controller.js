const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
  const category = await Category.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(category);
};

exports.getCategories = async (req, res) => {
  const filter = req.query.includeHidden === 'true' ? {} : { status: 'active' };
  const categories = await Category.find(filter).sort({ createdAt: -1 });
  res.json(categories);
};

exports.updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
};

exports.deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { status: 'hidden' }, { new: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category hidden', category });
};
