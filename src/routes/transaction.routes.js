const router = require('express').Router();
const ctrl = require('../controllers/transaction.controller');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.get('/my', ctrl.getMyTransactions);
router.get('/', authorize('super_admin'), ctrl.getTransactions);
router.post('/', ctrl.createTransaction);
router.patch('/:id/status', ctrl.updateTransactionStatus);

module.exports = router;
