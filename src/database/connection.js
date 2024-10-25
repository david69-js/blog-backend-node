import sql from 'mssql';

const dbSettings = {
    server: 'localhost', // Dirección IP del servidor
    database: 'proyecto_blog',
    user: 'david',
    password: 'root',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, // Requiere cifrado
        trustServerCertificate: true, // Acepta certificados no confiables
    }
}

export async function getConnection() {
    try {
        const pool = await sql.connect(dbSettings);
        return pool;
    } catch (e) {
        console.error('Error connecting to the database', e);
    }
}
