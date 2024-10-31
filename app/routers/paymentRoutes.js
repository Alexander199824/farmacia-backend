// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Ruta para iniciar el pago
router.post('/create', authMiddleware, createPayment);

module.exports = router;
