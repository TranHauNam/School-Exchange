const router = require("express").Router();
const ctrl = require("../controllers/activityAdminController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.use(protect, authorize("activity_admin"));
router.get("/fund", ctrl.getMyFund);
router.get("/campaigns", ctrl.getMyCampaigns);
router.post("/campaigns/:campaignId/end", ctrl.endMyCampaign);
router.get("/campaign-posts", ctrl.getCampaignPosts);
router.post("/campaign-posts/:postId/approve", ctrl.approveCampaignPost);
router.post("/campaign-posts/:postId/reject", ctrl.rejectCampaignPost);

module.exports = router;
