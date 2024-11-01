// paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/authMiddleware'); // Importa el middleware de autenticación

// Ruta para crear PaymentIntent (protegida con authMiddleware)
router.post('/create-payment-intent', authMiddleware, paymentController.createPaymentIntent);

module.exports = router;
