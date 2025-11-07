/**
 * @author Alexander Echeverria
 * @file app/controllers/receipt.controller.js
 * @description Controlador de Comprobantes de Pago
 * @location app/controllers/receipt.controller.js
 * 
 * Funcionalidades:
 * - Generación automática de comprobantes
 * - Numeración correlativa (COMP-YYYY-NNNNNN)
 * - Vinculación con recibos de venta y pagos
 * - Envío por email
 * - Generación de PDF
 * - Cancelación de comprobantes
 */

const db = require('../config/db.config');
const Receipt = db.Receipt;
const Invoice = db.Invoice;
const User = db.User;
const Payment = db.Payment;
const { Op } = db.Sequelize;
const PDFDocument = require('pdfkit');

// ========== CREAR COMPROBANTE ==========

exports.createReceipt = async (req, res) => {
    try {
        const {
            invoiceId,
            clientId,
            paymentId,
            amount,
            paymentMethod,
            currency = 'GTQ',
            issuedBy,
            notes
        } = req.body;

        // Validar que la venta existe
        const invoice = await Invoice.findByPk(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: "Venta no encontrada" });
        }

        // Validar que el cliente existe (si se proporciona)
        if (clientId) {
            const client = await User.findByPk(clientId);
            if (!client) {
                return res.status(404).json({ message: "Cliente no encontrado" });
            }
        }

        // Validar que el pago existe (si se proporciona)
        if (paymentId) {
            const payment = await Payment.findByPk(paymentId);
            if (!payment) {
                return res.status(404).json({ message: "Pago no encontrado" });
            }
        }

        // Crear el comprobante (el número se genera automáticamente en el hook)
        const receipt = await Receipt.create({
            invoiceId,
            clientId: clientId || invoice.clientId,
            paymentId,
            amount: amount || invoice.total,
            paymentMethod: paymentMethod || invoice.paymentMethod,
            currency,
            issuedBy,
            notes
        });

        // Recargar con relaciones
        const fullReceipt = await Receipt.findByPk(receipt.id, {
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: ['id', 'invoiceNumber', 'total', 'invoiceDate']
                },
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                    required: false
                },
                {
                    model: Payment,
                    as: 'payment',
                    attributes: ['id', 'paymentIntentId', 'status'],
                    required: false
                }
            ]
        });

        res.status(201).json({
            message: "Comprobante de pago creado exitosamente",
            receipt: fullReceipt
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al crear comprobante de pago",
            error: error.message
        });
    }
};

// ========== OBTENER COMPROBANTES ==========

// Obtener todos los comprobantes con filtros
exports.getAllReceipts = async (req, res) => {
    try {
        const { 
            clientId, 
            status, 
            startDate, 
            endDate,
            paymentMethod,
            page = 1,
            limit = 50 
        } = req.query;

        const where = {};

        if (clientId) where.clientId = clientId;
        if (status) where.status = status;
        if (paymentMethod) where.paymentMethod = paymentMethod;
        
        if (startDate && endDate) {
            where.issueDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const offset = (page - 1) * limit;

        const { count, rows: receipts } = await Receipt.findAndCountAll({
            where,
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: ['id', 'invoiceNumber', 'total', 'invoiceDate']
                },
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'dpi'],
                    required: false
                },
                {
                    model: Payment,
                    as: 'payment',
                    attributes: ['id', 'paymentIntentId', 'status'],
                    required: false
                }
            ],
            order: [['issueDate', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            receipts
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener comprobantes",
            error: error.message
        });
    }
};

