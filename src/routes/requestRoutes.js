const router = require("express").Router();
const ctrl = require("../controllers/requestController");
const { protect } = require("../middlewares/authMiddleware");

router.use(protect);
router.get("/sent", ctrl.sent);
router.get("/received", ctrl.received);
router.get("/completed", ctrl.completed);
router.post("/:requestId/accept", ctrl.accept);
router.post("/:requestId/reject", ctrl.reject);
router.post("/:requestId/complete", ctrl.complete);

module.exports = router;
