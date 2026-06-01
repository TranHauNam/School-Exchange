const router = require('express').Router();
const ctrl = require('../controllers/fee.controller');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('super_admin'));
router.get('/', ctrl.getFees);
router.post('/', ctrl.createFee);
router.patch('/:id/confirm', ctrl.confirmFee);
router.patch('/:id/cancel', ctrl.cancelFee);

module.exports = router;
