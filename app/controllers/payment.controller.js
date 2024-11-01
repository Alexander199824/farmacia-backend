// controllers/payment.controller.js
const env = require('../config/env');
const Stripe = require('stripe');
const stripe = Stripe(env.stripeSecretKey);
const db = require('../config/db.config'); // Configuración de la base de datos
const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const Payment = db.Payment;

exports.createPaymentIntent = async (req, res) => {
    const { amount, clientId, sellerDPI, clientDPI, paymentMethod, items } = req.body;

    try {
        // Crear el PaymentIntent en Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method_types: ['card'],
        });

        // Crear el pago en nuestra base de datos
        const payment = await Payment.create({
            amount: amount / 100, // Stripe maneja en centavos
            currency: 'usd',
            status: 'pending',
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret
        });

        res.send({ clientSecret: paymentIntent.client_secret });

        // Al completarse el pago con éxito en el frontend
        stripe.paymentIntents.confirm(paymentIntent.id).then(async (confirmedIntent) => {
            // Actualizar el estado del pago a exitoso
            await payment.update({ status: 'succeeded' });

            // Crear la factura automáticamente
            const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
            const invoice = await Invoice.create({
                clientId,
                sellerDPI,
                clientDPI,
                totalAmount,
                paymentMethod,
                date: new Date()
            });

            // Crear los items de la factura
            for (const item of items) {
                await InvoiceItem.create({
                    invoiceId: invoice.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                });
            }

            console.log("Factura creada automáticamente tras pago exitoso.");
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};
