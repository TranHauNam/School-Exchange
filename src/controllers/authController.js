const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ok, fail } = require("../utils/apiResponse");
const { mapSession } = require("../utils/mappers");

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone, userType } = req.body;
    const existed = await User.findOne({ email });
    if (existed) return fail(res, 400, "EMAIL_EXISTS", "Email already exists");

    const user = await User.create({ fullName, email, password, phone, userType, role: "member" });
    return ok(res, { token: signToken(user), session: mapSession(user) }, 201);
  } catch (error) {
    return fail(res, 400, "BAD_REQUEST", error.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const user = await User.findOne(email ? { email } : { username });

    if (!user || !(await user.matchPassword(password))) {
      return fail(res, 401, "INVALID_CREDENTIALS", "Invalid credentials");
    }
    if (["locked", "disabled"].includes(user.accountStatus)) {
      return fail(res, 403, "ACCOUNT_DISABLED", "Account disabled");
    }

    return ok(res, { token: signToken(user), session: mapSession(user) });
  } catch (error) {
    return fail(res, 500, "SERVER_ERROR", error.message);
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.matchPassword(password))) {
      return fail(res, 401, "INVALID_CREDENTIALS", "Invalid credentials");
    }
    if (!["super_admin", "activity_admin"].includes(user.role)) {
      return fail(res, 403, "FORBIDDEN", "Not admin account");
    }

    return ok(res, { token: signToken(user), session: mapSession(user) });
  } catch (error) {
    return fail(res, 500, "SERVER_ERROR", error.message);
  }
};

exports.me = async (req, res) => ok(res, mapSession(req.user));

exports.getProfile = async (req, res) => {
  const u = req.user;
  ok(res, {
    id: String(u._id),
    fullName: u.fullName,
    email: u.email,
    phone: u.phone || "",
    role: u.role === "super_admin" ? "System Administrator" : u.role === "activity_admin" ? "Activity Administrator" : "Member",
    roleKey: u.role,
    status: u.accountStatus,
    ownerRole: u.userType || null,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : ""
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const u = req.user;

    if (fullName !== undefined) {
      if (!fullName.trim()) return fail(res, 400, "VALIDATION", "Full name is required");
      u.fullName = fullName.trim();
    }
    if (phone !== undefined) {
      if (!phone.trim()) return fail(res, 400, "VALIDATION", "Phone is required");
      u.phone = phone.trim();
    }

    await u.save();

    ok(res, {
      id: String(u._id),
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || "",
      role: u.role === "super_admin" ? "System Administrator" : u.role === "activity_admin" ? "Activity Administrator" : "Member",
      roleKey: u.role,
      status: u.accountStatus,
      ownerRole: u.userType || null,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : ""
    });
  } catch (error) {
    fail(res, 400, "BAD_REQUEST", error.message);
  }
};

exports.logout = async (req, res) => ok(res, null);
