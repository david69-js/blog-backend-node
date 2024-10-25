import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ mensaje: 'Token no proporcionado.' });
    }

    // Verifica que el token tenga el prefijo 'Bearer '
    const bearerToken = token.split(' ')[1];
    if (!bearerToken) {
        return res.status(403).json({ mensaje: 'Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
        req.usuarioId = decoded.id_usuario;
        next(); // Continuar con la siguiente función
    } catch (err) {
        return res.status(401).json({ mensaje: 'Token inválido.' });
    }
};
