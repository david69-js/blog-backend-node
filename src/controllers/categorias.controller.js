import { getConnection } from '../database/connection.js';
import sql from 'mssql';

// Obtener todas las categorías
export const getCategorias = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Categorias');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener las categorías.', error: err.message });
    }
};

// Obtener una categoría por ID
export const getCategoriaPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_categoria', sql.Int, id)
            .query('SELECT * FROM Categorias WHERE id_categoria = @id_categoria');

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener la categoría.', error: err.message });
    }
};

// Crear una nueva categoría
export const createCategoria = async (req, res) => {
    const { nombre_categoria } = req.body;

    // Validación de campo requerido
    if (!nombre_categoria) {
        return res.status(400).json({ mensaje: 'Falta el campo requerido: nombre_categoria.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre_categoria', sql.NVarChar(100), nombre_categoria)
            .query(`INSERT INTO Categorias (nombre_categoria) 
                    OUTPUT INSERTED.id_categoria
                    VALUES (@nombre_categoria)`);

        res.status(201).json({ id_categoria: result.recordset[0].id_categoria, mensaje: 'Categoría creada exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al crear la categoría.', error: err.message });
    }
};

// Actualizar una categoría
export const updateCategoria = async (req, res) => {
    const { id } = req.params;
    const { nombre_categoria } = req.body;

    // Validación de campo requerido
    if (!nombre_categoria) {
        return res.status(400).json({ mensaje: 'Falta el campo requerido: nombre_categoria.' });
    }

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id_categoria', sql.Int, id)
            .input('nombre_categoria', sql.NVarChar(100), nombre_categoria)
            .query(`UPDATE Categorias SET 
                    nombre_categoria = @nombre_categoria
                    WHERE id_categoria = @id_categoria`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
        }

        res.json({ mensaje: 'Categoría actualizada exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al actualizar la categoría.', error: err.message });
    }
};

// Eliminar una categoría
export const deleteCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id_categoria', sql.Int, id)
            .query('DELETE FROM Categorias WHERE id_categoria = @id_categoria');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
        }

        res.json({ mensaje: 'Categoría eliminada exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al eliminar la categoría.', error: err.message });
    }
};
