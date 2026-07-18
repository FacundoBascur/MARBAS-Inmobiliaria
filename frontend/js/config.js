// -----------------------------------------------
// CONFIGURACIÓN CENTRALIZADA
// Detecta automáticamente si está en local o producción.
// Para producción, cambiar PROD_URL al dominio final.
// -----------------------------------------------
(function () {
    const PROD_URL = ''; // Ej: 'https://marbaspropiedades.com/'

    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const base = isLocal ? 'http://localhost:3000/' : (PROD_URL || window.location.origin + '/');

    window.APP_CONFIG = {
        URL_BASE: base,
        API_BASE_URL: base + 'api',
    };
})();
