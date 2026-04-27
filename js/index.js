// Menú Hamburguesa
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('main-menu').classList.toggle('active');
});

// --- LÓGICA CON BASE DE DATOS (Node.js) ---
async function cargarPropiedades() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/propiedades');
        const propiedadesDeLaBD = await respuesta.json();

        const contenedor = document.getElementById('contenedor-propiedades');
        let htmlTarjetas = '';

        propiedadesDeLaBD.forEach(prop => {
            const tieneTour = prop.tour === 1; 
            const badgeHTML = tieneTour ? `<span class="badge-360">Tour 360° disponible</span>` : '';
            
            const precioFormateado = new Intl.NumberFormat('es-AR').format(prop.price);

            htmlTarjetas += `
                <article class="card">
                    <div class="card-img" style="background-image: url('${prop.image}');">
                        ${badgeHTML}
                    </div>
                    <div class="card-content">
                        <span class="price">USD ${precioFormateado}</span>
                        <h3>${prop.title}</h3>
                        <p class="loc">${prop.location}</p>
                        <div class="icons">
                            <span>🛏️ ${prop.bedrooms}</span> 
                            <span>🚿 ${prop.bathroom}</span> 
                            <span>📐 ${prop.meters}m²</span>
                        </div>
                        <a href="detalle.html?id=${prop.id}" class="btn-detalle">Ver Detalle</a>
                    </div>
                </article>
            `;
        });
        
        contenedor.innerHTML = htmlTarjetas;

    } catch (error) {
        console.error("Error al conectar con la base de datos:", error);
        document.getElementById('contenedor-propiedades').innerHTML = 
            "<p style='text-align:center; grid-column: 1 / -1; color: red;'>Error al cargar las propiedades. Verificá que el servidor Node y XAMPP estén encendidos.</p>";
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

        // Avisamos al usuario y bloqueamos el botón para evitar spam
        mensajeRespuesta.innerText = "Enviando mensaje, por favor esperá...";
        mensajeRespuesta.style.color = "var(--primary-blue)";
        botonEnviar.disabled = true;
        botonEnviar.innerText = "Enviando...";

        const datos = {
            nombre: e.target.nombre.value,
            telefono: e.target.telefono.value,
            email: e.target.email.value,
            mensaje: e.target.mensaje.value
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
                formContacto.reset(); 
            } else {
                mensajeRespuesta.innerText = "Error al enviar el mensaje. Intentá nuevamente.";
                mensajeRespuesta.style.color = "red";
            }
        } catch (error) {
            console.error("Error enviando correo:", error);
            mensajeRespuesta.innerText = "Error de conexión con el servidor.";
            mensajeRespuesta.style.color = "red";
        } finally {
            // Habilitamos el botón de nuevo
            botonEnviar.disabled = false;
            botonEnviar.innerText = "Enviar Mensaje";
        }
    });
}