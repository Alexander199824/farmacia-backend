/**
 * Migración: Hacer el campo supplierId opcional en la tabla batches
 * Fecha: 2025-11-05
 * Autor: Alexander Echeverria
 *
 * Descripción:
 * - Cambia el campo supplierId de NOT NULL a NULL en la tabla batches
 * - Permite crear lotes sin proveedor cuando el producto tampoco tiene proveedor
 * - El invoiceNumber siempre ha sido opcional y sigue siéndolo
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configuración de la base de datos desde variables de entorno
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function migrate() {
  try {
    console.log('🔄 Iniciando migración: Hacer supplierId opcional en batches...\n');

    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.\n');

    // Ejecutar la migración
    await sequelize.query(`
      ALTER TABLE batches
      ALTER COLUMN "supplierId" DROP NOT NULL;
    `);

    console.log('✅ Columna "supplierId" ahora es opcional (NULL permitido).\n');

    // Actualizar el comentario de la columna
    await sequelize.query(`
      COMMENT ON COLUMN batches."supplierId" IS
      'Proveedor (opcional - productos pueden no tener proveedor)';
    `);

    console.log('✅ Comentario de la columna actualizado.\n');

    // Verificar el cambio
    const [results] = await sequelize.query(`
      SELECT
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'batches'
      AND column_name IN ('supplierId', 'invoiceNumber')
      ORDER BY column_name;
    `);

    console.log('📊 Estado actual de las columnas:\n');
    console.table(results);

    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n📝 Resumen de cambios:');
    console.log('   - supplierId: Ahora es OPCIONAL (puede ser NULL)');
    console.log('   - invoiceNumber: Sigue siendo OPCIONAL (puede ser NULL)');
    console.log('\n💡 Reglas de negocio:');
    console.log('   1. Si el producto tiene proveedor → el lote DEBE tener el mismo proveedor');
    console.log('   2. Si el producto NO tiene proveedor → el lote NO debe tener proveedor');
    console.log('   3. El recibo (invoiceNumber) es SIEMPRE opcional, independientemente del proveedor\n');

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar migración
migrate();
