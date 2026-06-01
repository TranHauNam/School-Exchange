const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["active", "hidden"],
    default: "active"
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema, "categories");
