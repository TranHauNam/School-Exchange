const router = require('express').Router();
const ctrl = require('../controllers/member.controller');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('super_admin'));
router.get('/', ctrl.getMembers);
router.get('/:id', ctrl.getMemberById);
router.patch('/:id/role', ctrl.updateMemberRole);
router.patch('/:id/status', ctrl.updateMemberStatus);

module.exports = router;
