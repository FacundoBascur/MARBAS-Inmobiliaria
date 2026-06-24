const express = require('express');
const router = express.Router();
const { login, refreshToken } = require('../controllers/authController');
const { limiterLogin } = require('../middlewares/rateLimiter');

router.post('/login', limiterLogin, login);
router.post('/refresh-token', refreshToken);

module.exports = router;
