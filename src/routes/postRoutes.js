const router = require("express").Router();
const ctrl = require("../controllers/postController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/feed", ctrl.getFeed);
router.get("/", ctrl.getAllPosts);
router.get("/my", protect, ctrl.getMyPosts);
router.post("/", protect, ctrl.createPost);
router.get("/:postId", ctrl.getPostById);
router.patch("/:postId", protect, ctrl.updatePost);
router.post("/:postId/remove", protect, ctrl.removePost);
router.post("/:postId/requests", protect, ctrl.createPostRequest);

module.exports = router;
