/**
 * @author Alexander Echeverria
 * @file app/models/inventoryMovement.js
 * @description Modelo de Movimientos de Inventario para trazabilidad completa
 * @location app/models/inventoryMovement.js
 * 
 * Este modelo maneja:
 * - Registro de entradas y salidas de inventario
 * - Ajustes de inventario
 * - Transferencias entre sucursales
 * - Mermas y devoluciones
 * - Trazabilidad completa de movimientos
 * - Auditoría de inventario
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
                model: 'productos',
                key: 'id'
            }
        },
        batchId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Batches',
                key: 'id'
            },
            comment: 'Lote asociado al movimiento'
        },
        movementType: {
            type: DataTypes.ENUM(
                'purchase',      // Compra a proveedor
                'sale',          // Venta a cliente
                'adjustment',    // Ajuste de inventario
                'transfer_in',   // Transferencia entrante
                'transfer_out',  // Transferencia saliente
                'return',        // Devolución de cliente
                'damage',        // Producto dañado
                'expiry',        // Producto vencido
                'donation',      // Donación
                'sample'         // Muestra médica
            ),
            allowNull: false,
            comment: 'Tipo de movimiento de inventario'
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Cantidad del movimiento (positivo=entrada, negativo=salida)'
        },
        previousStock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Stock previo al movimiento'
        },
        newStock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Stock después del movimiento'
        },
        unitCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Costo unitario del producto en este movimiento'
        },
        totalValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Valor total del movimiento'
        },
        referenceType: {
            type: DataTypes.ENUM('invoice', 'purchase_order', 'transfer', 'adjustment', 'other'),
            allowNull: true,
            comment: 'Tipo de documento de referencia'
        },
        referenceId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID del documento de referencia'
        },
        referenceNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Número del documento de referencia'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            comment: 'Usuario que realizó el movimiento'
        },
        movementDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: 'Fecha del movimiento'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Observaciones del movimiento'
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Ubicación física del inventario'
        },
        approved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Indica si el movimiento fue aprobado'
        },
        approvedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            comment: 'Usuario que aprobó el movimiento'
        },
        approvedDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Fecha de aprobación'
        }
    }, {
        timestamps: true,
        indexes: [
            {
                fields: ['productId', 'movementDate']
            },
            {
                fields: ['batchId']
            },
            {
                fields: ['movementType']
            },
            {
                fields: ['userId']
            }
        ]
    });

    InventoryMovement.associate = (models) => {
        InventoryMovement.belongsTo(models.Product, {
            foreignKey: 'productId',
            as: 'product'
        });
        InventoryMovement.belongsTo(models.Batch, {
            foreignKey: 'batchId',
            as: 'batch'
        });
        InventoryMovement.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        InventoryMovement.belongsTo(models.User, {
            foreignKey: 'approvedBy',
            as: 'approver'
        });
    };

    return InventoryMovement;
};