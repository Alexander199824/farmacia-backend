/**
 * @author Alexander Echeverria
 * @file app/middlewares/auditMiddleware.js
 * @description Middleware para registro automático de auditoría
 * @location app/middlewares/auditMiddleware.js
 * 
 * Funcionalidades:
 * - Registra automáticamente todas las operaciones críticas
 * - Captura información del usuario y contexto
 * - Almacena valores anteriores y nuevos en operaciones de actualización
 * - Registra IP y user agent para trazabilidad
 */

const db = require('../config/db.config');
const AuditLog = db.AuditLog;

/**
 * Middleware de auditoría
 * @param {string} action - Acción realizada (CREATE, UPDATE, DELETE, etc.)
 * @param {string} entity - Entidad afectada (Product, User, Invoice, etc.)
 * @param {string} severity - Nivel de importancia (low, medium, high, critical)
 */
const auditMiddleware = (action, entity, severity = 'low') => {
    return async (req, res, next) => {
        // Guardar el método original json
        const originalJson = res.json;
        
        // Sobrescribir res.json para capturar la respuesta
        res.json = function(data) {
            // Crear log de auditoría
            createAuditLog(req, action, entity, data, severity);
            
            // Llamar al método original
            return originalJson.call(this, data);
        };
        
        next();
    };
};

/**
 * Crea un registro de auditoría
 */
const createAuditLog = async (req, action, entity, responseData, severity) => {
    try {
        const auditData = {
            userId: req.user?.id || null,
            action,
            entity,
            entityId: req.params?.id || responseData?.id || null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            severity,
            status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure'
        };

        // Agregar valores anteriores y nuevos según la acción
        if (action === 'UPDATE' && req.body) {
            auditData.newValue = req.body;
        } else if (action === 'CREATE' && responseData) {
            auditData.newValue = responseData;
        }

        // Agregar descripción contextual
        auditData.description = generateDescription(action, entity, req.user, req.params);

        // Metadata adicional
        auditData.metadata = {
            method: req.method,
            path: req.path,
            query: req.query,
            params: req.params
        };

        await AuditLog.create(auditData);
    } catch (error) {
        console.error('Error al crear log de auditoría:', error);
        // No lanzar error para no afectar la operación principal
    }
};

/**
 * Genera una descripción legible de la acción
 */
const generateDescription = (action, entity, user, params) => {
    const username = user?.username || 'Usuario desconocido';
    const actionText = {
        'CREATE': 'creó',
        'UPDATE': 'actualizó',
        'DELETE': 'eliminó',
        'READ': 'consultó',
        'LOGIN': 'inició sesión',
        'LOGOUT': 'cerró sesión'
    };

    const entityTranslation = {
        'Product': 'producto',
        'User': 'usuario',
        'Invoice': 'factura',
        'Client': 'cliente',
        'Batch': 'lote',
        'Payment': 'pago'
    };

    const actionDesc = actionText[action] || action.toLowerCase();
    const entityDesc = entityTranslation[entity] || entity.toLowerCase();
    const entityId = params?.id ? ` #${params.id}` : '';

    return `${username} ${actionDesc} ${entityDesc}${entityId}`;
};

/**
 * Middleware específico para operaciones críticas
 */
const criticalAudit = (action, entity) => {
    return auditMiddleware(action, entity, 'critical');
};

/**
 * Middleware para operaciones de alta importancia
 */
const highAudit = (action, entity) => {
    return auditMiddleware(action, entity, 'high');
};

/**
 * Registrar login exitoso
 */
const auditLogin = async (userId, username, ipAddress, userAgent, success = true) => {
    try {
        await AuditLog.create({
            userId,
            action: success ? 'LOGIN' : 'LOGIN_FAILED',
            entity: 'User',
            entityId: userId,
            ipAddress,
            userAgent,
            description: success 
                ? `${username} inició sesión exitosamente`
                : `Intento fallido de inicio de sesión para ${username}`,
            severity: success ? 'low' : 'high',
            status: success ? 'success' : 'failure'
        });
    } catch (error) {
        console.error('Error al auditar login:', error);
    }
};

/**
 * Registrar logout
 */
const auditLogout = async (userId, username, ipAddress) => {
    try {
        await AuditLog.create({
            userId,
            action: 'LOGOUT',
            entity: 'User',
            entityId: userId,
            ipAddress,
            description: `${username} cerró sesión`,
            severity: 'low',
            status: 'success'
        });
    } catch (error) {
        console.error('Error al auditar logout:', error);
    }
};

module.exports = {
    auditMiddleware,
    criticalAudit,
    highAudit,
    auditLogin,
    auditLogout,
    createAuditLog
};