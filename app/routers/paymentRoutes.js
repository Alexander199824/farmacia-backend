const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Ruta para crear PaymentIntent sin autenticación
router.post('/create-payment-intent', paymentController.createPaymentIntent);

// Ruta para crear una factura tras la confirmación de pago exitosa
router.post('/create-invoice', paymentController.createInvoice);

module.exports = router;
