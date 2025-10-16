/**
 * Modelo de Auditoria
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/AuditLog.js
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
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM(
        'CREATE', 'READ', 'UPDATE', 'DELETE',
        'LOGIN', 'LOGOUT', 'LOGIN_FAILED'
      ),
      allowNull: false
    },
    entity: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    previousValue: {
      type: DataTypes.JSON,
      allowNull: true
    },
    newValue: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['action'] },
      { fields: ['entity'] },
      { fields: ['createdAt'] }
    ]
  });

  return AuditLog;
};