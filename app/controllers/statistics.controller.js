/**
 * @author Alexander Echeverria
 * @file app/controllers/statistics.controller.js
 * @description Controlador de Estadísticas y Reportes del sistema
 * @location app/controllers/statistics.controller.js
 * 
 * Funcionalidades:
 * - Dashboard con KPIs principales
 * - Reportes de ventas
 * - Productos más vendidos
 * - Análisis de rentabilidad
 * - Reportes de vencimientos
 * - Estadísticas por período
 */

const db = require('../config/db.config');
const { Op } = db.Sequelize;
const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const Product = db.Product;
const Batch = db.Batch;
const User = db.User;
const Payment = db.Payment;
const Supplier = db.Supplier;

// ========== DASHBOARD PRINCIPAL ==========

exports.getDashboard = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.invoiceDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Total de ventas
        const totalSales = await Invoice.sum('total', {
            where: {
                status: { [Op.ne]: 'anulada' },
                ...dateFilter
            }
        }) || 0;

        // Número de recibos
        const invoiceCount = await Invoice.count({
            where: {
                status: { [Op.ne]: 'anulada' },
                ...dateFilter
            }
        });

        // Número de clientes únicos
        const uniqueClients = await Invoice.count({
            where: {
                status: { [Op.ne]: 'anulada' },
                clientId: { [Op.ne]: null },
                ...dateFilter
            },
            distinct: true,
            col: 'clientId'
        });

        // Productos con stock bajo (menos del stock mínimo)
        const lowStockProducts = await Product.count({
            where: {
                stock: {
                    [Op.lte]: db.Sequelize.col('minStock')
                },
                isActive: true
            }
        });

        // Productos agotados
        const outOfStockProducts = await Product.count({
            where: {
                stock: 0,
                isActive: true
            }
        });

        // Productos próximos a vencer (30 días)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        
        const expiringBatches = await Batch.count({
            where: {
                expirationDate: {
                    [Op.lte]: futureDate,
                    [Op.gte]: new Date()
                },
                currentQuantity: { [Op.gt]: 0 },
                status: { [Op.in]: ['active', 'near_expiry'] }
            }
        });

        // Productos vencidos
        const expiredBatches = await Batch.count({
            where: {
                expirationDate: { [Op.lt]: new Date() },
                currentQuantity: { [Op.gt]: 0 },
                status: 'expired'
            }
        });

        // Venta promedio
        const avgSale = invoiceCount > 0 ? (totalSales / invoiceCount) : 0;

        // Métodos de pago más usados
        const paymentMethods = await Invoice.findAll({
            where: {
                status: { [Op.ne]: 'anulada' },
                ...dateFilter
            },
            attributes: [
                'paymentMethod',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'total']
            ],
            group: ['paymentMethod']
        });

        // Valor total del inventario
        const inventoryValue = await Product.sum(
            db.Sequelize.literal('stock * "costPrice"'),
            {
                where: { isActive: true }
            }
        ) || 0;

        res.status(200).json({
            sales: {
                total: parseFloat(totalSales).toFixed(2),
                count: invoiceCount,
                average: parseFloat(avgSale).toFixed(2)
            },
            clients: {
                unique: uniqueClients
            },
            inventory: {
                lowStock: lowStockProducts,
                outOfStock: outOfStockProducts,
                expiring: expiringBatches,
                expired: expiredBatches,
                totalValue: parseFloat(inventoryValue).toFixed(2)
            },
            paymentMethods
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener dashboard",
            error: error.message
        });
    }
};

// ========== PRODUCTOS MÁS VENDIDOS ==========

exports.getTopProducts = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const topProducts = await InvoiceItem.findAll({
            where: dateFilter,
            attributes: [
                'productId',
                [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'totalQuantity'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalRevenue'],
                [db.Sequelize.fn('COUNT', db.Sequelize.col('InvoiceItem.id')), 'timesOrdered']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku', 'category', 'price', 'imageUrl']
            }],
            group: ['productId', 'product.id'],
            order: [[db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json({
            count: topProducts.length,
            products: topProducts
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener productos más vendidos",
            error: error.message
        });
    }
};

// ========== REPORTE DE VENTAS POR PERÍODO ==========

exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: "Se requieren startDate y endDate"
            });
        }

        let dateFormat;
        switch (groupBy) {
            case 'hour':
                dateFormat = '%Y-%m-%d %H:00:00';
                break;
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'week':
                dateFormat = '%Y-W%V';
                break;
            case 'day':
            default:
                dateFormat = '%Y-%m-%d';
                break;
        }

        const salesReport = await Invoice.findAll({
            where: {
                invoiceDate: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                },
                status: { [Op.ne]: 'anulada' }
            },
            attributes: [
                [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('invoiceDate'), dateFormat), 'period'],
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'invoiceCount'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalSales'],
                [db.Sequelize.fn('AVG', db.Sequelize.col('total')), 'averageSale']
            ],
            group: [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('invoiceDate'), dateFormat)],
            order: [[db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('invoiceDate'), dateFormat), 'ASC']]
        });

        res.status(200).json({
            groupBy,
            startDate,
            endDate,
            report: salesReport
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al generar reporte de ventas",
            error: error.message
        });
    }
};

