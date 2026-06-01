const router = require("express").Router();
const ctrl = require("../controllers/campaignController");
const postCtrl = require("../controllers/postController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", ctrl.getCampaigns);
router.post("/", protect, ctrl.createCampaign);
router.get("/:campaignId", ctrl.getCampaignById);
router.patch("/:campaignId", protect, ctrl.updateCampaign);
router.post("/:campaignId/end", protect, ctrl.endCampaign);
router.get("/:campaignId/stats", ctrl.getStats);
router.get("/:campaignId/posts", postCtrl.getCampaignPosts);
router.post("/:campaignId/submissions", protect, ctrl.submitToCampaign);

module.exports = router;
