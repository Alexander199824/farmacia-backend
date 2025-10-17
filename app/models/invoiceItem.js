/**
 * Modelo de Item de Recibo de Venta
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/invoiceItem.js
 * 
 * Cada item representa un producto vendido con su lote específico (FIFO)
 */

module.exports = (sequelize, DataTypes) => {
  const InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      },
      comment: 'Recibo de venta al que pertenece'
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
      },
      comment: 'Lote del que se vendio (FIFO)'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      },
      comment: 'Cantidad vendida de este lote'
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Precio unitario de venta al cliente'
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Costo unitario para calcular ganancia'
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: 'Descuento aplicado a este item'
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Subtotal antes de descuento (quantity * unitPrice)'
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Total despues de descuento (subtotal - discount)'
    }
  }, {
    tableName: 'invoice_items',
    timestamps: true,
    indexes: [
      { fields: ['invoiceId'] },
      { fields: ['productId'] },
      { fields: ['batchId'] }
    ]
  });

  return InvoiceItem;
};