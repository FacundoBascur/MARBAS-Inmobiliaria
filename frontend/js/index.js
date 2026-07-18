// -----------------------------------------------
// index.js — Requiere config.js y common.js cargados previamente
// -----------------------------------------------
const URL_BASE = APP_CONFIG.URL_BASE;
const API_BASE_URL = APP_CONFIG.API_BASE_URL;

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
    imagenes.forEach((img) => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.style.backgroundImage = `url('${URL_BASE}${img.url}')`;
        slidesContainer.appendChild(slide);
    });

    const slides = Array.from(slidesContainer.querySelectorAll('.hero-slide'));

    // Activar slide con Ken Burns
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
        setTimeout(() => {
            slide.style.transition = 'none';
            slide.classList.remove('zoom');
            requestAnimationFrame(() => requestAnimationFrame(() => {
                slide.style.transition = '';
            }));
        }, 1600);
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

        // Reiniciar el contador de tiempo al cambiar manualmente
        ultimoCambio = performance.now();
    }

    // ─── Timer basado en rAF (no se "congela" como setInterval) ─────────────
    const INTERVALO_MS = 6000;
    let ultimoCambio = performance.now();
    let heroVisible  = true;
    let rafId        = null;

    function tick(ahora) {
        if (heroVisible && ahora - ultimoCambio >= INTERVALO_MS) {
            irASlide((indiceActual + 1) % slides.length);
            ultimoCambio = ahora;
        }
        rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    // Pausar solo cuando la sección hero sale completamente de la vista
    const heroSection = document.getElementById('inicio');
    if (heroSection && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                heroVisible = entries[0].isIntersecting;
                // Al volver a ser visible, resetear el timer para no saltar de inmediato
                if (heroVisible) ultimoCambio = performance.now();
            },
            { threshold: 0.1 } // pausa si menos del 10% es visible
        );
        observer.observe(heroSection);
    }
}

initHeroSlideshow();


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
    cardImg.setAttribute('role', 'img');
    cardImg.setAttribute('aria-label', prop.title);
    cardImg.style.backgroundImage = `url('${URL_BASE}${prop.image}')`;

    if (prop.tour === 1) {
        const badge = document.createElement('span');
        badge.className = 'badge-360';
        badge.textContent = 'Tour 360°';
        imgWrapper.appendChild(badge);
    }

    const badgeOp = document.createElement('span');
    badgeOp.className = 'badge-operation';
    badgeOp.textContent = prop.operation_type || 'En Venta';
    imgWrapper.appendChild(badgeOp);

    imgWrapper.appendChild(cardImg);

    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `${prop.currency || 'USD'} ${new Intl.NumberFormat('es-AR').format(prop.price)}`;

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
    const operacion = document.getElementById('filtro-operacion')?.value || '';
    const precioMin = parseFloat(document.getElementById('filtro-precio-min')?.value) || 0;
    const precioMax = parseFloat(document.getElementById('filtro-precio-max')?.value) || Infinity;

    const filtradas = todasLasPropiedades.filter(prop => {
        const matchUbicacion = !ubicacion ||
            normalizar(prop.location).includes(ubicacion) ||
            normalizar(prop.title).includes(ubicacion);
        const matchOperacion = !operacion || prop.operation_type === operacion;
        const matchPrecio = prop.price >= precioMin && prop.price <= precioMax;
        return matchUbicacion && matchOperacion && matchPrecio;
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
    lista.forEach((prop, index) => {
        const card = buildPropertyCard(prop);
        // Animación escalonada de entrada
        card.style.animationDelay = `${index * 0.08}s`;
        card.classList.add('card-enter');
        fragment.appendChild(card);
    });
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
