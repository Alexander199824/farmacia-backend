/**
 * Script para agregar valor al ENUM de status
 * Autor: Alexander Echeverria
 */

const db = require('../app/config/db.config');

async function addEnumValue() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║       🔄 Agregando listo_para_envio al ENUM status      ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    await db.sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    console.log('📝 Ejecutando ALTER TYPE...\n');

    // Agregar el nuevo valor al ENUM
    await db.sequelize.query(`
      ALTER TYPE enum_orders_status ADD VALUE IF NOT EXISTS 'listo_para_envio' AFTER 'listo_para_recoger';
    `);

    console.log('✅ Valor listo_para_envio agregado al ENUM exitosamente\n');

    console.log('📊 Verificando valores del ENUM...\n');

    // Verificar los valores del ENUM
    const [results] = await db.sequelize.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_orders_status')
      ORDER BY enumsortorder;
    `);

    console.log('Valores actuales del ENUM enum_orders_status:');
    results.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.enumlabel}`);
    });

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║           ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR EN LA MIGRACIÓN:');
    console.error(error.message);

    // Si el error es porque el valor ya existe, es OK
    if (error.message.includes('already exists')) {
      console.log('\n✅ El valor listo_para_envio ya existe en el ENUM\n');
      process.exit(0);
    } else {
      console.error('\nDetalles:', error);
      process.exit(1);
    }
  }
}

// Ejecutar
addEnumValue();
