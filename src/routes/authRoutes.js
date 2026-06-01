const router = require("express").Router();
const ctrl = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/admin-login", ctrl.adminLogin);
router.get("/me", protect, ctrl.me);
router.get("/profile", protect, ctrl.getProfile);
router.patch("/profile", protect, ctrl.updateProfile);
router.post("/logout", protect, ctrl.logout);

module.exports = router;
