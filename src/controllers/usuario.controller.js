import { getConnection } from '../database/connection.js';
import sql from 'mssql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const getUsuarios = async (req, res) => {
    const pool = await getConnection();

    const result = await pool.request().query('SELECT * FROM USUARIOS');

    res.json(result.recordset);
}

export const getUsuarioPorToken = async (req, res) => {
    try {
        const pool = await getConnection();
        
        // Modificar la consulta para incluir los roles y permisos
        const result = await pool.request()
            .input('id_usuario', sql.Int, req.usuarioId)
            .query(`
                SELECT 
                    u.*, 
                    r.nombre_rol AS rol, 
                    rp.id_permiso
                FROM Usuarios u
                LEFT JOIN Usuarios_Roles ur ON u.id_usuario = ur.id_usuario
                LEFT JOIN Roles r ON ur.id_rol = r.id_rol
                LEFT JOIN Roles_Permisos rp ON r.id_rol = rp.id_rol
                WHERE u.id_usuario = @id_usuario
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const usuario = result.recordset[0];
        
        // Crear un objeto para almacenar los permisos
        const permisos = result.recordset.map(row => row.id_permiso).filter(Boolean); // Filtrar permisos undefined

        res.json({ 
            usuario: { 
                ...usuario,
                permisos // Incluir permisos en la respuesta
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener usuario.', error: err.message });
    }
};


export const loginUsuario = async (req, res) => {
    const { login, contrasenia } = req.body;

    if (!login || !contrasenia) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos: login y contraseña.' });
    }

    try {
        const pool = await getConnection();

        // Buscar al usuario por nickname o correo
        const result = await pool.request()
        .input('login', sql.VarChar(50), login)
        .query(`
            SELECT 
                u.*, 
                r.nombre_rol AS rol, 
                rp.id_permiso
            FROM Usuarios u
            LEFT JOIN Usuarios_Roles ur ON u.id_usuario = ur.id_usuario
            LEFT JOIN Roles r ON ur.id_rol = r.id_rol
            LEFT JOIN Roles_Permisos rp ON r.id_rol = rp.id_rol
            WHERE u.nickname = @login OR u.correo = @login
        `);
    

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const usuario = result.recordset[0];

        // Verificar la contraseña
        const esValida = await bcrypt.compare(contrasenia, usuario.contrasenia);
        if (!esValida) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
        }

        // Generar el token
        const token = jwt.sign({ id_usuario: usuario.id_usuario }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        // Responder con el token y datos del usuario
        res.json({ token, usuario });

    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al iniciar sesión.', error: err.message });
    }
};


export const registerUsuario = async (req, res) => {
    const { nombre, nickname, correo, contrasenia, imagen_perfil, numero_telefono, fecha_nacimiento } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!nombre || !nickname || !correo || !contrasenia) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos: nombre, nickname, correo o contrasenia.' });
    }

    try {
        const pool = await getConnection();

        // Verificar si el nickname o el correo ya existen
        const userExist = await pool.request()
            .input('nickname', sql.VarChar(50), nickname)
            .input('correo', sql.VarChar(50), correo)
            .query(`SELECT * FROM Usuarios WHERE nickname = @nickname OR correo = @correo`);

        if (userExist.recordset.length > 0) {
            return res.status(400).json({ mensaje: 'El nickname o correo ya están en uso.' });
        }

        // Hashear la contraseña antes de guardarla
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contrasenia, saltRounds);

        // Insertar el nuevo usuario
        await pool.request()
            .input('nombre', sql.VarChar(50), nombre)
            .input('nickname', sql.VarChar(50), nickname)
            .input('correo', sql.VarChar(50), correo)
            .input('contrasenia', sql.VarChar(255), hashedPassword) // Contraseña hasheada
            .input('imagen_perfil', sql.VarChar(100), imagen_perfil || null)
            .input('numero_telefono', sql.VarChar(20), numero_telefono || null)
            .input('fecha_nacimiento', sql.Date, fecha_nacimiento || null)
            .query(`INSERT INTO Usuarios (nombre, nickname, correo, contrasenia, imagen_perfil, numero_telefono, fecha_nacimiento)
                    VALUES (@nombre, @nickname, @correo, @contrasenia, @imagen_perfil, @numero_telefono, @fecha_nacimiento)`);

        // Obtener el nuevo usuario para generar el token
        const newUser = await pool.request()
            .input('nickname', sql.VarChar(50), nickname)
            .query(`SELECT * FROM Usuarios WHERE nickname = @nickname`);

        // Asignar el rol con id 2 al nuevo usuario
        await pool.request()
            .input('id_usuario', sql.Int, newUser.recordset[0].id_usuario)
            .input('id_rol', sql.Int, 2)
            .query(`INSERT INTO Usuarios_Roles (id_usuario, id_rol)
                    VALUES (@id_usuario, @id_rol)`);

        // Generar el token
        const token = jwt.sign({ id_usuario: newUser.recordset[0].id_usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Responder con el mensaje de éxito, el token y los datos del usuario
        res.status(201).json({ mensaje: 'Usuario registrado exitosamente.', token, usuario: { id_usuario: newUser.recordset[0].id_usuario, nombre, nickname, correo } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al registrar usuario.', error: err.message });
    }
};


export const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, nickname, correo, contrasenia, numero_telefono, fecha_nacimiento } = req.body;

    // Verificar si se recibió una nueva imagen
    const imagen_perfil = req.file ? req.file.filename : null; // Utiliza el nombre del archivo generado por Multer

    try {
        const pool = await getConnection();

        // Verificar si el nickname ya existe en otro usuario
        const existingNickname = await pool.request()
            .input('nickname', sql.VarChar(50), nickname)
            .input('id_usuario', sql.Int, id) // Excluir el usuario actual de la verificación
            .query('SELECT COUNT(*) AS count FROM Usuarios WHERE nickname = @nickname AND id_usuario <> @id_usuario');

        if (existingNickname.recordset[0].count > 0) {
            return res.status(409).json({ mensaje: 'El nickname ya existe. Elige uno diferente.' });
        }

        // Verificar si el correo ya existe en otro usuario
        const existingCorreo = await pool.request()
            .input('correo', sql.VarChar(50), correo)
            .input('id_usuario', sql.Int, id) // Excluir el usuario actual de la verificación
            .query('SELECT COUNT(*) AS count FROM Usuarios WHERE correo = @correo AND id_usuario <> @id_usuario');

        if (existingCorreo.recordset[0].count > 0) {
            return res.status(409).json({ mensaje: 'El correo ya está registrado. Utiliza otro.' });
        }
        // Hashear la contraseña antes de guardarla
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contrasenia, saltRounds);

        // Actualizar el usuario
        const result = await pool.request()
            .input('id_usuario', sql.Int, id)
            .input('nombre', sql.VarChar(50), nombre)
            .input('nickname', sql.VarChar(50), nickname)
            .input('correo', sql.VarChar(50), correo)
            .input('contrasenia', sql.VarChar(255), hashedPassword) // Asegúrate de hashear la contraseña si es necesario
            .input('imagen_perfil', sql.VarChar(100), imagen_perfil)
            .input('numero_telefono', sql.VarChar(20), numero_telefono)
            .input('fecha_nacimiento', sql.Date, fecha_nacimiento)
            .query(`UPDATE Usuarios SET 
                    nombre = @nombre,
                    nickname = @nickname,
                    correo = @correo,
                    contrasenia = @contrasenia,
                    imagen_perfil = @imagen_perfil,
                    numero_telefono = @numero_telefono,
                    fecha_nacimiento = @fecha_nacimiento
                    WHERE id_usuario = @id_usuario`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.json({ mensaje: 'Usuario actualizado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al actualizar el usuario.', error: err.message });
    }
};



export const deleteUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id_usuario', sql.Int, id)
            .query('DELETE FROM Usuarios WHERE id_usuario = @id_usuario');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.json({ mensaje: 'Usuario eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al eliminar el usuario.', error: err.message });
    }
}

//Create Rol
export const createRol = async (req, res) => {
    const { nombre_rol } = req.body;

    if (!nombre_rol) {
        return res.status(400).json({ mensaje: 'El nombre del rol es requerido.' });
    }

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('nombre_rol', sql.VarChar(50), nombre_rol)
            .query(`INSERT INTO Roles (nombre_rol) 
                    OUTPUT INSERTED.id_rol
                    VALUES (@nombre_rol)`);

        res.status(201).json({ id_rol: result.recordset[0].id_rol, mensaje: 'Rol creado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al crear el rol.', error: err.message });
    }
}

export const getRoles = async (req, res) => {
    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .query('SELECT * FROM Roles');

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener los roles.', error: err.message });
    }
}

export const updateRol = async (req, res) => {
    const { id } = req.params;
    const { nombre_rol } = req.body;

    if (!nombre_rol) {
        return res.status(400).json({ mensaje: 'El nombre del rol es requerido.' });
    }

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id_rol', sql.Int, id)
            .input('nombre_rol', sql.VarChar(50), nombre_rol)
            .query(`UPDATE Roles 
                    SET nombre_rol = @nombre_rol
                    WHERE id_rol = @id_rol`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Rol no encontrado.' });
        }

        res.json({ mensaje: 'Rol actualizado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al actualizar el rol.', error: err.message });
    }
}

export const deleteRol = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id_rol', sql.Int, id)
            .query('DELETE FROM Roles WHERE id_rol = @id_rol');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Rol no encontrado.' });
        }

        res.json({ mensaje: 'Rol eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al eliminar el rol.', error: err.message });
    }
}

export const getRolPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id_rol', sql.Int, id)
            .query('SELECT * FROM Roles WHERE id_rol = @id_rol');

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Rol no encontrado.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener el rol.', error: err.message });
    }
}

// Crear un nuevo permiso
export const createPermiso = async (req, res) => {
    const { nombre_permiso } = req.body;

    if (!nombre_permiso) {
        return res.status(400).json({ mensaje: 'El nombre del permiso es requerido.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre_permiso', sql.VarChar(50), nombre_permiso)
            .query(`INSERT INTO Permisos (nombre_permiso) 
                    VALUES (@nombre_permiso)`);

        res.status(201).json({ mensaje: 'Permiso creado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al crear el permiso.', error: err.message });
    }
};

// Obtener todos los permisos
export const getPermisos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Permisos');

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener permisos.', error: err.message });
    }
};

// Obtener un permiso por ID
export const getPermisoPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_permiso', sql.Int, id)
            .query('SELECT * FROM Permisos WHERE id_permiso = @id_permiso');

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Permiso no encontrado.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener el permiso.', error: err.message });
    }
};

// Actualizar un permiso
export const updatePermiso = async (req, res) => {
    const { id } = req.params;
    const { nombre_permiso } = req.body;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_permiso', sql.Int, id)
            .input('nombre_permiso', sql.VarChar(50), nombre_permiso)
            .query(`UPDATE Permisos 
                    SET nombre_permiso = @nombre_permiso
                    WHERE id_permiso = @id_permiso`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Permiso no encontrado para actualizar.' });
        }

        res.json({ mensaje: 'Permiso actualizado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al actualizar el permiso.', error: err.message });
    }
};

// Eliminar un permiso
export const deletePermiso = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_permiso', sql.Int, id)
            .query('DELETE FROM Permisos WHERE id_permiso = @id_permiso');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Permiso no encontrado para eliminar.' });
        }

        res.json({ mensaje: 'Permiso eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al eliminar el permiso.', error: err.message });
    }
};

// Asignar un permiso a un rol
export const asignarPermisoARol = async (req, res) => {
    const { id_rol, id_permiso } = req.body; // Se espera que el cuerpo de la solicitud contenga estos IDs

    // Validar que se hayan proporcionado los IDs
    if (!id_rol || !id_permiso) {
        return res.status(400).json({ mensaje: 'Los IDs de rol y permiso son requeridos.' });
    }

    try {
        const pool = await getConnection();

        // Verifica si el rol y el permiso existen (opcional, pero recomendado)
        const rolExists = await pool.request()
            .input('id_rol', sql.Int, id_rol)
            .query('SELECT COUNT(*) AS count FROM Roles WHERE id_rol = @id_rol');

        const permisoExists = await pool.request()
            .input('id_permiso', sql.Int, id_permiso)
            .query('SELECT COUNT(*) AS count FROM Permisos WHERE id_permiso = @id_permiso');

        if (rolExists.recordset[0].count === 0) {
            return res.status(404).json({ mensaje: 'Rol no encontrado.' });
        }

        if (permisoExists.recordset[0].count === 0) {
            return res.status(404).json({ mensaje: 'Permiso no encontrado.' });
        }

        // Insertar el permiso en la tabla Roles_Permisos
        const result = await pool.request()
            .input('id_rol', sql.Int, id_rol)
            .input('id_permiso', sql.Int, id_permiso)
            .query(`INSERT INTO Roles_Permisos (id_rol, id_permiso)
                    VALUES (@id_rol, @id_permiso)`);

        res.status(201).json({ mensaje: 'Permiso asignado exitosamente al rol.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al asignar el permiso al rol.', error: err.message });
    }
};

// Asignar un rol a un usuario
export const asignarRolAUsuario = async (req, res) => {
    const { id_usuario, id_rol } = req.body; // Se espera que el cuerpo de la solicitud contenga estos IDs

    // Validar que se hayan proporcionado los IDs
    if (!id_usuario || !id_rol) {
        return res.status(400).json({ mensaje: 'Se requieren el id_usuario y el id_rol.' });
    }

    try {
        const pool = await getConnection();

        // Verificar si el usuario y el rol existen
        const usuarioExistente = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT * FROM Usuarios WHERE id_usuario = @id_usuario');

        if (usuarioExistente.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const rolExistente = await pool.request()
            .input('id_rol', sql.Int, id_rol)
            .query('SELECT * FROM Roles WHERE id_rol = @id_rol');

        if (rolExistente.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Rol no encontrado.' });
        }

        // Insertar el rol en la tabla intermedia Usuarios_Roles
        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_rol', sql.Int, id_rol)
            .query(`INSERT INTO Usuarios_Roles (id_usuario, id_rol) 
                    VALUES (@id_usuario, @id_rol)`);

        res.json({ mensaje: 'Rol asignado al usuario exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al asignar rol al usuario.', error: err.message });
    }
};
