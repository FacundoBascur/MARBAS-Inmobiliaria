const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Conectamos a tu base de datos
const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'marbas' // <--- ¡CAMBIÁ ESTO!
});

async function generarAdministrador() {
    // Los datos que va a usar tu hermano para entrar
    const email = 'admin2@marbas.com';
    const passwordPlana = 'Jero11831986'; // Podés cambiarla por la que quieras
    
    console.log("Encriptando contraseña...");
    
    // Le decimos a bcrypt que encripte la clave (el 10 es el nivel de seguridad)
    const passwordHasheada = await bcrypt.hash(passwordPlana, 10);

    // Lo guardamos en la tabla 'usuarios'
    const sql = 'INSERT INTO useradmin (user, password) VALUES (?, ?)';
    
    conexion.query(sql, [email, passwordHasheada], (error, resultado) => {
        if (error) {
            console.error("Error al crear el usuario:", error);
        } else {
            console.log("¡Usuario Administrador creado con éxito!");
            console.log(`Email: ${email}`);
            console.log(`Clave guardada en BD: ${passwordHasheada}`);
        }
        process.exit(); // Apaga el script automáticamente
    });
}

// Ejecutamos la función
generarAdministrador();