const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const hash = await bcrypt.hash('Marbas2026', 10);
    const conn = await mysql.createConnection({ 
        host: 'localhost', 
        user: 'marbas_user', 
        password: 'Marbas_Admin_2026!', 
        database: 'marbas_inmobiliaria' 
    });
    await conn.execute('INSERT INTO useradmin (user, password) VALUES (?, ?)', ['admin@marbas.com', hash]);
    process.exit();
  } catch (error) {
    console.error(error);
  }
}
run();