// ========== VENTAS POR HORA (Para identificar picos) ==========

exports.getSalesByHour = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                message: "Se requiere la fecha (date)"
            });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const salesByHour = await Invoice.findAll({
            where: {
                invoiceDateTime: {
                    [Op.between]: [startOfDay, endOfDay]
                },
                status: { [Op.ne]: 'anulada' }
            },
            attributes: [
                [db.Sequelize.fn('HOUR', db.Sequelize.col('invoiceDateTime')), 'hour'],
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'invoiceCount'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalSales'],
                [db.Sequelize.fn('AVG', db.Sequelize.col('total')), 'averageSale']
            ],
            group: [db.Sequelize.fn('HOUR', db.Sequelize.col('invoiceDateTime'))],
            order: [[db.Sequelize.fn('HOUR', db.Sequelize.col('invoiceDateTime')), 'ASC']]
        });

        res.status(200).json({
            date,
            salesByHour
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener ventas por hora",
            error: error.message
        });
    }
};

// ========== ANÁLISIS DE RENTABILIDAD ==========

exports.getProfitabilityAnalysis = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const profitAnalysis = await InvoiceItem.findAll({
            where: dateFilter,
            attributes: [
                'productId',
                [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'quantitySold'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'revenue'],
                [db.Sequelize.fn('SUM', db.Sequelize.literal('quantity * "unitCost"')), 'totalCost'],
                [db.Sequelize.fn('SUM', db.Sequelize.literal('total - (quantity * "unitCost")')), 'profit']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku', 'price', 'costPrice']
            }],
            group: ['productId', 'product.id'],
            order: [[db.Sequelize.fn('SUM', db.Sequelize.literal('total - (quantity * "unitCost")')), 'DESC']]
        });

        const analysis = profitAnalysis.map(item => {
            const revenue = parseFloat(item.dataValues.revenue) || 0;
            const cost = parseFloat(item.dataValues.totalCost) || 0;
            const profit = parseFloat(item.dataValues.profit) || 0;
            const quantity = parseInt(item.dataValues.quantitySold) || 0;
            const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

            return {
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    sku: item.product.sku
                },
                quantitySold: quantity,
                revenue: parseFloat(revenue).toFixed(2),
                cost: parseFloat(cost).toFixed(2),
                profit: parseFloat(profit).toFixed(2),
                margin: parseFloat(margin).toFixed(2) + '%'
            };
        });

        const totalRevenue = analysis.reduce((sum, item) => sum + parseFloat(item.revenue), 0);
        const totalCost = analysis.reduce((sum, item) => sum + parseFloat(item.cost), 0);
        const totalProfit = analysis.reduce((sum, item) => sum + parseFloat(item.profit), 0);
        const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

        res.status(200).json({
            summary: {
                totalRevenue: parseFloat(totalRevenue).toFixed(2),
                totalCost: parseFloat(totalCost).toFixed(2),
                totalProfit: parseFloat(totalProfit).toFixed(2),
                overallMargin: parseFloat(overallMargin).toFixed(2) + '%'
            },
            products: analysis
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al analizar rentabilidad",
            error: error.message
        });
    }
};

// ========== CLIENTES FRECUENTES ==========

