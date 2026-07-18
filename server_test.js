require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Verificar variables de entorno requeridas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'EMAIL_USER', 'EMAIL_PASSWORD'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`Error: Variable de entorno ${varName} no configurada`);
        process.exit(1);
    }
});

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const propiedadRoutes = require('./routes/propiedadRoutes');
const contactoRoutes = require('./routes/contactoRoutes');
const heroRoutes = require('./routes/heroRoutes');

// Importar middlewares globales
const { limiterGeneral } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(compression());
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
        // Permitir requests sin origin (mobile apps, curl, etc.)
        if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS bloqueado para origin: ${origin}`);
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Rate limiting global
app.use(limiterGeneral);

// Rutas de la API
app.use('/api', authRoutes);
app.use('/api/propiedades', propiedadRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/hero-imagenes', heroRoutes);

// Ruta no encontrada (debe ir ANTES del error handler)
app.use((req, res) => {
    res.status(404).json({ error: 'No encontrado' });
});

// Manejo de errores globales (debe ir al final)
app.use(errorHandler);

// Inicialización del servidor
const PUERTO = 3003;
app.listen(PUERTO, () => {
    console.log(`Servidor de prueba en puerto ${PUERTO}`);
});