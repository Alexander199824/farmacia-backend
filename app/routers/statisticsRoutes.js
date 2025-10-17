/**
 * @author Alexander Echeverria
 * @file app/routers/statisticsRoutes.js
 * @description Rutas para estadísticas, reportes y dashboard
 * @location app/routers/statisticsRoutes.js
 * 
 * Endpoints disponibles:
 * - GET /api/statistics/dashboard - Dashboard principal con KPIs
 * - GET /api/statistics/top-products - Productos más vendidos
 * - GET /api/statistics/sales-report - Reporte de ventas por período
 * - GET /api/statistics/sales-by-hour - Ventas por hora
 * - GET /api/statistics/profitability - Análisis de rentabilidad
 * - GET /api/statistics/top-clients - Clientes frecuentes
 * - GET /api/statistics/inventory - Reporte de inventario
 * - GET /api/statistics/expiration - Reporte de vencimientos
 * - GET /api/statistics/sales-by-category - Ventas por categoría
 * - GET /api/statistics/sales-by-seller - Ventas por vendedor
 */

const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getTopProducts,
    getSalesReport,
    getSalesByHour,
    getProfitabilityAnalysis,
    getTopClients,
    getInventoryReport,
    getExpirationReport,
    getSalesByCategory,
    getSalesBySeller
} = require('../controllers/statistics.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Dashboard principal
router.get('/dashboard', authMiddleware, getDashboard);

// Productos más vendidos
router.get('/top-products', authMiddleware, getTopProducts);

// Reporte de ventas por período
router.get('/sales-report', authMiddleware, getSalesReport);

// Ventas por hora (para identificar picos)
router.get('/sales-by-hour', authMiddleware, getSalesByHour);

// Análisis de rentabilidad
router.get('/profitability', authMiddleware, getProfitabilityAnalysis);

// Clientes frecuentes
router.get('/top-clients', authMiddleware, getTopClients);

// Reporte de inventario
router.get('/inventory', authMiddleware, getInventoryReport);

// Reporte de vencimientos
router.get('/expiration', authMiddleware, getExpirationReport);

// Ventas por categoría
router.get('/sales-by-category', authMiddleware, getSalesByCategory);

// Ventas por vendedor
router.get('/sales-by-seller', authMiddleware, getSalesBySeller);

module.exports = router;