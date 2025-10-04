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
 * - GET /api/statistics/profitability - Análisis de rentabilidad
 * - GET /api/statistics/top-clients - Clientes frecuentes
 * - GET /api/statistics/inventory - Reporte de inventario
 */

const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getTopProducts,
    getSalesReport,
    getProfitabilityAnalysis,
    getTopClients,
    getInventoryReport
} = require('../controllers/statistics.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Dashboard principal
router.get('/dashboard', authMiddleware, getDashboard);

// Productos más vendidos
router.get('/top-products', authMiddleware, getTopProducts);

// Reporte de ventas
router.get('/sales-report', authMiddleware, getSalesReport);

// Análisis de rentabilidad
router.get('/profitability', authMiddleware, getProfitabilityAnalysis);

// Clientes frecuentes
router.get('/top-clients', authMiddleware, getTopClients);

// Reporte de inventario
router.get('/inventory', authMiddleware, getInventoryReport);

module.exports = router;