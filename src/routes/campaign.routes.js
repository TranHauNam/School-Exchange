const router = require('express').Router();
const ctrl = require('../controllers/campaign.controller');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', ctrl.getCampaigns);
router.get('/:id', ctrl.getCampaignById);
router.post('/', protect, authorize('super_admin', 'activity_admin'), ctrl.createCampaign);
router.put('/:id', protect, authorize('super_admin', 'activity_admin'), ctrl.updateCampaign);
router.delete('/:id', protect, authorize('super_admin', 'activity_admin'), ctrl.deleteCampaign);

module.exports = router;
