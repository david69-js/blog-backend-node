import {Router} from 'express'
import { getCategorias, getCategoriaPorId, createCategoria, updateCategoria, deleteCategoria } from '../controllers/categorias.controller.js';

const router = Router();


router.get('/categorias', getCategorias);
router.get('/categorias/:id', getCategoriaPorId);
router.post('/categorias', createCategoria);
router.put('/categorias/:id', updateCategoria);
router.delete('/categorias/:id', deleteCategoria);

export default router;