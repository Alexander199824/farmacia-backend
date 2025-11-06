/**
 * Migración: Hacer el campo supplierId opcional en la tabla products
 * Autor: Alexander Echeverria
 * Fecha: 2025-11-05
 *
 * IMPORTANTE: Este script modifica la base de datos en producción
 * Solo ejecutar UNA vez
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

async function migrate() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');

    console.log('\n🔄 Iniciando migración: supplierId opcional en products...');

    // Modificar la columna supplierId para permitir NULL
    await sequelize.query(`
      ALTER TABLE products
      ALTER COLUMN "supplierId" DROP NOT NULL;
    `);

    console.log('✅ Columna supplierId ahora permite valores NULL');

    // Verificar el cambio
    const [results] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'supplierId';
    `);

    console.log('\n📊 Estado actual de la columna:');
    console.table(results);

    if (results[0]?.is_nullable === 'YES') {
      console.log('\n✅ ¡Migración completada exitosamente!');
      console.log('Ahora puedes crear productos sin proveedor y agregarlo después.');
    } else {
      console.log('\n⚠️ La columna todavía no permite NULL. Verifica manualmente.');
    }

  } catch (error) {
    console.error('\n❌ Error durante la migración:');
    console.error(error.message);

    if (error.message.includes('column "supplierId" of relation "products" does not exist')) {
      console.log('\n⚠️ La columna supplierId no existe. Esto podría significar que:');
      console.log('   1. La tabla products no existe');
      console.log('   2. La columna tiene un nombre diferente');
    }

    if (error.message.includes('already allows NULL')) {
      console.log('\n✅ La columna ya permite valores NULL. No se necesita migración.');
    }

  } finally {
    await sequelize.close();
    console.log('\n🔒 Conexión cerrada');
  }
}

// Ejecutar migración
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  MIGRACIÓN: Hacer supplierId opcional en tabla products   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`📍 Base de datos: ${process.env.DB_NAME}`);
console.log(`📍 Host: ${process.env.DB_HOST}`);
console.log(`📍 Usuario: ${process.env.DB_USER}\n`);

migrate();
