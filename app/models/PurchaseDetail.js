/**
 * Modelo de Detalle de Compra
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/PurchaseDetail.js
 */

module.exports = (sequelize, DataTypes) => {
  const PurchaseDetail = sequelize.define('PurchaseDetail', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    purchaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchases',
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
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
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
    tableName: 'purchase_details',
    timestamps: true,
    indexes: [
      { fields: ['purchaseId'] },
      { fields: ['productId'] },
      { fields: ['batchId'] }
    ]
  });

  return PurchaseDetail;
};