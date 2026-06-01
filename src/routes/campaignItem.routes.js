const router = require('express').Router();
const ctrl = require('../controllers/campaignItem.controller');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.get('/', ctrl.getCampaignItems);
router.post('/', ctrl.addItemToCampaign);
router.patch('/:id/status', authorize('super_admin', 'activity_admin'), ctrl.updateCampaignItemStatus);

module.exports = router;
