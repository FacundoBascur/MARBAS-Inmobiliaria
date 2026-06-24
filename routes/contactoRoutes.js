const express = require('express');
const router = express.Router();
const { enviarContacto } = require('../controllers/contactoController');
const { limiterEmail } = require('../middlewares/rateLimiter');

router.post('/', limiterEmail, enviarContacto);

module.exports = router;
