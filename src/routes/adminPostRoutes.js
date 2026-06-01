const router = require("express").Router();
const ctrl = require("../controllers/postController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.use(protect, authorize("super_admin", "activity_admin"));
router.get("/pending", ctrl.adminPending);
router.get("/", ctrl.adminPosts);
router.post("/:postId/approve", ctrl.approvePost);
router.post("/:postId/reject", ctrl.rejectPost);
router.post("/:postId/remove", ctrl.adminRemove);

module.exports = router;
