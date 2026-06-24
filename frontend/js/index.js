const URL_BASE = "http://localhost:3000/";
const API_BASE_URL = `${URL_BASE}api`;

// -----------------------------------------------
// MENÚ MÓVIL
// -----------------------------------------------
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('main-menu')?.classList.toggle('active');
});

// -----------------------------------------------
// HERO SLIDESHOW
// -----------------------------------------------
async function initHeroSlideshow() {
    const slidesContainer = document.getElementById('hero-slides');
    const dotsContainer   = document.getElementById('hero-dots');
    if (!slidesContainer) return;

    let imagenes = [];
    try {
        const res = await fetch(`${API_BASE_URL}/hero-imagenes`);
        if (res.ok) imagenes = await res.json();
    } catch { /* fallback silencioso */ }

    // Sin imágenes en BD → fallback estático
    if (!Array.isArray(imagenes) || imagenes.length === 0) {
        const slide = document.createElement('div');
        slide.className = 'hero-slide hero-slide-fallback activa';
        slidesContainer.appendChild(slide);
        return;
    }

    // Crear slides
    imagenes.forEach((img, i) => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.style.backgroundImage = `url('${URL_BASE}${img.url}')`;
        slidesContainer.appendChild(slide);
    });

    const slides = Array.from(slidesContainer.querySelectorAll('.hero-slide'));

    // Iniciar la primera slide con Ken Burns
    function activarSlide(slide) {
        slide.classList.add('activa');
        // Doble rAF garantiza que el navegador pintó opacity:1 antes de iniciar el zoom
        requestAnimationFrame(() => requestAnimationFrame(() => {
            slide.classList.add('zoom');
        }));
    }

    // Desactivar slide: fade-out SIN resetear el scale (evita el salto)
    function desactivarSlide(slide) {
        slide.classList.remove('activa');
        // Cuando termina el fade (1.5s), resetear scale silenciosamente
        // desactivando temporalmente la transition de transform
        setTimeout(() => {
            slide.style.transition = 'none';       // sin animación
            slide.classList.remove('zoom');         // vuelve a scale(1) instantáneamente
            // Forzar repaint, luego restaurar transition normal
            requestAnimationFrame(() => requestAnimationFrame(() => {
                slide.style.transition = '';
            }));
        }, 1600); // un poquito más que la transition de opacity (1.5s)
    }

    // Activar primera
    activarSlide(slides[0]);
    let indiceActual = 0;

    if (slides.length === 1) return; // solo 1 imagen → sin rotación ni dots

    // Crear dots
    if (dotsContainer) {
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'hero-dot' + (i === 0 ? ' activo' : '');
            dot.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
            dot.addEventListener('click', () => irASlide(i));
            dotsContainer.appendChild(dot);
        });
    }

    const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.hero-dot')) : [];

    function irASlide(nuevoIndice) {
        if (nuevoIndice === indiceActual) return;
        desactivarSlide(slides[indiceActual]);
        if (dots.length) dots[indiceActual].classList.remove('activo');

        indiceActual = nuevoIndice;
        activarSlide(slides[indiceActual]);
        if (dots.length) dots[indiceActual].classList.add('activo');
    }

    // Rotar cada 6 segundos (un poco más que la duración visual del Ken Burns)
    let intervalo = setInterval(() => irASlide((indiceActual + 1) % slides.length), 6000);

    // Pausar al hacer hover
    const heroSection = document.getElementById('inicio');
    heroSection?.addEventListener('mouseenter', () => clearInterval(intervalo));
    heroSection?.addEventListener('mouseleave', () => {
        intervalo = setInterval(() => irASlide((indiceActual + 1) % slides.length), 6000);
    });
}

initHeroSlideshow();


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

