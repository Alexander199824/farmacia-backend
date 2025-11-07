/**
 * @author Alexander Echeverria
 * @file app.js
 * @description Configuración principal de la aplicación Express
 * @location app.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const env = require('./app/config/env');

const app = express();

// ========== MIDDLEWARES GLOBALES ==========

// CORS - Permitir peticiones desde el frontend
app.use(cors({
    origin: env.frontendUrl || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser - Parsear JSON y URL encoded
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Webhook de Stripe - DEBE IR ANTES DE bodyParser.json()
// (Stripe necesita el raw body)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Logging en desarrollo
if (env.nodeEnv === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// ========== IMPORTAR RUTAS ==========
const userRoutes = require('./app/routers/userRoutes');
const supplierRoutes = require('./app/routers/supplierRoutes');
const productRoutes = require('./app/routers/productsRoutes');
const batchRoutes = require('./app/routers/batchRoutes');
const invoiceRoutes = require('./app/routers/invoiceRoutes');
const orderRoutes = require('./app/routers/orderRoutes');
const receiptRoutes = require('./app/routers/receiptRoutes');
const paymentRoutes = require('./app/routers/paymentRoutes');
const inventoryMovementRoutes = require('./app/routers/inventoryMovementRoutes');
const statisticsRoutes = require('./app/routers/statisticsRoutes');
const alertsRoutes = require('./app/routers/alertsRoutes');
const auditLogRoutes = require('./app/routers/auditLogRoutes');
const reportRoutes = require('./app/routers/reportRoutes');

// ========== CONFIGURAR RUTAS ==========
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryMovementRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/audit', auditLogRoutes);
app.use('/api/reports', reportRoutes);

// ========== RUTA DE BIENVENIDA ==========
app.get('/', (req, res) => {
    res.json({ 
        message: "🏥 Farmacia Elizabeth API",
        version: "3.0.0",
        author: "Alexander Echeverria",
        status: "active",
        environment: env.nodeEnv,
        documentation: {
            users: "/api/users",
            suppliers: "/api/suppliers",
            products: "/api/products",
            batches: "/api/batches",
            invoices: "/api/invoices",
            orders: "/api/orders",
            receipts: "/api/receipts",
            payments: "/api/payments",
            inventory: "/api/inventory",
            statistics: "/api/statistics",
            alerts: "/api/alerts",
            audit: "/api/audit",
            reports: "/api/reports"
        },
        features: [
            "✅ Gestión de usuarios con Google OAuth",
            "✅ Control de inventario con lotes FIFO",
            "✅ Sistema de ventas completo",
            "✅ Pagos con Stripe",
            "✅ Gestión de proveedores",
            "✅ Alertas automáticas",
            "✅ Auditoría completa",
            "✅ Reportes y estadísticas",
            "✅ Módulo de reportes avanzado"
        ]
    });
});

// ========== RUTA DE HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ========== MANEJO DE RUTAS NO ENCONTRADAS ==========
app.use((req, res) => {
    res.status(404).json({
        message: "Ruta no encontrada",
        path: req.path,
        method: req.method
    });
});

// ========== MANEJO DE ERRORES GLOBAL ==========
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    
    res.status(err.status || 500).json({
        message: err.message || "Error interno del servidor",
        error: env.nodeEnv === 'development' ? err : {}
    });
});

module.exports = app;