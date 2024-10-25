import { getConnection } from '../database/connection.js';
import sql from 'mssql';

export const getArticulosPorUsuario = async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT 
                  *
                FROM 
                    Articulos a
                JOIN 
                    Usuarios u ON a.id_usuario = u.id_usuario
                WHERE 
                    u.id_usuario = @id_usuario
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Usted no tiene articulos creados', error: err.message });
    }
};


export const getEtiquetasDeArticulo = async (req, res) => {
    const { id_articulo } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_articulo', sql.Int, id_articulo)
            .query(`
                SELECT 
                    e.id_etiqueta,
                    e.nombre_etiqueta
                FROM 
                    Articulos a
                JOIN 
                    Articulos_Etiquetas ae ON a.id_articulo = ae.id_articulo
                JOIN 
                    Etiquetas e ON ae.id_etiqueta = e.id_etiqueta
                WHERE 
                    a.id_articulo = @id_articulo
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener las etiquetas del artículo.', error: err.message });
    }
};

export const getUsuarioInfo = async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT 
                    u.id_usuario,
                    u.nombre,
                    u.email,
                    u.fecha_registro
                FROM 
                    Usuarios u
                WHERE 
                    u.id_usuario = @id_usuario
            `);

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener la información del usuario.', error: err.message });
    }
};

export const getTodosArticulosPorUsuario = async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT 
                    a.id_articulo,
                    a.titulo,
                    a.contenido,
                    a.imagen_cover,
                    a.estado,
                    a.fecha_creacion
                FROM 
                    Articulos a
                WHERE 
                    a.id_usuario = @id_usuario
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener los artículos del usuario.', error: err.message });
    }
};

export const getArticulosPorCategoria = async (req, res) => {
    const { id_categoria } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_categoria', sql.Int, id_categoria)
            .query(`
                SELECT 
                    a.id_articulo,
                    a.titulo,
                    a.contenido,
                    a.imagen_cover,
                    a.estado,
                    c.nombre_categoria
                FROM 
                    Articulos a
                JOIN 
                    Articulos_Categorias ac ON a.id_articulo = ac.id_articulo
                JOIN 
                    Categorias c ON ac.id_categoria = c.id_categoria
                WHERE 
                    c.id_categoria = @id_categoria
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener los artículos de la categoría.', error: err.message });
    }
};
