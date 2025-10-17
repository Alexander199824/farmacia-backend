/**
 * Modelo de Compra a Proveedores
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/Purchase.js
 */

module.exports = (sequelize, DataTypes) => {
  // ✅ CRÍTICO: Acceder a Op desde sequelize ANTES de definir el modelo
  const { Op } = sequelize.Sequelize;

  const Purchase = sequelize.define('Purchase', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    purchaseNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Numero de compra (COM-YYYYMM-000001)'
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
      },
      comment: 'Usuario que registra la compra'
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
      allowNull: true,
      comment: 'Numero de factura del proveedor'
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
      beforeCreate: async (purchase, options) => {
        const transaction = options.transaction;
        
        if (!purchase.purchaseNumber) {
          const year = new Date().getFullYear();
          const month = String(new Date().getMonth() + 1).padStart(2, '0');
          const prefix = `COM-${year}${month}-`;
          
          // ✅ Op ya está disponible desde el scope superior
          try {
            const lastPurchase = await purchase.constructor.findOne({
              where: {
                purchaseNumber: {
                  [Op.like]: `${prefix}%`
                }
              },
              order: [['id', 'DESC']],
              transaction,
              lock: transaction ? transaction.LOCK.UPDATE : false
            });

            let nextNumber = 1;
            if (lastPurchase && lastPurchase.purchaseNumber) {
              const parts = lastPurchase.purchaseNumber.split('-');
              if (parts.length === 3) {
                nextNumber = parseInt(parts[2]) + 1;
              }
            }

            purchase.purchaseNumber = `${prefix}${String(nextNumber).padStart(6, '0')}`;
            
            console.log('✅ Número de compra generado:', purchase.purchaseNumber);
          } catch (error) {
            console.error('❌ Error generando número de compra:', error);
            throw error;
          }
        }
      }
    }
  });

  return Purchase;
};