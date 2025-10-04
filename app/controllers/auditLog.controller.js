/**
 * @author Alexander Echeverria
 * @file app/controllers/auditLog.controller.js
 * @description Controlador de Auditoría - Logs del sistema
 * @location app/controllers/auditLog.controller.js
 * 
 * Funcionalidades:
 * - Consulta de logs de auditoría
 * - Filtros por acción, entidad, usuario, fecha
 * - Estadísticas de auditoría
 * - Exportación de logs
 */

const db = require('../config/db.config');
const AuditLog = db.AuditLog;
const User = db.User;
const { Op } = db.Sequelize;

// Obtener todos los logs con filtros
exports.getAllLogs = async (req, res) => {
    try {
        const {
            action,
            entity,
            severity,
            status,
            userId,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const where = {};

        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (severity) where.severity = severity;
        if (status) where.status = status;
        if (userId) where.userId = userId;

        if (startDate && endDate) {
            where.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const offset = (page - 1) * limit;

        const { count, rows: logs } = await AuditLog.findAndCountAll({
            where,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'role'],
                required: false
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            logs
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener logs de auditoría",
            error: error.message
        });
    }
};

// Obtener un log por ID
exports.getLogById = async (req, res) => {
    try {
        const { id } = req.params;

        const log = await AuditLog.findByPk(id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'role', 'email']
            }]
        });

        if (!log) {
            return res.status(404).json({ message: "Log no encontrado" });
        }

        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener el log",
            error: error.message
        });
    }
};

// Obtener logs por usuario
exports.getLogsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20 } = req.query;

        const logs = await AuditLog.findAll({
            where: { userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener logs del usuario",
            error: error.message
        });
    }
};

// Obtener logs por entidad
exports.getLogsByEntity = async (req, res) => {
    try {
        const { entity, entityId } = req.params;
        const { limit = 20 } = req.query;

        const where = { entity };
        if (entityId) where.entityId = entityId;

        const logs = await AuditLog.findAll({
            where,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener logs de la entidad",
            error: error.message
        });
    }
};

// Obtener estadísticas de auditoría
exports.getAuditStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const stats = {
            totalLogs: await AuditLog.count({ where: dateFilter }),
            
            byAction: await AuditLog.findAll({
                where: dateFilter,
                attributes: [
                    'action',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
                ],
                group: ['action'],
                order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']]
            }),

            bySeverity: await AuditLog.findAll({
                where: dateFilter,
                attributes: [
                    'severity',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
                ],
                group: ['severity']
            }),

            byStatus: await AuditLog.findAll({
                where: dateFilter,
                attributes: [
                    'status',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
                ],
                group: ['status']
            }),

            topUsers: await AuditLog.findAll({
                where: dateFilter,
                attributes: [
                    'userId',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
                ],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['username']
                }],
                group: ['userId', 'user.id', 'user.username'],
                order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']],
                limit: 10
            }),

            criticalEvents: await AuditLog.count({
                where: {
                    severity: 'critical',
                    ...dateFilter
                }
            }),

            failedActions: await AuditLog.count({
                where: {
                    status: 'failure',
                    ...dateFilter
                }
            })
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener estadísticas de auditoría",
            error: error.message
        });
    }
};

// Obtener logs de actividad reciente
exports.getRecentActivity = async (req, res) => {
    try {
        const { hours = 24, limit = 50 } = req.query;
        
        const timeAgo = new Date();
        timeAgo.setHours(timeAgo.getHours() - parseInt(hours));

        const logs = await AuditLog.findAll({
            where: {
                createdAt: {
                    [Op.gte]: timeAgo
                }
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'role']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json({
            period: `${hours} horas`,
            count: logs.length,
            logs
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener actividad reciente",
            error: error.message
        });
    }
};

// Limpiar logs antiguos (solo administrador)
exports.cleanOldLogs = async (req, res) => {
    try {
        const { days = 90 } = req.body;

        // Verificar que el usuario sea administrador
        if (req.user.role !== 'administrador') {
            return res.status(403).json({ 
                message: "No tienes permisos para realizar esta acción" 
            });
        }

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - parseInt(days));

        const deletedCount = await AuditLog.destroy({
            where: {
                createdAt: {
                    [Op.lt]: dateLimit
                },
                severity: {
                    [Op.notIn]: ['critical', 'high']
                }
            }
        });

        res.status(200).json({
            message: `Logs antiguos eliminados exitosamente`,
            deletedCount,
            olderThan: `${days} días`
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al limpiar logs",
            error: error.message
        });
    }
};