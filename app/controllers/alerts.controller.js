/**
 * @author Alexander Echeverria
 * @file app/controllers/alerts.controller.js
 * @description Controlador de Alertas del Sistema
 * @location app/controllers/alerts.controller.js
 * 
 * Funcionalidades:
 * - Alertas de productos con stock bajo
 * - Alertas de productos próximos a vencer
 * - Alertas de productos vencidos
 * - Alertas de movimientos pendientes de aprobación
 * - Resumen de alertas activas
 */

const db = require('../config/db.config');
const Product = db.Product;
const Batch = db.Batch;
const InventoryMovement = db.InventoryMovement;
const { Op } = db.Sequelize;

// Obtener todas las alertas activas
exports.getAllAlerts = async (req, res) => {
    try {
        const alerts = {
            lowStock: await getLowStockAlerts(),
            expiring: await getExpiringProductsAlerts(),
            expired: await getExpiredProductsAlerts(),
            pendingApprovals: await getPendingApprovalsAlerts(),
            summary: {}
        };

        // Calcular resumen
        alerts.summary = {
            total: alerts.lowStock.count + 
                   alerts.expiring.count + 
                   alerts.expired.count + 
                   alerts.pendingApprovals.count,
            critical: alerts.expired.count,
            high: alerts.expiring.count + alerts.lowStock.count,
            medium: alerts.pendingApprovals.count
        };

        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener alertas",
            error: error.message
        });
    }
};

// Alertas de stock bajo
exports.getLowStockAlerts = async (req, res) => {
    try {
        const result = await getLowStockAlerts();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener alertas de stock bajo",
            error: error.message
        });
    }
};

// Alertas de productos próximos a vencer
exports.getExpiringAlerts = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const result = await getExpiringProductsAlerts(days);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener alertas de vencimiento",
            error: error.message
        });
    }
};

// Alertas de productos vencidos
exports.getExpiredAlerts = async (req, res) => {
    try {
        const result = await getExpiredProductsAlerts();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener alertas de productos vencidos",
            error: error.message
        });
    }
};

// Alertas de aprobaciones pendientes
exports.getPendingApprovalsAlerts = async (req, res) => {
    try {
        const result = await getPendingApprovalsAlerts();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener alertas de aprobaciones pendientes",
            error: error.message
        });
    }
};

// ========== FUNCIONES AUXILIARES ==========

async function getLowStockAlerts() {
    const lowStockThreshold = 10; // Umbral mínimo de stock
    
    const products = await Product.findAll({
        where: {
            stock: {
                [Op.lte]: lowStockThreshold
            }
        },
        attributes: ['id', 'name', 'stock', 'price'],
        order: [['stock', 'ASC']]
    });

    return {
        type: 'low_stock',
        severity: 'high',
        count: products.length,
        threshold: lowStockThreshold,
        products: products.map(p => ({
            id: p.id,
            name: p.name,
            currentStock: p.stock,
            price: parseFloat(p.price),
            message: `Stock crítico: ${p.stock} unidades disponibles`
        }))
    };
}

async function getExpiringProductsAlerts(days = 30) {
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
        include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price']
        }],
        order: [['expirationDate', 'ASC']]
    });

    return {
        type: 'expiring_soon',
        severity: 'high',
        count: batches.length,
        days: parseInt(days),
        batches: batches.map(b => {
            const daysUntilExpiry = Math.floor(
                (new Date(b.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
            );
            return {
                id: b.id,
                batchNumber: b.batchNumber,
                product: {
                    id: b.product.id,
                    name: b.product.name
                },
                expirationDate: b.expirationDate,
                daysUntilExpiry,
                quantity: b.currentQuantity, 
                estimatedLoss: parseFloat(b.product.price) * b.currentQuantity,
                message: `Vence en ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? 's' : ''}`
            };
        })
    };
}

async function getExpiredProductsAlerts() {
    const batches = await Batch.findAll({
        where: {
            expirationDate: { [Op.lt]: new Date() },
            currentQuantity: { [Op.gt]: 0 } 
        },
        include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price']
        }],
        order: [['expirationDate', 'DESC']]
    });

    const totalLoss = batches.reduce((sum, b) => {
        return sum + (parseFloat(b.product.price) * b.currentQuantity);
    }, 0);

    return {
        type: 'expired',
        severity: 'critical',
        count: batches.length,
        totalLoss: parseFloat(totalLoss.toFixed(2)),
        batches: batches.map(b => {
            const daysExpired = Math.floor(
                (new Date() - new Date(b.expirationDate)) / (1000 * 60 * 60 * 24)
            );
            return {
                id: b.id,
                batchNumber: b.batchNumber,
                product: {
                    id: b.product.id,
                    name: b.product.name
                },
                expirationDate: b.expirationDate,
                daysExpired,
                quantity: b.currentQuantity, 
                estimatedLoss: parseFloat(b.product.price) * b.currentQuantity,
                message: `Vencido hace ${daysExpired} día${daysExpired !== 1 ? 's' : ''}`
            };
        })
    };
}

async function getPendingApprovalsAlerts() {
    // ⚠️ El modelo InventoryMovement no tiene campo 'approved'
    // Retornamos estructura vacía hasta implementar aprobaciones
    return {
        type: 'pending_approvals',
        severity: 'medium',
        count: 0,
        movements: []
    };
}