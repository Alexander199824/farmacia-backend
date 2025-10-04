/**
 * @author Alexander Echeverria
 * @file server.js
 * @description Servidor principal con configuración simple
 * @location server.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./app/config/db.config');
const bcrypt = require('bcrypt');

// ╔══════════════════════════════════════════════════════════╗
// ║        🔧 CONFIGURACIÓN DEL SISTEMA (EDITABLE)          ║
// ╚══════════════════════════════════════════════════════════╝

const CONFIG = {
    // ⚙️ RECREAR TABLAS: true = Elimina y recrea todas las tablas (BORRA DATOS)
    RECREATE_TABLES: true,  // ⬅️ Cambia a false para NO recrear tablas
    
    // 👥 INSERTAR USUARIOS: true = Crea usuarios por defecto
    INSERT_USERS: true,     // ⬅️ Cambia a false para NO insertar usuarios
    
    // 📦 INSERTAR DATOS DE PRUEBA: true = Crea productos y lotes de ejemplo
    INSERT_SAMPLE_DATA: true  // ⬅️ Cambia a false para NO insertar datos de prueba
};

// ╔══════════════════════════════════════════════════════════╗
// ║              NO EDITAR DEBAJO DE ESTA LÍNEA             ║
// ╚══════════════════════════════════════════════════════════╝

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
        configuration: {
            tablesRecreated: CONFIG.RECREATE_TABLES,
            usersInserted: CONFIG.INSERT_USERS,
            sampleDataInserted: CONFIG.INSERT_SAMPLE_DATA
        },
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

// ========== FUNCIÓN PARA INSERTAR USUARIOS POR DEFECTO ==========
async function createDefaultUsers() {
    try {
        console.log('\n👥 Creando usuarios por defecto...\n');

        // 1. Usuario ADMINISTRADOR
        const adminExists = await db.User.findOne({ where: { username: 'admin' }});
        if (!adminExists) {
            const adminPassword = await bcrypt.hash('admin123', 12);
            const adminUser = await db.User.create({
                username: 'admin',
                password: adminPassword,
                role: 'administrador',
                userType: 'trabajador',
                dpi: '1111111111111'
            });
            
            await db.Worker.create({
                name: 'Administrador Principal',
                dpi: '1111111111111',
                birthDate: '1990-01-01',
                email: 'admin@farmacia.com',
                phone: '1111-1111',
                address: 'Ciudad de Guatemala',
                role: 'Administrador',
                userId: adminUser.id
            });
            
            console.log('  ✅ ADMINISTRADOR creado:');
            console.log('     👤 Usuario: admin');
            console.log('     🔑 Contraseña: admin123');
            console.log('     📝 DPI: 1111111111111');
            console.log('     📧 Email: admin@farmacia.com\n');
        } else {
            console.log('  ℹ️  Usuario ADMINISTRADOR ya existe\n');
        }

        // 2. Usuario VENDEDOR
        const workerExists = await db.User.findOne({ where: { username: 'vendedor' }});
        if (!workerExists) {
            const workerPassword = await bcrypt.hash('vendedor123', 12);
            const workerUser = await db.User.create({
                username: 'vendedor',
                password: workerPassword,
                role: 'vendedor',
                userType: 'trabajador',
                dpi: '2222222222222'
            });
            
            await db.Worker.create({
                name: 'Juan Pérez',
                dpi: '2222222222222',
                birthDate: '1995-05-15',
                email: 'vendedor@farmacia.com',
                phone: '2222-2222',
                address: 'Guatemala',
                role: 'Vendedor',
                userId: workerUser.id
            });
            
            console.log('  ✅ VENDEDOR creado:');
            console.log('     👤 Usuario: vendedor');
            console.log('     🔑 Contraseña: vendedor123');
            console.log('     📝 DPI: 2222222222222');
            console.log('     📧 Email: vendedor@farmacia.com\n');
        } else {
            console.log('  ℹ️  Usuario VENDEDOR ya existe\n');
        }

        // 3. Usuario CLIENTE
        const clientExists = await db.User.findOne({ where: { username: 'cliente' }});
        if (!clientExists) {
            const clientPassword = await bcrypt.hash('cliente123', 12);
            const clientUser = await db.User.create({
                username: 'cliente',
                password: clientPassword,
                role: 'cliente',
                userType: 'cliente',
                dpi: '3333333333333'
            });
            
            await db.Client.create({
                name: 'María García',
                dpi: '3333333333333',
                birthDate: '1992-08-20',
                email: 'cliente@farmacia.com',
                phone: '3333-3333',
                address: 'Ciudad de Guatemala',
                userId: clientUser.id
            });
            
            console.log('  ✅ CLIENTE creado:');
            console.log('     👤 Usuario: cliente');
            console.log('     🔑 Contraseña: cliente123');
            console.log('     📝 DPI: 3333333333333');
            console.log('     📧 Email: cliente@farmacia.com\n');
        } else {
            console.log('  ℹ️  Usuario CLIENTE ya existe\n');
        }

        console.log('✅ Usuarios por defecto completados!\n');
        
    } catch (error) {
        console.error('❌ Error al crear usuarios:', error.message);
        throw error;
    }
}

// ========== FUNCIÓN PARA INSERTAR DATOS DE PRUEBA ==========
async function createSampleData() {
    try {
        console.log('📦 Creando datos de prueba...\n');

        // Producto de prueba
        const productExists = await db.Product.findOne({ where: { name: 'Paracetamol 500mg' }});
        if (!productExists) {
            const product = await db.Product.create({
                name: 'Paracetamol 500mg',
                description: 'Analgésico y antipirético',
                price: 25.50,
                stock: 100,
                supplier: 'Farmacéuticos Unidos'
            });
            console.log('  ✅ Producto creado: Paracetamol 500mg');

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
            console.log('  ✅ Lote creado: LOT-2025-001\n');
        } else {
            console.log('  ℹ️  Datos de prueba ya existen\n');
        }

    } catch (error) {
        console.error('❌ Error al crear datos de prueba:', error.message);
    }
}

// ========== SINCRONIZAR BASE DE DATOS ==========
async function initDatabase() {
    try {
        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║       🏥 FARMACIA ELIZABETH - INICIALIZACIÓN            ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        // Mostrar configuración actual
        console.log('⚙️  CONFIGURACIÓN ACTUAL:');
        console.log(`   📋 Recrear tablas: ${CONFIG.RECREATE_TABLES ? '✅ SI' : '❌ NO'}`);
        console.log(`   👥 Insertar usuarios: ${CONFIG.INSERT_USERS ? '✅ SI' : '❌ NO'}`);
        console.log(`   📦 Datos de prueba: ${CONFIG.INSERT_SAMPLE_DATA ? '✅ SI' : '❌ NO'}\n`);

        // PASO 1: Sincronizar base de datos
        if (CONFIG.RECREATE_TABLES) {
            console.log('🔄 RECREANDO TABLAS (se eliminarán datos existentes)...\n');
            await db.sequelize.sync({ force: true });
            console.log('✅ Tablas recreadas correctamente\n');
        } else {
            console.log('🔧 Sincronizando base de datos (sin eliminar datos)...\n');
            await db.sequelize.sync();
            console.log('✅ Base de datos sincronizada\n');
        }

        // PASO 2: Insertar usuarios por defecto
        if (CONFIG.INSERT_USERS) {
            await createDefaultUsers();
        } else {
            console.log('⏭️  Omitiendo creación de usuarios por defecto\n');
        }

        // PASO 3: Insertar datos de prueba
        if (CONFIG.INSERT_SAMPLE_DATA) {
            await createSampleData();
        } else {
            console.log('⏭️  Omitiendo datos de prueba\n');
        }

        // Mostrar resumen
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║              ✅ INICIALIZACIÓN COMPLETADA               ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        if (CONFIG.INSERT_USERS) {
            console.log('📊 USUARIOS DISPONIBLES:');
            console.log('   1. admin / admin123 (Administrador)');
            console.log('   2. vendedor / vendedor123 (Vendedor)');
            console.log('   3. cliente / cliente123 (Cliente)\n');
        }

        console.log('📦 Modelos cargados:', Object.keys(db).filter(key => 
            key !== 'Sequelize' && key !== 'sequelize'
        ).join(', '));
        console.log('\n');

    } catch (err) {
        console.error('\n❌ ERROR AL INICIALIZAR LA BASE DE DATOS:');
        console.error(err);
        process.exit(1);
    }
}

// Inicializar base de datos
initDatabase();

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║          🚀 FARMACIA ELIZABETH - API ACTIVA             ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n📍 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`📚 Documentación API: http://localhost:${PORT}/\n`);
    
    console.log('💡 Para cambiar la configuración:');
    console.log('   1. Abre server.js');
    console.log('   2. Edita las variables en CONFIG (líneas 16-24)');
    console.log('   3. Reinicia el servidor (Ctrl+C y npm start)\n');
});