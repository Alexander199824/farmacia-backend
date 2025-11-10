const db = require('../config/db.config.js');
const { Op, Sequelize } = require('sequelize');

// Importar modelos
const User = db.users;
const Product = db.products;
const Order = db.orders;
const OrderItem = db.orderItems;
const Invoice = db.invoices;
const InvoiceItem = db.invoiceItems;
const Receipt = db.receipts;
const Batch = db.batches;
const AuditLog = db.auditLogs;

// Generadores de reportes para descargas
const {
  generateSalesExcel,
  generateEconomicAnalysisExcel,
  generateBestSalesDaysExcel,
  generateSalesPDF,
  generateEconomicAnalysisPDF,
  generateBestSalesDaysPDF
} = require('../utils/reportGenerators');

// ==================== DASHBOARD GENERAL ====================

/**
 * Dashboard principal con métricas generales
 * GET /api/reports/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // today, week, month, year

    // Calcular fechas
    const { startDate, endDate } = calculateDateRange(period);

    // 1. VENTAS TOTALES
    const ventasTotales = await Invoice.sum('total', {
      where: {
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    }) || 0;

    // 2. NÚMERO DE TRANSACCIONES
    const numeroTransacciones = await Invoice.count({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    });

    // 3. PEDIDOS ONLINE
    const pedidosOnline = await Order.count({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    });

    // 4. PRODUCTOS VENDIDOS
    const productosVendidos = await InvoiceItem.sum('quantity', {
      include: [{
        model: Invoice,
        as: 'invoice',
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        attributes: []
      }]
    }) || 0;

    // 5. CLIENTES ACTIVOS
    const clientesActivos = await Invoice.count({
      distinct: true,
      col: 'clientId',
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        clientId: { [Op.not]: null }
      }
    });

    // 6. PRODUCTOS CON STOCK BAJO
    const stockBajo = await Product.count({
      where: {
        stock: {
          [Op.lte]: Sequelize.col('minStock')
        },
        isActive: true
      }
    });

    // 7. PRODUCTOS PRÓXIMOS A VENCER (30 días)
    const proximosAVencer = await Batch.count({
      where: {
        expirationDate: {
          [Op.between]: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
        },
        currentQuantity: { [Op.gt]: 0 }
      }
    });

    // 8. VENTAS POR DÍA (últimos 7 días)
    const ventasPorDia = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'fecha'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'total']
      ],
      where: {
        createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // 9. COMPARACIÓN CON PERIODO ANTERIOR
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(endDate);
    const diff = endDate - startDate;
    previousStartDate.setTime(previousStartDate.getTime() - diff);
    previousEndDate.setTime(previousEndDate.getTime() - diff);

    const ventasAnteriores = await Invoice.sum('total', {
      where: {
        createdAt: { [Op.between]: [previousStartDate, previousEndDate] }
      }
    }) || 0;

    const crecimiento = ventasAnteriores > 0
      ? (((ventasTotales - ventasAnteriores) / ventasAnteriores) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      period,
      dateRange: { startDate, endDate },
      metrics: {
        ventasTotales: parseFloat(ventasTotales).toFixed(2),
        numeroTransacciones,
        pedidosOnline,
        productosVendidos: parseInt(productosVendidos),
        clientesActivos,
        stockBajo,
        proximosAVencer,
        crecimiento: parseFloat(crecimiento)
      },
      ventasPorDia: ventasPorDia.map(v => ({
        fecha: v.fecha,
        cantidad: parseInt(v.cantidad),
        total: parseFloat(v.total).toFixed(2)
      }))
    });

  } catch (error) {
    console.error('Error en getDashboard:', error);
    res.status(500).json({
      message: 'Error al obtener dashboard',
      error: error.message
    });
  }
};

// ==================== REPORTES DE VENTAS ====================

/**
 * Reporte detallado de ventas
 * GET /api/reports/sales
 */
exports.getSalesReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'day', // hour, day, week, month, quarter, semester, year, product, category, client
      limit = 100,
      offset = 0
    } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    let results;

    switch (groupBy) {
      case 'hour':
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('Invoice.createdAt')), 'hora'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
        break;

      case 'day':
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt')), 'fecha'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
        break;

      case 'week':
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Invoice.createdAt')), 'semana'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
        break;

      case 'month':
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('Invoice.createdAt')), 'mes'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
        break;

      case 'quarter':
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE_TRUNC', 'quarter', Sequelize.col('Invoice.createdAt')), 'trimestre'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE_TRUNC', 'quarter', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE_TRUNC', 'quarter', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
        break;

      case 'semester':
        // Para semestre, agrupamos por cada 6 meses
        results = await db.sequelize.query(`
          SELECT
            DATE_TRUNC('year', "createdAt") +
              INTERVAL '6 months' * FLOOR(EXTRACT(MONTH FROM "createdAt") / 6) as semestre,
            COUNT(id) as cantidad,
            SUM(total) as total,
            AVG(total) as promedio
          FROM invoices
          ${Object.keys(where).length > 0 ? 'WHERE "createdAt" BETWEEN :startDate AND :endDate' : ''}
          GROUP BY semestre
          ORDER BY semestre DESC
        `, {
          replacements: {
            startDate: where.createdAt?.[Op.between]?.[0] || new Date(0),
            endDate: where.createdAt?.[Op.between]?.[1] || new Date()
          },
          type: db.Sequelize.QueryTypes.SELECT
        });
        break;

      case 'year':
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE_TRUNC', 'year', Sequelize.col('Invoice.createdAt')), 'año'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE_TRUNC', 'year', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE_TRUNC', 'year', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
        break;

      case 'product':
        console.log('🔍 [DEBUG] Starting product case');
        try {
          // Primero obtener las ventas por producto
          const salesByProduct = await db.sequelize.query(`
            SELECT
              ii."productId",
              SUM(ii.quantity) as "cantidadVendida",
              SUM(ii.subtotal) as "totalVentas",
              p.id as product_id,
              p.name as product_name,
              p.sku as product_sku,
              p.category as product_category,
              p."imageUrl" as product_imageUrl
            FROM invoice_items ii
            INNER JOIN invoices i ON ii."invoiceId" = i.id
            INNER JOIN products p ON ii."productId" = p.id
            ${Object.keys(where).length > 0 ? 'WHERE i."createdAt" BETWEEN :startDate AND :endDate' : ''}
            GROUP BY ii."productId", p.id, p.name, p.sku, p.category, p."imageUrl"
            ORDER BY SUM(ii.subtotal) DESC
            LIMIT :limit OFFSET :offset
          `, {
            replacements: {
              startDate: where.createdAt?.[Op.between]?.[0] || new Date(0),
              endDate: where.createdAt?.[Op.between]?.[1] || new Date(),
              limit: parseInt(limit),
              offset: parseInt(offset)
            },
            type: db.Sequelize.QueryTypes.SELECT
          });

          console.log('🔍 [DEBUG] Query completed, got', salesByProduct.length, 'results');

          // Reformatear resultados
          results = salesByProduct.map(r => ({
            productId: r.productId,
            product: {
              id: r.product_id,
              name: r.product_name,
              sku: r.product_sku,
              category: r.product_category,
              imageUrl: r.product_imageUrl
            },
            cantidadVendida: parseInt(r.cantidadVendida),
            totalVentas: parseFloat(r.totalVentas)
          }));

        } catch (queryError) {
          console.error('❌ [ERROR] Query failed:', queryError.message);
          throw queryError;
        }
        break;

      case 'category':
        results = await InvoiceItem.findAll({
          attributes: [
            [Sequelize.col('product.category'), 'categoria'],
            [Sequelize.fn('SUM', Sequelize.col('InvoiceItem.quantity')), 'cantidadVendida'],
            [Sequelize.fn('SUM', Sequelize.col('InvoiceItem.subtotal')), 'totalVentas'],
            [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('InvoiceItem.productId'))), 'productosUnicos']
          ],
          include: [
            {
              model: Invoice,
              as: 'invoice',
              where,
              attributes: []
            },
            {
              model: Product,
              as: 'product',
              attributes: []
            }
          ],
          group: ['product.category'],
          order: [[Sequelize.fn('SUM', Sequelize.col('InvoiceItem.subtotal')), 'DESC']],
          raw: true
        });
        break;

      case 'client':
        console.log('🔍 [DEBUG] Starting client case');
        try {
          // Obtener ventas por cliente usando raw SQL
          const salesByClient = await db.sequelize.query(`
            SELECT
              i."clientId",
              COUNT(i.id) as "numeroCompras",
              SUM(i.total) as "totalGastado",
              AVG(i.total) as "promedioCompra",
              u.id as client_id,
              u."firstName" as client_firstName,
              u."lastName" as client_lastName,
              u.email as client_email,
              u.nit as client_nit
            FROM invoices i
            LEFT JOIN users u ON i."clientId" = u.id
            WHERE i."clientId" IS NOT NULL
            ${Object.keys(where).length > 0 ? 'AND i."createdAt" BETWEEN :startDate AND :endDate' : ''}
            GROUP BY i."clientId", u.id, u."firstName", u."lastName", u.email, u.nit
            ORDER BY SUM(i.total) DESC
            LIMIT :limit OFFSET :offset
          `, {
            replacements: {
              startDate: where.createdAt?.[Op.between]?.[0] || new Date(0),
              endDate: where.createdAt?.[Op.between]?.[1] || new Date(),
              limit: parseInt(limit),
              offset: parseInt(offset)
            },
            type: db.Sequelize.QueryTypes.SELECT
          });

          console.log('🔍 [DEBUG] Query completed, got', salesByClient.length, 'results');

          // Reformatear resultados
          results = salesByClient.map(r => ({
            clientId: r.clientId,
            client: r.client_id ? {
              id: r.client_id,
              firstName: r.client_firstName,
              lastName: r.client_lastName,
              email: r.client_email,
              nit: r.client_nit
            } : null,
            numeroCompras: parseInt(r.numeroCompras),
            totalGastado: parseFloat(r.totalGastado),
            promedioCompra: parseFloat(r.promedioCompra)
          }));

        } catch (queryError) {
          console.error('❌ [ERROR] Query failed:', queryError.message);
          throw queryError;
        }
        break;

      default:
        return res.status(400).json({ message: 'Tipo de agrupación inválido' });
    }

    // Formatear números en los resultados
    // Los casos 'product' y 'client' ya están formateados por el raw SQL
    // Los casos 'day', 'month', 'category' usan raw: true y retornan objetos planos
    const formattedResults = results.map(r => {
      const obj = { ...r };

      // Formatear números a 2 decimales donde corresponda
      if (obj.total) obj.total = parseFloat(obj.total).toFixed(2);
      if (obj.totalVentas) obj.totalVentas = parseFloat(obj.totalVentas).toFixed(2);
      if (obj.totalGastado) obj.totalGastado = parseFloat(obj.totalGastado).toFixed(2);
      if (obj.promedio) obj.promedio = parseFloat(obj.promedio).toFixed(2);
      if (obj.promedioCompra) obj.promedioCompra = parseFloat(obj.promedioCompra).toFixed(2);

      return obj;
    });

    res.status(200).json({
      groupBy,
      results: formattedResults
    });

  } catch (error) {
    console.error('Error en getSalesReport:', error);
    res.status(500).json({
      message: 'Error al obtener reporte de ventas',
      error: error.message
    });
  }
};

