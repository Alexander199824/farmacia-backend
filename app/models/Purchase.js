/**
 * Modelo de Compra
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/Purchase.js
 */

module.exports = (sequelize, DataTypes) => {
  const Purchase = sequelize.define('Purchase', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    purchaseNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    purchaseDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('efectivo', 'transferencia', 'credito', 'cheque'),
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'parcial'),
      defaultValue: 'pendiente'
    },
    status: {
      type: DataTypes.ENUM('recibida', 'pendiente', 'cancelada'),
      defaultValue: 'recibida'
    },
    supplierInvoiceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'purchases',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['purchaseNumber'] },
      { fields: ['purchaseDate'] },
      { fields: ['supplierId'] },
      { fields: ['status'] }
    ],
    hooks: {
      beforeCreate: async (purchase) => {
        if (!purchase.purchaseNumber) {
          const year = new Date().getFullYear();
          const month = String(new Date().getMonth() + 1).padStart(2, '0');
          const lastPurchase = await sequelize.models.Purchase.findOne({
            where: {
              purchaseNumber: {
                [sequelize.Sequelize.Op.like]: `COM-${year}${month}-%`
              }
            },
            order: [['id', 'DESC']]
          });

          let nextNumber = 1;
          if (lastPurchase) {
            const parts = lastPurchase.purchaseNumber.split('-');
            nextNumber = parseInt(parts[2]) + 1;
          }

          purchase.purchaseNumber = `COM-${year}${month}-${String(nextNumber).padStart(6, '0')}`;
        }
      }
    }
  });

  return Purchase;
};