/**
 * @author Alexander Echeverria
 * @file app/models/auditLog.js
 * @description Modelo de Auditoría para registro de todas las operaciones del sistema
 * @location app/models/auditLog.js
 * 
 * Este modelo maneja:
 * - Registro de todas las operaciones críticas
 * - Trazabilidad de cambios por usuario
 * - Historial de acciones en el sistema
 * - Auditoría para cumplimiento normativo
 * - Detección de actividades sospechosas
 */

module.exports = (sequelize, DataTypes) => {
    const AuditLog = sequelize.define('AuditLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            comment: 'Usuario que realizó la acción'
        },
        action: {
            type: DataTypes.ENUM(
                'CREATE', 'READ', 'UPDATE', 'DELETE',
                'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
                'SALE', 'PURCHASE', 'PAYMENT',
                'INVENTORY_ADJUSTMENT', 'PRICE_CHANGE',
                'EXPORT', 'IMPORT'
            ),
            allowNull: false,
            comment: 'Tipo de acción realizada'
        },
        entity: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Entidad afectada (Product, User, Invoice, etc.)'
        },
        entityId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID de la entidad afectada'
        },
        previousValue: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Valor anterior (para UPDATE)'
        },
        newValue: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Nuevo valor (para CREATE/UPDATE)'
        },
        ipAddress: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Dirección IP del usuario'
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'User agent del navegador'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Descripción detallada de la acción'
        },
        severity: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
            defaultValue: 'low',
            comment: 'Nivel de importancia del evento'
        },
        status: {
            type: DataTypes.ENUM('success', 'failure', 'warning'),
            defaultValue: 'success',
            comment: 'Resultado de la acción'
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Mensaje de error si la acción falló'
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Datos adicionales contextuales'
        }
    }, {
        timestamps: true,
        updatedAt: false, // Los logs de auditoría no se actualizan
        indexes: [
            {
                fields: ['userId', 'createdAt']
            },
            {
                fields: ['action']
            },
            {
                fields: ['entity', 'entityId']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    AuditLog.associate = (models) => {
        AuditLog.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    // Método estático para crear logs fácilmente
    AuditLog.log = async function(data) {
        try {
            return await this.create(data);
        } catch (error) {
            console.error('Error creating audit log:', error);
        }
    };

    return AuditLog;
};