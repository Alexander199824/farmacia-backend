/**
 * @author Alexander Echeverria
 * @file app/models/SupplierPayment.js
 * @description Modelo de Pagos a Proveedores
 * @location app/models/SupplierPayment.js
 */

module.exports = (sequelize, Sequelize) => {
    const SupplierPayment = sequelize.define('SupplierPayment', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        supplierId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'suppliers',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        amount: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false,
            validate: {
                min: 0.01
            }
        },
        paymentMethod: {
            type: Sequelize.ENUM('efectivo', 'transferencia', 'cheque', 'tarjeta'),
            allowNull: false,
            defaultValue: 'efectivo'
        },
        referenceNumber: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Número de cheque, transferencia, etc.'
        },
        paymentDate: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        balanceBefore: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false,
            comment: 'Deuda antes del pago'
        },
        balanceAfter: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false,
            comment: 'Deuda después del pago'
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'supplier_payments',
        timestamps: true,
        indexes: [
            {
                fields: ['supplierId']
            },
            {
                fields: ['paymentDate']
            }
        ]
    });

    return SupplierPayment;
};
