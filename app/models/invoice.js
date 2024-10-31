// models/invoice.js
module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
      clientId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
              model: 'Clients', // Assuming client DPI is associated with the Clients table
              key: 'id'
          }
      },
      sellerDPI: {
          type: DataTypes.STRING,
          allowNull: false
      },
      clientDPI: {
          type: DataTypes.STRING,
          allowNull: false
      },
      totalAmount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false
      },
      paymentMethod: {
          type: DataTypes.ENUM('paypal', 'stripe', 'cash'),
          allowNull: false
      },
      date: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
      }
  });

  Invoice.associate = (models) => {
      Invoice.hasMany(models.InvoiceItem, { foreignKey: 'invoiceId', as: 'items' });
  };

  return Invoice;
};