// -----------------------------------------------
// CONSTRUIR TARJETA (con wrapper para zoom)
// -----------------------------------------------
function buildPropertyCard(prop) {
    const card = document.createElement('article');
    card.className = 'card';

    // Wrapper para el zoom de imagen
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'card-img-wrapper';

    const cardImg = document.createElement('div');
    cardImg.className = 'card-img';
    cardImg.style.backgroundImage = `url('${URL_BASE}${prop.image}')`;

    if (prop.tour === 1) {
        const badge = document.createElement('span');
        badge.className = 'badge-360';
        badge.textContent = 'Tour 360°';
        imgWrapper.appendChild(badge);
    }

    imgWrapper.appendChild(cardImg);

    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `USD ${new Intl.NumberFormat('es-AR').format(prop.price)}`;

    const title = document.createElement('h3');
    title.textContent = prop.title;

    const location = document.createElement('p');
    location.className = 'loc';
    location.textContent = `📍 ${prop.location}`;

    const icons = document.createElement('div');
    icons.className = 'icons';
    icons.innerHTML = `
        <span>🛏️ ${prop.bedrooms} hab.</span>
        <span>🚿 ${prop.bathroom} baños</span>
        <span>📐 ${prop.meters}m²</span>
    `;

    const detailLink = document.createElement('a');
    detailLink.href = `detalle.html?id=${prop.id}`;
    detailLink.className = 'btn-detalle';
    detailLink.textContent = 'Ver Detalle';

    cardContent.append(price, title, location, icons, detailLink);
    card.append(imgWrapper, cardContent);
    return card;
}

// -----------------------------------------------
// FILTROS (con normalización de acentos)
// -----------------------------------------------
let todasLasPropiedades = [];

// Normaliza texto: minuscúlas + sin acentos
function normalizar(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // elimina los diacríticos (tildes)
}

function aplicarFiltros() {
    const ubicacion = normalizar(document.getElementById('filtro-ubicacion')?.value || '');
    const precioMin = parseFloat(document.getElementById('filtro-precio-min')?.value) || 0;
    const precioMax = parseFloat(document.getElementById('filtro-precio-max')?.value) || Infinity;

    const filtradas = todasLasPropiedades.filter(prop => {
        const matchUbicacion = !ubicacion ||
            normalizar(prop.location).includes(ubicacion) ||
            normalizar(prop.title).includes(ubicacion);
        const matchPrecio = prop.price >= precioMin && prop.price <= precioMax;
        return matchUbicacion && matchPrecio;
    });

    renderPropiedades(filtradas);
}

function renderPropiedades(lista) {
    const contenedor = document.getElementById('contenedor-propiedades');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (!lista.length) {
        contenedor.innerHTML = `<p style='text-align:center; grid-column: 1 / -1; color: #888; padding: 3rem;'>No se encontraron propiedades con esos criterios.</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    lista.forEach(prop => fragment.appendChild(buildPropertyCard(prop)));
    contenedor.appendChild(fragment);
}

document.getElementById('form-filtros')?.addEventListener('submit', (e) => {
    e.preventDefault();
    aplicarFiltros();
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
});

// -----------------------------------------------
// CARGAR PROPIEDADES
// -----------------------------------------------
async function cargarPropiedades() {
    const contenedor = document.getElementById('contenedor-propiedades');
    if (!contenedor) return;

    contenedor.innerHTML = `<p style='text-align:center; grid-column: 1 / -1; color: #888;'>Cargando propiedades...</p>`;

    try {
        todasLasPropiedades = await fetchJson(`${API_BASE_URL}/propiedades`);

        if (!Array.isArray(todasLasPropiedades) || todasLasPropiedades.length === 0) {
            contenedor.innerHTML = `<p style='text-align:center; grid-column: 1 / -1; color: #888; padding: 3rem;'>No hay propiedades disponibles por el momento.</p>`;
            return;
        }

        renderPropiedades(todasLasPropiedades);
    } catch (error) {
        console.error("Error al conectar con la base de datos:", error);
        contenedor.innerHTML = `<p style='text-align:center; grid-column: 1 / -1; color: red; padding: 3rem;'>Error al cargar las propiedades.</p>`;
    }
}

cargarPropiedades();

// -----------------------------------------------
// FORMULARIO DE CONTACTO
// -----------------------------------------------
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
            setMessage(mensajeRespuesta, 'Completá nombre, email y mensaje antes de enviar.', 'red');
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

