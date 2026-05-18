const URL_BASE = "http://localhost:3000/";
const parametros = new URLSearchParams(window.location.search);
const idCasa = parseInt(parametros.get('id'));

let itemsGallery = []; 
let currentPhotoIndex = 0; 

document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('main-menu').classList.toggle('active');
});

async function cargarDetalle() {
    try {
        const respuesta = await fetch(URL_BASE + 'api/propiedades');
        const propiedadesBD = await respuesta.json();
        const casa = propiedadesBD.find(p => p.id === idCasa);

        if (casa) {
            const precioFormateado = new Intl.NumberFormat('es-AR').format(casa.price);

            document.getElementById('detalle-titulo').innerText = casa.title;
            document.getElementById('detalle-ubicacion').innerText = casa.location;
            document.getElementById('detalle-precio').innerText = "USD " + precioFormateado;
            document.getElementById('detalle-dorm').innerText = casa.bedrooms;
            document.getElementById('detalle-banos').innerText = casa.bathroom;
            document.getElementById('detalle-metros').innerText = casa.meters;
            document.getElementById('detalle-descripcion').innerText = casa.description || "Sin descripción disponible.";

            const wppTexto = `Hola Marbas Propiedades! Me interesa la propiedad: ${casa.title} (USD ${precioFormateado})`;
            document.getElementById('detalle-whatsapp').href = `https://wa.me/2984897012?text=${encodeURIComponent(wppTexto)}`;

            // LÓGICA DEL MAPA (Leaflet)
            const mapContainer = document.getElementById('mapa-propiedad');
            if (mapContainer) {
                // Usamos las coordenadas de la base de datos. Si están vacías, default a Roca.
                const lat = casa.latitude || -39.0275;
                const lng = casa.longitude || -67.5804;

                const mapa = L.map('mapa-propiedad').setView([lat, lng], 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(mapa);

                L.marker([lat, lng]).addTo(mapa)
                    .bindPopup(`<b>Propiedad: ${casa.title}</b><br>Ubicación aproximada.`)
                    .openPopup();
            }

            // --- 1. UNIFICAR GALERÍA ---
            let galeriaArray = [];
            if (casa.image) galeriaArray.push(casa.image);
            
            if (casa.galery) {
                const fotosExtra = typeof casa.galery === 'string' ? JSON.parse(casa.galery) : casa.galery;
                galeriaArray = galeriaArray.concat(fotosExtra);
            }
            galeriaArray = [...new Set(galeriaArray)];

            // --- 2. GALERÍA Y PHOTOSWIPE ---
            const fotoPrincipal = document.getElementById('foto-principal');
            const tiraMiniaturas = document.getElementById('tira-miniaturas');
            const btnPrev = document.getElementById('btn-prev');
            const btnNext = document.getElementById('btn-next');

            function actualizarGaleria(index) {
                currentPhotoIndex = index;
                fotoPrincipal.src = URL_BASE + galeriaArray[index];
                
                document.querySelectorAll('#tira-miniaturas img').forEach(img => img.classList.remove('activa'));
                const miniaturas = document.querySelectorAll('#tira-miniaturas img');
                if (miniaturas[index]) miniaturas[index].classList.add('activa');
            }

            if (galeriaArray.length > 0) {
                itemsGallery = galeriaArray.map(ruta => ({
                    src: URL_BASE + ruta,
                    w: 1920, 
                    h: 1080 
                }));

                actualizarGaleria(0);

                if (galeriaArray.length > 1) {
                    btnPrev.classList.remove('oculto');
                    btnNext.classList.remove('oculto');
                }

                tiraMiniaturas.innerHTML = ''; 
                galeriaArray.forEach((fotoUrl, index) => {
                    const imgMini = document.createElement('img');
                    imgMini.src = URL_BASE + fotoUrl;
                    if (index === 0) imgMini.classList.add('activa');
                    imgMini.addEventListener('click', () => actualizarGaleria(index));
                    tiraMiniaturas.appendChild(imgMini);
                });

                btnPrev.addEventListener('click', () => {
                    const prevIndex = (currentPhotoIndex > 0) ? currentPhotoIndex - 1 : galeriaArray.length - 1;
                    actualizarGaleria(prevIndex);
                });

                btnNext.addEventListener('click', () => {
                    const nextIndex = (currentPhotoIndex < galeriaArray.length - 1) ? currentPhotoIndex + 1 : 0;
                    actualizarGaleria(nextIndex);
                });

                // Lógica PhotoSwipe
                const fotoPrincipalWrapper = document.querySelector('.foto-principal-wrapper');
                if (fotoPrincipalWrapper) {
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

                        const miniaturasDom = document.querySelectorAll('#tira-miniaturas img');
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

            // --- 3. TOUR 360 ---
            const btnFotos = document.getElementById('btn-fotos');
            const btn360 = document.getElementById('btn-360');
            const contGaleria = document.getElementById('galeria-container');
            const wrapper360 = document.getElementById('tour-wrapper');
            const instruccion = document.getElementById('texto-instruccion');
            const tituloOverlay = document.getElementById('tour-overlay-title');
            const tira360 = document.getElementById('tira-miniaturas-360');

            if (casa.tour == 1 && casa.photo_360 && casa.photo_360.length > 0) {
                btn360.classList.remove('oculto');
                let visorPannellum = null;

                function extraerNombreLimpio(rutaFichero) {
                    const archivo = rutaFichero.split('/').pop(); 
                    let sinExtension = archivo.split('.')[0];     
                    const primerGuion = sinExtension.indexOf('-');
                    if (primerGuion !== -1) sinExtension = sinExtension.substring(primerGuion + 1); 
                    let nombreFinal = sinExtension.replace(/[0-9_-]/g, ' ').trim();
                    return nombreFinal === "" ? "Vista 360" : nombreFinal;
                }

                function cargarPanorama(index) {
                    const rutaFoto = casa.photo_360[index];
                    tituloOverlay.innerText = extraerNombreLimpio(rutaFoto).toUpperCase();

                    if (visorPannellum) visorPannellum.destroy();

                    visorPannellum = pannellum.viewer('panorama-container', {
                        "type": "equirectangular",
                        "panorama": URL_BASE + rutaFoto,
                        "autoLoad": true,
                        "compass": false,
                        "showZoomCtrl": false 
                    });

                    document.querySelectorAll('#tira-miniaturas-360 img').forEach(img => img.classList.remove('activa'));
                    const minis = document.querySelectorAll('#tira-miniaturas-360 img');
                    if (minis[index]) minis[index].classList.add('activa');
                }

                tira360.innerHTML = '';
                casa.photo_360.forEach((ruta, index) => {
                    const imgMini = document.createElement('img');
                    imgMini.src = URL_BASE + ruta; 
                    if (index === 0) imgMini.classList.add('activa');
                    
                    imgMini.addEventListener('click', () => cargarPanorama(index));
                    tira360.appendChild(imgMini);
                });

                btn360.addEventListener('click', () => {
                    btn360.classList.add('active');
                    btnFotos.classList.remove('active');
                    contGaleria.classList.add('oculto');
                    wrapper360.classList.remove('oculto'); 
                    wrapper360.style.display = 'flex'; 
                    instruccion.style.display = 'block';

                    if (!visorPannellum) cargarPanorama(0); 
                });

                btnFotos.addEventListener('click', () => {
                    btnFotos.classList.add('active');
                    btn360.classList.remove('active');
                    wrapper360.classList.add('oculto');
                    wrapper360.style.display = 'none';
                    contGaleria.classList.remove('oculto');
                    instruccion.style.display = 'none';
                });
            }

        } else {
            document.getElementById('detalle-titulo').innerText = "Propiedad no encontrada";
        }
    } catch (error) {
        console.error("Error cargando detalle:", error);
        document.getElementById('detalle-titulo').innerText = "Error de conexión";
    }
}

cargarDetalle();

// --- 4. FORMULARIO DE CONSULTA ---
const formConsultaDetalle = document.getElementById('form-consulta-detalle');

if (formConsultaDetalle) {
    formConsultaDetalle.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const mensajeRespuesta = document.getElementById('consulta-mensaje-estado');
        const botonEnviar = formConsultaDetalle.querySelector('.btn-submit');
        const tituloPropiedad = document.getElementById('detalle-titulo').innerText;

        mensajeRespuesta.innerText = "Enviando mensaje, por favor esperá...";
        mensajeRespuesta.style.color = "var(--primary-blue)";
        mensajeRespuesta.classList.remove('oculto');
        
        botonEnviar.disabled = true;
        botonEnviar.innerText = "Enviando...";

        const textoCliente = document.getElementById('consulta-mensaje').value;
        const mensajeFinal = `Consulta por la propiedad: ${tituloPropiedad}\n\n${textoCliente}`;

        const datos = {
            nombre: document.getElementById('consulta-nombre').value,
            telefono: document.getElementById('consulta-telefono').value,
            email: document.getElementById('consulta-email').value,
            mensaje: mensajeFinal 
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/contacto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            if (respuesta.ok) {
                mensajeRespuesta.innerText = "¡Mensaje enviado con éxito! Nos pondremos en contacto a la brevedad.";
                mensajeRespuesta.style.color = "green";
                formConsultaDetalle.reset(); 
            } else {
                mensajeRespuesta.innerText = "Error al enviar el mensaje. Intentá nuevamente.";
                mensajeRespuesta.style.color = "red";
            }
        } catch (error) {
            console.error("Error enviando correo:", error);
            mensajeRespuesta.innerText = "Error de conexión con el servidor.";
            mensajeRespuesta.style.color = "red";
        } finally {
            botonEnviar.disabled = false;
            botonEnviar.innerText = "Enviar Consulta";
        }
    });
}