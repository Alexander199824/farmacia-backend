/**
 * Script para ejecutar migración de tablas de pedidos
 * Autor: Alexander Echeverria
 * Fecha: 2025-11-06
 */

const fs = require('fs');
const path = require('path');
const db = require('../app/config/db.config');

async function runMigration() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║       🔄 MIGRACION: Crear Tablas de Pedidos            ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    await db.sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create-orders-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Ejecutando migración SQL...\n');

    // Ejecutar el SQL
    await db.sequelize.query(sql);

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║           ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('Tablas creadas:');
    console.log('  ✅ orders');
    console.log('  ✅ order_items\n');

    console.log('Puedes iniciar el servidor normalmente con: npm start\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR EN LA MIGRACIÓN:');
    console.error(error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

// Ejecutar migración
runMigration();
