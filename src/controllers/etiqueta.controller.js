import { getConnection } from '../database/connection.js';
import sql from 'mssql';

// Obtener todas las etiquetas
export const getEtiquetas = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Etiquetas');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener las etiquetas.', error: err.message });
    }
};

// Obtener una etiqueta por ID
export const getEtiquetaPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_etiqueta', sql.Int, id)
            .query('SELECT * FROM Etiquetas WHERE id_etiqueta = @id_etiqueta');

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Etiqueta no encontrada.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener la etiqueta.', error: err.message });
    }
};

// Crear una nueva etiqueta
export const createEtiqueta = async (req, res) => {
    const { nombre_etiqueta } = req.body;

    // Validación de campos requeridos
    if (!nombre_etiqueta) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos: nombre_etiqueta.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre_etiqueta', sql.NVarChar(100), nombre_etiqueta)
            .query(`INSERT INTO Etiquetas (nombre_etiqueta) 
                    OUTPUT INSERTED.id_etiqueta
                    VALUES (@nombre_etiqueta)`);

        res.status(201).json({ id_etiqueta: result.recordset[0].id_etiqueta, mensaje: 'Etiqueta creada exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al crear la etiqueta.', error: err.message });
    }
};

// Actualizar una etiqueta
export const updateEtiqueta = async (req, res) => {
    const { id } = req.params;
    const { nombre_etiqueta } = req.body;

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id_etiqueta', sql.Int, id)
            .input('nombre_etiqueta', sql.NVarChar(100), nombre_etiqueta)
            .query(`UPDATE Etiquetas SET 
                    nombre_etiqueta = @nombre_etiqueta
                    WHERE id_etiqueta = @id_etiqueta`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Etiqueta no encontrada.' });
        }

        res.json({ mensaje: 'Etiqueta actualizada exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al actualizar la etiqueta.', error: err.message });
    }
};

// Eliminar una etiqueta
export const deleteEtiqueta = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id_etiqueta', sql.Int, id)
            .query('DELETE FROM Etiquetas WHERE id_etiqueta = @id_etiqueta');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Etiqueta no encontrada.' });
        }

        res.json({ mensaje: 'Etiqueta eliminada exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al eliminar la etiqueta.', error: err.message });
    }
};
