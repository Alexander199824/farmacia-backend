/**
 * @author Alexander Echeverria
 * @file app/routers/auditLogRoutes.js
 * @description Rutas de Auditoría - Logs del sistema
 * @location app/routers/auditLogRoutes.js
 * 
 * Endpoints disponibles:
 * - GET /api/audit/logs - Listar logs
 * - GET /api/audit/logs/:id - Obtener log por ID
 * - GET /api/audit/logs/user/:userId - Logs por usuario
 * - GET /api/audit/logs/entity/:entity - Logs por entidad
 * - GET /api/audit/logs/entity/:entity/:entityId - Logs por entidad específica
 * - GET /api/audit/stats - Estadísticas de auditoría
 * - GET /api/audit/recent - Actividad reciente
 * - DELETE /api/audit/clean - Limpiar logs antiguos (admin)
 */

const express = require('express');
const router = express.Router();
const {
    getAllLogs,
    getLogById,
    getLogsByUser,
    getLogsByEntity,
    getAuditStats,
    getRecentActivity,
    cleanOldLogs
} = require('../controllers/auditLog.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Obtener todos los logs con filtros
router.get('/logs', authMiddleware, getAllLogs);

// Obtener estadísticas de auditoría
router.get('/stats', authMiddleware, getAuditStats);

// Obtener actividad reciente
router.get('/recent', authMiddleware, getRecentActivity);

// Obtener un log por ID
router.get('/logs/:id', authMiddleware, getLogById);

// Obtener logs por usuario
router.get('/logs/user/:userId', authMiddleware, getLogsByUser);

// Obtener logs por entidad (sin ID específico)
router.get('/logs/entity/:entity', authMiddleware, getLogsByEntity);

// Obtener logs por entidad específica
router.get('/logs/entity/:entity/:entityId', authMiddleware, getLogsByEntity);

// Limpiar logs antiguos (solo administrador)
router.delete('/clean', authMiddleware, cleanOldLogs);

module.exports = router;