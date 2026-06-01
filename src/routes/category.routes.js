const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', ctrl.getCategories);
router.post('/', protect, authorize('super_admin'), ctrl.createCategory);
router.put('/:id', protect, authorize('super_admin'), ctrl.updateCategory);
router.delete('/:id', protect, authorize('super_admin'), ctrl.deleteCategory);

module.exports = router;
