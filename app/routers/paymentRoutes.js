/**
 * @author Alexander Echeverria
 * @file app/routers/paymentRoutes.js
 * @description Rutas de Pagos con Stripe
 * @location app/routers/paymentRoutes.js
 * 
 * Endpoints disponibles:
 * - POST /api/payments/create-intent - Crear Payment Intent
 * - POST /api/payments/confirm - Confirmar pago
 * - POST /api/payments/webhook - Webhook de Stripe (público)
 * - GET /api/payments/:id/status - Estado de un pago
 * - GET /api/payments - Listar pagos
 * - POST /api/payments/:id/refund - Reembolsar pago
 * - POST /api/payments/:id/cancel - Cancelar Payment Intent
 * - GET /api/payments/stats - Estadísticas
 */

const express = require('express');
const router = express.Router();
const {
    createPaymentIntent,
    confirmPayment,
    stripeWebhook,
    getPaymentStatus,
    getAllPayments,
    refundPayment,
    cancelPaymentIntent,
    getPaymentStats
} = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Webhook de Stripe (SIN autenticación - Stripe la necesita pública)
router.post('/webhook', stripeWebhook);

// Crear Payment Intent
router.post('/create-intent', authMiddleware, createPaymentIntent);

// Confirmar pago
router.post('/confirm', authMiddleware, confirmPayment);

// Obtener estado de un pago
router.get('/:id/status', authMiddleware, getPaymentStatus);

// Listar todos los pagos
router.get('/', authMiddleware, getAllPayments);

// Obtener estadísticas
router.get('/stats', authMiddleware, getPaymentStats);

// Reembolsar pago
router.post('/:id/refund', authMiddleware, refundPayment);

// Cancelar Payment Intent
router.post('/:id/cancel', authMiddleware, cancelPaymentIntent);

module.exports = router;