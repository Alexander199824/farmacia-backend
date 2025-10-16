/**
 * Modelo de Payment para Stripe
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/payment.js
 */

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'gtq'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    paymentIntentId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    clientSecret: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'payments',
    timestamps: true
  });

  return Payment;
};