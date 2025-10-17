/**
 * @author Alexander Echeverria
 * @file app/controllers/batch.controller.js
 * @description Controlador de Lotes - CORREGIDO para modelo actualizado
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
const Supplier = db.Supplier;
const { Op } = db.Sequelize;

// Crear un nuevo lote
exports.createBatch = async (req, res) => {
    try {
        const {
            productId,
            supplierId,
            batchNumber,
            manufacturingDate,
            expirationDate,
            initialQuantity,
            purchasePrice,
            salePrice,
            location,
            invoiceNumber,
            notes
        } = req.body;

        // Validar que el producto existe
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        // Validar que el proveedor existe
        const supplier = await Supplier.findByPk(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        // Validar que el número de lote no exista para este producto
        const existingBatch = await Batch.findOne({ 
            where: { 
                batchNumber,
                productId 
            } 
        });
        
        if (existingBatch) {
            return res.status(400).json({ 
                message: "El número de lote ya existe para este producto" 
            });
        }

        // Validar fechas
        if (new Date(expirationDate) <= new Date(manufacturingDate)) {
            return res.status(400).json({
                message: "La fecha de vencimiento debe ser posterior a la fecha de fabricación"
            });
        }

        // Crear el lote (el hook beforeCreate calcula el status automáticamente)
        const batch = await Batch.create({
            productId,
            supplierId,
            batchNumber,
            manufacturingDate,
            expirationDate,
            initialQuantity,
            currentQuantity: initialQuantity,
            purchasePrice,
            salePrice,
            location,
            invoiceNumber,
            notes
        });

        // Actualizar stock del producto
        await product.increment('stock', { by: initialQuantity });

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
        const { 
            productId, 
            supplierId,
            status, 
            canBeSold,
            page = 1,
            limit = 50 
        } = req.query;
        
        const where = {};

        if (productId) where.productId = productId;
        if (supplierId) where.supplierId = supplierId;
        if (status) where.status = status;
        if (canBeSold !== undefined) where.canBeSold = canBeSold === 'true';

        const offset = (page - 1) * limit;

        const { count, rows: batches } = await Batch.findAndCountAll({
            where,
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku', 'category']
                },
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'code']
                }
            ],
            order: [['expirationDate', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            batches
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener los lotes",
            error: error.message
        });
    }
};

// Obtener un lote por ID
exports.getBatchById = async (req, res) => {
    try {
        const { id } = req.params;

        const batch = await Batch.findByPk(id, {
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku', 'category', 'price']
                },
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'code', 'email', 'phone']
                }
            ]
        });

        if (!batch) {
            return res.status(404).json({ message: "Lote no encontrado" });
        }

        res.status(200).json(batch);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener el lote",
            error: error.message
        });
    }
};

// Obtener lotes próximos a vencer
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
                currentQuantity: { [Op.gt]: 0 },
                status: { [Op.in]: ['active', 'near_expiry'] }
            },
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku', 'price']
                },
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'acceptsReturns', 'returnPolicyMonthsBefore']
                }
            ],
            order: [['expirationDate', 'ASC']]
        });

        res.status(200).json({
            count: batches.length,
            days: parseInt(days),
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
                currentQuantity: { [Op.gt]: 0 },
                status: 'expired'
            },
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku', 'price']
                },
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'acceptsReturns']
                }
            ],
            order: [['expirationDate', 'DESC']]
        });

        const totalLoss = batches.reduce((sum, batch) => {
            return sum + (parseFloat(batch.purchasePrice) * batch.currentQuantity);
        }, 0);

        res.status(200).json({
            count: batches.length,
            totalLoss: parseFloat(totalLoss.toFixed(2)),
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
                currentQuantity: { [Op.gt]: 0 },
                canBeSold: true,
                status: { [Op.in]: ['active', 'near_expiry'] },
                expirationDate: { [Op.gte]: new Date() }
            },
            order: [
                ['expirationDate', 'ASC'], // FIFO: primero vence, primero sale
                ['receiptDate', 'ASC']
            ]
        });

        res.status(200).json({
            productId,
            availableBatches: batches.length,
            totalQuantity: batches.reduce((sum, b) => sum + b.currentQuantity, 0),
            batches
        });
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
        const { location, notes, status } = req.body;

        const batch = await Batch.findByPk(id);
        if (!batch) {
            return res.status(404).json({ message: "Lote no encontrado" });
        }

        // Solo permitir actualizar ciertos campos
        // currentQuantity se maneja con movimientos de inventario
        const updates = {};
        if (location !== undefined) updates.location = location;
        if (notes !== undefined) updates.notes = notes;
        if (status !== undefined && ['blocked', 'active'].includes(status)) {
            updates.status = status;
            updates.canBeSold = status === 'active';
        }

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

// Bloquear/Desbloquear lote
exports.toggleBlockBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const batch = await Batch.findByPk(id);
        if (!batch) {
            return res.status(404).json({ message: "Lote no encontrado" });
        }

        const newStatus = batch.status === 'blocked' ? 'active' : 'blocked';
        const newCanBeSold = newStatus === 'active';

        await batch.update({
            status: newStatus,
            canBeSold: newCanBeSold,
            notes: reason ? `${batch.notes || ''}\n[${new Date().toISOString()}] ${newStatus === 'blocked' ? 'Bloqueado' : 'Desbloqueado'}: ${reason}` : batch.notes
        });

        res.status(200).json({
            message: `Lote ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'} exitosamente`,
            batch
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al cambiar estado del lote",
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

        if (batch.currentQuantity > 0) {
            return res.status(400).json({
                message: "No se puede eliminar un lote con stock disponible. Stock actual: " + batch.currentQuantity
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
            blocked: await Batch.count({ where: { status: 'blocked' } }),
            
            // Valor total del inventario por lotes
            totalValue: await Batch.sum('purchasePrice', {
                where: { 
                    currentQuantity: { [Op.gt]: 0 },
                    status: { [Op.in]: ['active', 'near_expiry'] }
                }
            }) || 0,

            // Cantidad total en lotes activos
            totalQuantity: await Batch.sum('currentQuantity', {
                where: { 
                    status: { [Op.in]: ['active', 'near_expiry'] }
                }
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