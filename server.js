require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Verificar variables de entorno requeridas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASSWORD'];
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
        if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Echo the origin instead of throwing Error to prevent crashes during dev
            callback(null, origin);
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

// Manejo de errores globales (debe ir después de las rutas)
app.use(errorHandler);

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ error: 'No encontrado' });
});

// Inicialización del servidor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Servidor en puerto ${PUERTO}`);
});