// Obtener un comprobante por ID
exports.getReceiptById = async (req, res) => {
    try {
        const { id } = req.params;

        const receipt = await Receipt.findByPk(id, {
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: ['id', 'invoiceNumber', 'total', 'invoiceDate', 'subtotal', 'discount', 'tax'],
                    include: [
                        {
                            model: User,
                            as: 'seller',
                            attributes: ['id', 'firstName', 'lastName']
                        },
                        {
                            model: db.InvoiceItem,
                            as: 'items',
                            attributes: ['id', 'quantity', 'unitPrice', 'total', 'discount'],
                            include: [
                                {
                                    model: db.Product,
                                    as: 'product',
                                    attributes: ['id', 'name', 'description']
                                }
                            ],
                            required: false
                        }
                    ]
                },
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'dpi', 'nit'],
                    required: false
                },
                {
                    model: Payment,
                    as: 'payment',
                    attributes: ['id', 'paymentIntentId', 'status', 'amount'],
                    required: false
                }
            ]
        });

        if (!receipt) {
            return res.status(404).json({ message: "Comprobante no encontrado" });
        }

        res.status(200).json(receipt);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener comprobante",
            error: error.message
        });
    }
};

// Obtener comprobante por número
exports.getReceiptByNumber = async (req, res) => {
    try {
        const { receiptNumber } = req.params;

        const receipt = await Receipt.findOne({
            where: { receiptNumber },
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: ['id', 'invoiceNumber', 'total', 'invoiceDate']
                },
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'dpi'],
                    required: false
                },
                {
                    model: Payment,
                    as: 'payment',
                    attributes: ['id', 'paymentIntentId', 'status'],
                    required: false
                }
            ]
        });

        if (!receipt) {
            return res.status(404).json({ message: "Comprobante no encontrado" });
        }

        res.status(200).json(receipt);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener comprobante",
            error: error.message
        });
    }
};

// Obtener comprobantes por cliente
exports.getReceiptsByClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { limit = 20 } = req.query;

        // Validar que el cliente existe
        const client = await User.findByPk(clientId);
        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        const receipts = await Receipt.findAll({
            where: { clientId },
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: ['id', 'invoiceNumber', 'total', 'invoiceDate', 'subtotal', 'discount', 'tax'],
                    include: [
                        {
                            model: db.InvoiceItem,
                            as: 'items',
                            attributes: ['id', 'quantity', 'unitPrice', 'total'],
                            include: [
                                {
                                    model: db.Product,
                                    as: 'product',
                                    attributes: ['id', 'name']
                                }
                            ],
                            required: false
                        }
                    ]
                }
            ],
            order: [['issueDate', 'DESC']],
            limit: parseInt(limit)
        });

        // Calcular totales
        const totalGastado = receipts.reduce((sum, receipt) => {
            return sum + parseFloat(receipt.amount || 0);
        }, 0);

        const totalPedidos = await Invoice.count({
            where: { clientId }
        });

        res.status(200).json({
            client: {
                id: client.id,
                name: `${client.firstName} ${client.lastName}`,
                email: client.email
            },
            count: receipts.length,
            receipts,
            // Totales agregados
            totals: {
                totalGastado: parseFloat(totalGastado.toFixed(2)),
                totalRecibos: receipts.length,
                totalPedidos: totalPedidos
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener comprobantes del cliente",
            error: error.message
        });
    }
};

// Obtener comprobantes por venta
exports.getReceiptsByInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const receipts = await Receipt.findAll({
            where: { invoiceId },
            include: [
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    required: false
                },
                {
                    model: Payment,
                    as: 'payment',
                    attributes: ['id', 'paymentIntentId', 'status'],
                    required: false
                }
            ],
            order: [['issueDate', 'DESC']]
        });

        res.status(200).json({
            invoiceId,
            count: receipts.length,
            receipts
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener comprobantes de la venta",
            error: error.message
        });
    }
};

// ========== ACTUALIZAR COMPROBANTE ==========

exports.updateReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes, status, cancelReason } = req.body;

        const receipt = await Receipt.findByPk(id);
        if (!receipt) {
            return res.status(404).json({ message: "Comprobante no encontrado" });
        }

        // No permitir actualizar comprobantes cancelados
        if (receipt.status === 'cancelado' && status !== 'cancelado') {
            return res.status(400).json({ 
                message: "No se puede modificar un comprobante cancelado" 
            });
        }

        const updates = {};
        if (notes !== undefined) updates.notes = notes;
        if (status !== undefined) updates.status = status;
        if (cancelReason !== undefined) updates.cancelReason = cancelReason;

        await receipt.update(updates);

        res.status(200).json({
            message: "Comprobante actualizado exitosamente",
            receipt
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar comprobante",
            error: error.message
        });
    }
};

