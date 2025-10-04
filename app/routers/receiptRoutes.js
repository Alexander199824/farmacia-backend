/**
 * @author Alexander Echeverria
 * @file app/routers/receiptRoutes.js
 * @description Rutas de Recibos/Comprobantes
 * @location app/routers/receiptRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/receipts - Crear recibo
 * - GET /api/receipts - Listar recibos
 * - GET /api/receipts/stats - Estadísticas
 * - GET /api/receipts/:id - Obtener recibo por ID
 * - GET /api/receipts/number/:receiptNumber - Obtener por número
 * - GET /api/receipts/client/:clientId - Recibos de un cliente
 * - PUT /api/receipts/:id - Actualizar recibo
 * - PUT /api/receipts/:id/cancel - Cancelar recibo
 * - PUT /api/receipts/:id/mark-sent - Marcar como enviado
 */

const express = require('express');
const router = express.Router();
const {
    createReceipt,
    getAllReceipts,
    getReceiptById,
    getReceiptByNumber,
    getReceiptsByClient,
    updateReceipt,
    cancelReceipt,
    markAsSent,
    getReceiptStats
} = require('../controllers/receipt.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Crear un recibo
router.post('/', authMiddleware, createReceipt);

// Obtener todos los recibos con filtros
router.get('/', authMiddleware, getAllReceipts);

// Obtener estadísticas de recibos
router.get('/stats', authMiddleware, getReceiptStats);

// Obtener recibo por número
router.get('/number/:receiptNumber', authMiddleware, getReceiptByNumber);

// Obtener recibos por cliente
router.get('/client/:clientId', authMiddleware, getReceiptsByClient);

// Obtener un recibo por ID
router.get('/:id', authMiddleware, getReceiptById);

// Actualizar un recibo
router.put('/:id', authMiddleware, updateReceipt);

// Cancelar un recibo
router.put('/:id/cancel', authMiddleware, cancelReceipt);

// Marcar recibo como enviado
router.put('/:id/mark-sent', authMiddleware, markAsSent);

module.exports = router;