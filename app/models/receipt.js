/**
 * Modelo de Comprobante de Pago
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/receipt.js
 * 
 * CORRECCIÓN: Hook beforeValidate para generar receiptNumber
 */

module.exports = (sequelize, DataTypes) => {
  const Receipt = sequelize.define('Receipt', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    receiptNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Numero de comprobante (COMP-YYYY-000001)'
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      },
      comment: 'Recibo de venta asociado'
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    paymentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Monto del comprobante'
    },
    paymentMethod: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia', 'paypal', 'stripe'),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'GTQ'
    },
    issueDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha de emision del comprobante'
    },
    issuedBy: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Nombre del emisor del comprobante'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pdfUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL del PDF en Cloudinary'
    },
    status: {
      type: DataTypes.ENUM('emitido', 'enviado', 'cancelado'),
      defaultValue: 'emitido'
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailSentDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'receipts',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['receiptNumber'] },
      { fields: ['invoiceId'] },
      { fields: ['clientId'] },
      { fields: ['issueDate'] },
      { fields: ['status'] }
    ],
    hooks: {
      beforeValidate: async (receipt, options) => {
        // ✅ CAMBIO CRÍTICO: Mover generación a beforeValidate
        
        if (receipt.receiptNumber) {
          // Ya tiene número, no hacer nada
          return;
        }

        try {
          console.log('🔧 [RECEIPT] Generando receiptNumber...');
          
          const transaction = options.transaction;
          
          // Generar prefijo con año
          const year = new Date().getFullYear();
          const prefix = `COMP-${year}-`;
          
          console.log('🔧 [RECEIPT] Prefijo:', prefix);

          // Buscar último comprobante del año
          const { Op } = sequelize.Sequelize;
          
          const lastReceipt = await Receipt.findOne({
            where: {
              receiptNumber: {
                [Op.like]: `${prefix}%`
              }
            },
            order: [['id', 'DESC']],
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined
          });

          console.log('🔧 [RECEIPT] Último comprobante:', lastReceipt?.receiptNumber || 'ninguno');

          // Calcular siguiente número
          let nextNumber = 1;
          if (lastReceipt && lastReceipt.receiptNumber) {
            const parts = lastReceipt.receiptNumber.split('-');
            if (parts.length === 3) {
              nextNumber = parseInt(parts[2], 10) + 1;
            }
          }

          // Generar número completo
          receipt.receiptNumber = `${prefix}${String(nextNumber).padStart(6, '0')}`;
          
          console.log('✅ [RECEIPT] Número generado:', receipt.receiptNumber);
          
        } catch (error) {
          console.error('❌ [RECEIPT] Error generando número:', error);
          throw new Error(`Error generando número de comprobante: ${error.message}`);
        }
      }
    }
  });

  return Receipt;
};