const router = require('express').Router();
const ctrl = require('../controllers/post.controller');
const { protect, authorize } = require('../middlewares/auth');

router.get('/approved', ctrl.getApprovedPosts);
router.get('/my', protect, ctrl.getMyPosts);
router.get('/', ctrl.getPosts);
router.get('/:id', ctrl.getPostById);
router.post('/', protect, ctrl.createPost);
router.put('/:id', protect, ctrl.updatePost);
router.delete('/:id', protect, ctrl.deletePost);
router.patch('/:id/moderate', protect, authorize('super_admin'), ctrl.moderatePost);

module.exports = router;
