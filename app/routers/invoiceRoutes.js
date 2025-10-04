/**
 * @author Alexander Echeverria
 * @file app/routers/invoiceRoutes.js
 * @description Rutas de Facturas - Incluye /next-number
 * @location app/routers/invoiceRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/invoices/create - Crear factura
 * - GET /api/invoices/next-number - Obtener próximo número de factura
 * - GET /api/invoices - Listar facturas
 * - GET /api/invoices/:id - Obtener factura por ID
 * - PUT /api/invoices/:id - Actualizar factura
 * - DELETE /api/invoices/:id - Eliminar factura
 */

const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getNextInvoiceNumber
} = require('../controllers/invoice.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros
router.get('/next-number', authMiddleware, getNextInvoiceNumber);   // Obtener el próximo número de factura
router.post('/create', authMiddleware, createInvoice);              // Crear una factura
router.get('/', authMiddleware, getAllInvoices);                    // Leer todas las facturas
router.get('/:id', authMiddleware, getInvoiceById);                 // Leer una factura por ID
router.put('/:id', authMiddleware, updateInvoice);                  // Actualizar una factura
router.delete('/:id', authMiddleware, deleteInvoice);               // Eliminar una factura

module.exports = router;