document.getElementById('form-login').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const mensaje = document.getElementById('mensaje-login');
            mensaje.innerText = "Verificando credenciales...";
            mensaje.style.color = "var(--primary-blue)";

            const usuario = e.target.usuario.value;
            const password = e.target.password.value;

            try {
                const respuesta = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, password })
                });

                if (respuesta.ok) 
                {
                        const datos = await respuesta.json();
                        localStorage.setItem('tokenMarbas', datos.token);
                        
                        mensaje.innerText = "¡Acceso concedido! Entrando...";
                        mensaje.style.color = "green";

                        // 1. Le decimos al body que cualquier cambio de opacidad sea suave
                        document.body.style.transition = "opacity 0.5s ease";
                        // 2. Volvemos la pantalla transparente
                        document.body.style.opacity = "0";

                        // 3. Esperamos medio segundo (500 milisegundos) a que termine el efecto y ahí cambiamos de página
                        setTimeout(() => {
                            window.location.href = 'admin.html';
                        }, 500);
                        
                    } else {
                        mensaje.innerText = "Usuario o contraseña incorrectos.";
                        mensaje.style.color = "red";
                }
            } catch (error) {
                console.error(error);
                mensaje.innerText = "Error de conexión con el servidor.";
                mensaje.style.color = "red";
            }
        });