/**
 * Top productos más vendidos
 * GET /api/reports/top-products
 */
exports.getTopProducts = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      limit = 10,
      sortBy = 'revenue' // revenue, quantity
    } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const orderField = sortBy === 'quantity'
      ? [Sequelize.fn('SUM', Sequelize.col('InvoiceItem.quantity')), 'DESC']
      : [Sequelize.fn('SUM', Sequelize.col('InvoiceItem.subtotal')), 'DESC'];

    const topProducts = await InvoiceItem.findAll({
      attributes: [
        'productId',
        [Sequelize.fn('SUM', Sequelize.col('InvoiceItem.quantity')), 'cantidadVendida'],
        [Sequelize.fn('SUM', Sequelize.col('InvoiceItem.subtotal')), 'totalIngresos'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('invoice.id'))), 'numeroTransacciones']
      ],
      include: [
        {
          model: Invoice,
          as: 'invoice',
          where,
          attributes: []
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'category', 'price', 'imageUrl', 'stock']
        }
      ],
      group: ['productId', 'product.id'],
      order: [orderField],
      limit: parseInt(limit)
    });

    res.status(200).json({
      topProducts: topProducts.map(item => ({
        product: item.product,
        cantidadVendida: parseInt(item.get('cantidadVendida')),
        totalIngresos: parseFloat(item.get('totalIngresos')).toFixed(2),
        numeroTransacciones: parseInt(item.get('numeroTransacciones'))
      }))
    });

  } catch (error) {
    console.error('Error en getTopProducts:', error);
    res.status(500).json({
      message: 'Error al obtener productos más vendidos',
      error: error.message
    });
  }
};

// ==================== REPORTES DE INVENTARIO ====================

/**
 * Reporte de inventario actual
 * GET /api/reports/inventory
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const {
      category,
      stockStatus, // low, normal, high, out
      includeInactive = false
    } = req.query;

    const where = {};

    if (category) {
      where.category = category;
    }

    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const products = await Product.findAll({
      where,
      include: [
        {
          model: Batch,
          as: 'batches',
          where: { currentQuantity: { [Op.gt]: 0 } },
          required: false,
          attributes: ['id', 'batchNumber', 'currentQuantity', 'expirationDate']
        }
      ],
      order: [['name', 'ASC']]
    });

    // Filtrar por estado de stock
    let filteredProducts = products;
    if (stockStatus) {
      filteredProducts = products.filter(p => {
        if (stockStatus === 'out') return p.stock === 0;
        if (stockStatus === 'low') return p.stock > 0 && p.stock <= p.minStock;
        if (stockStatus === 'normal') return p.stock > p.minStock && p.stock < p.stock * 1.5;
        if (stockStatus === 'high') return p.stock >= p.stock * 1.5;
        return true;
      });
    }

    // Calcular métricas
    const totalProductos = filteredProducts.length;
    const valorInventario = filteredProducts.reduce((sum, p) =>
      sum + (parseFloat(p.price) * parseInt(p.stock)), 0
    );

    const productosStockBajo = filteredProducts.filter(p =>
      p.stock > 0 && p.stock <= p.minStock
    ).length;

    const productosAgotados = filteredProducts.filter(p => p.stock === 0).length;

    const productosConLotes = filteredProducts.filter(p =>
      p.batches && p.batches.length > 0
    ).length;

    res.status(200).json({
      metrics: {
        totalProductos,
        valorInventario: valorInventario.toFixed(2),
        productosStockBajo,
        productosAgotados,
        productosConLotes
      },
      products: filteredProducts.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: parseFloat(p.price).toFixed(2),
        stock: p.stock,
        minStock: p.minStock,
        stockStatus: getStockStatus(p.stock, p.minStock),
        valorStock: (parseFloat(p.price) * parseInt(p.stock)).toFixed(2),
        batches: p.batches,
        imageUrl: p.imageUrl,
        isActive: p.isActive
      }))
    });

  } catch (error) {
    console.error('Error en getInventoryReport:', error);
    res.status(500).json({
      message: 'Error al obtener reporte de inventario',
      error: error.message
    });
  }
};

/**
 * Movimientos de inventario
 * GET /api/reports/inventory/movements
 */
exports.getInventoryMovements = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      productId,
      type, // sale, adjustment, expiry, return
      limit = 50,
      offset = 0
    } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (productId) {
      where.productId = productId;
    }

    // Obtener movimientos de ventas
    const salesMovements = await InvoiceItem.findAll({
      where: {
        ...(productId && { productId }),
        ...(startDate && endDate && {
          createdAt: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        })
      },
      include: [
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'createdAt']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const movements = salesMovements.map(item => ({
      id: item.id,
      type: 'sale',
      typeLabel: 'Venta',
      product: item.product,
      quantity: parseInt(item.quantity),
      reference: item.invoice.invoiceNumber,
      date: item.invoice.createdAt,
      value: parseFloat(item.subtotal || item.total || 0).toFixed(2)
    }));

    res.status(200).json({
      total: movements.length,
      movements
    });

  } catch (error) {
    console.error('Error en getInventoryMovements:', error);
    res.status(500).json({
      message: 'Error al obtener movimientos de inventario',
      error: error.message
    });
  }
};

/**
 * Productos próximos a vencer
 * GET /api/reports/inventory/expiring
 */
exports.getExpiringProducts = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const expiringBatches = await Batch.findAll({
      where: {
        expirationDate: {
          [Op.between]: [new Date(), endDate]
        },
        currentQuantity: { [Op.gt]: 0 }
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'price', 'category', 'imageUrl']
        }
      ],
      order: [['expirationDate', 'ASC']]
    });

    const valorEnRiesgo = expiringBatches.reduce((sum, batch) => {
      return sum + (parseFloat(batch.product.price) * parseInt(batch.currentQuantity));
    }, 0);

    res.status(200).json({
      days: parseInt(days),
      totalLotes: expiringBatches.length,
      valorEnRiesgo: valorEnRiesgo.toFixed(2),
      batches: expiringBatches.map(batch => ({
        id: batch.id,
        batchNumber: batch.batchNumber,
        product: batch.product,
        currentStock: batch.currentQuantity,
        expiryDate: batch.expirationDate,
        daysUntilExpiry: Math.ceil((new Date(batch.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)),
        estimatedLoss: (parseFloat(batch.product.price) * parseInt(batch.currentQuantity)).toFixed(2)
      }))
    });

  } catch (error) {
    console.error('Error en getExpiringProducts:', error);
    res.status(500).json({
      message: 'Error al obtener productos próximos a vencer',
      error: error.message
    });
  }
};

// ==================== REPORTES DE CLIENTES ====================

/**
 * Análisis de clientes
 * GET /api/reports/clients
 */
