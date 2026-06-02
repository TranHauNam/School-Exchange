const router = require("express").Router();
const ctrl = require("../controllers/paymentController");
const { protect } = require("../middlewares/authMiddleware");

router.use(protect);
router.post("/checkout/:requestId", ctrl.checkout);
router.post("/confirm/:requestId", ctrl.confirm);
router.get("/history", ctrl.getHistory);

module.exports = router;
