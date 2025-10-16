/**
 * Modelo de Item de Factura con lote
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/InvoiceItem.js
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
      },
      comment: 'Lote del que se vendio'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Precio unitario de venta'
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Costo unitario para calcular ganancia'
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Subtotal antes de descuento'
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Total despues de descuento'
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