// paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Ruta para crear PaymentIntent sin autenticación
router.post('/create-payment-intent', paymentController.createPaymentIntent);

module.exports = router;