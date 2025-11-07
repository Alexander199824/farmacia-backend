/**
 * @author Alexander Echeverria
 * @file server.js
 * @description Servidor principal - Punto de entrada
 * @location server.js
 */

const app = require('./app');
const db = require('./app/config/db.config');
const env = require('./app/config/env');

// ╔══════════════════════════════════════════════════════════╗
// ║        🔧 CONFIGURACIÓN DEL SISTEMA (EDITABLE)          ║
// ╚══════════════════════════════════════════════════════════╝

const CONFIG = {
    // ⚙️ SINCRONIZAR BD: true = Actualiza estructura (sin borrar datos)
    SYNC_DATABASE: false,

    // 🔄 RECREAR TABLAS: true = Elimina y recrea todas las tablas (BORRA DATOS)
    RECREATE_TABLES: false,  // ⚠️ PELIGROSO: Cambia a true solo para desarrollo

    // 👥 INSERTAR USUARIOS: true = Crea usuarios por defecto si no existen
    CREATE_DEFAULT_USERS: false,

    // 📦 INSERTAR DATOS DE PRUEBA: true = Crea productos y lotes de ejemplo
    CREATE_SAMPLE_DATA: false
};

// ╔══════════════════════════════════════════════════════════╗
// ║              NO EDITAR DEBAJO DE ESTA LÍNEA             ║
// ╚══════════════════════════════════════════════════════════╝

// ========== FUNCIÓN PARA CREAR USUARIOS POR DEFECTO ==========
async function createDefaultUsers() {
    try {
        console.log('\n👥 Verificando usuarios por defecto...\n');

        // 1. Usuario ADMIN
        const adminExists = await db.User.findOne({ 
            where: { email: 'admin@farmacia.com' }
        });
        
        if (!adminExists) {
            await db.User.create({
                firstName: 'Administrador',
                lastName: 'Sistema',
                email: 'admin@farmacia.com',
                password: 'Admin123!', // El hook lo hasheará automáticamente
                phone: '1111-1111',
                address: 'Ciudad de Guatemala',
                dpi: '1111111111111',
                role: 'admin',
                isActive: true
            });
            
            console.log('  ✅ ADMINISTRADOR creado:');
            console.log('     📧 Email: admin@farmacia.com');
            console.log('     🔑 Contraseña: Admin123!');
            console.log('     👤 Rol: admin\n');
        } else {
            console.log('  ℹ️  Usuario ADMIN ya existe\n');
        }

        // 2. Usuario VENDEDOR
        const sellerExists = await db.User.findOne({ 
            where: { email: 'vendedor@farmacia.com' }
        });
        
        if (!sellerExists) {
            await db.User.create({
                firstName: 'Vendedor',
                lastName: 'Principal',
                email: 'vendedor@farmacia.com',
                password: 'Vendedor123!',
                phone: '2222-2222',
                address: 'Guatemala',
                dpi: '2222222222222',
                role: 'vendedor',
                isActive: true
            });
            
            console.log('  ✅ VENDEDOR creado:');
            console.log('     📧 Email: vendedor@farmacia.com');
            console.log('     🔑 Contraseña: Vendedor123!');
            console.log('     👤 Rol: vendedor\n');
        } else {
            console.log('  ℹ️  Usuario VENDEDOR ya existe\n');
        }

        console.log('✅ Usuarios por defecto verificados!\n');
        
    } catch (error) {
        console.error('❌ Error al crear usuarios:', error.message);
        throw error;
    }
}

// ========== FUNCIÓN PARA CREAR DATOS DE PRUEBA ==========
async function createSampleData() {
    try {
        console.log('📦 Verificando datos de prueba...\n');

        // Verificar si ya existen datos
        const productCount = await db.Product.count();
        
        if (productCount === 0) {
            // Crear proveedor
            const supplier = await db.Supplier.create({
                code: 'PROV001',
                name: 'Farmacéuticos Unidos',
                contactName: 'Carlos Méndez',
                email: 'contacto@farmaunidos.com',
                phone: '4567-8901',
                nit: '123456789',
                isActive: true
            });
            console.log('  ✅ Proveedor creado');

            // Crear producto
            const product = await db.Product.create({
                name: 'Paracetamol 500mg',
                sku: 'MED-PARA-500',
                description: 'Analgésico y antipirético',
                category: 'Analgésicos',
                price: 25.50,
                costPrice: 18.00,
                stock: 100,
                minStock: 20,
                supplierId: supplier.id,
                isActive: true
            });
            console.log('  ✅ Producto creado: Paracetamol 500mg');

            // Crear lote
            await db.Batch.create({
                productId: product.id,
                supplierId: supplier.id,
                batchNumber: 'LOT-2025-001',
                manufacturingDate: '2025-01-01',
                expirationDate: '2027-01-01',
                initialQuantity: 100,
                currentQuantity: 100,
                purchasePrice: 18.00,
                salePrice: 25.50,
                status: 'active',
                canBeSold: true
            });
            console.log('  ✅ Lote creado: LOT-2025-001\n');
        } else {
            console.log('  ℹ️  Datos de prueba ya existen\n');
        }

    } catch (error) {
        console.error('❌ Error al crear datos de prueba:', error.message);
    }
}

