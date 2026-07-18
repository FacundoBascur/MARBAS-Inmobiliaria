const pool = require('./config/db');

async function runMigration() {
    try {
        console.log("Iniciando migración de base de datos...");
        
        // Agregar operation_type. In MariaDB < 10.3 IF NOT EXISTS for columns doesn't exist, we will catch the error instead.
        try {
            await pool.query(`
                ALTER TABLE propiedades 
                ADD COLUMN operation_type VARCHAR(50) DEFAULT 'En Venta'
            `);
            console.log("Columna 'operation_type' agregada.");
        } catch(e) {
            if(e.code === 'ER_DUP_FIELDNAME') console.log("Columna 'operation_type' ya existía.");
            else throw e;
        }

        // Agregar currency
        try {
            await pool.query(`
                ALTER TABLE propiedades 
                ADD COLUMN currency VARCHAR(10) DEFAULT 'USD'
            `);
            console.log("Columna 'currency' agregada.");
        } catch(e) {
            if(e.code === 'ER_DUP_FIELDNAME') console.log("Columna 'currency' ya existía.");
            else throw e;
        }

        console.log("Migración completada con éxito.");
    } catch (error) {
        console.error("Error durante la migración:", error);
    } finally {
        process.exit();
    }
}

runMigration();
