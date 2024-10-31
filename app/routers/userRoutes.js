const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig'); // Middleware de multer para manejar imágenes
const { register, login, getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', upload.single('image'), register); // Registrar usuario con imagen
router.post('/login', login);
router.get('/', authMiddleware, getAllUsers); // Obtener todos los usuarios (requiere autenticación)
router.get('/:id', authMiddleware, getUserById); // Obtener usuario por ID
router.put('/:id', authMiddleware, upload.single('image'), updateUser); // Actualizar usuario con imagen
router.delete('/:id', authMiddleware, deleteUser); // Eliminar usuario

module.exports = router;
