const router = require("express").Router();
const ctrl = require("../controllers/reportController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.use(protect, authorize("super_admin"));
router.get("/overview", ctrl.getOverview);
router.get("/posts", ctrl.getPostStats);
router.get("/transactions", ctrl.getTransactionStats);
router.get("/campaigns", ctrl.getCampaignStats);

module.exports = router;
