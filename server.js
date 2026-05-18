const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors()); 
app.use(express.json()); 
app.use('/uploads', express.static('uploads')); 

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'marbas' 
});

conexion.connect((error) => {
    if (error) console.error('Error de conexión a la BD:', error);
    else console.log('¡Conectado a MySQL con éxito!');
});

const CLAVE_SECRETA = 'MarbasSecreto2026'; 

app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;
    conexion.query('SELECT * FROM useradmin WHERE user = ?', [usuario], async (error, resultados) => {
        if (error) return res.status(500).json({ error: 'Error interno del servidor' });
        if (resultados.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

        const usuarioBD = resultados[0];
        const passwordCorrecta = await bcrypt.compare(password, usuarioBD.password);

        if (passwordCorrecta) {
            const token = jwt.sign({ id: usuarioBD.id, user: usuarioBD.user }, CLAVE_SECRETA, { expiresIn: '2h' });
            res.json({ token: token }); 
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    });
});

function verificarToken(req, res, next) {
    const headerAuth = req.header('Authorization');
    if (!headerAuth) return res.status(401).json({ error: 'Acceso denegado.' });

    try {
        const tokenLimpio = headerAuth.replace('Bearer ', '');
        req.user = jwt.verify(tokenLimpio, CLAVE_SECRETA);
        next(); 
    } catch (error) {
        res.status(401).json({ error: 'Token vencido o inválido.' });
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const codigoUnico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const nombreLimpio = file.originalname.replace(/\s+/g, '-'); 
        cb(null, codigoUnico + '-' + nombreLimpio); 
    }
});
const upload = multer({ storage: storage });

app.get('/api/propiedades', (req, res) => {
    conexion.query('SELECT * FROM propiedades', (error, resultados) => {
        if (error) return res.status(500).json({ error: 'Error al obtener datos' });

        const propiedadesFormateadas = resultados.map(prop => {
            let galeriaParseada = [];
            let tour360Parseado = []; 
            
            try { galeriaParseada = prop.galery ? JSON.parse(prop.galery) : []; } 
            catch (err) { console.error(`Omitiendo galería corrupta en ID ${prop.id}`); }
            
            try { 
                tour360Parseado = prop.photo_360 ? JSON.parse(prop.photo_360) : [];
                if (!Array.isArray(tour360Parseado)) tour360Parseado = [prop.photo_360];
            } 
            catch (err) { 
                tour360Parseado = prop.photo_360 ? [prop.photo_360] : []; 
            }

            return { ...prop, galery: galeriaParseada, photo_360: tour360Parseado };
        });
        res.json(propiedadesFormateadas);
    });
});

const configuracionSubida = upload.fields([
    { name: 'foto_principal', maxCount: 1 }, 
    { name: 'photo_360', maxCount: 15 }, 
    { name: 'fotos_galeria', maxCount: 15 }
]);

