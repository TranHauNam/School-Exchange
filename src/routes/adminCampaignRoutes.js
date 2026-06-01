const router = require("express").Router();
const ctrl = require("../controllers/campaignController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.use(protect, authorize("super_admin"));
router.get("/", ctrl.getCampaigns);
router.patch("/:campaignId", ctrl.updateCampaign);
router.post("/:campaignId/end", ctrl.endCampaign);

module.exports = router;
