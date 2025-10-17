/**
 * @author Alexander Echeverria
 * @file app/controllers/payment.controller.js
 * @description Controlador de Pagos con Stripe
 * @location app/controllers/payment.controller.js
 * 
 * Funcionalidades:
 * - Crear Payment Intent con Stripe
 * - Confirmar pagos
 * - Webhook de Stripe
 * - Reembolsos
 * - Historial de pagos
 */

const env = require('../config/env');
const Stripe = require('stripe');
const stripe = Stripe(env.stripeSecretKey);
const db = require('../config/db.config');
const Payment = db.Payment;
const Invoice = db.Invoice;
const Receipt = db.Receipt;
const User = db.User;
const { Op } = db.Sequelize;

// ========== CREAR PAYMENT INTENT ==========

exports.createPaymentIntent = async (req, res) => {
    try {
        let { amount, currency = 'gtq', metadata = {} } = req.body;

        // Validar que amount sea un número entero positivo en centavos
        amount = parseInt(amount, 10);
        
        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({
                error: 'El monto debe ser un entero positivo en centavos (ej: 10000 = Q100.00)'
            });
        }

        console.log('Creando Payment Intent:', {
            amount,
            currency,
            metadata
        });

        // Crear Payment Intent en Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: currency.toLowerCase(),
            payment_method_types: ['card'],
            metadata: {
                userId: req.user?.id || 'guest',
                ...metadata
            }
        });

        // Guardar Payment en base de datos
        const payment = await Payment.create({
            amount: amount / 100, // Convertir centavos a unidad
            currency: currency.toLowerCase(),
            status: paymentIntent.status,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret
        });

        console.log('Payment Intent creado exitosamente:', paymentIntent.id);

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency
        });

    } catch (error) {
        console.error('Error al crear Payment Intent:', error);
        res.status(500).json({
            message: 'Error al crear Payment Intent',
            error: error.message
        });
    }
};

// ========== CONFIRMAR PAGO ==========

exports.confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                message: 'Se requiere paymentIntentId'
            });
        }

        // Buscar el pago en la base de datos
        const payment = await Payment.findOne({
            where: { paymentIntentId }
        });

        if (!payment) {
            return res.status(404).json({
                message: 'Pago no encontrado'
            });
        }

        // Obtener estado actual del Payment Intent en Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Actualizar estado del pago
        await payment.update({
            status: paymentIntent.status
        });

        res.status(200).json({
            message: 'Estado del pago actualizado',
            payment: {
                id: payment.id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency
            },
            stripeStatus: paymentIntent.status
        });

    } catch (error) {
        console.error('Error al confirmar pago:', error);
        res.status(500).json({
            message: 'Error al confirmar pago',
            error: error.message
        });
    }
};

// ========== WEBHOOK DE STRIPE ==========

exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verificar la firma del webhook
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            endpointSecret
        );
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('✅ Payment Intent succeeded:', paymentIntent.id);

            // Actualizar estado del pago en base de datos
            const payment = await Payment.findOne({
                where: { paymentIntentId: paymentIntent.id }
            });

            if (payment) {
                await payment.update({ status: 'succeeded' });
                console.log('✅ Payment actualizado en base de datos:', payment.id);
            }

            break;

        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object;
            console.log('❌ Payment Intent failed:', failedIntent.id);

            const failedPayment = await Payment.findOne({
                where: { paymentIntentId: failedIntent.id }
            });

            if (failedPayment) {
                await failedPayment.update({ status: 'failed' });
            }

            break;

        case 'charge.refunded':
            const refund = event.data.object;
            console.log('🔄 Refund processed:', refund.id);

            // Aquí puedes manejar la lógica de reembolso
            // Por ejemplo, actualizar el estado de un recibo

            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    // Responder a Stripe que el webhook fue recibido
    res.status(200).json({ received: true });
};

// ========== OBTENER ESTADO DE PAGO ==========

exports.getPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await Payment.findByPk(id);

        if (!payment) {
            return res.status(404).json({
                message: 'Pago no encontrado'
            });
        }

        // Obtener info actualizada de Stripe
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(
                payment.paymentIntentId
            );

            // Actualizar si hay cambios
            if (paymentIntent.status !== payment.status) {
                await payment.update({ status: paymentIntent.status });
            }

            res.status(200).json({
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    createdAt: payment.createdAt
                },
                stripeInfo: {
                    status: paymentIntent.status,
                    paymentMethod: paymentIntent.payment_method,
                    lastPaymentError: paymentIntent.last_payment_error?.message || null
                }
            });
        } catch (stripeError) {
            // Si falla Stripe, devolver solo info de base de datos
            res.status(200).json({
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    createdAt: payment.createdAt
                },
                note: 'No se pudo obtener información actualizada de Stripe'
            });
        }

    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener estado del pago',
            error: error.message
        });
    }
};

