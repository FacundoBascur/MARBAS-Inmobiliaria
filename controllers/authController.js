const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const login = catchAsync(async (req, res, next) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        throw new AppError('Usuario y contraseña requeridos', 400);
    }

    const [resultados] = await pool.query(
        'SELECT id, user, password FROM useradmin WHERE user = ? LIMIT 1',
        [usuario.substring(0, 100)]
    );

    if (resultados.length === 0) {
        throw new AppError('Credenciales inválidas', 401);
    }

    const usuarioBD = resultados[0];
    const passwordCorrecta = await bcrypt.compare(password, usuarioBD.password);

    if (!passwordCorrecta) {
        throw new AppError('Credenciales inválidas', 401);
    }

    const token = jwt.sign(
        { id: usuarioBD.id, user: usuarioBD.user },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '2h' }
    );

    const refreshToken = jwt.sign(
        { id: usuarioBD.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    res.json({
        token,
        refreshToken,
        usuario: usuarioBD.user,
        expiresIn: '2h'
    });
});

const refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken: tokenRefresco } = req.body;
    
    if (!tokenRefresco) {
        throw new AppError('Refresh token requerido', 400);
    }

    try {
        const decoded = jwt.verify(tokenRefresco, process.env.JWT_REFRESH_SECRET);
        const newToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '2h' }
        );

        res.json({ token: newToken });
    } catch (err) {
        throw new AppError('Refresh token inválido o expirado', 401);
    }
});

module.exports = {
    login,
    refreshToken
};
