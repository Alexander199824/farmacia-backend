// models/payment.js
module.exports = (sequelize, Sequelize) => {
    const Payment = sequelize.define('payments', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        currency: {
            type: Sequelize.STRING,
            defaultValue: 'usd'
        },
        status: {
            type: Sequelize.STRING,
            allowNull: false
        },
        paymentIntentId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        clientSecret: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });

    return Payment;
};
