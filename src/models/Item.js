const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

  itemName: { type: String, required: true },
  itemDescription: { type: String, default: "" },
  condition: {
    type: String,
    enum: ["new", "used_good", "used_normal", "old"],
    default: "used_good"
  },
  price: { type: Number, default: 0 },
  imageUrl: [{ type: String }],

  itemStatus: {
    type: String,
    enum: ["available", "pending_transaction", "sold", "exchanged", "donated", "hidden", "removed"],
    default: "available"
  }
}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema, "items");
