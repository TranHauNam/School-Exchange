const router = require("express").Router();
const ctrl = require("../controllers/categoryController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.get("/active", ctrl.getActiveCategories);

module.exports = router;
