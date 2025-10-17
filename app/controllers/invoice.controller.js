/**
 * @author Alexander Echeverria
 * @file app/controllers/invoice.controller.js
 * @description Controlador de Ventas (Recibos de Venta) con FIFO y trazabilidad
 * @location app/controllers/invoice.controller.js
 * 
 * Funcionalidades:
 * - Crear venta con asignación automática de lotes (FIFO)
 * - Actualización automática de stock
 * - Generación de movimientos de inventario
 * - Cálculo de ganancia por item
 * - Ventas con y sin cliente registrado
 * - Generación automática de comprobantes de pago
 * - Reportes y estadísticas
 * - SIN IVA por defecto (solo recibos simples, no facturas fiscales)
 */

const db = require('../config/db.config');
const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const Product = db.Product;
const Batch = db.Batch;
const User = db.User;
const Receipt = db.Receipt;
const InventoryMovement = db.InventoryMovement;
const { Op } = db.Sequelize;

// ========== CREAR VENTA (RECIBO) ==========

exports.createInvoice = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const {
            clientId, // Opcional: ID del usuario con role: 'cliente'
            clientName, // Para ventas sin cliente registrado
            clientDPI,
            clientNit,
            sellerId, // ID del vendedor (usuario autenticado)
            items, // Array de { productId, quantity, unitPrice, discount? }
            paymentMethod,
            discount = 0,
            tax = 0, // Por defecto 0 - solo si es factura fiscal
            notes
        } = req.body;

        // Validaciones básicas
        if (!items || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: "La venta debe tener al menos un producto"
            });
        }

        if (!sellerId) {
            await transaction.rollback();
            return res.status(400).json({
                message: "Se requiere el ID del vendedor"
            });
        }

        // Validar vendedor existe y tiene rol correcto
        const seller = await User.findByPk(sellerId);
        if (!seller) {
            await transaction.rollback();
            return res.status(404).json({ message: "Vendedor no encontrado" });
        }

        if (!['admin', 'vendedor'].includes(seller.role)) {
            await transaction.rollback();
            return res.status(403).json({
                message: "El usuario no tiene permisos para vender"
            });
        }

        // Si hay clientId, validar que existe y es cliente
        let client = null;
        if (clientId) {
            client = await User.findByPk(clientId);
            if (!client) {
                await transaction.rollback();
                return res.status(404).json({ message: "Cliente no encontrado" });
            }
        }

        // Procesar items y asignar lotes (FIFO)
        const processedItems = [];
        let subtotal = 0;

        for (const item of items) {
            const { productId, quantity, unitPrice, discount: itemDiscount = 0 } = item;

            if (!productId || !quantity || quantity <= 0) {
                await transaction.rollback();
                return res.status(400).json({
                    message: "Cada item debe tener productId y quantity válidos"
                });
            }

            // Obtener producto
            const product = await Product.findByPk(productId, { transaction });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({
                    message: `Producto con ID ${productId} no encontrado`
                });
            }

            if (!product.isActive) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `El producto "${product.name}" está inactivo`
                });
            }

            // Verificar stock disponible
            if (product.stock < quantity) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${quantity}`
                });
            }

            // Obtener lotes disponibles ordenados por FIFO (primero vence, primero sale)
            const availableBatches = await Batch.findAll({
                where: {
                    productId,
                    currentQuantity: { [Op.gt]: 0 },
                    canBeSold: true,
                    status: { [Op.in]: ['active', 'near_expiry'] },
                    expirationDate: { [Op.gte]: new Date() }
                },
                order: [
                    ['expirationDate', 'ASC'],
                    ['receiptDate', 'ASC']
                ],
                transaction
            });

            if (availableBatches.length === 0) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `No hay lotes disponibles para vender "${product.name}"`
                });
            }

            // Asignar cantidad de cada lote (puede usar múltiples lotes)
            let remainingQuantity = quantity;
            const batchAssignments = [];

            for (const batch of availableBatches) {
                if (remainingQuantity <= 0) break;

                const quantityFromThisBatch = Math.min(remainingQuantity, batch.currentQuantity);

                batchAssignments.push({
                    batchId: batch.id,
                    quantity: quantityFromThisBatch,
                    unitCost: parseFloat(batch.purchasePrice),
                    unitPrice: unitPrice || parseFloat(batch.salePrice)
                });

                remainingQuantity -= quantityFromThisBatch;
            }

            if (remainingQuantity > 0) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `No hay suficiente stock en lotes para "${product.name}". Faltante: ${remainingQuantity}`
                });
            }

            // Agregar cada asignación de lote como un item separado
            for (const assignment of batchAssignments) {
                const itemSubtotal = assignment.quantity * assignment.unitPrice;
                const itemTotal = itemSubtotal - itemDiscount;
                
                processedItems.push({
                    productId,
                    batchId: assignment.batchId,
                    quantity: assignment.quantity,
                    unitPrice: assignment.unitPrice,
                    unitCost: assignment.unitCost,
                    discount: itemDiscount,
                    subtotal: itemSubtotal,
                    total: itemTotal
                });

                subtotal += itemSubtotal;
            }
        }

        // Calcular totales del recibo (SIN IVA por defecto)
        const invoiceSubtotal = subtotal;
        const invoiceTotal = invoiceSubtotal - discount + parseFloat(tax || 0);

        // Crear el recibo de venta (el número se genera automáticamente en el hook)
        const invoice = await Invoice.create({
            clientId: clientId || null,
            sellerId,
            clientName: clientName || (client ? `${client.firstName} ${client.lastName}` : 'Consumidor Final'),
            clientDPI,
            clientNit,
            sellerDPI: seller.dpi,
            subtotal: invoiceSubtotal,
            discount,
            tax: parseFloat(tax || 0), // Por defecto 0
            total: invoiceTotal,
            paymentMethod,
            paymentStatus: ['efectivo', 'tarjeta', 'transferencia'].includes(paymentMethod) ? 'pagado' : 'pendiente',
            status: 'completada',
            notes
        }, { transaction });

        // Crear items del recibo
        for (const item of processedItems) {
            await InvoiceItem.create({
                invoiceId: invoice.id,
                ...item
            }, { transaction });

            // Actualizar stock del lote
            const batch = await Batch.findByPk(item.batchId, { transaction });
            await batch.decrement('currentQuantity', { by: item.quantity, transaction });

            // Si el lote queda en 0, marcar como agotado
            if (batch.currentQuantity - item.quantity === 0) {
                await batch.update({ status: 'depleted' }, { transaction });
            }

            // Actualizar stock del producto
            const product = await Product.findByPk(item.productId, { transaction });
            await product.decrement('stock', { by: item.quantity, transaction });

            // Crear movimiento de inventario
            await InventoryMovement.create({
                productId: item.productId,
                batchId: item.batchId,
                movementType: 'venta',
                quantity: -item.quantity, // Negativo porque es salida
                previousStock: product.stock,
                newStock: product.stock - item.quantity,
                unitCost: item.unitCost,
                totalValue: item.unitCost * item.quantity,
                referenceType: 'sale',
                referenceId: invoice.id,
                userId: sellerId,
                notes: `Venta - Recibo ${invoice.invoiceNumber}`
            }, { transaction });
        }

        // Generar comprobante de pago automáticamente
        const receipt = await Receipt.create({
            invoiceId: invoice.id,
            clientId: clientId || null,
            amount: invoiceTotal,
            paymentMethod,
            currency: 'GTQ',
            issuedBy: `${seller.firstName} ${seller.lastName}`,
            notes: `Comprobante de Venta ${invoice.invoiceNumber}`
        }, { transaction });

        await transaction.commit();

        // Recargar recibo con todas las relaciones
        const fullInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                {
                    model: InvoiceItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'sku']
                        },
                        {
                            model: Batch,
                            as: 'batch',
                            attributes: ['id', 'batchNumber', 'expirationDate']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    required: false
                },
                {
                    model: User,
                    as: 'seller',
                    attributes: ['id', 'firstName', 'lastName']
                }
            ]
        });

        res.status(201).json({
            message: "Venta registrada exitosamente",
            invoice: fullInvoice,
            receipt: {
                id: receipt.id,
                receiptNumber: receipt.receiptNumber
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al registrar venta:', error);
        res.status(500).json({
            message: "Error al registrar venta",
            error: error.message
        });
    }
};

// ========== OBTENER VENTAS ==========

// Obtener todas las ventas con filtros
exports.getAllInvoices = async (req, res) => {
    try {
        const {
            clientId,
            sellerId,
            status,
            paymentStatus,
            paymentMethod,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const where = {};

        if (clientId) where.clientId = clientId;
        if (sellerId) where.sellerId = sellerId;
        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;
        if (paymentMethod) where.paymentMethod = paymentMethod;

        if (startDate && endDate) {
            where.invoiceDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const offset = (page - 1) * limit;

        const { count, rows: invoices } = await Invoice.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    required: false
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
                            attributes: ['id', 'name', 'sku']
                        }
                    ]
                }
            ],
            order: [['invoiceDateTime', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            invoices
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener ventas",
            error: error.message
        });
    }
};

// Obtener venta por ID
exports.getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findByPk(id, {
            include: [
                {
                    model: InvoiceItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'sku', 'description']
                        },
                        {
                            model: Batch,
                            as: 'batch',
                            attributes: ['id', 'batchNumber', 'expirationDate', 'manufacturingDate']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address'],
                    required: false
                },
                {
                    model: User,
                    as: 'seller',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: Receipt,
                    as: 'receipts',
                    attributes: ['id', 'receiptNumber', 'amount', 'issueDate']
                }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ message: "Venta no encontrada" });
        }

        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener venta",
            error: error.message
        });
    }
};

// Obtener venta por número
exports.getInvoiceByNumber = async (req, res) => {
    try {
        const { invoiceNumber } = req.params;

        const invoice = await Invoice.findOne({
            where: { invoiceNumber },
            include: [
                {
                    model: InvoiceItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        },
                        {
                            model: Batch,
                            as: 'batch'
                        }
                    ]
                },
                {
                    model: User,
                    as: 'client',
                    required: false
                },
                {
                    model: User,
                    as: 'seller'
                }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ message: "Venta no encontrada" });
        }

        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener venta",
            error: error.message
        });
    }
};

// Obtener próximo número de recibo
exports.getNextInvoiceNumber = async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        const lastInvoice = await Invoice.findOne({
            where: {
                invoiceNumber: {
                    [Op.like]: `REC-${year}${month}-%`
                }
            },
            order: [['id', 'DESC']]
        });

        let nextNumber = 1;
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNumber.split('-');
            nextNumber = parseInt(parts[2]) + 1;
        }

        const nextInvoiceNumber = `REC-${year}${month}-${String(nextNumber).padStart(6, '0')}`;

        res.status(200).json({
            nextInvoiceNumber,
            preview: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener número de recibo",
            error: error.message
        });
    }
};

// ========== ANULAR VENTA ==========

exports.cancelInvoice = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            await transaction.rollback();
            return res.status(400).json({
                message: "Se requiere una razón para anular la venta"
            });
        }

        const invoice = await Invoice.findByPk(id, {
            include: [
                {
                    model: InvoiceItem,
                    as: 'items',
                    include: [{ model: Batch, as: 'batch' }]
                }
            ],
            transaction
        });

        if (!invoice) {
            await transaction.rollback();
            return res.status(404).json({ message: "Venta no encontrada" });
        }

        if (invoice.status === 'cancelada' || invoice.status === 'anulada') {
            await transaction.rollback();
            return res.status(400).json({
                message: "La venta ya está cancelada"
            });
        }

        // Verificar que sea del mismo día (opcional, según política)
        const today = new Date().toISOString().split('T')[0];
        const invoiceDate = new Date(invoice.invoiceDate).toISOString().split('T')[0];

        if (invoiceDate !== today) {
            // Advertencia pero permitir continuar si es admin
            console.warn('⚠️ Anulando venta de fecha diferente al día actual');
        }

        // Revertir stock de todos los items
        for (const item of invoice.items) {
            // Devolver al lote
            await item.batch.increment('currentQuantity', {
                by: item.quantity,
                transaction
            });

            // Actualizar estado del lote si estaba agotado
            if (item.batch.status === 'depleted') {
                await item.batch.update({
                    status: 'active',
                    canBeSold: true
                }, { transaction });
            }

            // Devolver al producto
            const product = await Product.findByPk(item.productId, { transaction });
            await product.increment('stock', {
                by: item.quantity,
                transaction
            });

            // Crear movimiento de inventario de reversa
            await InventoryMovement.create({
                productId: item.productId,
                batchId: item.batchId,
                movementType: 'ajuste_entrada',
                quantity: item.quantity, // Positivo porque es entrada
                previousStock: product.stock,
                newStock: product.stock + item.quantity,
                referenceType: 'adjustment',
                referenceId: invoice.id,
                userId: req.user.id,
                notes: `Anulación de Venta ${invoice.invoiceNumber} - Razón: ${reason}`
            }, { transaction });
        }

        // Anular recibo
        await invoice.update({
            status: 'anulada',
            notes: `${invoice.notes || ''}\n[ANULADA] ${new Date().toISOString()}: ${reason}`
        }, { transaction });

        // Anular comprobantes asociados
        await Receipt.update(
            {
                status: 'cancelado',
                cancelReason: `Venta anulada: ${reason}`
            },
            {
                where: { invoiceId: invoice.id },
                transaction
            }
        );

        await transaction.commit();

        res.status(200).json({
            message: "Venta anulada exitosamente",
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                status: 'anulada'
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al anular venta:', error);
        res.status(500).json({
            message: "Error al anular venta",
            error: error.message
        });
    }
};

// ========== ESTADÍSTICAS ==========

// Obtener estadísticas de ventas
exports.getInvoiceStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.invoiceDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const stats = {
            total: await Invoice.count({ where: dateFilter }),
            
            byStatus: await Invoice.findAll({
                where: dateFilter,
                attributes: [
                    'status',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
                    [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalAmount']
                ],
                group: ['status']
            }),

            byPaymentMethod: await Invoice.findAll({
                where: dateFilter,
                attributes: [
                    'paymentMethod',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
                    [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalAmount']
                ],
                group: ['paymentMethod']
            }),

            totalRevenue: await Invoice.sum('total', {
                where: {
                    status: { [Op.ne]: 'anulada' },
                    ...dateFilter
                }
            }) || 0,

            averageTicket: await Invoice.findOne({
                where: {
                    status: { [Op.ne]: 'anulada' },
                    ...dateFilter
                },
                attributes: [
                    [db.Sequelize.fn('AVG', db.Sequelize.col('total')), 'average']
                ]
            })
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener estadísticas",
            error: error.message
        });
    }
};