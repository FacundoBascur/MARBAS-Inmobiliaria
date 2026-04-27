const URL_BASE = "http://localhost:3000/";
const parametros = new URLSearchParams(window.location.search);
const idCasa = parseInt(parametros.get('id'));

// Menú Hamburguesa
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

            // Llenar datos de texto
            document.getElementById('detalle-titulo').innerText = casa.title;
            document.getElementById('detalle-ubicacion').innerText = casa.location;
            document.getElementById('detalle-precio').innerText = "USD " + precioFormateado;
            document.getElementById('detalle-dorm').innerText = casa.bedrooms;
            document.getElementById('detalle-banos').innerText = casa.bathroom;
            document.getElementById('detalle-metros').innerText = casa.meters;
            
            // --- CAMBIO: Pegamos la descripción en el HTML ---
            document.getElementById('detalle-descripcion').innerText = casa.description || "Sin descripción disponible.";

            const wppTexto = `Hola Marbas Propiedades! Me interesa la propiedad: ${casa.title} (USD ${precioFormateado})`;
            document.getElementById('detalle-whatsapp').href = `https://wa.me/2984897012?text=${encodeURIComponent(wppTexto)}`;

            // --- 1. LÓGICA DE UNIFICAR GALERÍA NORMAL ---
            let galeriaArray = [];
            if (casa.image) galeriaArray.push(casa.image);
            
            if (casa.galery) {
                const fotosExtra = typeof casa.galery === 'string' ? JSON.parse(casa.galery) : casa.galery;
                galeriaArray = galeriaArray.concat(fotosExtra);
            }

            galeriaArray = [...new Set(galeriaArray)];

            // --- 2. FUNCIONAMIENTO DE LA GALERÍA NORMAL ---
            const fotoPrincipal = document.getElementById('foto-principal');
            const tiraMiniaturas = document.getElementById('tira-miniaturas');
            const btnPrev = document.getElementById('btn-prev');
            const btnNext = document.getElementById('btn-next');
            let fotoActualIndex = 0;

            function actualizarGaleria(index) {
                let ruta = galeriaArray[index];
                fotoPrincipal.src = URL_BASE + ruta;
                
                document.querySelectorAll('#tira-miniaturas img').forEach(img => img.classList.remove('activa'));
                const miniaturas = document.querySelectorAll('#tira-miniaturas img');
                if (miniaturas[index]) miniaturas[index].classList.add('activa');
            }

            if (galeriaArray.length > 0) {
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
                    imgMini.addEventListener('click', () => {
                        fotoActualIndex = index;
                        actualizarGaleria(fotoActualIndex);
                    });
                    tiraMiniaturas.appendChild(imgMini);
                });

                btnPrev.addEventListener('click', () => {
                    fotoActualIndex = (fotoActualIndex > 0) ? fotoActualIndex - 1 : galeriaArray.length - 1;
                    actualizarGaleria(fotoActualIndex);
                });

                btnNext.addEventListener('click', () => {
                    fotoActualIndex = (fotoActualIndex < galeriaArray.length - 1) ? fotoActualIndex + 1 : 0;
                    actualizarGaleria(fotoActualIndex);
                });
            }

            // --- 3. NUEVA LÓGICA DE TOUR 360 MULTIPLE ---
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
                    if (primerGuion !== -1) {
                        sinExtension = sinExtension.substring(primerGuion + 1); 
                    }

                    let nombreFinal = sinExtension.replace(/[0-9_-]/g, ' ').trim();

                    if (nombreFinal === "") {
                        return "Vista 360";
                    }

                    return nombreFinal;
                }

                function cargarPanorama(index) {
                    const rutaFoto = casa.photo_360[index];
                    
                    tituloOverlay.innerText = extraerNombreLimpio(rutaFoto).toUpperCase();

                    if (visorPannellum) {
                        visorPannellum.destroy();
                    }

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
                    
                    imgMini.addEventListener('click', () => {
                        cargarPanorama(index);
                    });
                    tira360.appendChild(imgMini);
                });

                btn360.addEventListener('click', () => {
                    btn360.classList.add('active');
                    btnFotos.classList.remove('active');
                    contGaleria.classList.add('oculto');
                    wrapper360.classList.remove('oculto'); 
                    wrapper360.style.display = 'flex'; 
                    instruccion.style.display = 'block';

                    if (!visorPannellum) {
                        cargarPanorama(0); 
                    }
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