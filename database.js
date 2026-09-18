const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, // Desativado para conexões locais/diretas comuns de ERP
        trustServerCertificate: true // Evita erros de certificado SSL
    }
};

async function getConnection() {
    try {
        const pool = await sql.connect(config);
        return pool;
    } catch (error) {
        console.error('❌ Erro ao conectar no SQL Server:', error.message);
        throw error;
    }
}

module.exports = { getConnection, sql };