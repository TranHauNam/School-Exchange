const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  userName: { type: String },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String },
  userType: {
    type: String,
    enum: ["student", "teacher", "school_staff", "club", "student_union"],
    default: "student"
  },
  role: {
    type: String,
    enum: ["member", "super_admin", "activity_admin"],
    default: "member"
  },
  accountStatus: {
    type: String,
    enum: ["active", "locked", "disabled"],
    default: "active"
  },
  organizationName: { type: String }
}, { timestamps: true });

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema, "users");