app.post('/api/propiedades', verificarToken, configuracionSubida, (req, res) => {
    // --- CAMBIO: Atrapamos latitude y longitude ---
    const { title, price, location, bedrooms, bathroom, meters, tour, description, latitude, longitude } = req.body;

    const fotoPrincipal = req.files['foto_principal'] ? req.files['foto_principal'][0] : null;
    const imagePath = fotoPrincipal ? 'uploads/' + fotoPrincipal.filename : '';
    
    let photo360Paths = [];
    if (req.files['photo_360']) {
        photo360Paths = req.files['photo_360'].map(file => 'uploads/' + file.filename);
    }
    
    let galeryPaths = [];
    if (req.files['fotos_galeria']) {
        req.files['fotos_galeria'].forEach(file => {
            if (fotoPrincipal && file.originalname === fotoPrincipal.originalname) {
                fs.unlink(file.path, () => {}); 
            } else {
                galeryPaths.push('uploads/' + file.filename);
            }
        });
    }
    
    // --- CAMBIO: Agregamos latitude y longitude a la consulta SQL ---
    const consultaSQL = `INSERT INTO propiedades (title, price, location, bedrooms, bathroom, meters, description, image, photo_360, galery, tour, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    // Si la coordenada viene vacía, le guardamos null para que la BD no se queje
    const valores = [title, price, location, bedrooms, bathroom, meters, description, imagePath, JSON.stringify(photo360Paths), JSON.stringify(galeryPaths), tour, latitude || null, longitude || null];

    conexion.query(consultaSQL, valores, (error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Fallo al guardar la propiedad' });
        }
        res.json({ mensaje: '¡Propiedad guardada!' });
    });
});

app.put('/api/propiedades/:id', verificarToken, (req, res) => {
    const idPropiedad = req.params.id;
    // --- CAMBIO: Atrapamos latitude y longitude ---
    const { title, price, location, bedrooms, bathroom, meters, description, latitude, longitude } = req.body;

    // --- CAMBIO: Agregamos latitude y longitude al UPDATE ---
    const consultaSQL = `
        UPDATE propiedades 
        SET title = ?, price = ?, location = ?, bedrooms = ?, bathroom = ?, meters = ?, description = ?, latitude = ?, longitude = ?
        WHERE id = ?
    `;
    const valores = [title, price, location, bedrooms, bathroom, meters, description, latitude || null, longitude || null, idPropiedad];

    conexion.query(consultaSQL, valores, (error) => {
        if (error) {
            console.error('Error al actualizar:', error);
            res.status(500).json({ error: 'Fallo al actualizar la propiedad' });
        } else {
            res.json({ mensaje: '¡Datos de la propiedad actualizados!' });
        }
    });
});

app.delete('/api/propiedades/:id', verificarToken, (req, res) => {
    const idPropiedad = req.params.id;

    conexion.query('SELECT image, photo_360, galery FROM propiedades WHERE id = ?', [idPropiedad], (errSelect, resultados) => {
        if (errSelect || resultados.length === 0) return res.status(404).json({ error: 'Propiedad no encontrada' });

        const casa = resultados[0];

        conexion.query('DELETE FROM propiedades WHERE id = ?', [idPropiedad], (errDelete) => {
            if (errDelete) return res.status(500).json({ error: 'Fallo al eliminar de BD' });

            let archivosABorrar = [casa.image];
            
            try { if (casa.galery) archivosABorrar.push(...JSON.parse(casa.galery)); } 
            catch (e) { console.error('Error parseando galería para eliminar'); }
            
            try { 
                if (casa.photo_360) {
                    const fotos360 = JSON.parse(casa.photo_360);
                    if (Array.isArray(fotos360)) archivosABorrar.push(...fotos360);
                    else archivosABorrar.push(casa.photo_360); 
                }
            } 
            catch (e) { 
                if (casa.photo_360) archivosABorrar.push(casa.photo_360); 
            }

            archivosABorrar.forEach(rutaRelativa => {
                if (!rutaRelativa) return;
                const rutaLimpia = rutaRelativa.replace(/\\/g, '/');
                const rutaFisica = path.resolve(__dirname, rutaLimpia); 
                fs.unlink(rutaFisica, () => {}); 
            });

            res.json({ mensaje: '¡Propiedad eliminada con éxito!' });
        });
    });
});

app.post('/api/contacto', async (req, res) => {
    const { nombre, telefono, email, mensaje } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'marbaspropiedades@gmail.com',
            pass: 'vdktnysxrnruodfg' 
        }
    });

    const mailOptions = {
        from: '"Web Marbas" <marbaspropiedades@gmail.com>', 
        to: 'marbaspropiedades@gmail.com', 
        replyTo: email, 
        subject: `Nueva consulta de ${nombre}`,
        text: `Datos del contacto:\n\nNombre: ${nombre}\nTeléfono: ${telefono}\nEmail: ${email}\n\nMensaje:\n${mensaje}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ mensaje: '¡Correo enviado con éxito!' });
    } catch (error) {
        console.error('Error enviando correo:', error);
        res.status(500).json({ error: 'Fallo al enviar el correo' });
    }
});

const PUERTO = 3000;
app.listen(PUERTO, () => {
    console.log(`Servidor activo en el puerto ${PUERTO}`);
});