/**
 * @author Alexander Echeverria
 * @file app/routers/alertsRoutes.js
 * @description Rutas de Alertas del Sistema
 * @location app/routers/alertsRoutes.js
 * 
 * Endpoints disponibles:
 * - GET /api/alerts - Todas las alertas activas
 * - GET /api/alerts/low-stock - Alertas de stock bajo
 * - GET /api/alerts/expiring - Alertas de productos por vencer
 * - GET /api/alerts/expired - Alertas de productos vencidos
 * - GET /api/alerts/pending-approvals - Alertas de aprobaciones pendientes
 */

const express = require('express');
const router = express.Router();
const {
    getAllAlerts,
    getLowStockAlerts,
    getExpiringAlerts,
    getExpiredAlerts,
    getPendingApprovalsAlerts
} = require('../controllers/alerts.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Obtener todas las alertas activas
router.get('/', authMiddleware, getAllAlerts);

// Obtener alertas de stock bajo
router.get('/low-stock', authMiddleware, getLowStockAlerts);

// Obtener alertas de productos próximos a vencer
router.get('/expiring', authMiddleware, getExpiringAlerts);

// Obtener alertas de productos vencidos
router.get('/expired', authMiddleware, getExpiredAlerts);

// Obtener alertas de aprobaciones pendientes
router.get('/pending-approvals', authMiddleware, getPendingApprovalsAlerts);

module.exports = router;