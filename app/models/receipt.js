/**
 * Modelo de Recibo vinculado a Invoice
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/receipt.js
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
      comment: 'Numero de recibo (REC-2025-00001)'
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      }
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
      allowNull: false
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
      defaultValue: DataTypes.NOW
    },
    issuedBy: {
      type: DataTypes.STRING(200),
      allowNull: false
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
      beforeCreate: async (receipt, options) => {
        // ✅ CRÍTICO: Usar la transacción del contexto
        const transaction = options.transaction;
        
        if (!receipt.receiptNumber) {
          const year = new Date().getFullYear();
          
          const lastReceipt = await sequelize.models.Receipt.findOne({
            where: {
              receiptNumber: {
                [sequelize.Sequelize.Op.like]: `REC-${year}-%`
              }
            },
            order: [['id', 'DESC']],
            transaction, // ✅ Pasar la transacción
            lock: transaction ? transaction.LOCK.UPDATE : false // ✅ Lock para evitar race conditions
          });

          let nextNumber = 1;
          if (lastReceipt) {
            const parts = lastReceipt.receiptNumber.split('-');
            nextNumber = parseInt(parts[2]) + 1;
          }

          receipt.receiptNumber = `REC-${year}-${String(nextNumber).padStart(6, '0')}`;
        }
      }
    }
  });

  return Receipt;
};