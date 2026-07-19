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
    const [resultados] = await pool.query('SELECT * FROM propiedades WHERE is_public = 1');

    const propiedadesFormateadas = resultados.map(prop => {
        const galeriaParseada = parseJSONSafe(prop.galery);
        const tour360Parseado = parseJSONSafe(prop.photo_360);

        return { ...prop, galery: galeriaParseada, photo_360: tour360Parseado };
    });

    res.json(propiedadesFormateadas);
});

const getTodasPropiedades = catchAsync(async (req, res, next) => {
    const [resultados] = await pool.query('SELECT * FROM propiedades');

    const propiedadesFormateadas = resultados.map(prop => {
        const galeriaParseada = parseJSONSafe(prop.galery);
        const tour360Parseado = parseJSONSafe(prop.photo_360);

        return { ...prop, galery: galeriaParseada, photo_360: tour360Parseado };
    });

    res.json(propiedadesFormateadas);
});

const getPropiedadById = catchAsync(async (req, res, next) => {
    const idPropiedad = parseInt(req.params.id);
    if (isNaN(idPropiedad)) {
        throw new AppError('ID de propiedad inválido', 400);
    }

    const [resultados] = await pool.query('SELECT * FROM propiedades WHERE id = ?', [idPropiedad]);

    if (resultados.length === 0) {
        throw new AppError('Propiedad no encontrada', 404);
    }

    const prop = resultados[0];
    prop.galery = parseJSONSafe(prop.galery);
    prop.photo_360 = parseJSONSafe(prop.photo_360);

    res.json(prop);
});

const createPropiedad = catchAsync(async (req, res, next) => {
    const { title, price, location, bedrooms, bathroom, meters, tour, description, latitude, longitude, operation_type, currency, is_public } = req.body;

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
        tour: parseInt(tour) ? 1 : 0,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        operation_type: sanitizar(operation_type || 'En Venta').substring(0, 50),
        currency: sanitizar(currency || 'USD').substring(0, 10),
        is_public: is_public !== undefined ? (parseInt(is_public) ? 1 : 0) : 1
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
        (title, price, location, bedrooms, bathroom, meters, description, image, photo_360, galery, tour, latitude, longitude, operation_type, currency, is_public)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        propiedadData.longitude,
        propiedadData.operation_type,
        propiedadData.currency,
        propiedadData.is_public
    ];

    await pool.query(consultaSQL, valores);
    res.status(201).json({ mensaje: 'Propiedad guardada exitosamente' });
});

const updatePropiedad = catchAsync(async (req, res, next) => {
    const idPropiedad = parseInt(req.params.id);
    if (isNaN(idPropiedad)) {
        throw new AppError('ID de propiedad inválido', 400);
    }

    const { title, price, location, bedrooms, bathroom, meters, description, tour, latitude, longitude, operation_type, currency, is_public } = req.body;

    if (!title || !price || !location) {
        throw new AppError('Campos requeridos faltantes', 400);
    }

    // Parsear imágenes a eliminar
    let imagenesAEliminar = [];
    if (req.body.imagenes_a_eliminar) {
        try {
            imagenesAEliminar = JSON.parse(req.body.imagenes_a_eliminar);
            if (!Array.isArray(imagenesAEliminar)) imagenesAEliminar = [imagenesAEliminar];
        } catch (err) {
            imagenesAEliminar = [req.body.imagenes_a_eliminar];
        }
    }

    // Obtener la propiedad actual para manipular los arrays de imágenes
    const [propiedadesBD] = await pool.query('SELECT image, galery, photo_360 FROM propiedades WHERE id = ?', [idPropiedad]);
    if (propiedadesBD.length === 0) {
        throw new AppError('Propiedad no encontrada', 404);
    }
    const propiedadActual = propiedadesBD[0];
    let galeriaActual = parseJSONSafe(propiedadActual.galery);
    let fotos360Actuales = parseJSONSafe(propiedadActual.photo_360);
    let imagePath = propiedadActual.image;

    // 1. Eliminar imágenes marcadas (física y lógicamente)
    if (imagenesAEliminar.length > 0) {
        await eliminarArchivos(imagenesAEliminar);
        galeriaActual = galeriaActual.filter(img => !imagenesAEliminar.includes(img));
        fotos360Actuales = fotos360Actuales.filter(img => !imagenesAEliminar.includes(img));
        // Si borra la foto principal (poco común pero por las dudas)
        if (imagenesAEliminar.includes(imagePath)) {
            imagePath = '';
        }
    }

    // 2. Procesar nuevas imágenes subidas
    const fotoPrincipalNueva = req.files && req.files['foto_principal'] ? req.files['foto_principal'][0] : null;
    if (fotoPrincipalNueva) {
        if (imagePath) await eliminarArchivos([imagePath]); // Borrar la vieja
        imagePath = 'uploads/' + fotoPrincipalNueva.filename;
    }

    if (req.files && req.files['photo_360']) {
        const nuevas360 = req.files['photo_360'].map(file => 'uploads/' + file.filename);
        fotos360Actuales = [...fotos360Actuales, ...nuevas360];
    }

    if (req.files && req.files['fotos_galeria']) {
        for (const file of req.files['fotos_galeria']) {
            if (!fotoPrincipalNueva || file.originalname !== fotoPrincipalNueva.originalname) {
                galeriaActual.push('uploads/' + file.filename);
            } else {
                await fs.unlink(file.path).catch(() => {});
            }
        }
    }

    // 3. Si la foto principal fue eliminada y no se subió una nueva,
    // usar la primera foto de la galería (si existe) como portada.
    if (!imagePath && galeriaActual.length > 0) {
        imagePath = galeriaActual.shift(); // Quitamos de la galería y la ponemos de portada
    }

    const propiedadData = {
        title: sanitizar(title).substring(0, 200),
        price: parseFloat(price) || 0,
        location: sanitizar(location).substring(0, 500),
        bedrooms: parseInt(bedrooms) || 0,
        bathroom: parseInt(bathroom) || 0,
        meters: parseFloat(meters) || 0,
        description: sanitizar(description),
        tour: parseInt(tour) ? 1 : 0,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        operation_type: sanitizar(operation_type || 'En Venta').substring(0, 50),
        currency: sanitizar(currency || 'USD').substring(0, 10),
        is_public: is_public !== undefined ? (parseInt(is_public) ? 1 : 0) : 1
    };

    const consultaSQL = `
        UPDATE propiedades 
        SET title = ?, price = ?, location = ?, bedrooms = ?, bathroom = ?, meters = ?, description = ?, tour = ?, latitude = ?, longitude = ?, operation_type = ?, currency = ?, image = ?, galery = ?, photo_360 = ?, is_public = ?
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
        propiedadData.operation_type,
        propiedadData.currency,
        imagePath,
        JSON.stringify(galeriaActual),
        JSON.stringify(fotos360Actuales),
        propiedadData.is_public,
        idPropiedad
    ];

    await pool.query(consultaSQL, valores);

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
    getTodasPropiedades,
    getPropiedadById,
    createPropiedad,
    updatePropiedad,
    deletePropiedad
};
