const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/admin-login', auth.adminLogin);
router.get('/me', protect, auth.me);

module.exports = router;
