const router = require("express").Router();
const ctrl = require("../controllers/categoryController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.use(protect, authorize("super_admin"));
router.get("/", ctrl.getAdminCategories);
router.post("/", ctrl.createCategory);
router.patch("/:name", ctrl.updateCategory);
router.post("/:name/toggle-active", ctrl.toggleActive);
router.delete("/:name", ctrl.deleteCategory);

module.exports = router;
