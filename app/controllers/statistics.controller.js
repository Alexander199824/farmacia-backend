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
const Client = db.Client;
const Payment = db.Payment;

// Dashboard principal con KPIs
exports.getDashboard = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Total de ventas
        const totalSales = await Invoice.sum('totalAmount', {
            where: dateFilter
        }) || 0;

        // Número de facturas
        const invoiceCount = await Invoice.count({
            where: dateFilter
        });

        // Número de clientes únicos
        const uniqueClients = await Invoice.count({
            where: dateFilter,
            distinct: true,
            col: 'clientId'
        });

        // Productos con stock bajo (menos del 20% del stock inicial)
        const lowStockProducts = await Product.count({
            where: {
                stock: {
                    [Op.lt]: db.Sequelize.literal('stock * 0.2')
                }
            }
        });

        // Productos próximos a vencer (30 días)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        
        const expiringProducts = await Batch.count({
            where: {
                expirationDate: {
                    [Op.lte]: futureDate,
                    [Op.gte]: new Date()
                },
                quantity: { [Op.gt]: 0 }
            }
        });

        // Venta promedio
        const avgSale = invoiceCount > 0 ? (totalSales / invoiceCount) : 0;

        // Métodos de pago más usados
        const paymentMethods = await Invoice.findAll({
            where: dateFilter,
            attributes: [
                'paymentMethod',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('totalAmount')), 'total']
            ],
            group: ['paymentMethod']
        });

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
                expiring: expiringProducts
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

// Productos más vendidos
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
                [db.Sequelize.fn('SUM', db.Sequelize.col('totalPrice')), 'totalRevenue']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'description', 'price']
            }],
            group: ['productId', 'product.id'],
            order: [[db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json(topProducts);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener productos más vendidos",
            error: error.message
        });
    }
};

// Reporte de ventas por período
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
                date: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                }
            },
            attributes: [
                [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('date'), dateFormat), 'period'],
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'invoiceCount'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('totalAmount')), 'totalSales']
            ],
            group: [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('date'), dateFormat)],
            order: [[db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('date'), dateFormat), 'ASC']]
        });

        res.status(200).json(salesReport);
    } catch (error) {
        res.status(500).json({
            message: "Error al generar reporte de ventas",
            error: error.message
        });
    }
};

// Análisis de rentabilidad
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
                [db.Sequelize.fn('SUM', db.Sequelize.col('totalPrice')), 'revenue']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price'],
                include: [{
                    model: Batch,
                    as: 'batches',
                    attributes: ['purchasePrice'],
                    limit: 1,
                    order: [['createdAt', 'DESC']]
                }]
            }],
            group: ['productId', 'product.id'],
            order: [[db.Sequelize.fn('SUM', db.Sequelize.col('totalPrice')), 'DESC']]
        });

        const analysis = profitAnalysis.map(item => {
            const revenue = parseFloat(item.dataValues.revenue) || 0;
            const cost = item.product?.batches?.[0]?.purchasePrice || 0;
            const quantity = parseInt(item.dataValues.quantitySold) || 0;
            const totalCost = cost * quantity;
            const profit = revenue - totalCost;
            const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

            return {
                product: {
                    id: item.product.id,
                    name: item.product.name
                },
                quantitySold: quantity,
                revenue: parseFloat(revenue).toFixed(2),
                cost: parseFloat(totalCost).toFixed(2),
                profit: parseFloat(profit).toFixed(2),
                margin: parseFloat(margin).toFixed(2) + '%'
            };
        });

        res.status(200).json(analysis);
    } catch (error) {
        res.status(500).json({
            message: "Error al analizar rentabilidad",
            error: error.message
        });
    }
};

// Reporte de clientes frecuentes
exports.getTopClients = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const topClients = await Invoice.findAll({
            where: dateFilter,
            attributes: [
                'clientId',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('Invoice.id')), 'purchaseCount'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('totalAmount')), 'totalSpent']
            ],
            include: [{
                model: Client,
                as: 'client',
                attributes: ['id', 'name', 'email', 'phone']
            }],
            group: ['clientId', 'client.id'],
            order: [[db.Sequelize.fn('SUM', db.Sequelize.col('totalAmount')), 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json(topClients);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener clientes frecuentes",
            error: error.message
        });
    }
};

// Reporte de inventario
exports.getInventoryReport = async (req, res) => {
    try {
        const inventoryReport = await Product.findAll({
            attributes: [
                'id',
                'name',
                'stock',
                'price',
                [db.Sequelize.literal('stock * price'), 'inventoryValue']
            ],
            include: [{
                model: Batch,
                as: 'batches',
                where: {
                    quantity: { [Op.gt]: 0 }
                },
                required: false,
                attributes: ['id', 'batchNumber', 'quantity', 'expirationDate', 'status']
            }],
            order: [['name', 'ASC']]
        });

        const totalInventoryValue = inventoryReport.reduce((sum, product) => {
            return sum + parseFloat(product.dataValues.inventoryValue || 0);
        }, 0);

        res.status(200).json({
            totalValue: parseFloat(totalInventoryValue).toFixed(2),
            products: inventoryReport
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al generar reporte de inventario",
            error: error.message
        });
    }
};