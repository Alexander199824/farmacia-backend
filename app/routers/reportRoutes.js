const express = require('express');
const router = express.Router();

// Middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// Controller
const reportsController = require('../controllers/reports.controller');

// ==================== DASHBOARD ====================

/**
 * Dashboard principal con métricas generales
 * GET /api/reports/dashboard
 * Acceso: Admin, Empleado
 */
router.get(
  '/dashboard',
  [authMiddleware, roleMiddleware(['admin', 'empleado'])],
  reportsController.getDashboard
);

// ==================== REPORTES DE VENTAS ====================

/**
 * Reporte detallado de ventas
 * GET /api/reports/sales
 * Query params: startDate, endDate, groupBy (day/month/product/category/client)
 * Acceso: Admin, Empleado
 */
router.get(
  '/sales',
  [authMiddleware, roleMiddleware(['admin', 'empleado'])],
  reportsController.getSalesReport
);

/**
 * Top productos más vendidos
 * GET /api/reports/top-products
 * Query params: startDate, endDate, limit, sortBy (revenue/quantity)
 * Acceso: Admin, Empleado
 */
router.get(
  '/top-products',
  [authMiddleware, roleMiddleware(['admin', 'empleado'])],
  reportsController.getTopProducts
);

// ==================== REPORTES DE INVENTARIO ====================

/**
 * Reporte de inventario actual
 * GET /api/reports/inventory
 * Query params: category, stockStatus (low/normal/high/out), includeInactive
 * Acceso: Admin, Empleado
 */
router.get(
  '/inventory',
  [authMiddleware, roleMiddleware(['admin', 'empleado'])],
  reportsController.getInventoryReport
);

/**
 * Movimientos de inventario
 * GET /api/reports/inventory/movements
 * Query params: startDate, endDate, productId, type, limit, offset
 * Acceso: Admin, Empleado
 */
router.get(
  '/inventory/movements',
  [authMiddleware, roleMiddleware(['admin', 'empleado'])],
  reportsController.getInventoryMovements
);

/**
 * Productos próximos a vencer
 * GET /api/reports/inventory/expiring
 * Query params: days (default: 30)
 * Acceso: Admin, Empleado
 */
router.get(
  '/inventory/expiring',
  [authMiddleware, roleMiddleware(['admin', 'empleado'])],
  reportsController.getExpiringProducts
);

// ==================== REPORTES DE CLIENTES ====================

/**
 * Análisis de clientes
 * GET /api/reports/clients
 * Query params: startDate, endDate, sortBy (revenue/purchases/recent), limit
 * Acceso: Admin
 */
router.get(
  '/clients',
  [authMiddleware, roleMiddleware(['admin'])],
  reportsController.getClientsReport
);

// ==================== REPORTES DE DELIVERY ====================

/**
 * Reporte de rendimiento de repartidores
 * GET /api/reports/delivery-performance
 * Query params: startDate, endDate
 * Acceso: Admin
 */
router.get(
  '/delivery-performance',
  [authMiddleware, roleMiddleware(['admin'])],
  reportsController.getDeliveryPerformance
);

// ==================== REPORTES FINANCIEROS ====================

/**
 * Reporte financiero general
 * GET /api/reports/financial
 * Query params: startDate, endDate
 * Acceso: Admin
 */
router.get(
  '/financial',
  [authMiddleware, roleMiddleware(['admin'])],
  reportsController.getFinancialReport
);

/**
 * Análisis económico avanzado con tendencias y comparaciones
 * GET /api/reports/economic-analysis
 * Query params: startDate, endDate, compareWith
 * Acceso: Admin
 */
router.get(
  '/economic-analysis',
  [authMiddleware, roleMiddleware(['admin'])],
  reportsController.getEconomicAnalysis
);

/**
 * Análisis de mejores días de venta (día del mes y día de la semana)
 * GET /api/reports/best-sales-days
 * Query params: startDate, endDate, period
 * Acceso: Admin, Empleado
 */
router.get(
  '/best-sales-days',
  [authMiddleware, roleMiddleware(['admin', 'empleado'])],
  reportsController.getBestSalesDays
);

// ==================== DESCARGA DE REPORTES ====================

/**
 * Descarga reporte de ventas en Excel o PDF
 * GET /api/reports/download/sales?format=excel|pdf&groupBy=day|month|...
 * Query params: format (excel|pdf), startDate, endDate, groupBy
 * Acceso: Admin, Empleado
 */
router.get(
  '/download/sales',
  [authMiddleware, roleMiddleware(['admin', 'empleado'])],
  reportsController.downloadSalesReport
);

/**
 * Descarga análisis económico en Excel o PDF
 * GET /api/reports/download/economic-analysis?format=excel|pdf
 * Query params: format (excel|pdf), startDate, endDate
 * Acceso: Admin
 */
router.get(
  '/download/economic-analysis',
  [authMiddleware, roleMiddleware(['admin'])],
  reportsController.downloadEconomicAnalysis
);

/**
 * Descarga análisis de mejores días en Excel o PDF
 * GET /api/reports/download/best-sales-days?format=excel|pdf
 * Query params: format (excel|pdf), startDate, endDate
 * Acceso: Admin, Empleado
 */
router.get(
  '/download/best-sales-days',
  [authMiddleware, roleMiddleware(['admin', 'empleado'])],
  reportsController.downloadBestSalesDays
);

module.exports = router;
