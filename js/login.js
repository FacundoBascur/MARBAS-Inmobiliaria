const API_BASE_URL = "http://localhost:3000/api";
const loginForm = document.getElementById('form-login');
const mensajeLogin = document.getElementById('mensaje-login');

function setLoginMessage(text, color) {
    if (!mensajeLogin) return;
    mensajeLogin.textContent = text;
    mensajeLogin.style.color = color;
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

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usuario = e.target.usuario.value.trim();
        const password = e.target.password.value.trim();

        if (!usuario || !password) {
            setLoginMessage('Completá usuario y contraseña antes de continuar.', 'red');
            return;
        }

        setLoginMessage('Verificando credenciales...', 'var(--primary-blue)');

        try {
            const datos = await fetchJson(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            });

            localStorage.setItem('tokenMarbas', datos.token);
            setLoginMessage('¡Acceso concedido! Entrando...', 'green');

            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '0';

            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 500);
        } catch (error) {
            console.error(error);
            setLoginMessage(error.message || 'Usuario o contraseña incorrectos.', 'red');
        }
    });
}
