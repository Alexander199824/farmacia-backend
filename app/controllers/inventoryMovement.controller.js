/**
 * @author Alexander Echeverria
 * @file app/controllers/inventoryMovement.controller.js
 * @description Controlador de Movimientos de Inventario
 * @location app/controllers/inventoryMovement.controller.js
 * 
 * Funcionalidades:
 * - Registro de movimientos de inventario
 * - Consulta de movimientos por tipo
 * - Historial de movimientos por producto
 * - Aprobación de movimientos
 * - Estadísticas de movimientos
 */

const db = require('../config/db.config');
const InventoryMovement = db.InventoryMovement;
const Product = db.Product;
const Batch = db.Batch;
const User = db.User;
const { Op } = db.Sequelize;

// Crear un movimiento de inventario
exports.createMovement = async (req, res) => {
    try {
        const {
            productId,
            batchId,
            movementType,
            quantity,
            unitCost,
            referenceType,
            referenceId,
            referenceNumber,
            notes,
            location
        } = req.body;

        const userId = req.user.id;

        // Validar que el producto existe
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        // Calcular stock previo y nuevo
        const previousStock = product.stock;
        const movementQuantity = ['purchase', 'return', 'transfer_in', 'adjustment'].includes(movementType) 
            ? Math.abs(quantity) 
            : -Math.abs(quantity);
        const newStock = previousStock + movementQuantity;

        // Validar que no quede stock negativo
        if (newStock < 0) {
            return res.status(400).json({ 
                message: "Stock insuficiente para realizar este movimiento",
                currentStock: previousStock,
                requestedQuantity: Math.abs(quantity)
            });
        }

        // Crear el movimiento
        const movement = await InventoryMovement.create({
            productId,
            batchId,
            movementType,
            quantity: movementQuantity,
            previousStock,
            newStock,
            unitCost,
            totalValue: unitCost ? (unitCost * Math.abs(quantity)) : null,
            referenceType,
            referenceId,
            referenceNumber,
            userId,
            notes,
            location,
            approved: false
        });

        // Actualizar stock del producto
        await product.update({ stock: newStock });

        // Si hay lote asociado, actualizar su cantidad
        if (batchId) {
            const batch = await Batch.findByPk(batchId);
            if (batch) {
                await batch.update({ 
                    currentQuantity: batch.currentQuantity + movementQuantity 
                }); 
            }
        }

        res.status(201).json({
            message: "Movimiento de inventario registrado exitosamente",
            movement
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al crear movimiento de inventario",
            error: error.message
        });
    }
};

// Obtener todos los movimientos con filtros
exports.getAllMovements = async (req, res) => {
    try {
        const { 
            productId, 
            movementType, 
            startDate, 
            endDate,
            approved,
            page = 1,
            limit = 50
        } = req.query;

        const where = {};

        if (productId) where.productId = productId;
        if (movementType) where.movementType = movementType;
        if (approved !== undefined) where.approved = approved === 'true';
        
        if (startDate && endDate) {
            where.movementDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const offset = (page - 1) * limit;

        const { count, rows: movements } = await InventoryMovement.findAndCountAll({
            where,
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'description']
                },
                {
                    model: Batch,
                    as: 'batch',
                    attributes: ['id', 'batchNumber', 'expirationDate'],
                    required: false
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['id', 'username'],
                    required: false
                }
            ],
            order: [['movementDate', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            movements
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener movimientos",
            error: error.message
        });
    }
};

// Obtener movimientos por producto
exports.getMovementsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 20 } = req.query;

        const movements = await InventoryMovement.findAll({
            where: { productId },
            include: [
                {
                    model: Batch,
                    as: 'batch',
                    attributes: ['id', 'batchNumber'],
                    required: false
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                }
            ],
            order: [['movementDate', 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json(movements);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener movimientos del producto",
            error: error.message
        });
    }
};

// Aprobar un movimiento
exports.approveMovement = async (req, res) => {
    try {
        const { id } = req.params;
        const approverId = req.user.id;

        const movement = await InventoryMovement.findByPk(id);
        if (!movement) {
            return res.status(404).json({ message: "Movimiento no encontrado" });
        }

        if (movement.approved) {
            return res.status(400).json({ message: "El movimiento ya está aprobado" });
        }

        await movement.update({
            approved: true,
            approvedBy: approverId,
            approvedDate: new Date()
        });

        res.status(200).json({
            message: "Movimiento aprobado exitosamente",
            movement
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al aprobar movimiento",
            error: error.message
        });
    }
};

// Obtener estadísticas de movimientos
exports.getMovementStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.movementDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const stats = {
            totalMovements: await InventoryMovement.count({ where: dateFilter }),
            byType: await InventoryMovement.findAll({
                where: dateFilter,
                attributes: [
                    'movementType',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
                    [db.Sequelize.fn('SUM', db.Sequelize.col('totalValue')), 'totalValue']
                ],
                group: ['movementType']
            }),
            pendingApproval: await InventoryMovement.count({
                where: { 
                    approved: false,
                    ...dateFilter
                }
            }),
            totalValue: await InventoryMovement.sum('totalValue', {
                where: dateFilter
            }) || 0
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener estadísticas",
            error: error.message
        });
    }
};

// Eliminar un movimiento (solo si no está aprobado)
exports.deleteMovement = async (req, res) => {
    try {
        const { id } = req.params;

        const movement = await InventoryMovement.findByPk(id);
        if (!movement) {
            return res.status(404).json({ message: "Movimiento no encontrado" });
        }

        if (movement.approved) {
            return res.status(400).json({ 
                message: "No se puede eliminar un movimiento aprobado" 
            });
        }

        // Revertir el stock
        const product = await Product.findByPk(movement.productId);
        if (product) {
            await product.update({ 
                stock: movement.previousStock 
            });
        }

        // Si hay lote, revertir su cantidad
        // ✅ CORRECCIÓN: usar movement.quantity en lugar de movementQuantity
        if (movement.batchId) {
            const batch = await Batch.findByPk(movement.batchId);
            if (batch) {
                // Revertir la cantidad (invertir el movimiento)
                await batch.update({ 
                    currentQuantity: batch.currentQuantity - movement.quantity 
                });
            }
        }

        await movement.destroy();

        res.status(200).json({
            message: "Movimiento eliminado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar movimiento",
            error: error.message
        });
    }
};