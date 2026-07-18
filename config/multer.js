const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const EXTENSIONES = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif'];
const TIPOS_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        // Asumimos que multer.js se ejecuta desde la raíz o aseguramos que uploads/ se cree en la raíz
        const dir = path.join(__dirname, '../uploads');
        await fs.mkdir(dir, { recursive: true }).catch(() => {});
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const nombre = Date.now() + '-' + Math.random().toString(36).substring(7) + '-' + 
                       file.originalname.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-\.]/g, '');
        cb(null, nombre);
    }
});

const filtroArchivos = (req, file, cb) => {
    const extension = path.extname(file.originalname).slice(1).toLowerCase();
    if (EXTENSIONES.includes(extension) && TIPOS_MIME.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo imágenes permitidas'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: filtroArchivos,
    limits: { fileSize: MAX_FILE_SIZE }
});

const configuracionSubida = upload.fields([
    { name: 'foto_principal', maxCount: 1 },
    { name: 'photo_360', maxCount: 15 },
    { name: 'fotos_galeria', maxCount: 15 }
]);

module.exports = {
    upload,
    configuracionSubida
};