// ========== CANCELAR COMPROBANTE ==========

exports.cancelReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;

        if (!cancelReason) {
            return res.status(400).json({
                message: "Se requiere una razón para cancelar el comprobante"
            });
        }

        const receipt = await Receipt.findByPk(id);
        if (!receipt) {
            return res.status(404).json({ message: "Comprobante no encontrado" });
        }

        if (receipt.status === 'cancelado') {
            return res.status(400).json({ 
                message: "El comprobante ya está cancelado" 
            });
        }

        await receipt.update({
            status: 'cancelado',
            cancelReason
        });

        res.status(200).json({
            message: "Comprobante cancelado exitosamente",
            receipt: {
                id: receipt.id,
                receiptNumber: receipt.receiptNumber,
                status: receipt.status,
                cancelReason: receipt.cancelReason
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al cancelar comprobante",
            error: error.message
        });
    }
};

// ========== MARCAR COMO ENVIADO ==========

exports.markAsSent = async (req, res) => {
    try {
        const { id } = req.params;

        const receipt = await Receipt.findByPk(id);
        if (!receipt) {
            return res.status(404).json({ message: "Comprobante no encontrado" });
        }

        if (receipt.status === 'cancelado') {
            return res.status(400).json({
                message: "No se puede marcar como enviado un comprobante cancelado"
            });
        }

        await receipt.update({
            emailSent: true,
            emailSentDate: new Date(),
            status: 'enviado'
        });

        res.status(200).json({
            message: "Comprobante marcado como enviado",
            receipt: {
                id: receipt.id,
                receiptNumber: receipt.receiptNumber,
                emailSent: receipt.emailSent,
                emailSentDate: receipt.emailSentDate
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar estado de envío",
            error: error.message
        });
    }
};

// ========== ENVIAR POR EMAIL ==========

exports.sendReceiptByEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;

        const receipt = await Receipt.findByPk(id, {
            include: [
                {
                    model: Invoice,
                    as: 'invoice'
                },
                {
                    model: User,
                    as: 'client',
                    required: false
                }
            ]
        });

        if (!receipt) {
            return res.status(404).json({ message: "Comprobante no encontrado" });
        }

        if (receipt.status === 'cancelado') {
            return res.status(400).json({
                message: "No se puede enviar un comprobante cancelado"
            });
        }

        // Determinar email destino
        const recipientEmail = email || receipt.client?.email;

        if (!recipientEmail) {
            return res.status(400).json({
                message: "No se especificó email y el cliente no tiene email registrado"
            });
        }

        // TODO: Implementar envío de email con servicio de correo
        // Por ahora solo simulamos el envío
        console.log(`📧 Enviando comprobante ${receipt.receiptNumber} a ${recipientEmail}`);

        // Actualizar estado
        await receipt.update({
            emailSent: true,
            emailSentDate: new Date(),
            status: 'enviado'
        });

        res.status(200).json({
            message: `Comprobante enviado exitosamente a ${recipientEmail}`,
            receipt: {
                id: receipt.id,
                receiptNumber: receipt.receiptNumber,
                sentTo: recipientEmail,
                sentAt: new Date()
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al enviar comprobante por email",
            error: error.message
        });
    }
};

// ========== GENERAR PDF ==========

