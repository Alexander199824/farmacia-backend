/**
 * @author Alexander Echeverria
 * @file resetDatabase.js
 * @description Script para resetear base de datos (uso independiente)
 * @location resetDatabase.js
 * 
 * Uso:
 * - node resetDatabase.js              # Reset sin datos
 * - node resetDatabase.js --seed       # Reset con datos de prueba
 * - npm run db:reset                   # Usando script npm
 */

const db = require('./app/config/db.config');
const bcrypt = require('bcrypt');

// Verificar argumentos
const args = process.argv.slice(2);
const withSeed = args.includes('--seed') || args.includes('-s');

console.log('╔════════════════════════════════════════════╗');
console.log('║   RESET DE BASE DE DATOS - FARMACIA        ║');
console.log('╚════════════════════════════════════════════╝\n');

if (withSeed) {
    console.log('📦 Modo: RESET CON DATOS DE PRUEBA\n');
} else {
    console.log('📦 Modo: RESET SIN DATOS\n');
}

// Función principal de reset
async function resetDatabase() {
    try {
        // PASO 1: Eliminar todas las tablas
        console.log('🔄 Paso 1/3: Eliminando tablas existentes...');
        await db.sequelize.sync({ force: true });
        console.log('✅ Tablas eliminadas\n');

        // PASO 2: Recrear tablas
        console.log('🔄 Paso 2/3: Recreando tablas con nueva estructura...');
        await db.sequelize.sync();
        console.log('✅ Tablas recreadas\n');

        // PASO 3: Insertar datos de prueba (si se solicitó)
        if (withSeed) {
            console.log('🔄 Paso 3/3: Insertando datos de prueba...');
            await seedDatabase();
            console.log('✅ Datos insertados\n');
        } else {
            console.log('⏭️  Paso 3/3: Omitiendo datos de prueba\n');
        }

        // Mostrar resumen
        console.log('╔════════════════════════════════════════════╗');
        console.log('║          RESET COMPLETADO ✅               ║');
        console.log('╚════════════════════════════════════════════╝\n');

        const tables = Object.keys(db).filter(key => 
            key !== 'Sequelize' && key !== 'sequelize'
        );
        
        console.log('📋 Tablas creadas:');
        tables.forEach(table => console.log(`   ✓ ${table}`));
        console.log('');

        if (withSeed) {
            console.log('👤 Credenciales de prueba:');
            console.log('   Usuario: admin');
            console.log('   Contraseña: admin123');
            console.log('   Rol: administrador\n');
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR AL RESETEAR BASE DE DATOS:');
        console.error(error);
        process.exit(1);
    }
}

// Función para insertar datos de prueba
async function seedDatabase() {
    try {
        // 1. Usuario administrador
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const adminUser = await db.User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'administrador',
            userType: 'trabajador',
            dpi: '1234567890101'
        });
        console.log('   ✓ Usuario administrador creado');

        // 2. Usuario vendedor
        const sellerPassword = await bcrypt.hash('vendedor123', 12);
        const sellerUser = await db.User.create({
            username: 'vendedor',
            password: sellerPassword,
            role: 'vendedor',
            userType: 'trabajador',
            dpi: '2345678901012'
        });
        console.log('   ✓ Usuario vendedor creado');

        // 3. Trabajador
        await db.Worker.create({
            name: 'Juan Pérez',
            dpi: '1234567890101',
            birthDate: '1990-05-15',
            email: 'juan@farmacia.com',
            phone: '12345678',
            address: 'Ciudad de Guatemala',
            role: 'Administrador',
            userId: adminUser.id
        });
        console.log('   ✓ Trabajador creado');

        // 4. Cliente
        const client = await db.Client.create({
            name: 'María López',
            dpi: '9876543210101',
            birthDate: '1985-03-20',
            email: 'maria@cliente.com',
            phone: '87654321',
            address: 'Zona 10, Guatemala'
        });
        console.log('   ✓ Cliente creado');

        // 5. Productos
        const productos = [
            {
                name: 'Paracetamol 500mg',
                description: 'Analgésico y antipirético',
                price: 25.50,
                stock: 100,
                supplier: 'Farmacéuticos Unidos'
            },
            {
                name: 'Ibuprofeno 400mg',
                description: 'Antiinflamatorio',
                price: 18.00,
                stock: 80,
                supplier: 'Distribuidora Médica'
            },
            {
                name: 'Amoxicilina 500mg',
                description: 'Antibiótico',
                price: 45.00,
                stock: 60,
                supplier: 'Laboratorios SA'
            }
        ];

        const productosCreados = [];
        for (const prod of productos) {
            const product = await db.Product.create(prod);
            productosCreados.push(product);
        }
        console.log(`   ✓ ${productos.length} productos creados`);

        // 6. Lotes
        const lotes = [
            {
                productId: productosCreados[0].id,
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
            },
            {
                productId: productosCreados[1].id,
                batchNumber: 'LOT-2025-002',
                manufacturingDate: '2025-02-01',
                expirationDate: '2025-12-01', // Próximo a vencer
                quantity: 80,
                initialQuantity: 80,
                purchasePrice: 15.00,
                salePrice: 18.00,
                supplier: 'Distribuidora Médica',
                location: 'Bodega A',
                status: 'active'
            },
            {
                productId: productosCreados[2].id,
                batchNumber: 'LOT-2024-050',
                manufacturingDate: '2024-01-01',
                expirationDate: '2025-10-01', // Por vencer
                quantity: 60,
                initialQuantity: 60,
                purchasePrice: 35.00,
                salePrice: 45.00,
                supplier: 'Laboratorios SA',
                location: 'Bodega B',
                status: 'near_expiry'
            }
        ];

        for (const lote of lotes) {
            await db.Batch.create(lote);
        }
        console.log(`   ✓ ${lotes.length} lotes creados`);

        // 7. Factura de ejemplo
        const invoice = await db.Invoice.create({
            clientId: client.id,
            sellerDPI: '1234567890101',
            clientDPI: client.dpi,
            totalAmount: 255.00,
            paymentMethod: 'cash',
            date: new Date()
        });
        console.log('   ✓ Factura de ejemplo creada');

        // 8. Items de factura
        await db.InvoiceItem.create({
            invoiceId: invoice.id,
            productId: productosCreados[0].id,
            quantity: 10,
            unitPrice: 25.50,
            totalPrice: 255.00
        });
        console.log('   ✓ Items de factura creados');

        // 9. Actualizar stock
        await productosCreados[0].update({ stock: 90 });
        console.log('   ✓ Stock actualizado');

        // 10. Log de auditoría de ejemplo
        await db.AuditLog.create({
            userId: adminUser.id,
            action: 'CREATE',
            entity: 'Invoice',
            entityId: invoice.id,
            description: 'Factura de prueba creada',
            severity: 'low',
            status: 'success'
        });
        console.log('   ✓ Log de auditoría creado');

        return true;
    } catch (error) {
        console.error('   ❌ Error al insertar datos de prueba:', error.message);
        throw error;
    }
}

// Ejecutar reset
resetDatabase();