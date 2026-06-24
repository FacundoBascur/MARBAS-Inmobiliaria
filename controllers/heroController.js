const pool = require('../config/db');
const { upload } = require('../config/multer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const fs = require('fs').promises;
const path = require('path');

// Middleware de multer para imágenes del hero (carpeta uploads/hero/)
const multer = require('multer');
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/hero');
        await fs.mkdir(dir, { recursive: true }).catch(() => {});
        cb(null, 'uploads/hero/');
    },
    filename: (req, file, cb) => {
        const nombre = 'hero-' + Date.now() + '-' + Math.random().toString(36).substring(7) +
            path.extname(file.originalname).toLowerCase();
        cb(null, nombre);
    }
});

const TIPOS_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif'];
const filtroArchivos = (req, file, cb) => {
    if (TIPOS_MIME.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Solo se permiten imágenes (jpg, png, webp, gif)', 400));
    }
};

const uploadHero = multer({
    storage,
    fileFilter: filtroArchivos,
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('imagen');

// GET /api/hero-imagenes → público, para el frontend
const getHeroImagenes = catchAsync(async (req, res) => {
    const [rows] = await pool.query(
        'SELECT id, url, orden FROM hero_imagenes WHERE activa = 1 ORDER BY orden ASC, created_at ASC'
    );
    res.json(rows);
});

// POST /api/hero-imagenes → protegido, admin
const createHeroImagen = (req, res, next) => {
    uploadHero(req, res, async (err) => {
        if (err) return next(new AppError(err.message || 'Error al subir imagen', 400));
        if (!req.file) return next(new AppError('No se recibió ningún archivo', 400));

        try {
            const url = `uploads/hero/${req.file.filename}`;
            const orden = parseInt(req.body.orden) || 0;

            const [result] = await pool.query(
                'INSERT INTO hero_imagenes (url, orden) VALUES (?, ?)',
                [url, orden]
            );

            res.status(201).json({ id: result.insertId, url, orden, activa: 1 });
        } catch (error) {
            next(error);
        }
    });
};

// DELETE /api/hero-imagenes/:id → protegido, admin
const deleteHeroImagen = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT url FROM hero_imagenes WHERE id = ?', [id]);
    if (!rows.length) throw new AppError('Imagen no encontrada', 404);

    const filePath = path.join(__dirname, '..', rows[0].url);
    await fs.unlink(filePath).catch(() => {}); // si el archivo no existe, ignora el error

    await pool.query('DELETE FROM hero_imagenes WHERE id = ?', [id]);

    res.json({ mensaje: 'Imagen eliminada correctamente' });
});

module.exports = { getHeroImagenes, createHeroImagen, deleteHeroImagen };
