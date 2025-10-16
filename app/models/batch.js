/**
 * Modelo de Lote
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/Batch.js
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
      allowNull: false
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
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    manufacturingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    expirationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    initialQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currentQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        'active',
        'near_expiry',
        'expired',
        'depleted',
        'blocked'
      ),
      defaultValue: 'active'
    },
    invoiceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    receiptDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    canBeSold: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
      { fields: ['batchNumber', 'productId'] },
      { fields: ['expirationDate'] },
      { fields: ['status'] }
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
        } else if (batch.currentQuantity > 0) {
          batch.status = 'active';
        }
      }
    }
  });

  return Batch;
};