exports.getClientsReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      sortBy = 'revenue', // revenue, purchases, recent
      limit = 50
    } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const orderField = sortBy === 'purchases'
      ? [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'DESC']
      : sortBy === 'recent'
      ? [Sequelize.fn('MAX', Sequelize.col('Invoice.createdAt')), 'DESC']
      : [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'DESC'];

    const clients = await Invoice.findAll({
      attributes: [
        'clientId',
        [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'numeroCompras'],
        [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'totalGastado'],
        [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedioCompra'],
        [Sequelize.fn('MAX', Sequelize.col('Invoice.createdAt')), 'ultimaCompra']
      ],
      where: {
        ...where,
        clientId: { [Op.not]: null }
      },
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'nit', 'createdAt']
        }
      ],
      group: ['clientId', 'client.id'],
      order: [orderField],
      limit: parseInt(limit),
      raw: false,
      nest: true
    });

    // Calcular métricas generales
    const totalClientes = await User.count({ where: { role: 'cliente' } });

    const clientesActivos = await Invoice.count({
      distinct: true,
      col: 'clientId',
      where: {
        clientId: { [Op.not]: null },
        createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });

    const totalIngresos = clients.reduce((sum, c) =>
      sum + parseFloat(c.get('totalGastado')), 0
    );

    res.status(200).json({
      metrics: {
        totalClientes,
        clientesActivos,
        clientesConCompras: clients.length,
        ingresosTotales: totalIngresos.toFixed(2)
      },
      clients: clients.map(c => {
        const json = c.toJSON();
        return {
          client: json.client ? {
            id: json.client.id,
            firstName: json.client.firstName,
            lastName: json.client.lastName,
            email: json.client.email,
            phone: json.client.phone,
            nit: json.client.nit,
            createdAt: json.client.createdAt
          } : null,
          numeroCompras: parseInt(json.numeroCompras),
          totalGastado: parseFloat(json.totalGastado).toFixed(2),
          promedioCompra: parseFloat(json.promedioCompra).toFixed(2),
          ultimaCompra: json.ultimaCompra
        };
      })
    });

  } catch (error) {
    console.error('Error en getClientsReport:', error);
    res.status(500).json({
      message: 'Error al obtener reporte de clientes',
      error: error.message
    });
  }
};

// ==================== REPORTES DE PEDIDOS DELIVERY ====================

/**
 * Reporte de rendimiento de repartidores
 * GET /api/reports/delivery-performance
 */
exports.getDeliveryPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      deliveryType: 'delivery',
      status: { [Op.in]: ['entregado', 'completado'] }
    };

    if (startDate && endDate) {
      where.deliveredAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const deliveryStats = await Order.findAll({
      attributes: [
        'deliveryPersonId',
        [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'totalEntregas'],
        [Sequelize.fn('SUM', Sequelize.col('Order.total')), 'totalRecaudado'],
        [Sequelize.fn('AVG',
          Sequelize.literal(
            "EXTRACT(EPOCH FROM (\"deliveredAt\" - \"shippedAt\")) / 60"
          )
        ), 'tiempoPromedioMinutos']
      ],
      where,
      include: [
        {
          model: User,
          as: 'deliveryPerson',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ],
      group: ['deliveryPersonId', 'deliveryPerson.id'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'DESC']],
      raw: false,
      nest: true
    });

    res.status(200).json({
      deliveryPersons: deliveryStats.map(stat => {
        const json = stat.toJSON();
        return {
          deliveryPerson: json.deliveryPerson ? {
            id: json.deliveryPerson.id,
            firstName: json.deliveryPerson.firstName,
            lastName: json.deliveryPerson.lastName,
            email: json.deliveryPerson.email,
            phone: json.deliveryPerson.phone
          } : null,
          totalEntregas: parseInt(json.totalEntregas),
          totalRecaudado: parseFloat(json.totalRecaudado).toFixed(2),
          tiempoPromedioMinutos: Math.round(parseFloat(json.tiempoPromedioMinutos) || 0)
        };
      })
    });

  } catch (error) {
    console.error('Error en getDeliveryPerformance:', error);
    res.status(500).json({
      message: 'Error al obtener reporte de repartidores',
      error: error.message
    });
  }
};

// ==================== REPORTES FINANCIEROS ====================

/**
 * Reporte financiero general
 * GET /api/reports/financial
 */
exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Ingresos totales
    const ingresosTotales = await Invoice.sum('total', { where }) || 0;

    // Ingresos por método de pago
    const ingresosPorMetodo = await Invoice.findAll({
      attributes: [
        'paymentMethod',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'total']
      ],
      where,
      group: ['paymentMethod'],
      raw: true
    });

    // Ingresos por tipo de venta (online vs presencial)
    const ventasOnline = await Order.sum('total', {
      where: {
        ...(startDate && endDate && {
          createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        })
      }
    }) || 0;

    // Calcular ventas presenciales con seguridad ante NaN
    const ingresosTotalesNum = parseFloat(ingresosTotales) || 0;
    const ventasOnlineNum = parseFloat(ventasOnline) || 0;
    const ventasPresenciales = Math.max(0, ingresosTotalesNum - ventasOnlineNum);

    // Ticket promedio
    const ticketPromedioResult = await Invoice.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('total')), 'promedio']],
      where,
      raw: true
    });
    const ticketPromedio = ticketPromedioResult?.promedio || 0;

    res.status(200).json({
      ingresosTotales: ingresosTotalesNum.toFixed(2),
      ventasOnline: ventasOnlineNum.toFixed(2),
      ventasPresenciales: ventasPresenciales.toFixed(2),
      ticketPromedio: (parseFloat(ticketPromedio) || 0).toFixed(2),
      ingresosPorMetodo: ingresosPorMetodo.map(m => ({
        metodo: m.paymentMethod || 'No especificado',
        cantidad: parseInt(m.cantidad) || 0,
        total: (parseFloat(m.total) || 0).toFixed(2)
      }))
    });

  } catch (error) {
    console.error('Error en getFinancialReport:', error);
    res.status(500).json({
      message: 'Error al obtener reporte financiero',
      error: error.message
    });
  }
};

/**
 * Análisis económico avanzado con métricas de crecimiento y tendencias
 * GET /api/reports/economic-analysis
 */
