// -----------------------------------------------
// FUNCIONES COMPARTIDAS (index.js + detalle.js)
// Requiere config.js cargado previamente
// -----------------------------------------------

// -----------------------------------------------
// MENÚ MÓVIL
// -----------------------------------------------
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('main-menu')?.classList.toggle('active');
});

// -----------------------------------------------
// UTILIDADES
// -----------------------------------------------
function setMessage(element, text, color) {
    if (!element) return;
    element.textContent = text;
    element.style.color = color;
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    let body = null;

    try {
        body = text ? JSON.parse(text) : null;
    } catch (err) {
        body = null;
    }

    if (!response.ok) {
        const error = body?.error || body?.message || response.statusText;
        throw new Error(error);
    }

    return body;
}

function getById(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getById(id);
    if (element) {
        element.textContent = value;
    }
}

function safeJsonParse(value, fallback = []) {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return fallback;

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
    } catch (err) {
        return [value];
    }
}
