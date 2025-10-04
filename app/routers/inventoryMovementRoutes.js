/**
 * @author Alexander Echeverria
 * @file app/routers/inventoryMovementRoutes.js
 * @description Rutas de Movimientos de Inventario
 * @location app/routers/inventoryMovementRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/inventory/movements - Crear movimiento
 * - GET /api/inventory/movements - Listar movimientos
 * - GET /api/inventory/movements/product/:productId - Movimientos por producto
 * - GET /api/inventory/movements/stats - Estadísticas
 * - PUT /api/inventory/movements/:id/approve - Aprobar movimiento
 * - DELETE /api/inventory/movements/:id - Eliminar movimiento
 */

const express = require('express');
const router = express.Router();
const {
    createMovement,
    getAllMovements,
    getMovementsByProduct,
    approveMovement,
    getMovementStats,
    deleteMovement
} = require('../controllers/inventoryMovement.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Crear un movimiento de inventario
router.post('/movements', authMiddleware, createMovement);

// Obtener todos los movimientos con filtros
router.get('/movements', authMiddleware, getAllMovements);

// Obtener estadísticas de movimientos
router.get('/movements/stats', authMiddleware, getMovementStats);

// Obtener movimientos por producto
router.get('/movements/product/:productId', authMiddleware, getMovementsByProduct);

// Aprobar un movimiento
router.put('/movements/:id/approve', authMiddleware, approveMovement);

// Eliminar un movimiento
router.delete('/movements/:id', authMiddleware, deleteMovement);

module.exports = router;