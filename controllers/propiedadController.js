const pool = require('../config/db');
const { sanitizar, eliminarArchivos } = require('../utils/helpers');
const fs = require('fs').promises;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const parseJSONSafe = (data) => {
    if (!data) return [];
    if (typeof data === 'object') return Array.isArray(data) ? data : [data];
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
        return [data];
    }
};

const getPropiedades = catchAsync(async (req, res, next) => {
    const [resultados] = await pool.query('SELECT * FROM propiedades');

    const propiedadesFormateadas = resultados.map(prop => {
        const galeriaParseada = parseJSONSafe(prop.galery);
        const tour360Parseado = parseJSONSafe(prop.photo_360);

        return { ...prop, galery: galeriaParseada, photo_360: tour360Parseado };
    });

    res.json(propiedadesFormateadas);
});

const createPropiedad = catchAsync(async (req, res, next) => {
    const { title, price, location, bedrooms, bathroom, meters, tour, description, latitude, longitude } = req.body;

    if (!title || !price || !location) {
        throw new AppError('Campos requeridos faltantes', 400);
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

    await pool.query(consultaSQL, valores);
    res.status(201).json({ mensaje: 'Propiedad guardada exitosamente' });
});

const updatePropiedad = catchAsync(async (req, res, next) => {
    const idPropiedad = parseInt(req.params.id);
    if (isNaN(idPropiedad)) {
        throw new AppError('ID de propiedad inválido', 400);
    }

    const { title, price, location, bedrooms, bathroom, meters, description, tour, latitude, longitude } = req.body;

    if (!title || !price || !location) {
        throw new AppError('Campos requeridos faltantes', 400);
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

    const consultaSQL = `
        UPDATE propiedades 
        SET title = ?, price = ?, location = ?, bedrooms = ?, bathroom = ?, meters = ?, description = ?, tour = ?, latitude = ?, longitude = ?
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
        propiedadData.tour,
        propiedadData.latitude,
        propiedadData.longitude,
        idPropiedad
    ];

    const [resultado] = await pool.query(consultaSQL, valores);

    if (resultado.affectedRows === 0) {
        throw new AppError('Propiedad no encontrada', 404);
    }

    res.json({ mensaje: 'Propiedad actualizada exitosamente' });
});

const deletePropiedad = catchAsync(async (req, res, next) => {
    const idPropiedad = parseInt(req.params.id);
    if (isNaN(idPropiedad)) {
        throw new AppError('ID de propiedad inválido', 400);
    }

    const [resultados] = await pool.query(
        'SELECT image, photo_360, galery FROM propiedades WHERE id = ?',
        [idPropiedad]
    );

    if (resultados.length === 0) {
        throw new AppError('Propiedad no encontrada', 404);
    }

    const casa = resultados[0];

    await pool.query('DELETE FROM propiedades WHERE id = ?', [idPropiedad]);

    let archivosABorrar = [casa.image];

    const galeria = parseJSONSafe(casa.galery);
    archivosABorrar.push(...galeria);

    const fotos360 = parseJSONSafe(casa.photo_360);
    archivosABorrar.push(...fotos360);

    await eliminarArchivos(archivosABorrar);

    res.json({ mensaje: 'Propiedad eliminada exitosamente' });
});

module.exports = {
    getPropiedades,
    createPropiedad,
    updatePropiedad,
    deletePropiedad
};
