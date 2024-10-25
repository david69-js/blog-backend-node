import express from 'express';
import { getEtiquetas, getEtiquetaPorId, createEtiqueta, updateEtiqueta, deleteEtiqueta } from '../controllers/etiqueta.controller.js';

const router = express.Router();

router.get('/etiquetas', getEtiquetas);
router.get('/etiquetas/:id', getEtiquetaPorId);
router.post('/etiquetas', createEtiqueta);
router.put('/etiquetas/:id', updateEtiqueta);
router.delete('/etiquetas/:id', deleteEtiqueta);

export default router;
