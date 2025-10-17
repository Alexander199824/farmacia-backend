/**
 * @author Alexander Echeverria
 * @file app/routers/invoiceRoutes.js
 * @description Rutas de Recibos de Venta
 * @location app/routers/invoiceRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/invoices - Crear recibo de venta
 * - GET /api/invoices/next-number - Obtener próximo número
 * - GET /api/invoices/stats - Estadísticas de recibos
 * - GET /api/invoices/number/:invoiceNumber - Obtener por número
 * - GET /api/invoices - Listar recibos
 * - GET /api/invoices/:id - Obtener recibo por ID
 * - POST /api/invoices/:id/cancel - Anular recibo
 */

const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  getNextInvoiceNumber,
  cancelInvoice,
  getInvoiceStats
} = require('../controllers/invoice.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros

// Obtener el próximo número de recibo
router.get('/next-number', authMiddleware, getNextInvoiceNumber);

// Obtener estadísticas
router.get('/stats', authMiddleware, getInvoiceStats);

// Obtener recibo por número
router.get('/number/:invoiceNumber', authMiddleware, getInvoiceByNumber);

// Crear un recibo de venta
router.post('/', authMiddleware, createInvoice);

// Leer todos los recibos
router.get('/', authMiddleware, getAllInvoices);

// Leer un recibo por ID
router.get('/:id', authMiddleware, getInvoiceById);

// Anular un recibo
router.post('/:id/cancel', authMiddleware, cancelInvoice);

module.exports = router;