exports.getEconomicAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, compareWith } = req.query;

    // Calcular período actual
    const currentPeriod = {};
    if (startDate && endDate) {
      currentPeriod.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // Por defecto, último mes
      const endDateDefault = new Date();
      const startDateDefault = new Date();
      startDateDefault.setMonth(startDateDefault.getMonth() - 1);
      currentPeriod.createdAt = {
        [Op.between]: [startDateDefault, endDateDefault]
      };
    }

    // Calcular período anterior para comparación
    const previousPeriod = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - diffDays);

      previousPeriod.createdAt = {
        [Op.between]: [prevStart, prevEnd]
      };
    }

    // === VENTAS ACTUALES Y ANTERIORES ===
    const currentSales = await Invoice.sum('total', { where: currentPeriod }) || 0;
    const previousSales = await Invoice.sum('total', { where: previousPeriod }) || 0;
    const growthPercentage = previousSales > 0
      ? (((currentSales - previousSales) / previousSales) * 100).toFixed(2)
      : 0;

    // === TRANSACCIONES ===
    const currentTransactions = await Invoice.count({ where: currentPeriod });
    const previousTransactions = await Invoice.count({ where: previousPeriod });
    const transactionGrowth = previousTransactions > 0
      ? (((currentTransactions - previousTransactions) / previousTransactions) * 100).toFixed(2)
      : 0;

    // === TICKET PROMEDIO ===
    const currentAvgTicketResult = await Invoice.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('total')), 'promedio']],
      where: currentPeriod,
      raw: true
    });
    const currentAvgTicket = parseFloat(currentAvgTicketResult?.promedio) || 0;

    const previousAvgTicketResult = await Invoice.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('total')), 'promedio']],
      where: previousPeriod,
      raw: true
    });
    const previousAvgTicket = parseFloat(previousAvgTicketResult?.promedio) || 0;

    // === VENTAS POR DÍA DE LA SEMANA ===
    const salesByDayOfWeek = await db.sequelize.query(`
      SELECT
        EXTRACT(DOW FROM "createdAt") as dia_semana,
        CASE EXTRACT(DOW FROM "createdAt")
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as dia_nombre,
        COUNT(id) as cantidad,
        SUM(total) as total,
        AVG(total) as promedio
      FROM invoices
      ${Object.keys(currentPeriod).length > 0 ? 'WHERE "createdAt" BETWEEN :startDate AND :endDate' : ''}
      GROUP BY dia_semana, dia_nombre
      ORDER BY dia_semana
    `, {
      replacements: {
        startDate: currentPeriod.createdAt?.[Op.between]?.[0] || new Date(0),
        endDate: currentPeriod.createdAt?.[Op.between]?.[1] || new Date()
      },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // === HORAS DE MAYOR VENTA ===
    const salesByHour = await db.sequelize.query(`
      SELECT
        EXTRACT(HOUR FROM "createdAt") as hora,
        COUNT(id) as cantidad,
        SUM(total) as total
      FROM invoices
      ${Object.keys(currentPeriod).length > 0 ? 'WHERE "createdAt" BETWEEN :startDate AND :endDate' : ''}
      GROUP BY hora
      ORDER BY total DESC
      LIMIT 5
    `, {
      replacements: {
        startDate: currentPeriod.createdAt?.[Op.between]?.[0] || new Date(0),
        endDate: currentPeriod.createdAt?.[Op.between]?.[1] || new Date()
      },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // === TOP 10 PRODUCTOS MÁS VENDIDOS ===
    const topProducts = await db.sequelize.query(`
      SELECT
        p.id,
        p.name,
        p.category,
        SUM(ii.quantity) as cantidad_vendida,
        SUM(ii.subtotal) as ingresos
      FROM invoice_items ii
      INNER JOIN invoices i ON ii."invoiceId" = i.id
      INNER JOIN products p ON ii."productId" = p.id
      ${Object.keys(currentPeriod).length > 0 ? 'WHERE i."createdAt" BETWEEN :startDate AND :endDate' : ''}
      GROUP BY p.id, p.name, p.category
      ORDER BY ingresos DESC
      LIMIT 10
    `, {
      replacements: {
        startDate: currentPeriod.createdAt?.[Op.between]?.[0] || new Date(0),
        endDate: currentPeriod.createdAt?.[Op.between]?.[1] || new Date()
      },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // === TENDENCIA DIARIA (últimos 30 días o período seleccionado) ===
    const dailyTrend = await db.sequelize.query(`
      SELECT
        DATE("createdAt") as fecha,
        COUNT(id) as transacciones,
        SUM(total) as ventas,
        AVG(total) as ticket_promedio
      FROM invoices
      ${Object.keys(currentPeriod).length > 0 ? 'WHERE "createdAt" BETWEEN :startDate AND :endDate' : ''}
      GROUP BY fecha
      ORDER BY fecha ASC
    `, {
      replacements: {
        startDate: currentPeriod.createdAt?.[Op.between]?.[0] || new Date(0),
        endDate: currentPeriod.createdAt?.[Op.between]?.[1] || new Date()
      },
      type: db.Sequelize.QueryTypes.SELECT
    });

    res.status(200).json({
      periodo: {
        inicio: currentPeriod.createdAt?.[Op.between]?.[0],
        fin: currentPeriod.createdAt?.[Op.between]?.[1]
      },
      resumen: {
        ventasActuales: parseFloat(currentSales).toFixed(2),
        ventasAnteriores: parseFloat(previousSales).toFixed(2),
        crecimientoVentas: growthPercentage,
        transaccionesActuales: currentTransactions,
        transaccionesAnteriores: previousTransactions,
        crecimientoTransacciones: transactionGrowth,
        ticketPromedioActual: currentAvgTicket.toFixed(2),
        ticketPromedioAnterior: previousAvgTicket.toFixed(2)
      },
      ventasPorDiaSemana: salesByDayOfWeek.map(d => ({
        dia: d.dia_nombre,
        cantidad: parseInt(d.cantidad),
        total: parseFloat(d.total).toFixed(2),
        promedio: parseFloat(d.promedio).toFixed(2)
      })),
      horasPico: salesByHour.map(h => ({
        hora: `${h.hora}:00`,
        cantidad: parseInt(h.cantidad),
        total: parseFloat(h.total).toFixed(2)
      })),
      topProductos: topProducts.map(p => ({
        id: p.id,
        nombre: p.name,
        categoria: p.category,
        cantidadVendida: parseInt(p.cantidad_vendida),
        ingresos: parseFloat(p.ingresos).toFixed(2)
      })),
      tendenciaDiaria: dailyTrend.map(d => ({
        fecha: d.fecha,
        transacciones: parseInt(d.transacciones),
        ventas: parseFloat(d.ventas).toFixed(2),
        ticketPromedio: parseFloat(d.ticket_promedio).toFixed(2)
      }))
    });

  } catch (error) {
    console.error('Error en getEconomicAnalysis:', error);
    res.status(500).json({
      message: 'Error al obtener análisis económico',
      error: error.message
    });
  }
};

/**
 * Análisis de mejores días de venta (día del mes y día de la semana)
 * GET /api/reports/best-sales-days
 */
exports.getBestSalesDays = async (req, res) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

    // Calcular período a analizar
    let where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // Por defecto, últimos 3 meses para mejor análisis
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      where.createdAt = {
        [Op.between]: [start, end]
      };
    }

    // === MEJOR DÍA DE LA SEMANA ===
    const bestDayOfWeek = await db.sequelize.query(`
      SELECT
        EXTRACT(DOW FROM "createdAt") as dia_numero,
        CASE EXTRACT(DOW FROM "createdAt")
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as dia_nombre,
        COUNT(id) as total_transacciones,
        SUM(total) as total_ventas,
        AVG(total) as promedio_ticket,
        COUNT(DISTINCT DATE("createdAt")) as dias_contados
      FROM invoices
      ${Object.keys(where).length > 0 ? 'WHERE "createdAt" BETWEEN :startDate AND :endDate' : ''}
      GROUP BY dia_numero, dia_nombre
      ORDER BY total_ventas DESC
    `, {
      replacements: {
        startDate: where.createdAt?.[Op.between]?.[0] || new Date(0),
        endDate: where.createdAt?.[Op.between]?.[1] || new Date()
      },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // === MEJOR DÍA DEL MES (1-31) ===
    const bestDayOfMonth = await db.sequelize.query(`
      SELECT
        EXTRACT(DAY FROM "createdAt") as dia_mes,
        COUNT(id) as total_transacciones,
        SUM(total) as total_ventas,
        AVG(total) as promedio_ticket,
        COUNT(DISTINCT DATE_TRUNC('month', "createdAt")) as meses_contados
      FROM invoices
      ${Object.keys(where).length > 0 ? 'WHERE "createdAt" BETWEEN :startDate AND :endDate' : ''}
      GROUP BY dia_mes
      ORDER BY total_ventas DESC
      LIMIT 10
    `, {
      replacements: {
        startDate: where.createdAt?.[Op.between]?.[0] || new Date(0),
        endDate: where.createdAt?.[Op.between]?.[1] || new Date()
      },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // === MEJOR HORA DEL DÍA ===
    const bestHourOfDay = await db.sequelize.query(`
      SELECT
        EXTRACT(HOUR FROM "createdAt") as hora,
        COUNT(id) as total_transacciones,
        SUM(total) as total_ventas,
        AVG(total) as promedio_ticket
      FROM invoices
      ${Object.keys(where).length > 0 ? 'WHERE "createdAt" BETWEEN :startDate AND :endDate' : ''}
      GROUP BY hora
      ORDER BY total_ventas DESC
    `, {
      replacements: {
        startDate: where.createdAt?.[Op.between]?.[0] || new Date(0),
        endDate: where.createdAt?.[Op.between]?.[1] || new Date()
      },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // === ANÁLISIS POR SEMANA DEL MES ===
    const bestWeekOfMonth = await db.sequelize.query(`
      SELECT
        CEIL(EXTRACT(DAY FROM "createdAt") / 7.0) as semana_numero,
        CASE
          WHEN EXTRACT(DAY FROM "createdAt") <= 7 THEN 'Primera semana'
          WHEN EXTRACT(DAY FROM "createdAt") <= 14 THEN 'Segunda semana'
          WHEN EXTRACT(DAY FROM "createdAt") <= 21 THEN 'Tercera semana'
          ELSE 'Última semana'
        END as semana,
        COUNT(id) as total_transacciones,
        SUM(total) as total_ventas,
        AVG(total) as promedio_ticket
      FROM invoices
      ${Object.keys(where).length > 0 ? 'WHERE "createdAt" BETWEEN :startDate AND :endDate' : ''}
      GROUP BY semana_numero, semana
      ORDER BY total_ventas DESC
    `, {
      replacements: {
        startDate: where.createdAt?.[Op.between]?.[0] || new Date(0),
        endDate: where.createdAt?.[Op.between]?.[1] || new Date()
      },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // === PEOR DÍA DE LA SEMANA (para comparación) ===
    const worstDayOfWeek = bestDayOfWeek[bestDayOfWeek.length - 1];

    // Calcular diferencia entre mejor y peor día
    const bestDay = bestDayOfWeek[0];
    const diferenciaPorcentaje = worstDayOfWeek && bestDay
      ? (((parseFloat(bestDay.total_ventas) - parseFloat(worstDayOfWeek.total_ventas)) / parseFloat(worstDayOfWeek.total_ventas)) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      periodo: {
        inicio: where.createdAt?.[Op.between]?.[0],
        fin: where.createdAt?.[Op.between]?.[1]
      },
      mejorDiaSemana: {
        dia: bestDay.dia_nombre,
        totalVentas: parseFloat(bestDay.total_ventas).toFixed(2),
        totalTransacciones: parseInt(bestDay.total_transacciones),
        promedioTicket: parseFloat(bestDay.promedio_ticket).toFixed(2),
        diasContados: parseInt(bestDay.dias_contados),
        promedioVentasPorDia: (parseFloat(bestDay.total_ventas) / parseInt(bestDay.dias_contados)).toFixed(2)
      },
      peorDiaSemana: worstDayOfWeek ? {
        dia: worstDayOfWeek.dia_nombre,
        totalVentas: parseFloat(worstDayOfWeek.total_ventas).toFixed(2),
        totalTransacciones: parseInt(worstDayOfWeek.total_transacciones),
        promedioTicket: parseFloat(worstDayOfWeek.promedio_ticket).toFixed(2)
      } : null,
      diferenciaEntreExtremos: diferenciaPorcentaje + '%',
      rankingDiasSemana: bestDayOfWeek.map(d => ({
        dia: d.dia_nombre,
        totalVentas: parseFloat(d.total_ventas).toFixed(2),
        totalTransacciones: parseInt(d.total_transacciones),
        promedioTicket: parseFloat(d.promedio_ticket).toFixed(2),
        diasContados: parseInt(d.dias_contados),
        promedioVentasPorDia: (parseFloat(d.total_ventas) / parseInt(d.dias_contados)).toFixed(2)
      })),
      mejoresDiasMes: bestDayOfMonth.map(d => ({
        dia: parseInt(d.dia_mes),
        totalVentas: parseFloat(d.total_ventas).toFixed(2),
        totalTransacciones: parseInt(d.total_transacciones),
        promedioTicket: parseFloat(d.promedio_ticket).toFixed(2),
        mesesContados: parseInt(d.meses_contados)
      })),
      mejoresHorasDia: bestHourOfDay.map(h => ({
        hora: `${parseInt(h.hora)}:00`,
        totalVentas: parseFloat(h.total_ventas).toFixed(2),
        totalTransacciones: parseInt(h.total_transacciones),
        promedioTicket: parseFloat(h.promedio_ticket).toFixed(2)
      })),
      mejorSemanaMes: bestWeekOfMonth.map(s => ({
        semana: s.semana,
        totalVentas: parseFloat(s.total_ventas).toFixed(2),
        totalTransacciones: parseInt(s.total_transacciones),
        promedioTicket: parseFloat(s.promedio_ticket).toFixed(2)
      })),
      recomendaciones: generateRecommendations(bestDayOfWeek, bestDayOfMonth, bestHourOfDay, bestWeekOfMonth)
    });

  } catch (error) {
    console.error('Error en getBestSalesDays:', error);
    res.status(500).json({
      message: 'Error al obtener análisis de mejores días de venta',
      error: error.message
    });
  }
};

// Función auxiliar para generar recomendaciones
function generateRecommendations(daysOfWeek, daysOfMonth, hoursOfDay, weeksOfMonth) {
  const recommendations = [];

  try {
    if (daysOfWeek && daysOfWeek.length > 0) {
      const bestDay = daysOfWeek[0];
      const worstDay = daysOfWeek[daysOfWeek.length - 1];

      if (bestDay && bestDay.dia_nombre && bestDay.total_ventas) {
        recommendations.push({
          tipo: 'Día de la semana',
          mensaje: `${bestDay.dia_nombre} es tu mejor día con Q${parseFloat(bestDay.total_ventas).toFixed(2)} en ventas. Considera aumentar el personal y stock este día.`,
          impacto: 'alto'
        });
      }

      if (worstDay && worstDay.dia_nombre) {
        recommendations.push({
          tipo: 'Día de menor venta',
          mensaje: `${worstDay.dia_nombre} tiene las ventas más bajas. Considera promociones especiales para aumentar el tráfico.`,
          impacto: 'medio'
        });
      }
    }

    if (hoursOfDay && hoursOfDay.length > 0) {
      const bestHour = hoursOfDay[0];
      if (bestHour && bestHour.hora !== undefined) {
        recommendations.push({
          tipo: 'Hora pico',
          mensaje: `Las ${parseInt(bestHour.hora)}:00 es tu hora pico. Asegúrate de tener suficiente personal durante este horario.`,
          impacto: 'alto'
        });
      }
    }

    if (weeksOfMonth && weeksOfMonth.length > 0) {
      const bestWeek = weeksOfMonth[0];
      if (bestWeek && bestWeek.semana) {
        recommendations.push({
          tipo: 'Semana del mes',
          mensaje: `La ${bestWeek.semana.toLowerCase()} del mes es la más fuerte en ventas. Planifica inventario y promociones acorde.`,
          impacto: 'medio'
        });
      }
    }
  } catch (error) {
    console.error('Error generando recomendaciones:', error);
    // Devolver al menos una recomendación genérica
    recommendations.push({
      tipo: 'General',
      mensaje: 'Analiza tus datos de ventas para identificar patrones y optimizar tu negocio.',
      impacto: 'medio'
    });
  }

  return recommendations;
}

// ==================== FUNCIONES AUXILIARES ====================

function calculateDateRange(period) {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

function getStockStatus(stock, minStock) {
  if (stock === 0) return 'out';
  if (stock <= minStock) return 'low';
  if (stock > minStock && stock < minStock * 2) return 'normal';
  return 'high';
}

/**
 * Calcula el rango de fechas según el período solicitado
 */
function calculatePeriodRange(period) {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'this-week':
      const dayOfWeek = startDate.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunes es el primer día
      startDate.setDate(startDate.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'last-week':
      const lastWeekEnd = new Date();
      const lastWeekDayOfWeek = lastWeekEnd.getDay();
      const lastWeekDiff = lastWeekDayOfWeek === 0 ? 6 : lastWeekDayOfWeek - 1;
      lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekDiff - 1);
      lastWeekEnd.setHours(23, 59, 59, 999);
      startDate = new Date(lastWeekEnd);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      return { startDate, endDate: lastWeekEnd };

    case 'this-month':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'last-month':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const lastMonthEnd = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      return { startDate, endDate: lastMonthEnd };

    case 'this-quarter':
      const currentQuarter = Math.floor(endDate.getMonth() / 3);
      startDate = new Date(endDate.getFullYear(), currentQuarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'last-quarter':
      const lastQuarter = Math.floor(endDate.getMonth() / 3) - 1;
      const quarterYear = lastQuarter < 0 ? endDate.getFullYear() - 1 : endDate.getFullYear();
      const quarterMonth = lastQuarter < 0 ? 9 : lastQuarter * 3;
      startDate = new Date(quarterYear, quarterMonth, 1);
      startDate.setHours(0, 0, 0, 0);
      const lastQuarterEnd = new Date(quarterYear, quarterMonth + 3, 0);
      lastQuarterEnd.setHours(23, 59, 59, 999);
      return { startDate, endDate: lastQuarterEnd };

    case 'this-semester':
      const currentSemester = Math.floor(endDate.getMonth() / 6);
      startDate = new Date(endDate.getFullYear(), currentSemester * 6, 1);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'last-semester':
      const lastSemester = Math.floor(endDate.getMonth() / 6) - 1;
      const semesterYear = lastSemester < 0 ? endDate.getFullYear() - 1 : endDate.getFullYear();
      const semesterMonth = lastSemester < 0 ? 6 : lastSemester * 6;
      startDate = new Date(semesterYear, semesterMonth, 1);
      startDate.setHours(0, 0, 0, 0);
      const lastSemesterEnd = new Date(semesterYear, semesterMonth + 6, 0);
      lastSemesterEnd.setHours(23, 59, 59, 999);
      return { startDate, endDate: lastSemesterEnd };

    case 'this-year':
      startDate = new Date(endDate.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'last-year':
      startDate = new Date(endDate.getFullYear() - 1, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      const lastYearEnd = new Date(endDate.getFullYear() - 1, 11, 31);
      lastYearEnd.setHours(23, 59, 59, 999);
      return { startDate, endDate: lastYearEnd };

    case 'last-7-days':
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'last-30-days':
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'last-90-days':
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;

    default:
      // Por defecto, este mes
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

/**
 * Obtiene una etiqueta legible para el período
 */
function getPeriodLabel(period, startDate, endDate) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (!period) {
    return `${startDate.toLocaleDateString('es-GT')} - ${endDate.toLocaleDateString('es-GT')}`;
  }

  const year = endDate.getFullYear();
  const month = months[endDate.getMonth()];

  switch (period) {
    case 'today':
      return `Hoy (${endDate.toLocaleDateString('es-GT')})`;
    case 'yesterday':
      return `Ayer (${startDate.toLocaleDateString('es-GT')})`;
    case 'this-week':
      return `Esta Semana (${startDate.toLocaleDateString('es-GT')} - ${endDate.toLocaleDateString('es-GT')})`;
    case 'last-week':
      return `Semana Pasada (${startDate.toLocaleDateString('es-GT')} - ${endDate.toLocaleDateString('es-GT')})`;
    case 'this-month':
      return `${month} ${year}`;
    case 'last-month':
      return `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
    case 'this-quarter':
      const q = Math.floor(endDate.getMonth() / 3) + 1;
      return `Trimestre ${q} de ${year}`;
    case 'last-quarter':
      const lq = Math.floor(startDate.getMonth() / 3) + 1;
      return `Trimestre ${lq} de ${startDate.getFullYear()}`;
    case 'this-semester':
      const s = Math.floor(endDate.getMonth() / 6) + 1;
      return `Semestre ${s} de ${year}`;
    case 'last-semester':
      const ls = Math.floor(startDate.getMonth() / 6) + 1;
      return `Semestre ${ls} de ${startDate.getFullYear()}`;
    case 'this-year':
      return `Año ${year}`;
    case 'last-year':
      return `Año ${year - 1}`;
    case 'last-7-days':
      return 'Últimos 7 días';
    case 'last-30-days':
      return 'Últimos 30 días';
    case 'last-90-days':
      return 'Últimos 90 días';
    default:
      return `${startDate.toLocaleDateString('es-GT')} - ${endDate.toLocaleDateString('es-GT')}`;
  }
}

// ==================== DESCARGA DE REPORTES ====================

/**
 * Descarga reporte de ventas en Excel o PDF
 * GET /api/reports/download/sales?format=excel|pdf
 */
exports.downloadSalesReport = async (req, res) => {
  try {
    const { format = 'excel', startDate, endDate, groupBy = 'day' } = req.query;

    // Obtener los datos del reporte
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // Por defecto, último mes
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      where.createdAt = {
        [Op.between]: [lastMonth, today]
      };
    }

    // Obtener datos de ventas según groupBy
    let results = [];

    switch (groupBy) {
      case 'hour':
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('Invoice.createdAt')), 'hora'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
        break;

      case 'day':
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt')), 'fecha'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
        break;

      case 'month':
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('Invoice.createdAt')), 'mes'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
        break;

      default:
        results = await Invoice.findAll({
          attributes: [
            [Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt')), 'fecha'],
            [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
            [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
            [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
          ],
          where,
          group: [Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt'))],
          order: [[Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt')), 'DESC']],
          raw: true
        });
    }

    // Calcular resumen
    const totalVentas = results.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    const totalTransacciones = results.reduce((sum, item) => sum + parseInt(item.cantidad || 0), 0);
    const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;

    const reportData = {
      results,
      resumen: {
        ventasActuales: totalVentas.toFixed(2),
        transaccionesActuales: totalTransacciones,
        ticketPromedioActual: ticketPromedio.toFixed(2)
      }
    };

    const period = {
      inicio: startDate || 'Último mes',
      fin: endDate || 'Hoy'
    };

    // Generar archivo según formato
    if (format === 'excel') {
      const workbook = await generateSalesExcel(reportData, period);
      const fileName = `reporte-ventas-${Date.now()}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = generateSalesPDF(reportData, period);
      const fileName = `reporte-ventas-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      doc.pipe(res);
      doc.end();
    } else {
      res.status(400).json({ message: 'Formato no válido. Use excel o pdf' });
    }

  } catch (error) {
    console.error('Error en downloadSalesReport:', error);
    res.status(500).json({
      message: 'Error al generar reporte de ventas',
      error: error.message
    });
  }
};

/**
 * Descarga análisis económico en Excel o PDF
 * GET /api/reports/download/economic-analysis?format=excel|pdf
 */
exports.downloadEconomicAnalysis = async (req, res) => {
  try {
    const { format = 'excel', startDate, endDate } = req.query;

    // Calcular período actual
    let inicio, fin;
    if (startDate && endDate) {
      inicio = new Date(startDate);
      fin = new Date(endDate);
    } else {
      fin = new Date();
      inicio = new Date();
      inicio.setMonth(inicio.getMonth() - 1);
    }

    // Calcular período anterior
    const diff = fin - inicio;
    const inicioAnterior = new Date(inicio - diff);
    const finAnterior = new Date(fin - diff);

    // Obtener ventas período actual
    const ventasActuales = await Invoice.sum('total', {
      where: { createdAt: { [Op.between]: [inicio, fin] } }
    }) || 0;

    const transaccionesActuales = await Invoice.count({
      where: { createdAt: { [Op.between]: [inicio, fin] } }
    });

    // Obtener ventas período anterior
    const ventasAnteriores = await Invoice.sum('total', {
      where: { createdAt: { [Op.between]: [inicioAnterior, finAnterior] } }
    }) || 0;

    const transaccionesAnteriores = await Invoice.count({
      where: { createdAt: { [Op.between]: [inicioAnterior, finAnterior] } }
    });

    // Calcular crecimiento
    const crecimientoVentas = ventasAnteriores > 0
      ? (((ventasActuales - ventasAnteriores) / ventasAnteriores) * 100).toFixed(2)
      : '100.00';

    const crecimientoTransacciones = transaccionesAnteriores > 0
      ? (((transaccionesActuales - transaccionesAnteriores) / transaccionesAnteriores) * 100).toFixed(2)
      : '100.00';

    // Ventas por día de semana
    const ventasPorDiaSemana = await db.sequelize.query(`
      SELECT
        CASE EXTRACT(DOW FROM "createdAt")
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as dia,
        COUNT(id) as cantidad,
        SUM(total) as total
      FROM invoices
      WHERE "createdAt" BETWEEN :startDate AND :endDate
      GROUP BY EXTRACT(DOW FROM "createdAt"), dia
      ORDER BY EXTRACT(DOW FROM "createdAt")
    `, {
      replacements: { startDate: inicio, endDate: fin },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // Horas pico
    const horasPico = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('EXTRACT', Sequelize.literal('HOUR FROM "createdAt"')), 'hora'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'total']
      ],
      where: { createdAt: { [Op.between]: [inicio, fin] } },
      group: [Sequelize.fn('EXTRACT', Sequelize.literal('HOUR FROM "createdAt"'))],
      order: [[Sequelize.fn('SUM', Sequelize.col('total')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Top productos
    const topProductos = await InvoiceItem.findAll({
      attributes: [
        'productId',
        [Sequelize.fn('SUM', Sequelize.col('InvoiceItem.quantity')), 'cantidadVendida'],
        [Sequelize.fn('SUM', Sequelize.literal('"InvoiceItem"."quantity" * "InvoiceItem"."unitPrice"')), 'ingresos']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category']
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: [],
          where: {
            createdAt: { [Op.between]: [inicio, fin] }
          }
        }
      ],
      group: ['InvoiceItem.productId', 'product.id'],
      order: [[Sequelize.fn('SUM', Sequelize.literal('"InvoiceItem"."quantity" * "InvoiceItem"."unitPrice"')), 'DESC']],
      limit: 10,
      raw: true
    });

    const topProductosFormateados = topProductos.map(item => ({
      nombre: item['product.name'] || 'N/A',
      categoria: item['product.category'] || 'N/A',
      cantidadVendida: item.cantidadVendida,
      ingresos: parseFloat(item.ingresos).toFixed(2)
    }));

    const reportData = {
      resumen: {
        ventasActuales: ventasActuales.toFixed(2),
        ventasAnteriores: ventasAnteriores.toFixed(2),
        crecimientoVentas,
        transaccionesActuales,
        transaccionesAnteriores,
        crecimientoTransacciones,
        ticketPromedioActual: (ventasActuales / (transaccionesActuales || 1)).toFixed(2),
        ticketPromedioAnterior: (ventasAnteriores / (transaccionesAnteriores || 1)).toFixed(2)
      },
      ventasPorDiaSemana,
      horasPico: horasPico.map(h => ({
        hora: `${h.hora}:00`,
        cantidad: h.cantidad,
        total: parseFloat(h.total).toFixed(2)
      })),
      topProductos: topProductosFormateados
    };

    const period = {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0]
    };

    // Generar archivo según formato
    if (format === 'excel') {
      const workbook = await generateEconomicAnalysisExcel(reportData, period);
      const fileName = `analisis-economico-${Date.now()}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = generateEconomicAnalysisPDF(reportData, period);
      const fileName = `analisis-economico-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      doc.pipe(res);
      doc.end();
    } else {
      res.status(400).json({ message: 'Formato no válido. Use excel o pdf' });
    }

  } catch (error) {
    console.error('Error en downloadEconomicAnalysis:', error);
    res.status(500).json({
      message: 'Error al generar análisis económico',
      error: error.message
    });
  }
};

/**
 * Descarga ventas completas detalladas con todos los datos
 * GET /api/reports/download/sales-complete?format=excel|pdf&period=today|this-week|this-month|...
 */
exports.downloadSalesComplete = async (req, res) => {
  try {
    const { format = 'excel', period, startDate, endDate } = req.query;

    // Calcular fechas según el período
    let inicio, fin;

    if (period) {
      const dateRange = calculatePeriodRange(period);
      inicio = dateRange.startDate;
      fin = dateRange.endDate;
    } else if (startDate && endDate) {
      inicio = new Date(startDate);
      fin = new Date(endDate);
    } else {
      // Por defecto, este mes
      fin = new Date();
      inicio = new Date(fin.getFullYear(), fin.getMonth(), 1);
    }

    // Obtener todas las ventas detalladas del período
    const ventas = await Invoice.findAll({
      where: {
        createdAt: { [Op.between]: [inicio, fin] }
      },
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'nit']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: InvoiceItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'category']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calcular resumen
    const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalTransacciones = ventas.length;
    const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;
    const totalProductosVendidos = ventas.reduce((sum, v) => {
      return sum + v.items.reduce((itemSum, item) => itemSum + parseInt(item.quantity), 0);
    }, 0);

    // Agrupar ventas por fecha para tendencia diaria
    const ventasPorDia = {};
    ventas.forEach(venta => {
      const fecha = venta.createdAt.toISOString().split('T')[0];
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = {
          fecha,
          cantidad: 0,
          total: 0
        };
      }
      ventasPorDia[fecha].cantidad++;
      ventasPorDia[fecha].total += parseFloat(venta.total);
    });

    const tendenciaDiaria = Object.values(ventasPorDia).sort((a, b) =>
      new Date(a.fecha) - new Date(b.fecha)
    );

    // Top productos vendidos en el período
    const productosVendidos = {};
    ventas.forEach(venta => {
      venta.items.forEach(item => {
        const prodId = item.productId;
        if (!productosVendidos[prodId]) {
          productosVendidos[prodId] = {
            nombre: item.product?.name || 'N/A',
            categoria: item.product?.category || 'N/A',
            cantidad: 0,
            ingresos: 0
          };
        }
        productosVendidos[prodId].cantidad += parseInt(item.quantity);
        productosVendidos[prodId].ingresos += parseFloat(item.subtotal || item.total || 0);
      });
    });

    const topProductos = Object.values(productosVendidos)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 10);

    // Ventas por método de pago
    const ventasPorMetodo = {};
    ventas.forEach(venta => {
      const metodo = venta.paymentMethod || 'No especificado';
      if (!ventasPorMetodo[metodo]) {
        ventasPorMetodo[metodo] = {
          metodo,
          cantidad: 0,
          total: 0
        };
      }
      ventasPorMetodo[metodo].cantidad++;
      ventasPorMetodo[metodo].total += parseFloat(venta.total);
    });

    const reportData = {
      periodo: {
        tipo: period || 'personalizado',
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0]
      },
      resumen: {
        totalVentas: totalVentas.toFixed(2),
        totalTransacciones,
        ticketPromedio: ticketPromedio.toFixed(2),
        totalProductosVendidos
      },
      ventas: ventas.map(v => ({
        id: v.id,
        numero: v.invoiceNumber,
        fecha: v.createdAt,
        cliente: v.client ? {
          nombre: `${v.client.firstName} ${v.client.lastName}`,
          nit: v.client.nit,
          email: v.client.email
        } : { nombre: 'Cliente General', nit: 'CF', email: 'N/A' },
        vendedor: v.seller ? `${v.seller.firstName} ${v.seller.lastName}` : 'N/A',
        metodoPago: v.paymentMethod || 'N/A',
        subtotal: parseFloat(v.subtotal || 0).toFixed(2),
        descuento: parseFloat(v.discount || 0).toFixed(2),
        total: parseFloat(v.total).toFixed(2),
        items: v.items.map(item => ({
          producto: item.product?.name || 'N/A',
          sku: item.product?.sku || 'N/A',
          categoria: item.product?.category || 'N/A',
          cantidad: item.quantity,
          precioUnitario: parseFloat(item.unitPrice).toFixed(2),
          subtotal: parseFloat(item.subtotal || item.total || 0).toFixed(2)
        }))
      })),
      tendenciaDiaria,
      topProductos,
      ventasPorMetodo: Object.values(ventasPorMetodo)
    };

    const periodLabel = getPeriodLabel(period, inicio, fin);

    // Generar archivo según formato
    if (format === 'excel') {
      const { generateSalesCompleteExcel } = require('../utils/reportGenerators');
      const workbook = await generateSalesCompleteExcel(reportData, periodLabel);
      const fileName = `ventas-completas-${period || 'personalizado'}-${Date.now()}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const { generateSalesCompletePDF } = require('../utils/reportGenerators');
      const doc = generateSalesCompletePDF(reportData, periodLabel);
      const fileName = `ventas-completas-${period || 'personalizado'}-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      doc.pipe(res);
      doc.end();
    } else {
      res.status(400).json({ message: 'Formato no válido. Use excel o pdf' });
    }

  } catch (error) {
    console.error('Error en downloadSalesComplete:', error);
    res.status(500).json({
      message: 'Error al generar reporte de ventas completas',
      error: error.message
    });
  }
};

/**
 * Descarga análisis de mejores días en Excel o PDF
 * GET /api/reports/download/best-sales-days?format=excel|pdf
 */
exports.downloadBestSalesDays = async (req, res) => {
  try {
    const { format = 'excel', startDate, endDate } = req.query;

    // Calcular fechas (últimos 3 meses por defecto)
    let inicio, fin;
    if (startDate && endDate) {
      inicio = new Date(startDate);
      fin = new Date(endDate);
    } else {
      fin = new Date();
      inicio = new Date();
      inicio.setMonth(inicio.getMonth() - 3);
    }

    // Mejor día de la semana
    const bestDayOfWeek = await db.sequelize.query(`
      SELECT
        EXTRACT(DOW FROM "createdAt") as dia_numero,
        CASE EXTRACT(DOW FROM "createdAt")
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as dia_nombre,
        COUNT(id) as total_transacciones,
        SUM(total) as total_ventas,
        AVG(total) as promedio_ticket,
        COUNT(DISTINCT DATE("createdAt")) as dias_contados
      FROM invoices
      WHERE "createdAt" BETWEEN :startDate AND :endDate
      GROUP BY dia_numero, dia_nombre
      ORDER BY total_ventas DESC
    `, {
      replacements: { startDate: inicio, endDate: fin },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // Mejores días del mes
    const bestDaysOfMonth = await db.sequelize.query(`
      SELECT
        EXTRACT(DAY FROM "createdAt") as dia,
        COUNT(id) as total_transacciones,
        SUM(total) as total_ventas,
        COUNT(DISTINCT DATE_TRUNC('month', "createdAt")) as meses_contados
      FROM invoices
      WHERE "createdAt" BETWEEN :startDate AND :endDate
      GROUP BY dia
      ORDER BY total_ventas DESC
      LIMIT 10
    `, {
      replacements: { startDate: inicio, endDate: fin },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // Mejores horas
    const bestHours = await db.sequelize.query(`
      SELECT
        EXTRACT(HOUR FROM "createdAt") as hora,
        COUNT(id) as total_transacciones,
        SUM(total) as total_ventas,
        AVG(total) as promedio_ticket
      FROM invoices
      WHERE "createdAt" BETWEEN :startDate AND :endDate
      GROUP BY hora
      ORDER BY total_ventas DESC
    `, {
      replacements: { startDate: inicio, endDate: fin },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // Mejores semanas del mes
    const bestWeeksOfMonth = await db.sequelize.query(`
      SELECT
        CASE
          WHEN EXTRACT(DAY FROM "createdAt") <= 7 THEN 'Primera semana'
          WHEN EXTRACT(DAY FROM "createdAt") <= 14 THEN 'Segunda semana'
          WHEN EXTRACT(DAY FROM "createdAt") <= 21 THEN 'Tercera semana'
          ELSE 'Última semana'
        END as semana,
        COUNT(id) as total_transacciones,
        SUM(total) as total_ventas,
        AVG(total) as promedio_ticket
      FROM invoices
      WHERE "createdAt" BETWEEN :startDate AND :endDate
      GROUP BY semana
      ORDER BY total_ventas DESC
    `, {
      replacements: { startDate: inicio, endDate: fin },
      type: db.Sequelize.QueryTypes.SELECT
    });

    // Validar que haya datos
    if (!bestDayOfWeek || bestDayOfWeek.length === 0) {
      return res.status(404).json({
        message: 'No hay suficientes datos de ventas en el período seleccionado'
      });
    }

    const mejorDia = bestDayOfWeek[0];
    const peorDia = bestDayOfWeek[bestDayOfWeek.length - 1];

    const reportData = {
      mejorDiaSemana: {
        dia: mejorDia.dia_nombre,
        totalVentas: parseFloat(mejorDia.total_ventas).toFixed(2),
        totalTransacciones: parseInt(mejorDia.total_transacciones),
        promedioTicket: parseFloat(mejorDia.promedio_ticket).toFixed(2),
        diasContados: parseInt(mejorDia.dias_contados),
        promedioVentasPorDia: (parseFloat(mejorDia.total_ventas) / parseInt(mejorDia.dias_contados)).toFixed(2)
      },
      peorDiaSemana: peorDia ? {
        dia: peorDia.dia_nombre,
        totalVentas: parseFloat(peorDia.total_ventas).toFixed(2),
        totalTransacciones: parseInt(peorDia.total_transacciones)
      } : null,
      diferenciaEntreExtremos: peorDia
        ? `${(((parseFloat(mejorDia.total_ventas) - parseFloat(peorDia.total_ventas)) / parseFloat(peorDia.total_ventas)) * 100).toFixed(2)}%`
        : '0%',
      rankingDiasSemana: bestDayOfWeek.map(dia => ({
        dia: dia.dia_nombre,
        totalVentas: parseFloat(dia.total_ventas).toFixed(2),
        totalTransacciones: parseInt(dia.total_transacciones),
        promedioVentasPorDia: (parseFloat(dia.total_ventas) / parseInt(dia.dias_contados)).toFixed(2)
      })),
      mejoresDiasMes: bestDaysOfMonth.map(dia => ({
        dia: parseInt(dia.dia),
        totalVentas: parseFloat(dia.total_ventas).toFixed(2),
        totalTransacciones: parseInt(dia.total_transacciones),
        mesesContados: parseInt(dia.meses_contados)
      })),
      mejoresHorasDia: bestHours.map(hora => ({
        hora: `${parseInt(hora.hora)}:00`,
        totalVentas: parseFloat(hora.total_ventas).toFixed(2),
        totalTransacciones: parseInt(hora.total_transacciones),
        promedioTicket: parseFloat(hora.promedio_ticket).toFixed(2)
      })),
      mejorSemanaMes: bestWeeksOfMonth.map(semana => ({
        semana: semana.semana,
        totalVentas: parseFloat(semana.total_ventas).toFixed(2),
        totalTransacciones: parseInt(semana.total_transacciones),
        promedioTicket: parseFloat(semana.promedio_ticket).toFixed(2)
      })),
      recomendaciones: generateRecommendations(
        bestDayOfWeek,
        bestDaysOfMonth,
        bestHours,
        bestWeeksOfMonth
      )
    };

    const period = {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0]
    };

    // Generar archivo según formato
    if (format === 'excel') {
      const workbook = await generateBestSalesDaysExcel(reportData, period);
      const fileName = `mejores-dias-venta-${Date.now()}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = generateBestSalesDaysPDF(reportData, period);
      const fileName = `mejores-dias-venta-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      doc.pipe(res);
      doc.end();
    } else {
      res.status(400).json({ message: 'Formato no válido. Use excel o pdf' });
    }

  } catch (error) {
    console.error('Error en downloadBestSalesDays:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      message: 'Error al generar análisis de mejores días',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Análisis completo por períodos de tiempo con datos detallados
 * GET /api/reports/time-period-analysis
 * Query params: startDate, endDate (opcional, por defecto últimos 90 días)
 */
exports.getTimePeriodAnalysis = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Calcular fechas - por defecto últimos 90 días
    let inicio, fin;
    if (startDate && endDate) {
      inicio = new Date(startDate);
      fin = new Date(endDate);
    } else {
      fin = new Date();
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 90);
    }

    // Función auxiliar para formatear y obtener top 5 resultados de un período
    const getTopResults = (data, limit = 5) => {
      return data
        .sort((a, b) => parseFloat(b.total || b.totalVentas || 0) - parseFloat(a.total || a.totalVentas || 0))
        .slice(0, limit);
    };

    // Función auxiliar para calcular estadísticas resumidas
    const calculateSummary = (data) => {
      if (!data || data.length === 0) {
        return {
          totalVentas: 0,
          totalTransacciones: 0,
          ticketPromedio: 0,
          registros: 0
        };
      }

      const totalVentas = data.reduce((sum, item) =>
        sum + parseFloat(item.total || item.totalVentas || 0), 0
      );
      const totalTransacciones = data.reduce((sum, item) =>
        sum + parseInt(item.cantidad || item.cantidadVendida || item.numeroCompras || 0), 0
      );

      return {
        totalVentas: totalVentas.toFixed(2),
        totalTransacciones,
        ticketPromedio: totalTransacciones > 0 ? (totalVentas / totalTransacciones).toFixed(2) : '0.00',
        registros: data.length
      };
    };

    // Objeto donde guardaremos todos los análisis
    const analysis = {};

    // 1. ANÁLISIS POR HORA
    const ventasPorHora = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('Invoice.createdAt')), 'hora'],
        [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
        [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
      ],
      where: {
        createdAt: { [Op.between]: [inicio, fin] }
      },
      group: [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('Invoice.createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('Invoice.createdAt')), 'DESC']],
      raw: true
    });

    analysis.hour = {
      summary: calculateSummary(ventasPorHora),
      topPeriods: getTopResults(ventasPorHora).map(h => ({
        periodo: new Date(h.hora).toLocaleString('es-GT', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          hour12: true
        }),
        transacciones: parseInt(h.cantidad),
        total: parseFloat(h.total).toFixed(2),
        ticketPromedio: parseFloat(h.promedio).toFixed(2)
      }))
    };

    // 2. ANÁLISIS POR DÍA
    const ventasPorDia = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt')), 'fecha'],
        [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
        [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
      ],
      where: {
        createdAt: { [Op.between]: [inicio, fin] }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('Invoice.createdAt')), 'DESC']],
      raw: true
    });

    analysis.day = {
      summary: calculateSummary(ventasPorDia),
      topPeriods: getTopResults(ventasPorDia).map(d => ({
        periodo: new Date(d.fecha).toLocaleDateString('es-GT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        transacciones: parseInt(d.cantidad),
        total: parseFloat(d.total).toFixed(2),
        ticketPromedio: parseFloat(d.promedio).toFixed(2)
      }))
    };

    // 3. ANÁLISIS POR SEMANA
    const ventasPorSemana = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Invoice.createdAt')), 'semana'],
        [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
        [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
      ],
      where: {
        createdAt: { [Op.between]: [inicio, fin] }
      },
      group: [Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Invoice.createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Invoice.createdAt')), 'DESC']],
      raw: true
    });

    analysis.week = {
      summary: calculateSummary(ventasPorSemana),
      topPeriods: getTopResults(ventasPorSemana).map(w => ({
        periodo: `Semana del ${new Date(w.semana).toLocaleDateString('es-GT')}`,
        transacciones: parseInt(w.cantidad),
        total: parseFloat(w.total).toFixed(2),
        ticketPromedio: parseFloat(w.promedio).toFixed(2)
      }))
    };

    // 4. ANÁLISIS POR MES
    const ventasPorMes = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('Invoice.createdAt')), 'mes'],
        [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
        [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
      ],
      where: {
        createdAt: { [Op.between]: [inicio, fin] }
      },
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('Invoice.createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('Invoice.createdAt')), 'DESC']],
      raw: true
    });

    analysis.month = {
      summary: calculateSummary(ventasPorMes),
      topPeriods: getTopResults(ventasPorMes).map(m => ({
        periodo: new Date(m.mes).toLocaleDateString('es-GT', {
          year: 'numeric',
          month: 'long'
        }),
        transacciones: parseInt(m.cantidad),
        total: parseFloat(m.total).toFixed(2),
        ticketPromedio: parseFloat(m.promedio).toFixed(2)
      }))
    };

    // 5. ANÁLISIS POR TRIMESTRE
    const ventasPorTrimestre = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'quarter', Sequelize.col('Invoice.createdAt')), 'trimestre'],
        [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
        [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
      ],
      where: {
        createdAt: { [Op.between]: [inicio, fin] }
      },
      group: [Sequelize.fn('DATE_TRUNC', 'quarter', Sequelize.col('Invoice.createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'quarter', Sequelize.col('Invoice.createdAt')), 'DESC']],
      raw: true
    });

    analysis.quarter = {
      summary: calculateSummary(ventasPorTrimestre),
      topPeriods: getTopResults(ventasPorTrimestre).map(q => {
        const fecha = new Date(q.trimestre);
        const trimestre = Math.floor(fecha.getMonth() / 3) + 1;
        return {
          periodo: `Q${trimestre} ${fecha.getFullYear()}`,
          transacciones: parseInt(q.cantidad),
          total: parseFloat(q.total).toFixed(2),
          ticketPromedio: parseFloat(q.promedio).toFixed(2)
        };
      })
    };

    // 6. ANÁLISIS POR SEMESTRE
    const ventasPorSemestre = await db.sequelize.query(`
      SELECT
        DATE_TRUNC('year', "createdAt") +
          INTERVAL '6 months' * FLOOR(EXTRACT(MONTH FROM "createdAt") / 6) as semestre,
        COUNT(id) as cantidad,
        SUM(total) as total,
        AVG(total) as promedio
      FROM invoices
      WHERE "createdAt" BETWEEN :startDate AND :endDate
      GROUP BY semestre
      ORDER BY semestre DESC
    `, {
      replacements: {
        startDate: inicio,
        endDate: fin
      },
      type: db.Sequelize.QueryTypes.SELECT
    });

    analysis.semester = {
      summary: calculateSummary(ventasPorSemestre),
      topPeriods: getTopResults(ventasPorSemestre).map(s => {
        const fecha = new Date(s.semestre);
        const semestre = Math.floor(fecha.getMonth() / 6) + 1;
        return {
          periodo: `S${semestre} ${fecha.getFullYear()}`,
          transacciones: parseInt(s.cantidad),
          total: parseFloat(s.total).toFixed(2),
          ticketPromedio: parseFloat(s.promedio).toFixed(2)
        };
      })
    };

    // 7. ANÁLISIS POR AÑO
    const ventasPorAño = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'year', Sequelize.col('Invoice.createdAt')), 'año'],
        [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
        [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
      ],
      where: {
        createdAt: { [Op.between]: [inicio, fin] }
      },
      group: [Sequelize.fn('DATE_TRUNC', 'year', Sequelize.col('Invoice.createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'year', Sequelize.col('Invoice.createdAt')), 'DESC']],
      raw: true
    });

    analysis.year = {
      summary: calculateSummary(ventasPorAño),
      topPeriods: getTopResults(ventasPorAño).map(y => ({
        periodo: new Date(y.año).getFullYear().toString(),
        transacciones: parseInt(y.cantidad),
        total: parseFloat(y.total).toFixed(2),
        ticketPromedio: parseFloat(y.promedio).toFixed(2)
      }))
    };

    // Calcular totales generales del período analizado
    const totalesGenerales = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'cantidad'],
        [Sequelize.fn('SUM', Sequelize.col('Invoice.total')), 'total'],
        [Sequelize.fn('AVG', Sequelize.col('Invoice.total')), 'promedio']
      ],
      where: {
        createdAt: { [Op.between]: [inicio, fin] }
      },
      raw: true
    });

    const totales = totalesGenerales[0] || { cantidad: 0, total: 0, promedio: 0 };

    res.status(200).json({
      periodo: {
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0],
        dias: Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))
      },
      resumenGeneral: {
        totalVentas: parseFloat(totales.total || 0).toFixed(2),
        totalTransacciones: parseInt(totales.cantidad || 0),
        ticketPromedio: parseFloat(totales.promedio || 0).toFixed(2)
      },
      analisisPorPeriodo: analysis,
      generadoEn: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en getTimePeriodAnalysis:', error);
    res.status(500).json({
      message: 'Error al obtener análisis por períodos de tiempo',
      error: error.message
    });
  }
};
