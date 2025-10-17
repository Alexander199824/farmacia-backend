/**
 * Modelo de Compra a Proveedores
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/Purchase.js
 * 
 * CORRECCIÓN: Hook beforeValidate para generar purchaseNumber
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
      beforeValidate: async (purchase, options) => {
        // ✅ CAMBIO CRÍTICO: Mover generación a beforeValidate
        
        if (purchase.purchaseNumber) {
          // Ya tiene número, no hacer nada
          return;
        }

        try {
          console.log('🔧 [PURCHASE] Generando purchaseNumber...');
          
          const transaction = options.transaction;
          
          // Generar prefijo con año y mes
          const year = new Date().getFullYear();
          const month = String(new Date().getMonth() + 1).padStart(2, '0');
          const prefix = `COM-${year}${month}-`;
          
          console.log('🔧 [PURCHASE] Prefijo:', prefix);

          // Buscar última compra del mes
          const { Op } = sequelize.Sequelize;
          
          const lastPurchase = await Purchase.findOne({
            where: {
              purchaseNumber: {
                [Op.like]: `${prefix}%`
              }
            },
            order: [['id', 'DESC']],
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined
          });

          console.log('🔧 [PURCHASE] Última compra:', lastPurchase?.purchaseNumber || 'ninguna');

          // Calcular siguiente número
          let nextNumber = 1;
          if (lastPurchase && lastPurchase.purchaseNumber) {
            const parts = lastPurchase.purchaseNumber.split('-');
            if (parts.length === 3) {
              nextNumber = parseInt(parts[2], 10) + 1;
            }
          }

          // Generar número completo
          purchase.purchaseNumber = `${prefix}${String(nextNumber).padStart(6, '0')}`;
          
          console.log('✅ [PURCHASE] Número generado:', purchase.purchaseNumber);
          
        } catch (error) {
          console.error('❌ [PURCHASE] Error generando número:', error);
          throw new Error(`Error generando número de compra: ${error.message}`);
        }
      }
    }
  });

  return Purchase;
};