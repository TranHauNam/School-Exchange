/**
 * Tạo tài khoản test cho Postman (chạy 1 lần):
 *   node scripts/seed-test-users.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Category = require("../src/models/Category");

const users = [
  { username: "admin", fullName: "Super Admin", email: "admin@test.local", password: "admin123", role: "super_admin", userType: "school_staff" },
  { username: "club_admin", fullName: "CLB Admin", email: "club@test.local", password: "club123", role: "activity_admin", userType: "club", organizationName: "CLB Tin học" }
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  for (const u of users) {
    const exists = await User.findOne({ $or: [{ email: u.email }, { username: u.username }] });
    if (exists) {
      console.log("Skip (exists):", u.username);
      continue;
    }
    await User.create(u);
    console.log("Created:", u.username, `(${u.role})`);
  }
  const cat = await Category.findOne({ categoryName: "Sách" });
  if (!cat) {
    await Category.create({ categoryName: "Sách", description: "Sách giáo khoa", status: "active" });
    console.log("Created category: Sách");
  }
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
