const pool = require('./config/db');

async function alterDB() {
    try {
        console.log('Intentando agregar columna is_public a la base de datos...');
        const [rows] = await pool.query("SHOW COLUMNS FROM propiedades LIKE 'is_public'");
        
        if (rows.length === 0) {
            await pool.query("ALTER TABLE propiedades ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT 1");
            console.log('Columna is_public agregada con éxito a la tabla propiedades.');
        } else {
            console.log('La columna is_public ya existe en la tabla propiedades.');
        }
    } catch (err) {
        console.error('Error alterando DB:', err);
    } finally {
        process.exit(0);
    }
}

alterDB();
