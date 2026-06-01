const Category = require("../models/Category");
const Item = require("../models/Item");
const { ok, fail } = require("../utils/apiResponse");
const { mapCategory } = require("../utils/mappers");

async function categoryCounts() {
  const counts = await Item.aggregate([{ $group: { _id: "$categoryId", count: { $sum: 1 } } }]);
  return new Map(counts.map(c => [String(c._id), c.count]));
}

exports.getActiveCategories = async (req, res) => {
  const categories = await Category.find({ status: "active" }).sort({ categoryName: 1 });
  const counts = await categoryCounts();
  return ok(res, categories.map(c => mapCategory(c, counts.get(String(c._id)) || 0)));
};

exports.getAdminCategories = async (req, res) => {
  const categories = await Category.find().sort({ categoryName: 1 });
  const counts = await categoryCounts();
  return ok(res, categories.map(c => mapCategory(c, counts.get(String(c._id)) || 0)));
};

exports.createCategory = async (req, res) => {
  try {
    const { name, desc, categoryName, description } = req.body;
    const category = await Category.create({
      categoryName: name || categoryName,
      description: desc || description || "",
      createdBy: req.user?._id
    });
    return ok(res, mapCategory(category), 201);
  } catch (error) {
    return fail(res, 400, "BAD_REQUEST", error.message);
  }
};

exports.updateCategory = async (req, res) => {
  const oldName = decodeURIComponent(req.params.name);
  const category = await Category.findOne({ categoryName: oldName });
  if (!category) return fail(res, 404, "NOT_FOUND", "Category not found");

  category.categoryName = req.body.name || req.body.categoryName || category.categoryName;
  category.description = req.body.desc || req.body.description || category.description;
  await category.save();

  return ok(res, mapCategory(category));
};

exports.toggleActive = async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const category = await Category.findOne({ categoryName: name });
  if (!category) return fail(res, 404, "NOT_FOUND", "Category not found");

  category.status = category.status === "active" ? "hidden" : "active";
  await category.save();

  return ok(res, mapCategory(category));
};

exports.deleteCategory = async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const category = await Category.findOne({ categoryName: name });
  if (!category) return fail(res, 404, "NOT_FOUND", "Category not found");

  const used = await Item.exists({ categoryId: category._id });
  if (used) return fail(res, 409, "CONFLICT", "Danh mục đang được sử dụng.");

  await category.deleteOne();
  return ok(res, null);
};
