/**
 * @author Alexander Echeverria
 * @file server.js
 * @description Servidor principal con función de reset de tablas
 * @location server.js
 * 
 * Configuración:
 * - Express server
 * - CORS habilitado
 * - Rutas de API
 * - Sincronización de base de datos
 * - RESET de tablas para aplicar cambios de modelos
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./app/config/db.config');

const app = express();

// ========== MIDDLEWARES ==========
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ========== IMPORTAR RUTAS ==========
const productRoutes = require('./app/routers/productsRoutes');
const userRoutes = require('./app/routers/userRoutes');
const clientRoutes = require('./app/routers/clientRoutes');
const workerRoutes = require('./app/routers/workerRoutes');
const invoiceRoutes = require('./app/routers/invoiceRoutes');
const paymentRoutes = require('./app/routers/paymentRoutes');
const batchRoutes = require('./app/routers/batchRoutes');
const statisticsRoutes = require('./app/routers/statisticsRoutes');
const inventoryMovementRoutes = require('./app/routers/inventoryMovementRoutes');
const auditLogRoutes = require('./app/routers/auditLogRoutes');
const alertsRoutes = require('./app/routers/alertsRoutes');
const receiptRoutes = require('./app/routers/receiptRoutes');

// ========== CONFIGURAR RUTAS ==========
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/inventory', inventoryMovementRoutes);
app.use('/api/audit', auditLogRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/receipts', receiptRoutes);

// ========== RUTA DE PRUEBA ==========
app.get('/', (req, res) => {
    res.json({ 
        message: "Farmacia Elizabeth API",
        version: "2.0.0",
        endpoints: {
            products: "/api/products",
            users: "/api/users",
            clients: "/api/clients",
            workers: "/api/workers",
            invoices: "/api/invoices",
            payments: "/api/payments",
            batches: "/api/batches",
            statistics: "/api/statistics",
            inventory: "/api/inventory",
            audit: "/api/audit",
            alerts: "/api/alerts",
            receipts: "/api/receipts"
        }
    });
});

// ========== FUNCIÓN PARA RESETEAR TABLAS ==========
/**
 * Resetea todas las tablas eliminándolas y recreándolas
 * @param {boolean} withSeed - Si es true, inserta datos de prueba
 */
async function resetDatabase(withSeed = false) {
    try {
        console.log('\n🔄 Iniciando reset de base de datos...\n');

        // PASO 1: Eliminar todas las tablas (DROP)
        console.log('📋 Paso 1: Eliminando tablas existentes...');
        await db.sequelize.sync({ force: true });
        console.log('✅ Tablas eliminadas correctamente\n');

        // PASO 2: Recrear tablas con nueva estructura
        console.log('📋 Paso 2: Recreando tablas con nueva estructura...');
        await db.sequelize.sync();
        console.log('✅ Tablas recreadas correctamente\n');

        // PASO 3: Insertar datos de prueba (opcional)
        if (withSeed) {
            console.log('📋 Paso 3: Insertando datos de prueba...');
            await seedDatabase();
            console.log('✅ Datos de prueba insertados\n');
        }

        console.log('🎉 Reset de base de datos completado exitosamente!\n');
        
        // Mostrar tablas creadas
        const tables = Object.keys(db).filter(key => 
            key !== 'Sequelize' && key !== 'sequelize'
        );
        console.log('📦 Tablas disponibles:', tables.join(', '));
        console.log('\n');

    } catch (error) {
        console.error('❌ Error al resetear la base de datos:', error);
        throw error;
    }
}

// ========== FUNCIÓN PARA INSERTAR DATOS DE PRUEBA ==========
async function seedDatabase() {
    const bcrypt = require('bcrypt');

    try {
        // Usuario administrador de prueba
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await db.User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'administrador',
            userType: 'trabajador',
            dpi: '1234567890101'
        });
        console.log('  ✓ Usuario admin creado (user: admin, pass: admin123)');

        // Cliente de prueba
        await db.Client.create({
            name: 'Cliente Prueba',
            dpi: '9876543210101',
            birthDate: '1990-01-01',
            email: 'cliente@prueba.com',
            phone: '12345678',
            address: 'Ciudad de Guatemala'
        });
        console.log('  ✓ Cliente de prueba creado');

        // Producto de prueba
        const product = await db.Product.create({
            name: 'Paracetamol 500mg',
            description: 'Analgésico y antipirético',
            price: 25.50,
            stock: 100,
            supplier: 'Farmacéuticos Unidos'
        });
        console.log('  ✓ Producto de prueba creado');

        // Lote de prueba
        await db.Batch.create({
            productId: product.id,
            batchNumber: 'LOT-2025-001',
            manufacturingDate: '2025-01-01',
            expirationDate: '2027-01-01',
            quantity: 100,
            initialQuantity: 100,
            purchasePrice: 20.00,
            salePrice: 25.50,
            supplier: 'Farmacéuticos Unidos',
            location: 'Bodega A',
            status: 'active'
        });
        console.log('  ✓ Lote de prueba creado');

    } catch (error) {
        console.error('  ❌ Error al insertar datos de prueba:', error.message);
    }
}

// ========== CONFIGURACIÓN DE SINCRONIZACIÓN ==========
/**
 * Configura el modo de sincronización de la base de datos
 * 
 * Opciones:
 * - DEVELOPMENT: { force: true } - Elimina y recrea todas las tablas (SOLO DESARROLLO)
 * - STAGING: { alter: true } - Modifica tablas existentes (puede perder datos)
 * - PRODUCTION: { } - Solo crea tablas que no existen (SEGURO)
 */

// ========== VARIABLE DE ENTORNO PARA RESET ==========
const RESET_DB = process.env.RESET_DB === 'true';
const SEED_DB = process.env.SEED_DB === 'true';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ========== SINCRONIZAR BASE DE DATOS ==========
async function initDatabase() {
    try {
        if (RESET_DB) {
            // MODO RESET: Elimina y recrea todas las tablas
            console.log('⚠️  MODO RESET ACTIVADO - Se eliminarán todas las tablas\n');
            await resetDatabase(SEED_DB);
        } else {
            // MODO NORMAL: Sincronización según entorno
            const syncOptions = {
                development: { alter: true },  // Modifica tablas en desarrollo
                staging: { alter: true },      // Modifica tablas en staging
                production: { }                // Solo crea nuevas en producción
            };

            const options = syncOptions[NODE_ENV] || syncOptions.development;
            
            console.log(`🔧 Sincronizando base de datos en modo: ${NODE_ENV.toUpperCase()}`);
            console.log(`📝 Opciones: ${JSON.stringify(options)}\n`);

            await db.sequelize.sync(options);
            
            console.log('✅ Base de datos sincronizada correctamente');
            console.log('📦 Modelos disponibles:', Object.keys(db).filter(key => 
                key !== 'Sequelize' && key !== 'sequelize'
            ).join(', '));
            console.log('\n');
        }
    } catch (err) {
        console.error('❌ Error al sincronizar la base de datos:', err);
        process.exit(1);
    }
}

// Inicializar base de datos
initDatabase();

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`\n📚 Documentación de API: http://localhost:${PORT}/`);
    
    if (RESET_DB) {
        console.log('\n⚠️  BASE DE DATOS RESETEADA - Datos anteriores eliminados');
    }
    
    console.log('\n💡 Comandos útiles:');
    console.log('   RESET_DB=true npm run dev          # Resetear y recrear tablas');
    console.log('   RESET_DB=true SEED_DB=true npm run dev  # Resetear con datos de prueba');
    console.log('   NODE_ENV=production npm run dev    # Modo producción (seguro)');
    console.log('\n');
});