require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const validator = require('validator');

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASSWORD'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`Error: Variable de entorno ${varName} no configurada`);
        process.exit(1);
    }
});

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(compression());
app.use(cors({
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static('uploads'));

const limiterGeneral = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
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

app.use(limiterGeneral);

// ============================================
// POOL DE CONEXIONES MYSQL
// ============================================
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection().then(() => {
    console.log('Conectado a MySQL');
}).catch(error => {
    console.error('Error BD:', error.message);
    process.exit(1);
});

// ============================================
// CONFIGURACIÓN DE NODEMAILER
// ============================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
});

transporter.verify((error) => {
    if (error) console.log('Email no verificado:', error.message);
    else console.log('Email configurado y listo para mandar');
});

// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================
const EXTENSIONES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const TIPOS_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        await fs.mkdir('uploads', { recursive: true }).catch(() => {});
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

// ============================================
// FUNCIONES AUXILIARES
// ============================================

const validarEmail = (email) => validator.isEmail(email);

function verificarToken(req, res, next) {
    try {
        const auth = req.header('Authorization');
        if (!auth) return res.status(401).json({ error: 'Token requerido' });
        const token = auth.replace('Bearer ', '').trim();
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: error.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido' });
    }
}

async function eliminarArchivos(rutas) {
    for (const ruta of rutas) {
        if (!ruta) continue;
        try {
            await fs.unlink(path.resolve(__dirname, ruta.replace(/\\/g, '/')));
        } catch (e) {}
    }
}

const sanitizar = (text) => validator.trim(validator.stripLow(text)).substring(0, 1000);

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

app.post('/api/login', limiterLogin, async (req, res) => {
    try {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        const connection = await pool.getConnection();
        try {
            const [resultados] = await connection.query(
                'SELECT id, user, password FROM useradmin WHERE user = ? LIMIT 1',
                [usuario.substring(0, 100)]
            );

            if (resultados.length === 0) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const usuarioBD = resultados[0];
            const passwordCorrecta = await bcrypt.compare(password, usuarioBD.password);

            if (passwordCorrecta) {
                const token = jwt.sign(
                    { id: usuarioBD.id, user: usuarioBD.user },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRE || '2h' }
                );

                const refreshToken = jwt.sign(
                    { id: usuarioBD.id },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
                );

                res.json({
                    token,
                    refreshToken,
                    usuario: usuarioBD.user,
                    expiresIn: '2h'
                });
            } else {
                res.status(401).json({ error: 'Credenciales inválidas' });
            }
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token requerido' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const newToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '2h' }
        );

        res.json({ token: newToken });
    } catch (error) {
        res.status(401).json({ error: 'Refresh token inválido' });
    }
});

// ============================================
// RUTAS DE PROPIEDADES
// ============================================

