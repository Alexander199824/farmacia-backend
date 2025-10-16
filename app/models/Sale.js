/**
 * Modelo de Venta
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/Sale.js
 */

module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    saleNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    saleDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    saleTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    saleDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
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
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia', 'credito'),
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'cancelado'),
      defaultValue: 'pagado'
    },
    status: {
      type: DataTypes.ENUM('completada', 'cancelada', 'devuelta'),
      defaultValue: 'completada'
    },
    clientName: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    clientNit: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'sales',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['saleNumber'] },
      { fields: ['saleDate'] },
      { fields: ['saleDateTime'] },
      { fields: ['sellerId'] },
      { fields: ['status'] }
    ],
    hooks: {
      beforeCreate: async (sale) => {
        if (!sale.saleNumber) {
          const year = new Date().getFullYear();
          const month = String(new Date().getMonth() + 1).padStart(2, '0');
          const lastSale = await sequelize.models.Sale.findOne({
            where: {
              saleNumber: {
                [sequelize.Sequelize.Op.like]: `VEN-${year}${month}-%`
              }
            },
            order: [['id', 'DESC']]
          });

          let nextNumber = 1;
          if (lastSale) {
            const parts = lastSale.saleNumber.split('-');
            nextNumber = parseInt(parts[2]) + 1;
          }

          sale.saleNumber = `VEN-${year}${month}-${String(nextNumber).padStart(6, '0')}`;
        }
      }
    }
  });

  return Sale;
};