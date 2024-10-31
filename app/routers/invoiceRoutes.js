// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getNextInvoiceNumber // Importamos la función para el próximo número de factura
} = require('../controllers/invoice.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// CRUD routes for invoices
router.post('/create', authMiddleware, createInvoice);              // Crear una factura
router.get('/', authMiddleware, getAllInvoices);                    // Leer todas las facturas
router.get('/:id', authMiddleware, getInvoiceById);                 // Leer una factura por ID
router.put('/:id', authMiddleware, updateInvoice);                  // Actualizar una factura
router.delete('/:id', authMiddleware, deleteInvoice);               // Eliminar una factura
router.get('/next-number', authMiddleware, getNextInvoiceNumber);   // Obtener el próximo número de factura

module.exports = router;
