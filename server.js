/**
 * @author Alexander Echeverria
 * @file server.js
 * @description Servidor principal del Sistema de Farmacia Elizabeth
 * @location server.js
 * 
 * Sistema completo de gestión para farmacia que incluye:
 * - Gestión de usuarios y autenticación
 * - Control de inventario con lotes y vencimientos
 * - Sistema de ventas y facturación
 * - Procesamiento de pagos (Stripe/PayPal)
 * - Generación de recibos
 * - Reportes y estadísticas
 * - Auditoría de operaciones
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./app/config/db.config');

// Importar rutas existentes
const userRoutes = require('./app/routers/userRoutes');
const productsRoutes = require('./app/routers/productsRoutes');
const paymentRoutes = require('./app/routers/paymentRoutes');
const workerRoutes = require('./app/routers/workerRoutes');
const clientRoutes = require('./app/routers/clientRoutes');
const invoiceRoutes = require('./app/routers/invoiceRoutes');

// Importar nuevas rutas
const batchRoutes = require('./app/routers/batchRoutes');
const statisticsRoutes = require('./app/routers/statisticsRoutes');

dotenv.config();

const app = express();

// ========== MIDDLEWARES DE SEGURIDAD ==========
app.use(helmet()); // Seguridad HTTP headers
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Logging de requests
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ========== PARSEO DE DATOS ==========
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ========== RUTAS DE LA API ==========

// Rutas existentes
app.use('/api/users', userRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);

// Nuevas rutas
app.use('/api/batches', batchRoutes);
app.use('/api/statistics', statisticsRoutes);

// ========== MANEJO DE ERRORES ==========
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.path
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========== SINCRONIZACIÓN DE BASE DE DATOS ==========
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Verificar conexión a la base de datos
        await db.sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida correctamente.');

        // Sincronizar modelos (usar alter en desarrollo, force: false en producción)
        await db.sequelize.sync({ 
            alter: process.env.NODE_ENV === 'development',
            force: false 
        });
        console.log('✅ Modelos sincronizados correctamente.');

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════╗
║   🏥 SISTEMA FARMACIA ELIZABETH                ║
║                                                ║
║   🚀 Servidor corriendo en puerto ${PORT}        ║
║   🌍 Entorno: ${process.env.NODE_ENV || 'development'}              ║
║   📅 ${new Date().toLocaleString('es-GT')}     ║
║                                                ║
║   📊 Módulos activos:                          ║
║   ✅ Usuarios y Autenticación                  ║
║   ✅ Inventario y Lotes                        ║
║   ✅ Ventas y Facturación                      ║
║   ✅ Pagos (Stripe/PayPal)                     ║
║   ✅ Recibos                                   ║
║   ✅ Estadísticas y Reportes                   ║
║   ✅ Auditoría                                 ║
║                                                ║
║   👨‍💻 Desarrollado por: Alexander Echeverria   ║
╚════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejo de señales para cierre graceful
process.on('SIGTERM', async () => {
    console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
    await db.sequelize.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n⚠️  SIGINT recibido. Cerrando servidor...');
    await db.sequelize.close();
    process.exit(0);
});

startServer();