const mongoose = require("mongoose");

const fundSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  currentBalance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Fund", fundSchema, "funds");
