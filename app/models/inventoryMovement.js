/**
 * Modelo de Movimiento de Inventario
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/InventoryMovement.js
 */

module.exports = (sequelize, DataTypes) => {
  const InventoryMovement = sequelize.define('InventoryMovement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      allowNull: true,
      references: {
        model: 'batches',
        key: 'id'
      }
    },
    movementType: {
      type: DataTypes.ENUM(
        'compra',
        'venta',
        'ajuste_entrada',
        'ajuste_salida',
        'devolucion_cliente',
        'devolucion_proveedor',
        'dano',
        'vencimiento',
        'donacion'
      ),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Positivo para entradas, negativo para salidas'
    },
    previousStock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    newStock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    totalValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    referenceType: {
      type: DataTypes.ENUM('sale', 'purchase', 'adjustment', 'return'),
      allowNull: true
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    movementDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'inventory_movements',
    timestamps: true,
    indexes: [
      { fields: ['productId'] },
      { fields: ['movementType'] },
      { fields: ['movementDate'] }
    ]
  });

  return InventoryMovement;
};