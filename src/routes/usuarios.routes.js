import {Router} from 'express'
import { verificarToken } from '../middleware/auth.middleware.js';
import { registerUsuario, loginUsuario, getUsuarios, 
        deleteUsuario, updateUsuario, createRol, deleteRol, 
        getRoles, updateRol, getRolPorId,
        createPermiso, deletePermiso,getPermisoPorId,getPermisos, updatePermiso, asignarPermisoARol,  
        getUsuarioPorToken, asignarRolAUsuario} from '../controllers/usuario.controller.js'


const router = Router();

router.get('/usuarios', getUsuarios)

// Ruta para registrar un nuevo usuario
router.post('/register', registerUsuario);

// Ruta para iniciar sesión
router.post('/login', loginUsuario);

router.get('/profile', verificarToken, getUsuarioPorToken); 

router.put('/usuarios/:id', updateUsuario)

router.delete('/usuarios/:id', deleteUsuario)

//Roles
router.get('/rol', getRoles)

router.get('/rol/:id', getRolPorId)

router.post('/rol', createRol)

router.put('/rol/:id', updateRol)

router.delete('/rol/:id', deleteRol)

//Roles
router.get('/permiso', getPermisos)

router.get('/permiso/:id', getPermisoPorId)

router.post('/permiso', createPermiso)

router.put('/permiso/:id', updatePermiso)

router.delete('/permiso/:id', deletePermiso)

//asignar permiso
router.post('/asignar-permiso', asignarPermisoARol);
router.post('/usuarios/asignar-rol', asignarRolAUsuario);

export default router;