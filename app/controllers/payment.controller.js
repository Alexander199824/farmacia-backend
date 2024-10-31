// controllers/payment.controller.js
const paypal = require('paypal-rest-sdk');

paypal.configure({
    mode: 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

exports.createPayment = (req, res) => {
    const { price } = req.body;

    const paymentJson = {
        intent: 'sale',
        payer: { payment_method: 'paypal' },
        transactions: [{ amount: { total: price, currency: 'USD' }, description: 'Compra en Mi Farmacia Online' }],
        redirect_urls: {
            return_url: "http://localhost:5000/api/payments/success",
            cancel_url: "http://localhost:5000/api/payments/cancel"
        }
    };

    paypal.payment.create(paymentJson, (error, payment) => {
        if (error) {
            res.status(500).json({ message: "Error en el pago", error: error.message });
        } else {
            res.json({ link: payment.links.find(link => link.rel === 'approval_url').href });
        }
    });
};
