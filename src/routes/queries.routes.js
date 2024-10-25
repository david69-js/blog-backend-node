import { Router } from 'express';
import { 
    getArticulosPorUsuario,
    getEtiquetasDeArticulo,
    getUsuarioInfo,
    getTodosArticulosPorUsuario,
    getArticulosPorCategoria
} from '../queries/queries.js'; // Ajusta la ruta según tu estructura
import { verificarToken } from '../middleware/auth.middleware.js'; // Ajusta la ruta según tu estructura

const router = Router();

// Rutas para artículos
router.get('/articulos/usuario/:id_usuario', verificarToken, getArticulosPorUsuario);
router.get('/articulos/:id_articulo/etiquetas', verificarToken, getEtiquetasDeArticulo);
router.get('/usuarios/:id_usuario', verificarToken, getUsuarioInfo);
router.get('/articulos/usuario/todos/:id_usuario', verificarToken, getTodosArticulosPorUsuario);
router.get('/articulos/categoria/:id_categoria', verificarToken, getArticulosPorCategoria);

export default router;


