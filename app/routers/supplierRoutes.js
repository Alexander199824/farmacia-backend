/**
 * @author Alexander Echeverria
 * @file app/routers/supplierRoutes.js
 * @description Rutas de Proveedores
 * @location app/routers/supplierRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/suppliers - Crear proveedor
 * - GET /api/suppliers - Listar proveedores
 * - GET /api/suppliers/stats - Estadísticas generales
 * - GET /api/suppliers/code/:code - Obtener por código
 * - GET /api/suppliers/:id - Obtener proveedor por ID
 * - GET /api/suppliers/:id/stats - Estadísticas del proveedor
 * - GET /api/suppliers/:id/products - Productos del proveedor
 * - GET /api/suppliers/:id/batches - Lotes del proveedor
 * - GET /api/suppliers/:id/payment-history - Historial de pagos
 * - PUT /api/suppliers/:id - Actualizar proveedor
 * - PATCH /api/suppliers/:id/toggle-active - Activar/desactivar
 * - POST /api/suppliers/:id/increase-debt - Aumentar deuda
 * - POST /api/suppliers/:id/register-payment - Registrar pago
 * - DELETE /api/suppliers/:id - Eliminar proveedor
 */

const express = require('express');
const router = express.Router();
const {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    getSupplierByCode,
    updateSupplier,
    toggleActive,
    deleteSupplier,
    increaseDebt,
    registerPayment,
    getPaymentHistory,
    getSupplierProducts,
    getSupplierBatches,
    getSupplierStats,
    getSupplierDetailedStats
} = require('../controllers/supplier.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Crear proveedor
router.post('/', authMiddleware, createSupplier);

// Listar proveedores con filtros
router.get('/', authMiddleware, getAllSuppliers);

// Obtener estadísticas generales
router.get('/stats', authMiddleware, getSupplierStats);

// Obtener proveedor por código
router.get('/code/:code', authMiddleware, getSupplierByCode);

// Obtener proveedor por ID
router.get('/:id', authMiddleware, getSupplierById);

// Obtener estadísticas detalladas del proveedor
router.get('/:id/stats', authMiddleware, getSupplierDetailedStats);

// Obtener productos del proveedor
router.get('/:id/products', authMiddleware, getSupplierProducts);

// Obtener lotes del proveedor
router.get('/:id/batches', authMiddleware, getSupplierBatches);

// Obtener historial de pagos
router.get('/:id/payment-history', authMiddleware, getPaymentHistory);

// Actualizar proveedor
router.put('/:id', authMiddleware, updateSupplier);

// Activar/desactivar proveedor
router.patch('/:id/toggle-active', authMiddleware, toggleActive);

// Aumentar deuda (al crear compra a crédito)
router.post('/:id/increase-debt', authMiddleware, increaseDebt);

// Registrar pago a proveedor
router.post('/:id/register-payment', authMiddleware, registerPayment);

// Eliminar proveedor
router.delete('/:id', authMiddleware, deleteSupplier);

module.exports = router;