// controllers/payment.controller.js
const env = require('../config/env'); // Asegúrate de que la ruta sea correcta
const Stripe = require('stripe');
const stripe = Stripe(env.stripeSecretKey); // Utiliza la clave desde el archivo de configuración

exports.createPaymentIntent = async (req, res) => {
    const { amount } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            // Puedes agregar más parámetros como "payment_method_types"
        });
        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};
