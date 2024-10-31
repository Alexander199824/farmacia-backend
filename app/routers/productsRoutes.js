const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig'); // Importa el middleware de multer
const { create, getAll, getById, update, delete: deleteProduct } = require('../controllers/products.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, upload.single('image'), create);  // Crear producto con imagen
router.get('/', getAll);                   // Obtener todos los productos
router.get('/:id', getById);               // Obtener un producto por ID
router.put('/:id', authMiddleware, upload.single('image'), update); // Actualizar producto con imagen
router.delete('/:id', authMiddleware, deleteProduct); // Eliminar un producto

module.exports = router;
