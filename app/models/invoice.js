/**
 * Modelo de Factura CORREGIDO
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/Invoice.js
 */

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Numero de factura generado automaticamente'
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Cliente que compra (usuario con rol cliente)'
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Vendedor que realiza la venta (usuario con rol vendedor)'
    },
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha de la factura'
    },
    invoiceTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Hora de la factura'
    },
    invoiceDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha y hora completa'
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
      comment: 'IVA u otros impuestos'
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia', 'credito', 'paypal', 'stripe'),
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'parcial', 'cancelado'),
      defaultValue: 'pagado'
    },
    status: {
      type: DataTypes.ENUM('completada', 'cancelada', 'devuelta', 'anulada'),
      defaultValue: 'completada'
    },
    clientName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Nombre del cliente para ventas sin registro'
    },
    clientDPI: {
      type: DataTypes.STRING(13),
      allowNull: true,
      comment: 'DPI del cliente'
    },
    clientNit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'NIT para facturacion'
    },
    sellerDPI: {
      type: DataTypes.STRING(13),
      allowNull: true,
      comment: 'DPI del vendedor'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'invoices',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['invoiceNumber'] },
      { fields: ['clientId'] },
      { fields: ['sellerId'] },
      { fields: ['invoiceDate'] },
      { fields: ['invoiceDateTime'] },
      { fields: ['invoiceTime'] },
      { fields: ['status'] },
      { fields: ['paymentMethod'] },
      { fields: ['paymentStatus'] }
    ],
    hooks: {
  beforeCreate: async (invoice, options) => {
    const transaction = options.transaction;
    
    if (!invoice.invoiceNumber) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // ✅ CORRECCIÓN: Usar invoice.constructor en lugar de Invoice
      const lastInvoice = await invoice.constructor.findOne({
        where: {
          invoiceNumber: {
            [sequelize.Sequelize.Op.like]: `FAC-${year}${month}-%`
          }
        },
        order: [['id', 'DESC']],
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : false
      });

      let nextNumber = 1;
      if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split('-');
        nextNumber = parseInt(parts[2]) + 1;
      }

      invoice.invoiceNumber = `FAC-${year}${month}-${String(nextNumber).padStart(6, '0')}`;
      
      console.log('✅ Número de factura generado:', invoice.invoiceNumber);
    }
  }
}
  });

  return Invoice;
};