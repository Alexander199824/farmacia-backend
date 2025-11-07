/**
 * Modelo de Item de Pedido (OrderItem)
 * @author Alexander Echeverria
 * @location app/models/orderItem.js
 *
 * Funcionalidades:
 * - Items de pedidos en línea
 * - Relación con productos y lotes
 * - Precios y cantidades
 */

module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      },
      comment: 'Pedido al que pertenece este item'
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      },
      comment: 'Producto solicitado'
    },
    batchId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'batches',
        key: 'id'
      },
      comment: 'Lote asignado (al preparar el pedido)'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      },
      comment: 'Cantidad solicitada'
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Precio unitario al momento del pedido'
    },
    unitCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Costo unitario (se asigna al preparar con lote)'
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
      comment: 'Descuento aplicado a este item'
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Subtotal del item (quantity * unitPrice)'
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Total del item (subtotal - discount)'
    }
  }, {
    tableName: 'order_items',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['productId'] },
      { fields: ['batchId'] }
    ]
  });

  return OrderItem;
};
