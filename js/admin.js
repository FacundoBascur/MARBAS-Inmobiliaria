const URL_BASE = "http://localhost:3000/";
const API_BASE_URL = `${URL_BASE}api`;
const token = localStorage.getItem('tokenMarbas');

if (!token) {
    window.location.href = 'login.html';
}

function getById(id) {
    return document.getElementById(id);
}

document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('main-menu')?.classList.toggle('active');
});

function parseJsonResponse(response) {
    return response.text().then(text => {
        try {
            return text ? JSON.parse(text) : null;
        } catch (err) {
            return null;
        }
    });
}

function handleUnauthorized() {
    localStorage.removeItem('tokenMarbas');
    alert('La sesión expiró o no está autorizada. Volviendo al login.');
    window.location.href = 'login.html';
}

function setStatusMessage(text, className) {
    const mensajeEstado = getById('mensaje-estado');
    if (!mensajeEstado) return;
    mensajeEstado.textContent = text;
    mensajeEstado.className = className;
}

async function fetchWithAuth(path, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};
    headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const body = await parseJsonResponse(response);

    if (response.status === 401) {
        handleUnauthorized();
        throw new Error('No autorizado');
    }

    if (!response.ok) {
        throw new Error(body?.error || body?.message || 'Error en la petición');
    }

    return body;
}

const btnLogout = getById('btn-logout');
btnLogout?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('tokenMarbas');
    window.location.href = 'login.html';
});

const selectTour = getById('select-tour');
const container360 = getById('container-360');
const input360 = getById('input-360');

selectTour?.addEventListener('change', (e) => {
    if (e.target.value === '1') {
        container360?.classList.remove('oculto');
        if (input360) input360.required = true;
    } else {
        container360?.classList.add('oculto');
        if (input360) {
            input360.required = false;
            input360.value = '';
        }
    }
});

let propiedadesGlobales = [];

function buildPropertyRow(prop) {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.innerHTML = `<strong>#${prop.id}</strong>`;

    const tdTitle = document.createElement('td');
    tdTitle.textContent = prop.title;

    const tdPrice = document.createElement('td');
    tdPrice.textContent = `USD ${new Intl.NumberFormat('es-AR').format(prop.price)}`;

    const tdActions = document.createElement('td');
    tdActions.className = 'acciones-cell';

    const editar = document.createElement('button');
    editar.className = 'btn-editar';
    editar.textContent = 'Editar';
    editar.type = 'button';
    editar.addEventListener('click', () => abrirModalEditar(prop.id));

    const eliminar = document.createElement('button');
    eliminar.className = 'btn-eliminar';
    eliminar.textContent = 'Eliminar';
    eliminar.type = 'button';
    eliminar.addEventListener('click', () => eliminarPropiedad(prop.id));

    tdActions.append(editar, eliminar);
    tr.append(tdId, tdTitle, tdPrice, tdActions);
    return tr;
}

async function cargarListaPropiedades() {
    const tbody = getById('tbody-propiedades');
    if (!tbody) return;

    tbody.innerHTML = '';

    try {
        const propiedades = await fetchWithAuth('/propiedades');
        propiedadesGlobales = Array.isArray(propiedades) ? propiedades : [];

        if (propiedadesGlobales.length === 0) {
            const fila = document.createElement('tr');
            fila.innerHTML = '<td colspan="4" class="text-center">No hay propiedades cargadas.</td>';
            tbody.appendChild(fila);
            return;
        }

        const fragment = document.createDocumentFragment();
        propiedadesGlobales.forEach(prop => fragment.appendChild(buildPropertyRow(prop)));
        tbody.appendChild(fragment);
    } catch (error) {
        console.error('Error cargando tabla:', error);
        const fila = document.createElement('tr');
        fila.innerHTML = '<td colspan="4" class="text-center">Error al cargar propiedades.</td>';
        tbody.appendChild(fila);
    }
}

function abrirModalEditar(id) {
    const casa = propiedadesGlobales.find(p => p.id === id);
    if (!casa) return;

    getById('edit-id').value = casa.id;
    getById('edit-title').value = casa.title;
    getById('edit-price').value = casa.price;
    getById('edit-location').value = casa.location;
    getById('edit-bedrooms').value = casa.bedrooms;
    getById('edit-bathroom').value = casa.bathroom;
    getById('edit-meters').value = casa.meters;
    getById('edit-description').value = casa.description || '';

    const latitudeInput = getById('edit-latitude');
    const longitudeInput = getById('edit-longitude');
    if (latitudeInput) latitudeInput.value = casa.latitude || '';
    if (longitudeInput) longitudeInput.value = casa.longitude || '';

    getById('modal-editar')?.classList.remove('oculto');
}

function cerrarModal() {
    getById('modal-editar')?.classList.add('oculto');
}

async function guardarEdicion() {
    const idPropiedad = getById('edit-id')?.value;
    if (!idPropiedad) return;

    const datosNuevos = {
        title: getById('edit-title')?.value || '',
        price: parseFloat(getById('edit-price')?.value) || 0,
        location: getById('edit-location')?.value || '',
        bedrooms: parseInt(getById('edit-bedrooms')?.value) || 0,
        bathroom: parseInt(getById('edit-bathroom')?.value) || 0,
        meters: parseFloat(getById('edit-meters')?.value) || 0,
        description: getById('edit-description')?.value || '',
        latitude: getById('edit-latitude')?.value || null,
        longitude: getById('edit-longitude')?.value || null
    };

    try {
        await fetchWithAuth(`/propiedades/${idPropiedad}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosNuevos)
        });

        alert('¡Propiedad actualizada!');
        cerrarModal();
        cargarListaPropiedades();
    } catch (error) {
        console.error('Error al actualizar:', error);
        alert('Error al actualizar la propiedad.');
    }
}

async function eliminarPropiedad(id) {
    if (!confirm('¿Estás seguro de que querés borrar esta propiedad y sus fotos?')) return;

    try {
        await fetchWithAuth(`/propiedades/${id}`, {
            method: 'DELETE'
        });

        alert('¡Propiedad eliminada!');
        cargarListaPropiedades();
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al intentar eliminar.');
    }
}

const formAdmin = getById('form-admin');
if (formAdmin) {
    formAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();

        setStatusMessage('Subiendo archivos, por favor esperá...', 'mensaje-estado mensaje-info');

        const paqueteDeDatos = new FormData(formAdmin);

        try {
            await fetchWithAuth('/propiedades', {
                method: 'POST',
                body: paqueteDeDatos
            });

            setStatusMessage('¡Propiedad cargada con éxito!', 'mensaje-estado mensaje-exito');
            formAdmin.reset();
            container360?.classList.add('oculto');
            cargarListaPropiedades();
        } catch (error) {
            console.error(error);
            setStatusMessage('Error al cargar la propiedad.', 'mensaje-estado mensaje-error');
        }
    });
}

cargarListaPropiedades();