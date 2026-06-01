const router = require('express').Router();
const ctrl = require('../controllers/item.controller');
const { protect } = require('../middlewares/auth');

router.get('/', ctrl.getItems);
router.get('/:id', ctrl.getItemById);
router.post('/', protect, ctrl.createItem);
router.put('/:id', protect, ctrl.updateItem);
router.delete('/:id', protect, ctrl.deleteItem);

module.exports = router;
