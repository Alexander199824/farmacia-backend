// models/invoiceItem.js
module.exports = (sequelize, DataTypes) => {
    const InvoiceItem = sequelize.define('InvoiceItem', {
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Invoices', // Debe coincidir con el nombre de la tabla de facturas
          key: 'id'
        }
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'productos', // Nombre de la tabla de productos
          key: 'id'
        }
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      }
    });
  
    InvoiceItem.associate = (models) => {
      InvoiceItem.belongsTo(models.Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
      InvoiceItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    };
  
    return InvoiceItem;
  };
  