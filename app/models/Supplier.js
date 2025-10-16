/**
 * Modelo de Proveedor
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/Supplier.js
 */

module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    contactName: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    alternativePhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nit: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    acceptsReturns: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    returnPolicyMonthsBefore: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    returnPolicyMonthsAfter: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    returnConditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    paymentTerms: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    creditLimit: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    currentDebt: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'suppliers',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['isActive'] }
    ]
  });

  return Supplier;
};