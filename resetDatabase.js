/**
 * @author Alexander Echeverria
 * @file resetDatabase.js
 * @description Script para resetear y poblar la base de datos
 * @location resetDatabase.js
 */

require('dotenv').config();
const db = require('./app/config/db.config.js');

const shouldSeed = process.argv.includes('--seed');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║   RESET DE BASE DE DATOS - FARMACIA        ║');
console.log('╚════════════════════════════════════════════╝\n');

if (shouldSeed) {
    console.log('📦 Modo: RESET CON USUARIOS POR DEFECTO\n');
} else {
    console.log('⚠️  Modo: SOLO RESET (sin crear usuarios)');
    console.log('💡 Usa: node resetDatabase.js --seed para crear usuarios\n');
}

async function resetDatabase() {
    try {
        // Paso 1: Conectar
        console.log('🔌 Conectando a la base de datos...');
        await db.sequelize.authenticate();
        console.log('✅ Conexión establecida\n');

        // Paso 2: Recrear tablas (force: true elimina y recrea)
        console.log('🔄 Recreando tablas (esto eliminará todos los datos)...');
        await db.sequelize.sync({ force: true });
        console.log('✅ Tablas recreadas\n');

        // Paso 3: Crear usuarios por defecto (si --seed)
        if (shouldSeed) {
            console.log('🔄 Creando usuarios por defecto...\n');
            
            const users = [
                {
                    email: 'admin@farmacia.com',
                    password: 'Admin123!',
                    firstName: 'Administrador',
                    lastName: 'Sistema',
                    role: 'admin',
                    dpi: '1111111111111',
                    nit: '1111111-1',
                    phone: '1111-1111',
                    address: 'Ciudad de Guatemala, Zona 1',
                    birthDate: '1990-01-01',
                    isActive: true
                },
                {
                    email: 'vendedor@farmacia.com',
                    password: 'Vendedor123!',
                    firstName: 'Juan',
                    lastName: 'Pérez Vendedor',
                    role: 'vendedor',
                    dpi: '2222222222222',
                    nit: '2222222-2',
                    phone: '2222-2222',
                    address: 'Ciudad de Guatemala, Zona 10',
                    birthDate: '1995-05-15',
                    isActive: true
                },
                {
                    email: 'bodega@farmacia.com',
                    password: 'Bodega123!',
                    firstName: 'Carlos',
                    lastName: 'López Bodega',
                    role: 'bodega',
                    dpi: '3333333333333',
                    nit: '3333333-3',
                    phone: '3333-3333',
                    address: 'Ciudad de Guatemala, Zona 12',
                    birthDate: '1992-08-20',
                    isActive: true
                },
                {
                    email: 'cliente@farmacia.com',
                    password: 'Cliente123!',
                    firstName: 'María',
                    lastName: 'García Cliente',
                    role: 'cliente',
                    dpi: '9876543210101',
                    nit: 'CF',
                    phone: '4444-4444',
                    address: 'Ciudad de Guatemala, Zona 15',
                    birthDate: '1988-03-10',
                    isActive: true
                }
            ];

            for (const userData of users) {
                const user = await db.User.create(userData);
                console.log(`   ✓ Usuario ${user.role.toUpperCase()} creado (ID: ${user.id})`);
            }
            
            console.log('\n✅ Usuarios creados\n');
        }

        // Resumen final
        console.log('╔════════════════════════════════════════════╗');
        console.log('║          RESET COMPLETADO ✅               ║');
        console.log('╚════════════════════════════════════════════╝\n');

        // Listar tablas creadas
        const tables = await db.sequelize.getQueryInterface().showAllTables();
        console.log('📋 Tablas creadas:');
        tables.forEach(table => console.log(`   ✓ ${table}`));
        console.log('');

        // Mostrar credenciales si se crearon usuarios
        if (shouldSeed) {
            console.log('╔════════════════════════════════════════════╗');
            console.log('║        👤 CREDENCIALES DE ACCESO          ║');
            console.log('╚════════════════════════════════════════════╝\n');

            console.log('🔐 ADMINISTRADOR:');
            console.log('   📧 Email: admin@farmacia.com');
            console.log('   🔑 Contraseña: Admin123!');
            console.log('   👤 Rol: admin\n');

            console.log('🔐 VENDEDOR:');
            console.log('   📧 Email: vendedor@farmacia.com');
            console.log('   🔑 Contraseña: Vendedor123!');
            console.log('   👤 Rol: vendedor\n');

            console.log('🔐 BODEGA:');
            console.log('   📧 Email: bodega@farmacia.com');
            console.log('   🔑 Contraseña: Bodega123!');
            console.log('   👤 Rol: bodega\n');

            console.log('🔐 CLIENTE:');
            console.log('   📧 Email: cliente@farmacia.com');
            console.log('   🔑 Contraseña: Cliente123!');
            console.log('   👤 Rol: cliente\n');
        }

        console.log('💡 Ahora puedes iniciar el servidor con: npm start\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR AL RESETEAR BASE DE DATOS:');
        console.error(error.message);
        console.error('\n📋 Detalles completos:');
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar
resetDatabase();