/**
 * @author Alexander Echeverria
 * @file app/routers/userRoutes.js
 * @description Rutas de Usuarios con Google OAuth completo
 * @location app/routers/userRoutes.js
 * 
 * RUTAS PÚBLICAS (sin autenticación):
 * - POST   /api/users/register              - Registrar usuario tradicional
 * - POST   /api/users/login                 - Login tradicional
 * - POST   /api/users/register-google       - Registrar con Google (token directo)
 * - POST   /api/users/login-google          - Login con Google (token directo)
 * - GET    /api/users/auth/google           - Iniciar OAuth con Google (redirect)
 * - GET    /api/users/auth/google/callback  - Callback de Google OAuth
 * 
 * RUTAS DE PERFIL (usuario autenticado):
 * - GET    /api/users/profile               - Obtener perfil del usuario autenticado
 * - PUT    /api/users/profile               - Actualizar perfil propio
 * - POST   /api/users/change-password       - Cambiar contraseña propia
 * 
 * RUTAS DE ADMINISTRACIÓN (requieren autenticación):
 * - GET    /api/users                       - Listar todos los usuarios
 * - GET    /api/users/stats                 - Estadísticas de usuarios
 * - POST   /api/users                       - Crear usuario (Admin)
 * - GET    /api/users/:id                   - Obtener usuario por ID
 * - PUT    /api/users/:id                   - Actualizar usuario (Admin)
 * - PATCH  /api/users/:id/toggle-active     - Activar/desactivar usuario
 * - DELETE /api/users/:id                   - Eliminar usuario
 */

const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const { 
    register,
    registerWithGoogle,
    login,
    loginWithGoogle,
    initiateGoogleAuth,
    googleAuthCallback,
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    toggleActiveUser,
    deleteUser,
    getUserStats
} = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// ╔══════════════════════════════════════════════════════════╗
// ║              RUTAS PÚBLICAS (SIN AUTENTICACIÓN)         ║
// ╚══════════════════════════════════════════════════════════╝

// ========== AUTENTICACIÓN TRADICIONAL ==========

/**
 * Registrar usuario con email/password
 * Permite subir imagen de perfil
 */
router.post('/register', upload.single('image'), register);

/**
 * Login con email/password
 * Retorna token JWT
 */
router.post('/login', login);

// ========== AUTENTICACIÓN CON GOOGLE OAUTH ==========

/**
 * OPCIÓN A: Frontend maneja OAuth (RECOMENDADO)
 * 
 * Registrar usuario con token de Google
 * Frontend usa @react-oauth/google o similar
 * Envía el token que recibe de Google
 */
router.post('/register-google', registerWithGoogle);

/**
 * OPCIÓN A: Frontend maneja OAuth (RECOMENDADO)
 * 
 * Login con token de Google
 * Frontend usa @react-oauth/google o similar
 * Envía el token que recibe de Google
 */
router.post('/login-google', loginWithGoogle);

/**
 * OPCIÓN B: Backend maneja OAuth (con redirects)
 * 
 * Iniciar proceso de autenticación con Google
 * Redirige al usuario a Google para autenticarse
 * Después Google redirige a /auth/google/callback
 */
router.get('/auth/google', initiateGoogleAuth);

/**
 * OPCIÓN B: Backend maneja OAuth (con redirects)
 * 
 * Callback que recibe Google después de la autenticación
 * Procesa el código de autorización
 * Crea/actualiza usuario y redirige al frontend con token
 */
router.get('/auth/google/callback', googleAuthCallback);

// ╔══════════════════════════════════════════════════════════╗
// ║           RUTAS DE PERFIL (USUARIO AUTENTICADO)         ║
// ╚══════════════════════════════════════════════════════════╝

/**
 * Obtener perfil del usuario autenticado
 * Requiere token JWT en header Authorization
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * Actualizar perfil propio
 * Permite cambiar: nombre, teléfono, dirección, imagen
 * NO permite cambiar: email, role, password (usar /change-password)
 */
router.put('/profile', authMiddleware, upload.single('image'), updateProfile);

/**
 * Cambiar contraseña propia
 * Requiere contraseña actual para validación
 */
router.post('/change-password', authMiddleware, changePassword);

// ╔══════════════════════════════════════════════════════════╗
// ║        RUTAS DE ADMINISTRACIÓN (AUTENTICACIÓN)          ║
// ╚══════════════════════════════════════════════════════════╝

// IMPORTANTE: Rutas específicas ANTES de rutas con parámetros

/**
 * Obtener estadísticas de usuarios
 * Solo Admin
 * Retorna: total usuarios, por rol, activos/inactivos, etc.
 */
router.get('/stats', authMiddleware, getUserStats);

/**
 * Listar todos los usuarios
 * Solo Admin/Vendedor
 * Soporta filtros: role, isActive, search
 * Soporta paginación: page, limit
 */
router.get('/', authMiddleware, getAllUsers);

/**
 * Crear usuario manualmente (Admin)
 * Diferente a /register (que es público)
 * Admin puede crear usuarios con cualquier rol
 */
router.post('/', authMiddleware, upload.single('image'), createUser);

/**
 * Obtener usuario por ID
 * Solo Admin o el propio usuario
 */
router.get('/:id', authMiddleware, getUserById);

/**
 * Actualizar usuario (Admin)
 * Admin puede modificar cualquier campo, incluyendo role
 */
router.put('/:id', authMiddleware, upload.single('image'), updateUser);

/**
 * Activar/Desactivar usuario
 * Solo Admin
 * Alterna el estado isActive del usuario
 */
router.patch('/:id/toggle-active', authMiddleware, toggleActiveUser);

/**
 * Eliminar usuario (soft delete)
 * Solo Admin
 * Marca isActive = false en lugar de eliminar físicamente
 */
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;

// cambios