exports.generateReceiptPDF = async (req, res) => {
    try {
        const { id } = req.params;

        const receipt = await Receipt.findByPk(id, {
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    include: [
                        {
                            model: User,
                            as: 'seller',
                            attributes: ['firstName', 'lastName']
                        },
                        {
                            model: db.InvoiceItem,
                            as: 'items',
                            include: [
                                {
                                    model: db.Product,
                                    as: 'product',
                                    attributes: ['id', 'name', 'description']
                                }
                            ]
                        }
                    ]
                },
                {
                    model: User,
                    as: 'client',
                    required: false
                }
            ]
        });

        if (!receipt) {
            return res.status(404).json({ message: "Comprobante no encontrado" });
        }

        // Validar que el recibo tenga invoice e items
        if (!receipt.invoice) {
            return res.status(400).json({
                message: "Este recibo no tiene una venta asociada y no puede generar PDF"
            });
        }

        if (!receipt.invoice.items || receipt.invoice.items.length === 0) {
            return res.status(400).json({
                message: "Este recibo no tiene productos asociados y no puede generar PDF"
            });
        }

        // Crear documento PDF
        const doc = new PDFDocument({ size: 'letter', margin: 50 });

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Recibo-${receipt.receiptNumber}.pdf`);

        // Pipe del PDF a la respuesta
        doc.pipe(res);

        // ========== ENCABEZADO ==========
        doc.fontSize(20).font('Helvetica-Bold').text('FARMACIA ELIZABETH', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Rabinal, Baja Verapaz, Guatemala', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).font('Helvetica-Bold').text('COMPROBANTE DE PAGO', { align: 'center' });
        doc.moveDown();

        // ========== INFORMACIÓN DEL RECIBO ==========
        const startY = doc.y;

        doc.fontSize(10).font('Helvetica-Bold').text('No. Recibo:', 50, startY);
        doc.font('Helvetica').text(receipt.receiptNumber, 150, startY);

        doc.font('Helvetica-Bold').text('Fecha de Emisión:', 50, startY + 15);
        doc.font('Helvetica').text(new Date(receipt.issueDate).toLocaleString('es-GT'), 150, startY + 15);

        doc.font('Helvetica-Bold').text('No. Venta:', 50, startY + 30);
        doc.font('Helvetica').text(receipt.invoice.invoiceNumber, 150, startY + 30);

        doc.font('Helvetica-Bold').text('Método de Pago:', 50, startY + 45);
        doc.font('Helvetica').text(receipt.paymentMethod.toUpperCase(), 150, startY + 45);

        doc.font('Helvetica-Bold').text('Estado:', 50, startY + 60);
        doc.font('Helvetica').text(receipt.status.toUpperCase(), 150, startY + 60);

        doc.moveDown(5);

        // ========== INFORMACIÓN DEL CLIENTE ==========
        if (receipt.client) {
            doc.fontSize(12).font('Helvetica-Bold').text('CLIENTE:', { underline: true });
            doc.fontSize(10).font('Helvetica');
            doc.text(`Nombre: ${receipt.client.firstName} ${receipt.client.lastName}`);
            if (receipt.client.dpi) doc.text(`DPI: ${receipt.client.dpi}`);
            if (receipt.client.email) doc.text(`Email: ${receipt.client.email}`);
            if (receipt.client.phone) doc.text(`Teléfono: ${receipt.client.phone}`);
            doc.moveDown();
        }

        // ========== LÍNEA SEPARADORA ==========
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // ========== DETALLE DE PRODUCTOS ==========
        doc.fontSize(12).font('Helvetica-Bold').text('DETALLE DE PRODUCTOS', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const colProducto = 50;
        const colCantidad = 320;
        const colPrecio = 400;
        const colSubtotal = 480;

        doc.fontSize(9);
        doc.font('Helvetica-Bold');
        doc.text('Producto', colProducto, tableTop);
        doc.text('Cant.', colCantidad, tableTop);
        doc.text('Precio', colPrecio, tableTop);
        doc.text('Subtotal', colSubtotal, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let currentY = tableTop + 25;
        doc.font('Helvetica').fontSize(9);

        // Iterar sobre los items del pedido
        receipt.invoice.items.forEach((item, index) => {
            const productName = item.product ? item.product.name : 'Producto desconocido';
            const quantity = item.quantity;
            const unitPrice = parseFloat(item.unitPrice).toFixed(2);
            const subtotal = parseFloat(item.total).toFixed(2);

            // Si el nombre es muy largo, truncarlo
            const truncatedName = productName.length > 35
                ? productName.substring(0, 32) + '...'
                : productName;

            doc.text(truncatedName, colProducto, currentY, { width: 260 });
            doc.text(quantity.toString(), colCantidad, currentY);
            doc.text(`Q${unitPrice}`, colPrecio, currentY);
            doc.text(`Q${subtotal}`, colSubtotal, currentY);

            currentY += 20;

            // Si llegamos al final de la página, crear nueva página
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }
        });

        doc.moveDown(2);

        // ========== TOTALES ==========
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        const totalsStartY = doc.y;
        doc.fontSize(10).font('Helvetica');

        // Subtotal
        doc.text('Subtotal:', 350, totalsStartY);
        doc.text(`${receipt.currency} ${parseFloat(receipt.invoice.subtotal).toFixed(2)}`, 450, totalsStartY, { align: 'right' });

        // Descuento (si existe)
        if (receipt.invoice.discount && parseFloat(receipt.invoice.discount) > 0) {
            doc.text('Descuento:', 350, totalsStartY + 15);
            doc.text(`- ${receipt.currency} ${parseFloat(receipt.invoice.discount).toFixed(2)}`, 450, totalsStartY + 15, { align: 'right' });
        }

        // Impuesto (si existe)
        if (receipt.invoice.tax && parseFloat(receipt.invoice.tax) > 0) {
            doc.text('IVA:', 350, totalsStartY + 30);
            doc.text(`${receipt.currency} ${parseFloat(receipt.invoice.tax).toFixed(2)}`, 450, totalsStartY + 30, { align: 'right' });
        }

        // Línea separadora antes del total
        const totalLineY = totalsStartY + 45;
        doc.moveTo(350, totalLineY).lineTo(550, totalLineY).stroke();

        // TOTAL
        const totalY = totalLineY + 10;
        doc.fontSize(14).font('Helvetica-Bold').text('TOTAL:', 350, totalY);
        doc.fontSize(16).text(`${receipt.currency} ${parseFloat(receipt.amount).toFixed(2)}`, 450, totalY, { align: 'right' });

        doc.moveDown(3);

        // ========== PIE DE PÁGINA ==========
        doc.fontSize(8).font('Helvetica-Oblique').text(
            `Emitido por: ${receipt.issuedBy || 'Sistema'}`,
            50,
            doc.y,
            { align: 'center' }
        );

        doc.moveDown(0.5);
        doc.text('Gracias por su compra', { align: 'center' });
        doc.text('Farmacia Elizabeth - Rabinal, Baja Verapaz', { align: 'center' });

        // Finalizar el PDF
        doc.end();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({
            message: "Error al generar PDF",
            error: error.message
        });
    }
};

// ========== ESTADÍSTICAS ==========

exports.getReceiptStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.issueDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const stats = {
            total: await Receipt.count({ where: dateFilter }),
            
            byStatus: await Receipt.findAll({
                where: dateFilter,
                attributes: [
                    'status',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
                ],
                group: ['status']
            }),

            byPaymentMethod: await Receipt.findAll({
                where: dateFilter,
                attributes: [
                    'paymentMethod',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
                    [db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'totalAmount']
                ],
                group: ['paymentMethod']
            }),

            emitidos: await Receipt.count({ 
                where: { status: 'emitido', ...dateFilter } 
            }),
            
            enviados: await Receipt.count({ 
                where: { status: 'enviado', ...dateFilter } 
            }),
            
            cancelados: await Receipt.count({ 
                where: { status: 'cancelado', ...dateFilter } 
            }),
            
            totalAmount: await Receipt.sum('amount', { 
                where: { 
                    status: { [Op.ne]: 'cancelado' },
                    ...dateFilter 
                } 
            }) || 0,

            emailsSent: await Receipt.count({
                where: {
                    emailSent: true,
                    ...dateFilter
                }
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