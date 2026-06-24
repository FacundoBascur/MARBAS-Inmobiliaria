const multer = require('multer');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
    // Si el error tiene statusCode y no es de multer
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ error: 'Archivo muy grande' });
        }
        return res.status(400).json({ error: 'Error en carga de archivo' });
    }
    
    if (err && err.message && err.message.includes('permitidas')) {
        return res.status(400).json({ error: err.message });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    // Errores no esperados
    console.error('Error no capturado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
};

module.exports = errorHandler;
