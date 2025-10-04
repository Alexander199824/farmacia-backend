/**
 * @author Alexander Echeverria
 * @file app/controllers/receipt.controller.js
 * @description Controlador de Recibos - Sistema completo de comprobantes
 * @location app/controllers/receipt.controller.js
 * 
 * Funcionalidades:
 * - Generación automática de recibos
 * - Numeración correlativa
 * - Vinculación con facturas y pagos
 * - Envío por email
 * - Generación de PDF
 */

const db = require('../config/db.config');
const Receipt = db.Receipt;
const Invoice = db.Invoice;
const Client = db.Client;
const Payment = db.Payment;
const { Op } = db.Sequelize;

// Crear un recibo
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

        // Validar que la factura existe
        const invoice = await Invoice.findByPk(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: "Factura no encontrada" });
        }

        // Validar que el cliente existe
        const client = await Client.findByPk(clientId);
        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        // Crear el recibo (el número se genera automáticamente en el hook)
        const receipt = await Receipt.create({
            invoiceId,
            clientId,
            paymentId,
            amount,
            paymentMethod,
            currency,
            issuedBy,
            notes
        });

        res.status(201).json({
            message: "Recibo creado exitosamente",
            receipt
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al crear recibo",
            error: error.message
        });
    }
};

// Obtener todos los recibos
exports.getAllReceipts = async (req, res) => {
    try {
        const { 
            clientId, 
            status, 
            startDate, 
            endDate,
            page = 1,
            limit = 50 
        } = req.query;

        const where = {};

        if (clientId) where.clientId = clientId;
        if (status) where.status = status;
        
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
                    attributes: ['id', 'totalAmount', 'date']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'dpi', 'email']
                },
                {
                    model: Payment,
                    as: 'payment',
                    attributes: ['id', 'status', 'paymentIntentId'],
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
            message: "Error al obtener recibos",
            error: error.message
        });
    }
};

// Obtener un recibo por ID
exports.getReceiptById = async (req, res) => {
    try {
        const { id } = req.params;

        const receipt = await Receipt.findByPk(id, {
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: ['id', 'totalAmount', 'date', 'sellerDPI']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'dpi', 'email', 'phone', 'address']
                },
                {
                    model: Payment,
                    as: 'payment',
                    attributes: ['id', 'status', 'paymentIntentId'],
                    required: false
                }
            ]
        });

        if (!receipt) {
            return res.status(404).json({ message: "Recibo no encontrado" });
        }

        res.status(200).json(receipt);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener recibo",
            error: error.message
        });
    }
};

// Obtener recibo por número
exports.getReceiptByNumber = async (req, res) => {
    try {
        const { receiptNumber } = req.params;

        const receipt = await Receipt.findOne({
            where: { receiptNumber },
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: ['id', 'totalAmount', 'date']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'dpi', 'email']
                }
            ]
        });

        if (!receipt) {
            return res.status(404).json({ message: "Recibo no encontrado" });
        }

        res.status(200).json(receipt);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener recibo",
            error: error.message
        });
    }
};

// Obtener recibos por cliente
exports.getReceiptsByClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { limit = 20 } = req.query;

        const receipts = await Receipt.findAll({
            where: { clientId },
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: ['id', 'totalAmount', 'date']
                }
            ],
            order: [['issueDate', 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json(receipts);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener recibos del cliente",
            error: error.message
        });
    }
};

// Actualizar recibo
exports.updateReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes, status, cancelReason } = req.body;

        const receipt = await Receipt.findByPk(id);
        if (!receipt) {
            return res.status(404).json({ message: "Recibo no encontrado" });
        }

        // No permitir actualizar recibos cancelados
        if (receipt.status === 'cancelled' && status !== 'cancelled') {
            return res.status(400).json({ 
                message: "No se puede modificar un recibo cancelado" 
            });
        }

        await receipt.update({
            notes: notes || receipt.notes,
            status: status || receipt.status,
            cancelReason: cancelReason || receipt.cancelReason
        });

        res.status(200).json({
            message: "Recibo actualizado exitosamente",
            receipt
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar recibo",
            error: error.message
        });
    }
};

// Cancelar recibo
exports.cancelReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;

        const receipt = await Receipt.findByPk(id);
        if (!receipt) {
            return res.status(404).json({ message: "Recibo no encontrado" });
        }

        if (receipt.status === 'cancelled') {
            return res.status(400).json({ message: "El recibo ya está cancelado" });
        }

        await receipt.update({
            status: 'cancelled',
            cancelReason: cancelReason || 'Sin razón especificada'
        });

        res.status(200).json({
            message: "Recibo cancelado exitosamente",
            receipt
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al cancelar recibo",
            error: error.message
        });
    }
};

// Marcar recibo como enviado por email
exports.markAsSent = async (req, res) => {
    try {
        const { id } = req.params;

        const receipt = await Receipt.findByPk(id);
        if (!receipt) {
            return res.status(404).json({ message: "Recibo no encontrado" });
        }

        await receipt.update({
            emailSent: true,
            emailSentDate: new Date(),
            status: 'sent'
        });

        res.status(200).json({
            message: "Recibo marcado como enviado",
            receipt
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar estado de envío",
            error: error.message
        });
    }
};

// Obtener estadísticas de recibos
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
            issued: await Receipt.count({ 
                where: { status: 'issued', ...dateFilter } 
            }),
            sent: await Receipt.count({ 
                where: { status: 'sent', ...dateFilter } 
            }),
            cancelled: await Receipt.count({ 
                where: { status: 'cancelled', ...dateFilter } 
            }),
            totalAmount: await Receipt.sum('amount', { 
                where: { 
                    status: { [Op.ne]: 'cancelled' },
                    ...dateFilter 
                } 
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