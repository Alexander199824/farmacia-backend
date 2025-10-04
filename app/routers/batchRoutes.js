/**
 * @author Alexander Echeverria
 * @file app/routers/batchRoutes.js
 * @description Rutas para gestión de lotes y control de vencimientos
 * @location app/routers/batchRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/batches - Crear lote
 * - GET /api/batches - Listar lotes
 * - GET /api/batches/expiring - Lotes por vencer
 * - GET /api/batches/expired - Lotes vencidos
 * - GET /api/batches/product/:productId - Lotes de un producto
 * - GET /api/batches/stats - Estadísticas de lotes
 * - PUT /api/batches/:id - Actualizar lote
 * - DELETE /api/batches/:id - Eliminar lote
 */

const express = require('express');
const router = express.Router();
const {
    createBatch,
    getAllBatches,
    getExpiringBatches,
    getExpiredBatches,
    getAvailableBatchesByProduct,
    updateBatch,
    deleteBatch,
    getBatchStats
} = require('../controllers/batch.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Crear un nuevo lote
router.post('/', authMiddleware, createBatch);

// Obtener todos los lotes con filtros opcionales
router.get('/', authMiddleware, getAllBatches);

// Obtener lotes próximos a vencer
router.get('/expiring', authMiddleware, getExpiringBatches);

// Obtener lotes vencidos
router.get('/expired', authMiddleware, getExpiredBatches);

// Obtener estadísticas de lotes
router.get('/stats', authMiddleware, getBatchStats);

// Obtener lotes disponibles por producto
router.get('/product/:productId', authMiddleware, getAvailableBatchesByProduct);

// Actualizar un lote
router.put('/:id', authMiddleware, updateBatch);

// Eliminar un lote
router.delete('/:id', authMiddleware, deleteBatch);

module.exports = router;