// ========== LISTAR PAGOS ==========

exports.getAllPayments = async (req, res) => {
    try {
        const {
            status,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const where = {};

        if (status) where.status = status;

        if (startDate && endDate) {
            where.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const offset = (page - 1) * limit;

        const { count, rows: payments } = await Payment.findAndCountAll({
            where,
            include: [
                {
                    model: Receipt,
                    as: 'receipts',
                    attributes: ['id', 'receiptNumber', 'invoiceId'],
                    required: false,
                    include: [
                        {
                            model: Invoice,
                            as: 'invoice',
                            attributes: ['id', 'invoiceNumber', 'total'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            payments
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener pagos',
            error: error.message
        });
    }
};

// ========== REEMBOLSAR PAGO ==========

exports.refundPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;

        const payment = await Payment.findByPk(id);

        if (!payment) {
            return res.status(404).json({
                message: 'Pago no encontrado'
            });
        }

        if (payment.status !== 'succeeded') {
            return res.status(400).json({
                message: 'Solo se pueden reembolsar pagos completados exitosamente'
            });
        }

        // Crear reembolso en Stripe
        const refund = await stripe.refunds.create({
            payment_intent: payment.paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined, // Convertir a centavos si es parcial
            reason: reason || 'requested_by_customer'
        });

        console.log('✅ Reembolso creado:', refund.id);

        // Actualizar estado del pago
        await payment.update({
            status: refund.status === 'succeeded' ? 'refunded' : 'refund_pending'
        });

        res.status(200).json({
            message: 'Reembolso procesado exitosamente',
            refund: {
                id: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
                reason: refund.reason
            },
            payment: {
                id: payment.id,
                status: payment.status
            }
        });

    } catch (error) {
        console.error('Error al procesar reembolso:', error);
        res.status(500).json({
            message: 'Error al procesar reembolso',
            error: error.message
        });
    }
};

// ========== ESTADÍSTICAS DE PAGOS ==========

exports.getPaymentStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const stats = {
            total: await Payment.count({ where: dateFilter }),

            byStatus: await Payment.findAll({
                where: dateFilter,
                attributes: [
                    'status',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
                    [db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'totalAmount']
                ],
                group: ['status']
            }),

            totalAmount: await Payment.sum('amount', {
                where: {
                    status: 'succeeded',
                    ...dateFilter
                }
            }) || 0,

            averageAmount: await Payment.findOne({
                where: {
                    status: 'succeeded',
                    ...dateFilter
                },
                attributes: [
                    [db.Sequelize.fn('AVG', db.Sequelize.col('amount')), 'average']
                ]
            }),

            succeeded: await Payment.count({
                where: {
                    status: 'succeeded',
                    ...dateFilter
                }
            }),

            failed: await Payment.count({
                where: {
                    status: 'failed',
                    ...dateFilter
                }
            }),

            pending: await Payment.count({
                where: {
                    status: {
                        [Op.in]: ['requires_payment_method', 'requires_confirmation', 'processing']
                    },
                    ...dateFilter
                }
            })
        };

        res.status(200).json(stats);

    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// ========== CANCELAR PAYMENT INTENT ==========

exports.cancelPaymentIntent = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancellation_reason } = req.body;

        const payment = await Payment.findByPk(id);

        if (!payment) {
            return res.status(404).json({
                message: 'Pago no encontrado'
            });
        }

        // Solo se pueden cancelar pagos que aún no se completaron
        if (payment.status === 'succeeded') {
            return res.status(400).json({
                message: 'No se puede cancelar un pago completado. Use reembolso en su lugar.'
            });
        }

        // Cancelar en Stripe
        const canceledIntent = await stripe.paymentIntents.cancel(
            payment.paymentIntentId,
            {
                cancellation_reason: cancellation_reason || 'requested_by_customer'
            }
        );

        // Actualizar en base de datos
        await payment.update({ status: 'canceled' });

        res.status(200).json({
            message: 'Payment Intent cancelado exitosamente',
            payment: {
                id: payment.id,
                status: payment.status
            }
        });

    } catch (error) {
        console.error('Error al cancelar Payment Intent:', error);
        res.status(500).json({
            message: 'Error al cancelar Payment Intent',
            error: error.message
        });
    }
};