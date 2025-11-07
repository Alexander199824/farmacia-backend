/**
 * Script para ejecutar migraciones JS de Sequelize
 * Autor: Alexander Echeverria
 */

const db = require('../app/config/db.config');

async function runMigration() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('❌ Error: Debes proporcionar el nombre del archivo de migración');
    console.log('Uso: node migrations/run-js-migration.js <nombre-archivo>');
    process.exit(1);
  }

  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║              🔄 EJECUTANDO MIGRACIÓN JS                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log(`📄 Archivo: ${migrationFile}\n`);

    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    await db.sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Cargar el archivo de migración
    const migration = require(`./${migrationFile}`);

    if (!migration.up || typeof migration.up !== 'function') {
      throw new Error('El archivo de migración no tiene una función "up" válida');
    }

    // Ejecutar la migración
    console.log('🔄 Ejecutando migración UP...\n');
    await migration.up(db.sequelize.getQueryInterface(), db.Sequelize);

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║           ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

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
