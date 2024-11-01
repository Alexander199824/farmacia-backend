const env = require('../config/env');
const Stripe = require('stripe');
const stripe = Stripe(env.stripeSecretKey);
const db = require('../config/db.config');
const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const Payment = db.Payment;

exports.createPaymentIntent = async (req, res) => {
    console.log('Datos recibidos en /create-payment-intent:', req.body);
    
    let { amount, clientId, sellerDPI, clientDPI, paymentMethod, items } = req.body;

    // Valida que `amount` sea un número entero positivo
    amount = parseInt(amount, 10);
    if (!Number.isInteger(amount) || amount <= 0) {
        return res.status(400).send({ error: 'El monto debe ser un entero positivo en centavos.' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method_types: ['card'],
        });

        const payment = await Payment.create({
            amount: amount / 100,
            currency: 'usd',
            status: 'pending',
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret
        });

        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error al crear PaymentIntent:', error);
        res.status(500).send({ error: error.message });
    }
};


exports.createInvoice = async (req, res) => {
    const { clientId, sellerDPI, clientDPI, paymentMethod, items } = req.body;

    try {
        const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

        const invoice = await Invoice.create({
            clientId,
            sellerDPI,
            clientDPI,
            totalAmount,
            paymentMethod,
            date: new Date()
        });

        for (const item of items) {
            await InvoiceItem.create({
                invoiceId: invoice.id,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
            });
        }

        res.send({ message: 'Factura creada exitosamente.' });
    } catch (error) {
        console.error('Error al crear factura:', error);
        res.status(500).send({ error: error.message });
    }
};
