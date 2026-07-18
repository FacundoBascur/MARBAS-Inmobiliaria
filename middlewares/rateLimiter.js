const rateLimit = require('express-rate-limit');

const limiterGeneral = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
    message: 'Demasiadas solicitudes. Intente más tarde.'
});

const limiterLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos. Intente en 15 minutos.',
    skipSuccessfulRequests: true
});

const limiterEmail = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Límite de contactos alcanzado.'
});

module.exports = {
    limiterGeneral,
    limiterLogin,
    limiterEmail
};
