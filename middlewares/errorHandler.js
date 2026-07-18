const multer = require('multer');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // 1. Errores operacionales nuestros (AppError)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    // 2. Errores de Multer (carga de archivos)
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Archivo muy grande (máx. 10MB)' });
        }
        return res.status(400).json({ error: 'Error en carga de archivo' });
    }

    // 3. Error de CORS
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({ error: 'Origen no permitido' });
    }

    // 4. Errores no esperados
    console.error('Error no capturado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
};

module.exports = errorHandler;
