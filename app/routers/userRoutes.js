/**
 * @author Alexander Echeverria
 * @file app/routers/userRoutes.js
 * @description Rutas de Usuarios - Incluye endpoint /profile
 * @location app/routers/userRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/users/register - Registrar usuario
 * - POST /api/users/login - Iniciar sesión
 * - GET /api/users/profile - Obtener perfil del usuario autenticado
 * - GET /api/users - Listar usuarios
 * - GET /api/users/:id - Obtener usuario por ID
 * - PUT /api/users/:id - Actualizar usuario
 * - DELETE /api/users/:id - Eliminar usuario
 */

const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig'); // Middleware de multer para manejar imágenes
const { 
    register, 
    login, 
    getProfile, 
    getAllUsers, 
    getUserById, 
    updateUser, 
    deleteUser 
} = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas públicas (sin autenticación)
router.post('/register', upload.single('image'), register); // Registrar usuario con imagen
router.post('/login', login); // Iniciar sesión

// Rutas protegidas (requieren autenticación)
router.get('/profile', authMiddleware, getProfile); // Obtener perfil del usuario autenticado
router.get('/', authMiddleware, getAllUsers); // Obtener todos los usuarios
router.get('/:id', authMiddleware, getUserById); // Obtener usuario por ID
router.put('/:id', authMiddleware, upload.single('image'), updateUser); // Actualizar usuario con imagen
router.delete('/:id', authMiddleware, deleteUser); // Eliminar usuario

module.exports = router;