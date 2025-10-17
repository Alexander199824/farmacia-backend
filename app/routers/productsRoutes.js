/**
 * @author Alexander Echeverria
 * @file app/routers/productsRoutes.js
 * @description Rutas de Productos con Cloudinary
 * @location app/routers/productsRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/products - Crear producto
 * - GET /api/products - Listar productos con filtros
 * - GET /api/products/low-stock - Productos con stock bajo
 * - GET /api/products/out-of-stock - Productos agotados
 * - GET /api/products/stats - Estadísticas
 * - GET /api/products/sku/:sku - Obtener por SKU
 * - GET /api/products/barcode/:barcode - Obtener por código de barras
 * - GET /api/products/:id - Obtener por ID
 * - PUT /api/products/:id - Actualizar producto
 * - PATCH /api/products/:id/toggle-active - Activar/desactivar
 * - DELETE /api/products/:id - Eliminar producto
 */

const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const { 
    create, 
    getAll, 
    getById, 
    getBySku,
    getByBarcode,
    update, 
    toggleActive,
    delete: deleteProduct,
    getLowStockProducts,
    getOutOfStockProducts,
    getProductStats
} = require('../controllers/products.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Crear producto con imagen (autenticado)
router.post('/', authMiddleware, upload.single('image'), create);

// Obtener todos los productos (público o con filtros)
router.get('/', getAll);

// Obtener productos con stock bajo
router.get('/low-stock', authMiddleware, getLowStockProducts);

// Obtener productos agotados
router.get('/out-of-stock', authMiddleware, getOutOfStockProducts);

// Obtener estadísticas
router.get('/stats', authMiddleware, getProductStats);

// Obtener producto por SKU
router.get('/sku/:sku', getBySku);

// Obtener producto por código de barras
router.get('/barcode/:barcode', getByBarcode);

// Obtener un producto por ID
router.get('/:id', getById);

// Actualizar producto con imagen
router.put('/:id', authMiddleware, upload.single('image'), update);

// Activar/desactivar producto
router.patch('/:id/toggle-active', authMiddleware, toggleActive);

// Eliminar un producto
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;