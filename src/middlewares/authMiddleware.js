const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ success: false, code: "UNAUTHORIZED", message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ success: false, code: "UNAUTHORIZED", message: "Unauthorized" });
    if (["locked", "disabled"].includes(user.accountStatus)) {
      return res.status(403).json({ success: false, code: "ACCOUNT_DISABLED", message: "Account disabled" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, code: "UNAUTHORIZED", message: "Unauthorized" });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, code: "FORBIDDEN", message: "Forbidden" });
  }
  next();
};