app.get('/api/propiedades', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [resultados] = await connection.query('SELECT * FROM propiedades');

            const propiedadesFormateadas = resultados.map(prop => {
                let galeriaParseada = [];
                let tour360Parseado = [];

                try {
                    galeriaParseada = prop.galery ? JSON.parse(prop.galery) : [];
                } catch (err) {
                    console.warn(`⚠️  Galería corrupta en ID ${prop.id}`);
                }

                try {
                    tour360Parseado = prop.photo_360 ? JSON.parse(prop.photo_360) : [];
                    if (!Array.isArray(tour360Parseado)) tour360Parseado = [prop.photo_360];
                } catch (err) {
                    tour360Parseado = prop.photo_360 ? [prop.photo_360] : [];
                }

                return { ...prop, galery: galeriaParseada, photo_360: tour360Parseado };
            });

            res.json(propiedadesFormateadas);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al obtener propiedades:', error);
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

app.post('/api/propiedades', verificarToken, configuracionSubida, async (req, res) => {
    try {
        const { title, price, location, bedrooms, bathroom, meters, tour, description, latitude, longitude } = req.body;

        if (!title || !price || !location) {
            return res.status(400).json({ error: 'Campos requeridos faltantes' });
        }

        const propiedadData = {
            title: sanitizar(title).substring(0, 200),
            price: parseFloat(price) || 0,
            location: sanitizar(location).substring(0, 500),
            bedrooms: parseInt(bedrooms) || 0,
            bathroom: parseInt(bathroom) || 0,
            meters: parseFloat(meters) || 0,
            description: sanitizar(description),
            tour: sanitizar(tour).substring(0, 50),
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null
        };

        const fotoPrincipal = req.files['foto_principal'] ? req.files['foto_principal'][0] : null;
        const imagePath = fotoPrincipal ? 'uploads/' + fotoPrincipal.filename : '';

        let photo360Paths = [];
        if (req.files['photo_360']) {
            photo360Paths = req.files['photo_360'].map(file => 'uploads/' + file.filename);
        }

        let galeryPaths = [];
        if (req.files['fotos_galeria']) {
            for (const file of req.files['fotos_galeria']) {
                if (!fotoPrincipal || file.originalname !== fotoPrincipal.originalname) {
                    galeryPaths.push('uploads/' + file.filename);
                } else {
                    await fs.unlink(file.path).catch(() => {});
                }
            }
        }

        const connection = await pool.getConnection();
        try {
            const consultaSQL = `
                INSERT INTO propiedades 
                (title, price, location, bedrooms, bathroom, meters, description, image, photo_360, galery, tour, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const valores = [
                propiedadData.title,
                propiedadData.price,
                propiedadData.location,
                propiedadData.bedrooms,
                propiedadData.bathroom,
                propiedadData.meters,
                propiedadData.description,
                imagePath,
                JSON.stringify(photo360Paths),
                JSON.stringify(galeryPaths),
                propiedadData.tour,
                propiedadData.latitude,
                propiedadData.longitude
            ];

            await connection.query(consultaSQL, valores);
            res.status(201).json({ mensaje: 'Propiedad guardada exitosamente' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al guardar propiedad:', error);
        res.status(500).json({ error: 'Error al guardar la propiedad' });
    }
});

app.put('/api/propiedades/:id', verificarToken, async (req, res) => {
    try {
        const idPropiedad = parseInt(req.params.id);
        if (isNaN(idPropiedad)) {
            return res.status(400).json({ error: 'ID de propiedad inválido' });
        }

        const { title, price, location, bedrooms, bathroom, meters, description, latitude, longitude } = req.body;

        if (!title || !price || !location) {
            return res.status(400).json({ error: 'Campos requeridos faltantes' });
        }

        const propiedadData = {
            title: sanitizar(title).substring(0, 200),
            price: parseFloat(price) || 0,
            location: sanitizar(location).substring(0, 500),
            bedrooms: parseInt(bedrooms) || 0,
            bathroom: parseInt(bathroom) || 0,
            meters: parseFloat(meters) || 0,
            description: sanitizar(description),
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null
        };

        const connection = await pool.getConnection();
        try {
            const consultaSQL = `
                UPDATE propiedades 
                SET title = ?, price = ?, location = ?, bedrooms = ?, bathroom = ?, meters = ?, description = ?, latitude = ?, longitude = ?
                WHERE id = ?
            `;

            const valores = [
                propiedadData.title,
                propiedadData.price,
                propiedadData.location,
                propiedadData.bedrooms,
                propiedadData.bathroom,
                propiedadData.meters,
                propiedadData.description,
                propiedadData.latitude,
                propiedadData.longitude,
                idPropiedad
            ];

            const [resultado] = await connection.query(consultaSQL, valores);

            if (resultado.affectedRows === 0) {
                return res.status(404).json({ error: 'Propiedad no encontrada' });
            }

            res.json({ mensaje: 'Propiedad actualizada exitosamente' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al actualizar propiedad:', error);
        res.status(500).json({ error: 'Error al actualizar la propiedad' });
    }
});

app.delete('/api/propiedades/:id', verificarToken, async (req, res) => {
    try {
        const idPropiedad = parseInt(req.params.id);
        if (isNaN(idPropiedad)) {
            return res.status(400).json({ error: 'ID de propiedad inválido' });
        }

        const connection = await pool.getConnection();
        try {
            const [resultados] = await connection.query(
                'SELECT image, photo_360, galery FROM propiedades WHERE id = ?',
                [idPropiedad]
            );

            if (resultados.length === 0) {
                return res.status(404).json({ error: 'Propiedad no encontrada' });
            }

            const casa = resultados[0];

            await connection.query('DELETE FROM propiedades WHERE id = ?', [idPropiedad]);

            let archivosABorrar = [casa.image];

            try {
                if (casa.galery) {
                    const galeria = JSON.parse(casa.galery);
                    if (Array.isArray(galeria)) archivosABorrar.push(...galeria);
                }
            } catch (e) {
                console.warn('Error parseando galería');
            }

            try {
                if (casa.photo_360) {
                    const fotos360 = JSON.parse(casa.photo_360);
                    if (Array.isArray(fotos360)) archivosABorrar.push(...fotos360);
                    else archivosABorrar.push(casa.photo_360);
                }
            } catch (e) {
                if (casa.photo_360) archivosABorrar.push(casa.photo_360);
            }

            await eliminarArchivos(archivosABorrar);

            res.json({ mensaje: 'Propiedad eliminada exitosamente' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        res.status(500).json({ error: 'Error al eliminar la propiedad' });
    }
});

// ============================================
// RUTAS DE CONTACTO
// ============================================

app.post('/api/contacto', limiterEmail, async (req, res) => {
    try {
        const { nombre, telefono, email, propiedad, mensaje } = req.body;

        if (!nombre || !email || !mensaje) {
            return res.status(400).json({ error: 'Campos requeridos faltantes' });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        const contactoData = {
            nombre: sanitizar(nombre).substring(0, 100),
            telefono: sanitizar(telefono).substring(0, 20),
            email: validator.normalizeEmail(email),
            propiedad: propiedad ? sanitizar(propiedad).substring(0, 200) : null,
            mensaje: sanitizar(mensaje).substring(0, 5000)
        };

        const textBody = `Nueva consulta de ${contactoData.nombre}\n${contactoData.propiedad ? 'Propiedad: ' + contactoData.propiedad + '\n' : ''}Mensaje:\n${contactoData.mensaje}`;

        const htmlPropiedad = contactoData.propiedad ? `<p><strong>Propiedad:</strong> ${validator.escape(contactoData.propiedad)}</p>` : '';

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_USER,
            replyTo: contactoData.email,
            subject: `Nueva consulta de ${contactoData.nombre}`,
            text: textBody,
            html: `
                <h2>Nueva Consulta de Contacto</h2>
                <p><strong>Nombre:</strong> ${validator.escape(contactoData.nombre)}</p>
                <p><strong>Teléfono:</strong> ${validator.escape(contactoData.telefono)}</p>
                <p><strong>Email:</strong> ${validator.escape(contactoData.email)}</p>
                ${htmlPropiedad}
                <hr/>
                <h3>Mensaje:</h3>
                <p>${validator.escape(contactoData.mensaje).replace(/\n/g, '<br>')}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ mensaje: 'Correo enviado exitosamente' });
    } catch (error) {
        console.error('Error email:', error);
        res.status(500).json({ error: 'Error al enviar' });
    }
});

// Error handlers
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ error: 'Archivo muy grande' });
        }
        return res.status(400).json({ error: 'Error en carga' });
    }
    if (error && error.message && error.message.includes('permitidas')) {
        return res.status(400).json({ error: error.message });
    }
    next(error);
});

app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'No encontrado' });
});

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Servidor en puerto ${PUERTO}`);
});