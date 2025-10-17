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
 * - GET /api/batches/stats - Estadísticas de lotes
 * - GET /api/batches/product/:productId - Lotes de un producto
 * - GET /api/batches/:id - Obtener lote por ID
 * - PUT /api/batches/:id - Actualizar lote
 * - PATCH /api/batches/:id/toggle-block - Bloquear/desbloquear lote
 * - DELETE /api/batches/:id - Eliminar lote
 */

const express = require('express');
const router = express.Router();
const {
    createBatch,
    getAllBatches,
    getBatchById,
    getExpiringBatches,
    getExpiredBatches,
    getAvailableBatchesByProduct,
    updateBatch,
    toggleBlockBatch,
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

// Obtener lote por ID
router.get('/:id', authMiddleware, getBatchById);

// Actualizar un lote
router.put('/:id', authMiddleware, updateBatch);

// Bloquear/Desbloquear lote
router.patch('/:id/toggle-block', authMiddleware, toggleBlockBatch);

// Eliminar un lote
router.delete('/:id', authMiddleware, deleteBatch);

module.exports = router;