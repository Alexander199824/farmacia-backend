/**
 * Modelo de Detalle de Venta
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/SaleDetail.js
 */

module.exports = (sequelize, DataTypes) => {
  const SaleDetail = sequelize.define('SaleDetail', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    batchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'batches',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    }
  }, {
    tableName: 'sale_details',
    timestamps: true,
    indexes: [
      { fields: ['saleId'] },
      { fields: ['productId'] },
      { fields: ['batchId'] }
    ]
  });

  return SaleDetail;
};