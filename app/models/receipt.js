/**
 * @author Alexander Echeverria
 * @file app/models/receipt.js
 * @description Modelo de Recibos para comprobantes de pago de clientes
 * @location app/models/receipt.js
 * 
 * Este modelo maneja:
 * - Generación de recibos/comprobantes
 * - Numeración automática correlativa
 * - Vinculación con facturas y pagos
 * - Historial de recibos por cliente
 * - Generación de PDF para impresión/envío
 */

module.exports = (sequelize, DataTypes) => {
    const Receipt = sequelize.define('Receipt', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        receiptNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Número correlativo del recibo (ej: REC-2025-00001)'
        },
        invoiceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Invoices',
                key: 'id'
            }
        },
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Clients',
                key: 'id'
            }
        },
        paymentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'payments',
                key: 'id'
            }
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Monto total del recibo'
        },
        paymentMethod: {
            type: DataTypes.ENUM('cash', 'card', 'transfer', 'paypal', 'stripe'),
            allowNull: false,
            comment: 'Método de pago utilizado'
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: 'GTQ',
            comment: 'Moneda del recibo (GTQ, USD, etc.)'
        },
        issueDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: 'Fecha de emisión del recibo'
        },
        issuedBy: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Usuario que emitió el recibo'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Notas adicionales en el recibo'
        },
        pdfUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'URL del PDF generado'
        },
        status: {
            type: DataTypes.ENUM('issued', 'sent', 'cancelled'),
            defaultValue: 'issued',
            comment: 'Estado del recibo'
        },
        cancelReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Razón de cancelación si aplica'
        },
        emailSent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Indica si se envió por correo electrónico'
        },
        emailSentDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Fecha de envío por email'
        }
    }, {
        timestamps: true,
        paranoid: true,
        hooks: {
            beforeCreate: async (receipt) => {
                // Generar número de recibo automático
                if (!receipt.receiptNumber) {
                    const year = new Date().getFullYear();
                    const lastReceipt = await Receipt.findOne({
                        where: {
                            receiptNumber: {
                                [sequelize.Sequelize.Op.like]: `REC-${year}-%`
                            }
                        },
                        order: [['id', 'DESC']]
                    });

                    let nextNumber = 1;
                    if (lastReceipt) {
                        const lastNumber = parseInt(lastReceipt.receiptNumber.split('-')[2]);
                        nextNumber = lastNumber + 1;
                    }

                    receipt.receiptNumber = `REC-${year}-${String(nextNumber).padStart(5, '0')}`;
                }
            }
        }
    });

    Receipt.associate = (models) => {
        Receipt.belongsTo(models.Invoice, {
            foreignKey: 'invoiceId',
            as: 'invoice'
        });
        Receipt.belongsTo(models.Client, {
            foreignKey: 'clientId',
            as: 'client'
        });
        Receipt.belongsTo(models.Payment, {
            foreignKey: 'paymentId',
            as: 'payment'
        });
    };

    return Receipt;
};