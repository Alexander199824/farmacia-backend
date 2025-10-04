/**
 * @author Alexander Echeverria
 * @file app/models/batch.js
 * @description Modelo de Lotes para control de vencimientos y trazabilidad de productos farmacéuticos
 * @location app/models/batch.js
 * 
 * Este modelo maneja:
 * - Control de lotes por producto
 * - Fechas de vencimiento
 * - Cantidades por lote
 * - Trazabilidad FIFO (First In, First Out)
 * - Alertas de productos próximos a vencer
 */

module.exports = (sequelize, DataTypes) => {
    const Batch = sequelize.define('Batch', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'productos',
                key: 'id'
            }
        },
        batchNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Número de lote único proporcionado por el fabricante'
        },
        manufacturingDate: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Fecha de fabricación del lote'
        },
        expirationDate: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Fecha de vencimiento del lote'
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Cantidad disponible en este lote'
        },
        initialQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Cantidad inicial del lote al momento de ingreso'
        },
        purchasePrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Precio de compra del lote'
        },
        salePrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Precio de venta sugerido para este lote'
        },
        supplier: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Proveedor del lote'
        },
        status: {
            type: DataTypes.ENUM('active', 'near_expiry', 'expired', 'depleted'),
            defaultValue: 'active',
            comment: 'Estado del lote: activo, por vencer, vencido, agotado'
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Ubicación física del lote en bodega/farmacia'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Notas adicionales sobre el lote'
        }
    }, {
        timestamps: true,
        paranoid: true, // Soft delete
        hooks: {
            beforeCreate: async (batch) => {
                // Verificar si el lote ya venció
                if (new Date(batch.expirationDate) < new Date()) {
                    batch.status = 'expired';
                }
            },
            beforeUpdate: async (batch) => {
                // Actualizar estado según vencimiento y cantidad
                const now = new Date();
                const expiryDate = new Date(batch.expirationDate);
                const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

                if (batch.quantity === 0) {
                    batch.status = 'depleted';
                } else if (expiryDate < now) {
                    batch.status = 'expired';
                } else if (daysUntilExpiry <= 30) {
                    batch.status = 'near_expiry';
                } else {
                    batch.status = 'active';
                }
            }
        }
    });

    Batch.associate = (models) => {
        Batch.belongsTo(models.Product, {
            foreignKey: 'productId',
            as: 'product'
        });
    };

    return Batch;
};