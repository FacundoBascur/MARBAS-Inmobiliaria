const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');

const validarEmail = (email) => validator.isEmail(email);

const sanitizar = (text) => {
    if (!text) return '';
    // stripLow with keep_new_lines = true to preserve paragraphs
    return validator.trim(validator.stripLow(text, true));
};

async function eliminarArchivos(rutas) {
    for (const ruta of rutas) {
        if (!ruta) continue;
        try {

            await fs.unlink(path.resolve(__dirname, '../', ruta.replace(/\\/g, '/')));
        } catch (e) {

        }
    }
}

module.exports = {
    validarEmail,
    sanitizar,
    eliminarArchivos
};
