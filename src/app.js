import express from 'express';
import cors from 'cors';

import usuarioRoutes from './routes/usuarios.routes.js';
import articuloRoutes from './routes/articulo.routes.js';
import categoriaRoutes from './routes/categorias.routes.js';
import etiquetaRoutes from './routes/etiqueta.routes.js';
import queriesRoutes from './routes/queries.routes.js';


const app = express();
app.use(cors());
// Middlewares
app.use(express.json());

// Ruta
app.use(usuarioRoutes);
app.use(articuloRoutes);
app.use(categoriaRoutes);
app.use(etiquetaRoutes);
app.use(queriesRoutes);

export default app;
