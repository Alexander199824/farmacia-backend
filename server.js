// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./app/config/db.config');
const userRoutes = require('./app/routers/userRoutes');
const productsRoutes = require('./app/routers/productsRoutes');
const paymentRoutes = require('./app/routers/paymentRoutes');
const workerRoutes = require('./app/routers/workerRoutes');
const clientRoutes = require('./app/routers/clientRoutes');
const invoiceRoutes = require('./app/routers/invoiceRoutes');

dotenv.config();

const app = express();
app.use(cors());

// Configura el tamaño límite para JSON y datos de formulario codificados en URL
app.use(express.json({ limit: '100mb' })); // Ajusta el límite según tus necesidades
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

db.sequelize.sync({ alter: true })
  .then(() => {
    console.log("La base de datos ha sido sincronizada correctamente.");
  })
  .catch((error) => {
    console.error("Error al sincronizar la base de datos:", error);
  });

// Configura las rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);

const PORT = process.env.PORT || 5000;

// Sincroniza la base de datos con `force: false`
db.sequelize.sync({ force: false }).then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(error => {
    console.error("Error al sincronizar la base de datos:", error);
});
