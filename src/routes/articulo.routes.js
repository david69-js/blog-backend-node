import {Router} from 'express'
import { getArticulos, getArticuloPorId, createArticulo, updateArticulo, deleteArticulo } from '../controllers/articulo.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';


const router = Router();

router.get('/articulos', verificarToken, getArticulos);
router.get('/articulos/:id', verificarToken, getArticuloPorId);
router.post('/articulos', verificarToken, createArticulo);
router.put('/articulos/:id', verificarToken, updateArticulo);
router.delete('/articulos/:id', verificarToken, deleteArticulo);

export default router;