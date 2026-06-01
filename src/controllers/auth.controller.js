const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require("bcryptjs");

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone, userType } = req.body;
    const existed = await User.findOne({ email });
    if (existed) return res.status(400).json({ message: 'Email already exists' });
    const user = await User.create({ fullName, email, password, phone, userType, role: 'member' });
    res.status(201).json({
      message: 'Register success',
      token: signToken(user),
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Email không tồn tại" });
  }

  if (user.role !== "member") {
    return res.status(403).json({ message: "Tài khoản này không phải tài khoản thành viên" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Mật khẩu không đúng" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Đăng nhập thành công",
    token,
    user
  });
};

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ message: "Tài khoản admin không tồn tại" });
  }

  if (!["super_admin", "activity_admin"].includes(user.role)) {
    return res.status(403).json({ message: "Không có quyền admin" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Mật khẩu không đúng" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Admin đăng nhập thành công",
    token,
    user
  });
};

exports.me = async (req, res) => res.json(req.user);
