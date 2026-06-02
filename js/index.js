const URL_BASE = "http://localhost:3000/";
const API_BASE_URL = `${URL_BASE}api`;

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

document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('main-menu')?.classList.toggle('active');
});

function buildPropertyCard(prop) {
    const card = document.createElement('article');
    card.className = 'card';

    const cardImg = document.createElement('div');
    cardImg.className = 'card-img';
    cardImg.style.backgroundImage = `url('${prop.image}')`;

    if (prop.tour === 1) {
        const badge = document.createElement('span');
        badge.className = 'badge-360';
        badge.textContent = 'Tour 360° disponible';
        cardImg.appendChild(badge);
    }

    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `USD ${new Intl.NumberFormat('es-AR').format(prop.price)}`;

    const title = document.createElement('h3');
    title.textContent = prop.title;

    const location = document.createElement('p');
    location.className = 'loc';
    location.textContent = prop.location;

    const icons = document.createElement('div');
    icons.className = 'icons';
    icons.innerHTML = `
        <span>🛏️ ${prop.bedrooms}</span>
        <span>🚿 ${prop.bathroom}</span>
        <span>📐 ${prop.meters}m²</span>
    `;

    const detailLink = document.createElement('a');
    detailLink.href = `detalle.html?id=${prop.id}`;
    detailLink.className = 'btn-detalle';
    detailLink.textContent = 'Ver Detalle';

    cardContent.append(price, title, location, icons, detailLink);
    card.append(cardImg, cardContent);
    return card;
}

async function cargarPropiedades() {
    const contenedor = document.getElementById('contenedor-propiedades');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    try {
        const propiedadesDeLaBD = await fetchJson(`${API_BASE_URL}/propiedades`);

        if (!Array.isArray(propiedadesDeLaBD) || propiedadesDeLaBD.length === 0) {
            contenedor.innerHTML = "<p style='text-align:center; grid-column: 1 / -1; color: #333;'>No hay propiedades disponibles.</p>";
            return;
        }

        const fragment = document.createDocumentFragment();
        propiedadesDeLaBD.forEach(prop => {
            fragment.appendChild(buildPropertyCard(prop));
        });

        contenedor.appendChild(fragment);
    } catch (error) {
        console.error("Error al conectar con la base de datos:", error);
        contenedor.innerHTML = "<p style='text-align:center; grid-column: 1 / -1; color: red;'>Error al cargar las propiedades.</p>";
    }
}

// Ejecutamos la función apenas carga la página
cargarPropiedades();

// ---ENVIAR FORMULARIO DE CONTACTO ---
const formContacto = document.getElementById('form-contacto');

if (formContacto) {
    formContacto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const mensajeRespuesta = document.getElementById('mensaje-respuesta');
        const botonEnviar = formContacto.querySelector('.btn-submit');

        const nombre = e.target.nombre.value.trim();
        const telefono = e.target.telefono.value.trim();
        const email = e.target.email.value.trim();
        const mensaje = e.target.mensaje.value.trim();

        if (!nombre || !email || !mensaje) {
            setMessage(mensajeRespuesta, 'Completa nombre, email y mensaje antes de enviar.', 'red');
            return;
        }

        setMessage(mensajeRespuesta, 'Enviando mensaje, por favor esperá...', 'var(--primary-blue)');
        botonEnviar.disabled = true;
        botonEnviar.innerText = 'Enviando...';

        try {
            await fetchJson(`${API_BASE_URL}/contacto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, telefono, email, mensaje })
            });

            setMessage(mensajeRespuesta, '¡Mensaje enviado con éxito! Nos pondremos en contacto a la brevedad.', 'green');
            formContacto.reset();
        } catch (error) {
            console.error('Error enviando correo:', error);
            setMessage(mensajeRespuesta, 'Error al enviar el mensaje. Intentá nuevamente.', 'red');
        } finally {
            botonEnviar.disabled = false;
            botonEnviar.innerText = 'Enviar Mensaje';
        }
    });
}
