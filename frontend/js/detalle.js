// -----------------------------------------------
// detalle.js — Requiere config.js y common.js cargados previamente
// -----------------------------------------------
const URL_BASE = APP_CONFIG.URL_BASE;
const API_BASE_URL = APP_CONFIG.API_BASE_URL;
const parametros = new URLSearchParams(window.location.search);
const idCasa = parseInt(parametros.get('id'));

let itemsGallery = [];
let currentPhotoIndex = 0;

async function cargarDetalle() {
    if (!idCasa) {
        setText('detalle-titulo', 'Propiedad no válida');
        return;
    }

    try {
        // Usar endpoint individual en vez de descargar todas
        const casa = await fetchJson(`${API_BASE_URL}/propiedades/${idCasa}`);

        if (!casa) {
            setText('detalle-titulo', 'Propiedad no encontrada');
            return;
        }

        const precioFormateado = new Intl.NumberFormat('es-AR').format(casa.price);

        // Actualizar título de la página dinámicamente
        document.title = `${casa.title} - Marbas Propiedades`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = `${casa.title} en ${casa.location}. ${casa.currency || 'USD'} ${precioFormateado}. Marbas Propiedades - General Roca, Río Negro.`;
        }

        setText('detalle-titulo', casa.title);
        setText('detalle-ubicacion', casa.location);
        
        const operacion = casa.operation_type ? casa.operation_type.toUpperCase() : 'EN VENTA';
        setText('detalle-operacion', operacion);
        
        const moneda = casa.currency || 'USD';
        setText('detalle-precio', `${moneda} ${precioFormateado}`);
        setText('detalle-dorm', casa.bedrooms);
        setText('detalle-banos', casa.bathroom);
        setText('detalle-metros', casa.meters);
        setText('detalle-descripcion', casa.description || 'Sin descripción disponible.');

        const detalleWhatsapp = getById('detalle-whatsapp');
        const monedaWpp = casa.currency || 'USD';
        if (detalleWhatsapp) {
            const wppTexto = `Hola Marbas Propiedades! Me interesa la propiedad: ${casa.title} (${monedaWpp} ${precioFormateado})`;
            detalleWhatsapp.href = `https://wa.me/542984897012?text=${encodeURIComponent(wppTexto)}`;
        }

        // Botones de compartir
        const urlActual   = window.location.href;
        const monedaShare = casa.currency || 'USD';
        const tituloShare = `${casa.title} – ${monedaShare} ${precioFormateado} | Marbas Propiedades`;

        const btnCopiar = getById('btn-copiar-link');
        if (btnCopiar) {
            btnCopiar.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(urlActual);
                } catch {
                    // fallback para navegadores sin clipboard API
                    const ta = document.createElement('textarea');
                    ta.value = urlActual;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                const spanCopiar = btnCopiar.querySelector('span');
                btnCopiar.classList.add('copiado');
                if (spanCopiar) spanCopiar.textContent = '¡Copiado!';
                setTimeout(() => {
                    btnCopiar.classList.remove('copiado');
                    if (spanCopiar) spanCopiar.textContent = 'Copiar enlace';
                }, 2000);
            });
        }

        const btnShareWpp = getById('btn-compartir-wpp');
        if (btnShareWpp) {
            const mensajeWpp = `Mirá esta propiedad en Marbas Propiedades:\n${casa.title} – ${monedaShare} ${precioFormateado}\n${urlActual}`;
            btnShareWpp.addEventListener('click', () => {
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensajeWpp)}`, '_blank');
            });
        }

        const btnShareEmail = getById('btn-compartir-email');
        if (btnShareEmail) {
            const asunto  = encodeURIComponent(tituloShare);
            const cuerpo  = encodeURIComponent(`Te comparto esta propiedad de Marbas Propiedades:\n\n${casa.title}\nPrecio: ${monedaShare} ${precioFormateado}\nUbicación: ${casa.location}\n\nVer más: ${urlActual}`);
            btnShareEmail.addEventListener('click', () => {
                window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;
            });
        }

        const mapContainer = getById('mapa-propiedad');
        if (mapContainer && typeof L !== 'undefined') {
            const lat = typeof casa.latitude === 'number' ? casa.latitude : (casa.latitude ? parseFloat(casa.latitude) : -39.0275);
            const lng = typeof casa.longitude === 'number' ? casa.longitude : (casa.longitude ? parseFloat(casa.longitude) : -67.5804);

            const mapa = L.map('mapa-propiedad').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(mapa);

            L.marker([lat, lng]).addTo(mapa)
                .bindPopup(`<b>Propiedad: ${casa.title}</b><br>Ubicación aproximada.`)
                .openPopup();
        }

        let galeriaArray = [];
        if (casa.image) galeriaArray.push(casa.image);
        galeriaArray = galeriaArray.concat(safeJsonParse(casa.galery));
        galeriaArray = [...new Set(galeriaArray.filter(Boolean))];

        const fotoPrincipal = getById('foto-principal');
        const tiraMiniaturas = getById('tira-miniaturas');
        const btnPrev = getById('btn-prev');
        const btnNext = getById('btn-next');

        function actualizarGaleria(index) {
            currentPhotoIndex = index;
            if (fotoPrincipal && galeriaArray[index]) {
                fotoPrincipal.src = `${URL_BASE}${galeriaArray[index]}`;
            }

            tiraMiniaturas?.querySelectorAll('img').forEach(img => img.classList.remove('activa'));
            const miniaturas = tiraMiniaturas?.querySelectorAll('img');
            if (miniaturas?.[index]) {
                miniaturas[index].classList.add('activa');
            }
        }

        if (galeriaArray.length > 0 && fotoPrincipal && tiraMiniaturas) {
            itemsGallery = galeriaArray.map(ruta => ({
                src: `${URL_BASE}${ruta}`,
                w: 1920,
                h: 1080
            }));

            actualizarGaleria(0);

            if (galeriaArray.length > 1) {
                btnPrev?.classList.remove('oculto');
                btnNext?.classList.remove('oculto');
            }

            tiraMiniaturas.innerHTML = '';
            galeriaArray.forEach((fotoUrl, index) => {
                const imgMini = document.createElement('img');
                imgMini.src = `${URL_BASE}${fotoUrl}`;
                imgMini.loading = 'lazy';
                if (index === 0) imgMini.classList.add('activa');
                imgMini.addEventListener('click', () => actualizarGaleria(index));
                tiraMiniaturas.appendChild(imgMini);
            });

            btnPrev?.addEventListener('click', () => {
                const prevIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : galeriaArray.length - 1;
                actualizarGaleria(prevIndex);
            });

            btnNext?.addEventListener('click', () => {
                const nextIndex = currentPhotoIndex < galeriaArray.length - 1 ? currentPhotoIndex + 1 : 0;
                actualizarGaleria(nextIndex);
            });

            const fotoPrincipalWrapper = document.querySelector('.foto-principal-wrapper');
            if (fotoPrincipalWrapper && typeof PhotoSwipeLightbox !== 'undefined') {
                const lightbox = new PhotoSwipeLightbox({
                    pswpModule: PhotoSwipe,
                    bgOpacity: 0.9,
                    loop: true,
                    arrowPrev: false,
                    arrowNext: false
                });

                lightbox.on('beforeOpen', () => document.documentElement.style.overflow = 'hidden');
                lightbox.on('close', () => document.documentElement.style.overflow = '');
                lightbox.init();

                fotoPrincipalWrapper.addEventListener('click', (e) => {
                    if (e.target.id === 'btn-prev' || e.target.id === 'btn-next') return;

                    const miniaturasDom = tiraMiniaturas.querySelectorAll('img');
                    itemsGallery.forEach((item, index) => {
                        if (miniaturasDom[index] && miniaturasDom[index].naturalWidth > 0) {
                            item.w = miniaturasDom[index].naturalWidth;
                            item.h = miniaturasDom[index].naturalHeight;
                        }
                    });

                    lightbox.loadAndOpen(currentPhotoIndex, itemsGallery);
                });
            }
        }

        const btnFotos = getById('btn-fotos');
        const btn360 = getById('btn-360');
        const contGaleria = getById('galeria-container');
        const wrapper360 = getById('tour-wrapper');
        const instruccion = getById('texto-instruccion');
        const tituloOverlay = getById('tour-overlay-title');
        const tira360 = getById('tira-miniaturas-360');

        const fotos360 = safeJsonParse(casa.photo_360);

        if (casa.tour == 1 && fotos360.length > 0 && btn360 && tira360 && tituloOverlay && wrapper360 && contGaleria && instruccion) {
            btn360.classList.remove('oculto');
            let visorPannellum = null;

            function extraerNombreLimpio(rutaFichero) {
                const archivo = rutaFichero.split('/').pop();
                let sinExtension = archivo.split('.')[0];
                const primerGuion = sinExtension.indexOf('-');
                if (primerGuion !== -1) sinExtension = sinExtension.substring(primerGuion + 1);
                const nombreFinal = sinExtension.replace(/[0-9_-]/g, ' ').trim();
                return nombreFinal === '' ? 'Vista 360' : nombreFinal;
            }

            function cargarPanorama(index) {
                const rutaFoto = fotos360[index];
                tituloOverlay.textContent = extraerNombreLimpio(rutaFoto).toUpperCase();

                if (visorPannellum) visorPannellum.destroy();

                visorPannellum = pannellum.viewer('panorama-container', {
                    type: 'equirectangular',
                    panorama: `${URL_BASE}${rutaFoto}`,
                    autoLoad: true,
                    compass: false,
                    showZoomCtrl: false
                });

                tira360.querySelectorAll('img').forEach(img => img.classList.remove('activa'));
                const minis = tira360.querySelectorAll('img');
                if (minis[index]) minis[index].classList.add('activa');
            }

            tira360.innerHTML = '';
            fotos360.forEach((ruta, index) => {
                const imgMini = document.createElement('img');
                imgMini.src = `${URL_BASE}${ruta}`;
                imgMini.loading = 'lazy';
                if (index === 0) imgMini.classList.add('activa');
                imgMini.addEventListener('click', () => cargarPanorama(index));
                tira360.appendChild(imgMini);
            });

            btn360.addEventListener('click', () => {
                btn360.classList.add('active');
                btnFotos?.classList.remove('active');
                contGaleria.classList.add('oculto');
                wrapper360.classList.remove('oculto');
                wrapper360.style.display = 'flex';
                instruccion.style.display = 'block';

                if (!visorPannellum) cargarPanorama(0);
            });

            btnFotos?.addEventListener('click', () => {
                btnFotos.classList.add('active');
                btn360.classList.remove('active');
                wrapper360.classList.add('oculto');
                wrapper360.style.display = 'none';
                contGaleria.classList.remove('oculto');
                instruccion.style.display = 'none';
            });
        }
    } catch (error) {
        console.error('Error cargando detalle:', error);
        setText('detalle-titulo', 'Error de conexión');
    }
}

cargarDetalle();

const formConsultaDetalle = getById('form-consulta-detalle');

if (formConsultaDetalle) {
    formConsultaDetalle.addEventListener('submit', async (e) => {
        e.preventDefault();

        const mensajeRespuesta = getById('consulta-mensaje-estado');
        const botonEnviar = formConsultaDetalle.querySelector('.btn-submit');
        const tituloPropiedad = getById('detalle-titulo')?.textContent || '';

        const nombre = getById('consulta-nombre')?.value.trim();
        const telefono = getById('consulta-telefono')?.value.trim();
        const email = getById('consulta-email')?.value.trim();
        const textoCliente = getById('consulta-mensaje')?.value.trim();

        if (!nombre || !email || !textoCliente) {
            if (mensajeRespuesta) {
                mensajeRespuesta.textContent = 'Completa nombre, email y mensaje antes de enviar.';
                mensajeRespuesta.style.color = 'red';
                mensajeRespuesta.classList.remove('oculto');
            }
            return;
        }

        if (mensajeRespuesta) {
            mensajeRespuesta.textContent = 'Enviando mensaje, por favor esperá...';
            mensajeRespuesta.style.color = 'var(--primary-blue)';
            mensajeRespuesta.classList.remove('oculto');
        }

        botonEnviar.disabled = true;
        botonEnviar.innerText = 'Enviando...';

        const datos = {
            nombre,
            telefono,
            email,
            propiedad: tituloPropiedad,
            mensaje: textoCliente
        };

        try {
            await fetchJson(`${API_BASE_URL}/contacto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            if (mensajeRespuesta) {
                mensajeRespuesta.textContent = '¡Mensaje enviado con éxito! Nos pondremos en contacto a la brevedad.';
                mensajeRespuesta.style.color = 'green';
            }
            formConsultaDetalle.reset();
        } catch (error) {
            console.error('Error enviando consulta:', error);
            if (mensajeRespuesta) {
                mensajeRespuesta.textContent = 'Error al enviar el mensaje. Intentá nuevamente.';
                mensajeRespuesta.style.color = 'red';
            }
        } finally {
            botonEnviar.disabled = false;
            botonEnviar.innerText = 'Enviar Mensaje';
        }
    });
}
