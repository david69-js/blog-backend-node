import { getConnection } from '../database/connection.js'; 
import sql from 'mssql';

// Obtener todos los artículos con información de usuario, categorías y etiquetas
export const getArticulos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                A.id_articulo, 
                A.fecha_publicacion,
                A.titulo, 
                A.contenido, 
                U.nombre AS nombre_usuario
            FROM Articulos A
            LEFT JOIN Usuarios U ON A.id_usuario = U.id_usuario
            ORDER BY A.fecha_publicacion DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener los artículos.', error: err.message });
    }
};

// Obtener un artículo por ID con sus etiquetas y categorías
export const getArticuloPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_articulo', sql.Int, id)
            .query(`
                SELECT 
                    u.id_usuario,
                    u.nombre,
                    a.id_articulo,
                    a.titulo,
                    a.contenido,
                    a.imagen_cover,
                    a.estado,
                    a.fecha_publicacion,
                    (SELECT 
                        JSON_QUERY((
                            SELECT c.id_categoria, c.nombre_categoria
                            FROM Articulos_Categorias ac 
                            JOIN Categorias c ON ac.id_categoria = c.id_categoria 
                            WHERE ac.id_articulo = a.id_articulo
                            FOR JSON PATH
                        ))
                     ) AS categorias,
                    (SELECT 
                        JSON_QUERY((
                            SELECT e.id_etiqueta, e.nombre_etiqueta
                            FROM Articulos_Etiquetas ae 
                            JOIN Etiquetas e ON ae.id_etiqueta = e.id_etiqueta 
                            WHERE ae.id_articulo = a.id_articulo
                            FOR JSON PATH
                        ))
                     ) AS etiquetas
                FROM 
                    Usuarios u
                JOIN 
                    Articulos a ON u.id_usuario = a.id_usuario
                WHERE 
                    a.id_articulo = @id_articulo
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener el artículo.', error: err.message });
    }
};



// Crear un nuevo artículo
export const createArticulo = async (req, res) => {
    const { id_usuario, titulo, contenido, imagen_cover, estado, etiquetas, categorias } = req.body;

    // Validación de campos requeridos
    if (!id_usuario || !titulo || !contenido) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos: id_usuario, titulo y contenido.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('titulo', sql.NVarChar(255), titulo)
            .input('contenido', sql.NVarChar(sql.MAX), contenido)
            .input('imagen_cover', sql.NVarChar(255), imagen_cover)
            .input('estado', sql.NVarChar(20), estado || 'borrador') // Estado por defecto
            .query(`INSERT INTO Articulos (id_usuario, titulo, contenido, imagen_cover, estado) 
                    OUTPUT INSERTED.id_articulo
                    VALUES (@id_usuario, @titulo, @contenido, @imagen_cover, @estado)`);

        const id_articulo = result.recordset[0].id_articulo;

        // Asignar etiquetas si se proporcionan
        if (etiquetas && etiquetas.length > 0) {
            for (const id_etiqueta of etiquetas) {
                await pool.request()
                    .input('id_articulo', sql.Int, id_articulo)
                    .input('id_etiqueta', sql.Int, id_etiqueta)
                    .query(`INSERT INTO Articulos_Etiquetas (id_articulo, id_etiqueta) VALUES (@id_articulo, @id_etiqueta)`);
            }
        }

        // Asignar categorías si se proporcionan
        if (categorias && categorias.length > 0) {
            for (const id_categoria of categorias) {
                await pool.request()
                    .input('id_articulo', sql.Int, id_articulo)
                    .input('id_categoria', sql.Int, id_categoria)
                    .query(`INSERT INTO Articulos_Categorias (id_articulo, id_categoria) VALUES (@id_articulo, @id_categoria)`);
            }
        }

        res.status(201).json({ id_articulo, mensaje: 'Artículo creado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al crear el artículo.', error: err.message });
    }
};

// Actualizar un artículo
export const updateArticulo = async (req, res) => {
    const { id } = req.params;
    const { id_usuario, titulo, contenido, imagen_cover, estado, etiquetas, categorias } = req.body;

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id_articulo', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .input('titulo', sql.NVarChar(255), titulo)
            .input('contenido', sql.NVarChar(sql.MAX), contenido)
            .input('imagen_cover', sql.NVarChar(255), imagen_cover)
            .input('estado', sql.NVarChar(20), estado)
            .query(`UPDATE Articulos SET 
                    id_usuario = @id_usuario,
                    titulo = @titulo,
                    contenido = @contenido,
                    imagen_cover = @imagen_cover,
                    estado = @estado
                    WHERE id_articulo = @id_articulo`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
        }

        // Actualizar etiquetas si se proporcionan
        if (etiquetas) {
            // Eliminar etiquetas existentes
            await pool.request()
                .input('id_articulo', sql.Int, id)
                .query(`DELETE FROM Articulos_Etiquetas WHERE id_articulo = @id_articulo`);

            // Asignar nuevas etiquetas
            for (const id_etiqueta of etiquetas) {
                await pool.request()
                    .input('id_articulo', sql.Int, id)
                    .input('id_etiqueta', sql.Int, id_etiqueta)
                    .query(`INSERT INTO Articulos_Etiquetas (id_articulo, id_etiqueta) VALUES (@id_articulo, @id_etiqueta)`);
            }
        }

        // Actualizar categorías si se proporcionan
        if (categorias) {
            // Eliminar categorías existentes
            await pool.request()
                .input('id_articulo', sql.Int, id)
                .query(`DELETE FROM Articulos_Categorias WHERE id_articulo = @id_articulo`);

            // Asignar nuevas categorías
            for (const id_categoria of categorias) {
                await pool.request()
                    .input('id_articulo', sql.Int, id)
                    .input('id_categoria', sql.Int, id_categoria)
                    .query(`INSERT INTO Articulos_Categorias (id_articulo, id_categoria) VALUES (@id_articulo, @id_categoria)`);
            }
        }

        res.json({ mensaje: 'Artículo actualizado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al actualizar el artículo.', error: err.message });
    }
};


export const deleteArticulo = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();

        // Primero, eliminar etiquetas asociadas
        await pool.request()
            .input('id_articulo', sql.Int, id)
            .query(`DELETE FROM Articulos_Etiquetas WHERE id_articulo = @id_articulo`);

        // Luego, eliminar categorías asociadas
        await pool.request()
            .input('id_articulo', sql.Int, id)
            .query(`DELETE FROM Articulos_Categorias WHERE id_articulo = @id_articulo`);

        // Finalmente, eliminar el artículo
        const result = await pool.request()
            .input('id_articulo', sql.Int, id)
            .query('DELETE FROM Articulos WHERE id_articulo = @id_articulo');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
        }

        res.json({ mensaje: 'Artículo eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al eliminar el artículo.', error: err.message });
    }
};

