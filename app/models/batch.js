/**
 * Modelo de Lote con control unico por producto
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/batch.js
 */

module.exports = (sequelize, DataTypes) => {
  const Batch = sequelize.define('Batch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    batchNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Numero de lote del fabricante/proveedor'
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      },
      comment: 'Proveedor (opcional - productos pueden no tener proveedor)'
    },
    manufacturingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Fecha de fabricacion'
    },
    expirationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Fecha de vencimiento'
    },
    initialQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Cantidad inicial al recibir'
    },
    currentQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Cantidad disponible actual'
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Precio de compra unitario'
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Precio de venta unitario'
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Ubicacion fisica en bodega'
    },
    status: {
      type: DataTypes.ENUM(
        'active',
        'near_expiry',
        'expired',
        'depleted',
        'blocked'
      ),
      defaultValue: 'active',
      comment: 'Estado actual del lote'
    },
    invoiceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Numero de factura/recibo de compra (opcional - solo cuando existe documento físico)'
    },
    receiptDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha de recepcion del lote'
    },
    canBeSold: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Si puede ser vendido'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'batches',
    timestamps: true,
    paranoid: true,
    indexes: [
      { 
        unique: true, 
        fields: ['batchNumber', 'productId'],
        name: 'unique_batch_per_product'
      },
      { fields: ['productId'] },
      { fields: ['supplierId'] },
      { fields: ['expirationDate'] },
      { fields: ['status'] },
      { fields: ['canBeSold'] },
      { fields: ['receiptDate'] }
    ],
    hooks: {
      beforeCreate: async (batch) => {
        const today = new Date();
        const expirationDate = new Date(batch.expirationDate);
        const daysUntilExpiry = Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          batch.status = 'expired';
          batch.canBeSold = false;
        } else if (daysUntilExpiry <= 30) {
          batch.status = 'near_expiry';
        } else {
          batch.status = 'active';
        }
      },
      beforeUpdate: async (batch) => {
        const today = new Date();
        const expirationDate = new Date(batch.expirationDate);
        const daysUntilExpiry = Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24));

        if (batch.currentQuantity === 0) {
          batch.status = 'depleted';
        } else if (daysUntilExpiry < 0) {
          batch.status = 'expired';
          batch.canBeSold = false;
        } else if (daysUntilExpiry <= 30) {
          batch.status = 'near_expiry';
        } else if (batch.currentQuantity > 0 && daysUntilExpiry > 30) {
          batch.status = 'active';
          batch.canBeSold = true;
        }
      }
    }
  });

  return Batch;
};