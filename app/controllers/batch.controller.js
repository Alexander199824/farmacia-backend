/**
 * @author Alexander Echeverria
 * @file app/controllers/batch.controller.js
 * @description Controlador de Lotes para gestión de vencimientos y trazabilidad
 * @location app/controllers/batch.controller.js
 * 
 * Funcionalidades:
 * - CRUD de lotes
 * - Consulta de lotes por vencer
 * - Consulta de lotes vencidos
 * - Lotes disponibles por producto (FIFO)
 * - Alertas de vencimiento
 */

const db = require('../config/db.config');
const Batch = db.Batch;
const Product = db.Product;
const { Op } = db.Sequelize;

// Crear un nuevo lote
exports.createBatch = async (req, res) => {
    try {
        const {
            productId,
            batchNumber,
            manufacturingDate,
            expirationDate,
            quantity,
            purchasePrice,
            salePrice,
            supplier,
            location,
            notes
        } = req.body;

        // Validar que el producto existe
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        // Validar que el número de lote no exista
        const existingBatch = await Batch.findOne({ where: { batchNumber } });
        if (existingBatch) {
            return res.status(400).json({ message: "El número de lote ya existe" });
        }

        // Crear el lote
        const batch = await Batch.create({
            productId,
            batchNumber,
            manufacturingDate,
            expirationDate,
            quantity,
            initialQuantity: quantity,
            purchasePrice,
            salePrice,
            supplier,
            location,
            notes
        });

        // Actualizar stock del producto
        await product.increment('stock', { by: quantity });

        res.status(201).json({
            message: "Lote creado exitosamente",
            batch
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al crear el lote",
            error: error.message
        });
    }
};

// Obtener todos los lotes con filtros opcionales
exports.getAllBatches = async (req, res) => {
    try {
        const { productId, status, supplier } = req.query;
        const where = {};

        if (productId) where.productId = productId;
        if (status) where.status = status;
        if (supplier) where.supplier = { [Op.iLike]: `%${supplier}%` };

        const batches = await Batch.findAll({
            where,
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'description']
            }],
            order: [['expirationDate', 'ASC']]
        });

        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener los lotes",
            error: error.message
        });
    }
};

// Obtener lotes próximos a vencer (30 días o menos)
exports.getExpiringBatches = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));

        const batches = await Batch.findAll({
            where: {
                expirationDate: {
                    [Op.lte]: futureDate,
                    [Op.gte]: new Date()
                },
                quantity: { [Op.gt]: 0 },
                status: { [Op.in]: ['active', 'near_expiry'] }
            },
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'description', 'price']
            }],
            order: [['expirationDate', 'ASC']]
        });

        res.status(200).json({
            count: batches.length,
            batches
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener lotes por vencer",
            error: error.message
        });
    }
};

// Obtener lotes vencidos
exports.getExpiredBatches = async (req, res) => {
    try {
        const batches = await Batch.findAll({
            where: {
                expirationDate: { [Op.lt]: new Date() },
                quantity: { [Op.gt]: 0 }
            },
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'description']
            }],
            order: [['expirationDate', 'DESC']]
        });

        res.status(200).json({
            count: batches.length,
            batches
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener lotes vencidos",
            error: error.message
        });
    }
};

// Obtener lotes disponibles de un producto (FIFO)
exports.getAvailableBatchesByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const batches = await Batch.findAll({
            where: {
                productId,
                quantity: { [Op.gt]: 0 },
                status: 'active',
                expirationDate: { [Op.gte]: new Date() }
            },
            order: [
                ['expirationDate', 'ASC'], // FIFO: primero vence, primero sale
                ['createdAt', 'ASC']
            ]
        });

        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener lotes disponibles",
            error: error.message
        });
    }
};

// Actualizar un lote
exports.updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const batch = await Batch.findByPk(id);
        if (!batch) {
            return res.status(404).json({ message: "Lote no encontrado" });
        }

        // No permitir cambiar cantidad directamente (usar movimientos de inventario)
        delete updates.quantity;

        await batch.update(updates);

        res.status(200).json({
            message: "Lote actualizado exitosamente",
            batch
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar el lote",
            error: error.message
        });
    }
};

// Eliminar un lote (soft delete)
exports.deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;

        const batch = await Batch.findByPk(id);
        if (!batch) {
            return res.status(404).json({ message: "Lote no encontrado" });
        }

        if (batch.quantity > 0) {
            return res.status(400).json({
                message: "No se puede eliminar un lote con stock disponible"
            });
        }

        await batch.destroy();

        res.status(200).json({
            message: "Lote eliminado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar el lote",
            error: error.message
        });
    }
};

// Obtener estadísticas de lotes
exports.getBatchStats = async (req, res) => {
    try {
        const stats = {
            total: await Batch.count(),
            active: await Batch.count({ where: { status: 'active' } }),
            nearExpiry: await Batch.count({ where: { status: 'near_expiry' } }),
            expired: await Batch.count({ where: { status: 'expired' } }),
            depleted: await Batch.count({ where: { status: 'depleted' } }),
            totalValue: await Batch.sum('totalPrice', {
                where: { quantity: { [Op.gt]: 0 } }
            }) || 0
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener estadísticas de lotes",
            error: error.message
        });
    }
};