exports.getTopClients = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.invoiceDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const topClients = await Invoice.findAll({
            where: {
                clientId: { [Op.ne]: null },
                status: { [Op.ne]: 'anulada' },
                ...dateFilter
            },
            attributes: [
                'clientId',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('Invoice.id')), 'purchaseCount'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalSpent'],
                [db.Sequelize.fn('AVG', db.Sequelize.col('total')), 'averageTicket']
            ],
            include: [{
                model: User,
                as: 'client',
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                where: { role: 'cliente' }
            }],
            group: ['clientId', 'client.id'],
            order: [[db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json({
            count: topClients.length,
            clients: topClients
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener clientes frecuentes",
            error: error.message
        });
    }
};

// ========== REPORTE DE INVENTARIO ==========

exports.getInventoryReport = async (req, res) => {
    try {
        const { category, supplierId } = req.query;
        const where = { isActive: true };

        if (category) where.category = category;
        if (supplierId) where.supplierId = supplierId;

        const inventoryReport = await Product.findAll({
            where,
            attributes: [
                'id',
                'name',
                'sku',
                'category',
                'stock',
                'minStock',
                'maxStock',
                'price',
                'costPrice',
                [db.Sequelize.literal('stock * "costPrice"'), 'inventoryValue']
            ],
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Batch,
                    as: 'batches',
                    where: {
                        currentQuantity: { [Op.gt]: 0 },
                        status: { [Op.in]: ['active', 'near_expiry'] }
                    },
                    required: false,
                    attributes: ['id', 'batchNumber', 'currentQuantity', 'expirationDate', 'status']
                }
            ],
            order: [['name', 'ASC']]
        });

        const totalInventoryValue = inventoryReport.reduce((sum, product) => {
            return sum + parseFloat(product.dataValues.inventoryValue || 0);
        }, 0);

        const summary = {
            totalProducts: inventoryReport.length,
            totalValue: parseFloat(totalInventoryValue).toFixed(2),
            withStock: inventoryReport.filter(p => p.stock > 0).length,
            lowStock: inventoryReport.filter(p => p.stock <= p.minStock && p.stock > 0).length,
            outOfStock: inventoryReport.filter(p => p.stock === 0).length
        };

        res.status(200).json({
            summary,
            products: inventoryReport
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al generar reporte de inventario",
            error: error.message
        });
    }
};

// ========== REPORTE DE VENCIMIENTOS ==========

exports.getExpirationReport = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));

        // Lotes vencidos
        const expiredBatches = await Batch.findAll({
            where: {
                expirationDate: { [Op.lt]: today },
                currentQuantity: { [Op.gt]: 0 }
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
            order: [['expirationDate', 'DESC']]
        });

        // Lotes próximos a vencer
        const expiringBatches = await Batch.findAll({
            where: {
                expirationDate: {
                    [Op.gte]: today,
                    [Op.lte]: futureDate
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

        // Calcular pérdidas
        const expiredLoss = expiredBatches.reduce((sum, batch) => {
            return sum + (parseFloat(batch.purchasePrice || 0) * batch.currentQuantity);
        }, 0);

        const expiringValue = expiringBatches.reduce((sum, batch) => {
            return sum + (parseFloat(batch.purchasePrice || 0) * batch.currentQuantity);
        }, 0);

        res.status(200).json({
            expired: {
                count: expiredBatches.length,
                totalLoss: parseFloat(expiredLoss).toFixed(2),
                batches: expiredBatches
            },
            expiring: {
                count: expiringBatches.length,
                valueAtRisk: parseFloat(expiringValue).toFixed(2),
                days: parseInt(days),
                batches: expiringBatches
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al generar reporte de vencimientos",
            error: error.message
        });
    }
};

// ========== VENTAS POR CATEGORÍA ==========

exports.getSalesByCategory = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const salesByCategory = await InvoiceItem.findAll({
            where: dateFilter,
            attributes: [
                [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'totalQuantity'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalRevenue'],
                [db.Sequelize.fn('COUNT', db.Sequelize.col('InvoiceItem.id')), 'itemCount']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['category']
            }],
            group: ['product.category'],
            order: [[db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'DESC']]
        });

        res.status(200).json({
            categories: salesByCategory
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener ventas por categoría",
            error: error.message
        });
    }
};

// ========== VENTAS POR VENDEDOR ==========

exports.getSalesBySeller = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.invoiceDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const salesBySeller = await Invoice.findAll({
            where: {
                status: { [Op.ne]: 'anulada' },
                ...dateFilter
            },
            attributes: [
                'sellerId',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('Invoice.id')), 'invoiceCount'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalSales'],
                [db.Sequelize.fn('AVG', db.Sequelize.col('total')), 'averageTicket']
            ],
            include: [{
                model: User,
                as: 'seller',
                attributes: ['id', 'firstName', 'lastName', 'email'],
                where: { role: { [Op.in]: ['admin', 'vendedor'] } }
            }],
            group: ['sellerId', 'seller.id'],
            order: [[db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'DESC']]
        });

        res.status(200).json({
            sellers: salesBySeller
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener ventas por vendedor",
            error: error.message
        });
    }
};