// ========== INICIALIZAR BASE DE DATOS ==========
async function initDatabase() {
    try {
        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║       🏥 FARMACIA ELIZABETH - INICIALIZACIÓN            ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        // Mostrar configuración
        console.log('⚙️  CONFIGURACIÓN:');
        console.log(`   🔄 Sincronizar BD: ${CONFIG.SYNC_DATABASE ? '✅' : '❌'}`);
        console.log(`   ⚠️  Recrear tablas: ${CONFIG.RECREATE_TABLES ? '✅ SI (BORRA DATOS)' : '❌ NO'}`);
        console.log(`   👥 Crear usuarios: ${CONFIG.CREATE_DEFAULT_USERS ? '✅' : '❌'}`);
        console.log(`   📦 Datos prueba: ${CONFIG.CREATE_SAMPLE_DATA ? '✅' : '❌'}\n`);

        // Paso 1: Conectar a la base de datos
        console.log('🔌 Conectando a la base de datos...');
        await db.sequelize.authenticate();
        console.log('✅ Conexión establecida\n');

        // Paso 2: Sincronizar/Recrear tablas
        if (CONFIG.RECREATE_TABLES) {
            console.log('⚠️  RECREANDO TABLAS (eliminando datos)...\n');
            await db.sequelize.sync({ force: true });
            console.log('✅ Tablas recreadas\n');
        } else if (CONFIG.SYNC_DATABASE) {
            console.log('🔧 Sincronizando estructura de base de datos...\n');
            await db.sequelize.sync({ alter: true });
            console.log('✅ Estructura sincronizada\n');
        }

        // Paso 3: Crear usuarios por defecto
        if (CONFIG.CREATE_DEFAULT_USERS) {
            await createDefaultUsers();
        }

        // Paso 4: Crear datos de prueba
        if (CONFIG.CREATE_SAMPLE_DATA) {
            await createSampleData();
        }

        // Mostrar resumen
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║              ✅ INICIALIZACIÓN COMPLETADA               ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('\n❌ ERROR AL INICIALIZAR:');
        console.error(error);
        process.exit(1);
    }
}

// ========== INICIAR APLICACIÓN ==========
async function startServer() {
    // Inicializar base de datos
    await initDatabase();

    // Iniciar servidor
    const PORT = env.port || 5000;
    
    app.listen(PORT, () => {
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║          🚀 SERVIDOR ACTIVO Y ESCUCHANDO                ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        console.log(`\n📍 Servidor: http://localhost:${PORT}`);
        console.log(`📚 API Docs: http://localhost:${PORT}/`);
        console.log(`💚 Health: http://localhost:${PORT}/health\n`);
        
        console.log('📦 Endpoints disponibles:');
        console.log('   • /api/users - Gestión de usuarios');
        console.log('   • /api/suppliers - Gestión de proveedores');
        console.log('   • /api/products - Gestión de productos');
        console.log('   • /api/batches - Gestión de lotes');
        console.log('   • /api/invoices - Recibos de venta');
        console.log('   • /api/orders - Pedidos en línea');
        console.log('   • /api/receipts - Comprobantes');
        console.log('   • /api/payments - Pagos Stripe');
        console.log('   • /api/inventory - Movimientos inventario');
        console.log('   • /api/statistics - Reportes y estadísticas');
        console.log('   • /api/alerts - Alertas del sistema');
        console.log('   • /api/audit - Logs de auditoría');
        console.log('   • /api/reports - Módulo de reportes completo 📊\n');

        console.log('💡 Ambiente: ' + env.nodeEnv.toUpperCase());
        console.log('🔐 JWT configurado: ' + (env.jwtSecret ? '✅' : '❌'));
        console.log('☁️  Cloudinary: ' + (env.cloudinary.cloudName ? '✅' : '❌'));
        console.log('💳 Stripe: ' + (env.stripeSecretKey ? '✅' : '❌'));
        console.log('🔑 Google OAuth: ' + (env.googleClientId ? '✅' : '❌\n'));
    });
}

// Ejecutar
startServer();