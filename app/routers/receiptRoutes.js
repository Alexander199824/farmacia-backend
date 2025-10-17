/**
 * @author Alexander Echeverria
 * @file app/routers/receiptRoutes.js
 * @description Rutas de Comprobantes de Pago
 * @location app/routers/receiptRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/receipts - Crear comprobante
 * - GET /api/receipts - Listar comprobantes
 * - GET /api/receipts/stats - Estadísticas
 * - GET /api/receipts/number/:receiptNumber - Obtener por número
 * - GET /api/receipts/client/:clientId - Comprobantes de un cliente
 * - GET /api/receipts/invoice/:invoiceId - Comprobantes de un recibo de venta
 * - GET /api/receipts/:id - Obtener comprobante por ID
 * - GET /api/receipts/:id/pdf - Generar PDF
 * - PUT /api/receipts/:id - Actualizar comprobante
 * - POST /api/receipts/:id/cancel - Cancelar comprobante
 * - POST /api/receipts/:id/mark-sent - Marcar como enviado
 * - POST /api/receipts/:id/send-email - Enviar por email
 */

const express = require('express');
const router = express.Router();
const {
    createReceipt,
    getAllReceipts,
    getReceiptById,
    getReceiptByNumber,
    getReceiptsByClient,
    getReceiptsByInvoice,
    updateReceipt,
    cancelReceipt,
    markAsSent,
    sendReceiptByEmail,
    generateReceiptPDF,
    getReceiptStats
} = require('../controllers/receipt.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Crear un comprobante
router.post('/', authMiddleware, createReceipt);

// Obtener todos los comprobantes con filtros
router.get('/', authMiddleware, getAllReceipts);

// Obtener estadísticas de comprobantes
router.get('/stats', authMiddleware, getReceiptStats);

// Obtener comprobante por número
router.get('/number/:receiptNumber', authMiddleware, getReceiptByNumber);

// Obtener comprobantes por cliente
router.get('/client/:clientId', authMiddleware, getReceiptsByClient);

// Obtener comprobantes por recibo de venta
router.get('/invoice/:invoiceId', authMiddleware, getReceiptsByInvoice);

// Obtener un comprobante por ID
router.get('/:id', authMiddleware, getReceiptById);

// Generar PDF del comprobante
router.get('/:id/pdf', authMiddleware, generateReceiptPDF);

// Actualizar un comprobante
router.put('/:id', authMiddleware, updateReceipt);

// Cancelar un comprobante
router.post('/:id/cancel', authMiddleware, cancelReceipt);

// Marcar comprobante como enviado
router.post('/:id/mark-sent', authMiddleware, markAsSent);

// Enviar comprobante por email
router.post('/:id/send-email', authMiddleware, sendReceiptByEmail);

module.exports = router;