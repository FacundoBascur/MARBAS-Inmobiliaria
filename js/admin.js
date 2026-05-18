// --- 1. SEGURIDAD ---
const token = localStorage.getItem('tokenMarbas');
if (!token) window.location.href = 'login.html';

document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('tokenMarbas'); 
    window.location.href = 'login.html'; 
});

// --- 2. TOUR 360 DINÁMICO ---
const selectTour = document.getElementById('select-tour');
const container360 = document.getElementById('container-360');
const input360 = document.getElementById('input-360');

selectTour.addEventListener('change', (e) => {
    if (e.target.value === "1") {
        container360.classList.remove('oculto');
        input360.required = true;
    } else {
        container360.classList.add('oculto');
        input360.required = false;
        input360.value = ""; 
    }
});

// --- 3. CARGAR TABLA DE PROPIEDADES ---
let propiedadesGlobales = []; 

async function cargarListaPropiedades() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/propiedades');
        const propiedades = await respuesta.json();
        propiedadesGlobales = propiedades; 
        const tbody = document.getElementById('tbody-propiedades');
        
        tbody.innerHTML = ''; 
        
        if (propiedades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay propiedades cargadas.</td></tr>';
            return;
        }

        propiedades.forEach(prop => {
            const precioFmt = new Intl.NumberFormat('es-AR').format(prop.price);
            tbody.innerHTML += `
                <tr>
                    <td><strong>#${prop.id}</strong></td>
                    <td>${prop.title}</td>
                    <td>USD ${precioFmt}</td>
                    <td class="acciones-cell">
                        <button onclick="abrirModalEditar(${prop.id})" class="btn-editar">Editar</button>
                        <button onclick="eliminarPropiedad(${prop.id})" class="btn-eliminar">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error cargando tabla:", error);
    }
}

// --- 4. FUNCIONES DE EDICIÓN (MODAL) ---
function abrirModalEditar(id) {
    const casa = propiedadesGlobales.find(p => p.id === id);
    
    if(casa) {
        document.getElementById('edit-id').value = casa.id;
        document.getElementById('edit-title').value = casa.title;
        document.getElementById('edit-price').value = casa.price;
        document.getElementById('edit-location').value = casa.location;
        document.getElementById('edit-bedrooms').value = casa.bedrooms;
        document.getElementById('edit-bathroom').value = casa.bathroom;
        document.getElementById('edit-meters').value = casa.meters;
        document.getElementById('edit-description').value = casa.description || '';
        
        // --- NUEVO: Cargamos las coordenadas en el modal si existen ---
        if(document.getElementById('edit-latitude')) document.getElementById('edit-latitude').value = casa.latitude || '';
        if(document.getElementById('edit-longitude')) document.getElementById('edit-longitude').value = casa.longitude || '';

        document.getElementById('modal-editar').classList.remove('oculto');
    }
}

function cerrarModal() {
    document.getElementById('modal-editar').classList.add('oculto');
}

async function guardarEdicion() {
    const idPropiedad = document.getElementById('edit-id').value;
    
    const datosNuevos = {
        title: document.getElementById('edit-title').value,
        price: document.getElementById('edit-price').value,
        location: document.getElementById('edit-location').value,
        bedrooms: document.getElementById('edit-bedrooms').value,
        bathroom: document.getElementById('edit-bathroom').value,
        meters: document.getElementById('edit-meters').value,
        description: document.getElementById('edit-description').value,
        // --- NUEVO: Atrapamos las coordenadas al guardar ---
        latitude: document.getElementById('edit-latitude') ? document.getElementById('edit-latitude').value : null,
        longitude: document.getElementById('edit-longitude') ? document.getElementById('edit-longitude').value : null
    };

    try {
        const respuesta = await fetch(`http://localhost:3000/api/propiedades/${idPropiedad}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(datosNuevos)
        });

        if (respuesta.ok) {
            alert('¡Propiedad actualizada!');
            cerrarModal();
            cargarListaPropiedades(); 
        } else {
            alert('Error al actualizar la propiedad.');
        }
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert('Fallo de conexión con el servidor.');
    }
}

// --- 5. FUNCIÓN PARA ELIMINAR ---
async function eliminarPropiedad(id) {
    if (!confirm('¿Estás seguro de que querés borrar esta propiedad y sus fotos?')) return; 

    try {
        const respuesta = await fetch(`http://localhost:3000/api/propiedades/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (respuesta.ok) {
            alert('¡Propiedad eliminada!');
            cargarListaPropiedades(); 
        } else {
            alert('Error al intentar eliminar.');
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert('Fallo de conexión con el servidor.');
    }
}

// --- 6. SUBIR PROPIEDAD ---
document.getElementById('form-admin').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const mensajeEstado = document.getElementById('mensaje-estado');
    mensajeEstado.innerText = "Subiendo archivos, por favor esperá...";
    mensajeEstado.className = 'mensaje-estado mensaje-info';

    const formulario = e.target;
    // FormData automáticamente agarra los inputs "latitude" y "longitude" del HTML
    const paqueteDeDatos = new FormData(formulario);

    try {
        const respuesta = await fetch('http://localhost:3000/api/propiedades', {
            method: 'POST', 
            headers: { 'Authorization': 'Bearer ' + token },
            body: paqueteDeDatos
        });

        if (respuesta.ok) {
            mensajeEstado.innerText = "¡Propiedad cargada con éxito!";
            mensajeEstado.className = 'mensaje-estado mensaje-exito';
            formulario.reset(); 
            document.getElementById('container-360').classList.add('oculto'); 
            cargarListaPropiedades(); 
        } else {
            mensajeEstado.innerText = "Error al cargar la propiedad.";
            mensajeEstado.className = 'mensaje-estado mensaje-error';
        }
    } catch (error) {
        console.error(error);
        mensajeEstado.innerText = "Error de conexión con el servidor Node.";
        mensajeEstado.className = 'mensaje-estado mensaje-error';
    }
});

cargarListaPropiedades();