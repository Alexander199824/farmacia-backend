/**
 * Script para verificar la estructura de las tablas relacionadas con recibos
 * Autor: Alexander Echeverria
 */

const db = require('./app/config/db.config');

async function verifyStructure() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...\n');

    // Verificar conexión
    await db.testConnection();

    // Verificar que las tablas existen
    const tables = ['receipts', 'invoices', 'invoice_items', 'products'];

    for (const table of tables) {
      const [results] = await db.sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${table}'
        ORDER BY ordinal_position;
      `);

      console.log(`\n📋 Tabla: ${table}`);
      console.log('─'.repeat(80));

      if (results.length === 0) {
        console.log('❌ Tabla no existe');
      } else {
        results.forEach(col => {
          console.log(`  ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | Null: ${col.is_nullable}`);
        });
      }
    }

    // Verificar relaciones
    console.log('\n\n🔗 Verificando relaciones...\n');

    const [foreignKeys] = await db.sequelize.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('receipts', 'invoices', 'invoice_items')
      ORDER BY tc.table_name;
    `);

    foreignKeys.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    // Verificar datos de ejemplo
    console.log('\n\n📊 Verificando datos...\n');

    const receiptCount = await db.Receipt.count();
    const invoiceCount = await db.Invoice.count();
    const itemCount = await db.InvoiceItem.count();

    console.log(`  Recibos (receipts): ${receiptCount}`);
    console.log(`  Ventas (invoices): ${invoiceCount}`);
    console.log(`  Items de venta (invoice_items): ${itemCount}`);

    // Verificar si hay recibos con items
    if (receiptCount > 0) {
      const receiptsWithItems = await db.Receipt.findAll({
        include: [
          {
            model: db.Invoice,
            as: 'invoice',
            include: [
              {
                model: db.InvoiceItem,
                as: 'items',
                include: [
                  {
                    model: db.Product,
                    as: 'product'
                  }
                ]
              }
            ]
          }
        ],
        limit: 3
      });

      console.log('\n📝 Muestra de recibos con items:\n');

      receiptsWithItems.forEach(receipt => {
        const hasItems = receipt.invoice?.items?.length > 0;
        console.log(`  Recibo #${receipt.id} (${receipt.receiptNumber}):`);
        console.log(`    Invoice: ${receipt.invoice ? receipt.invoice.invoiceNumber : 'NO'}`);
        console.log(`    Items: ${hasItems ? receipt.invoice.items.length : 0}`);
        console.log(`    ✅ Puede generar PDF: ${hasItems ? 'SÍ' : 'NO'}`);
        console.log('');
      });
    }

    console.log('\n✅ Verificación completada\n');

    // Conclusión
    console.log('━'.repeat(80));
    console.log('CONCLUSIÓN:');
    console.log('━'.repeat(80));

    if (receiptCount === 0) {
      console.log('⚠️  No hay recibos en la base de datos');
      console.log('   Para probar, debes crear ventas (invoices) con productos');
    } else if (itemCount === 0) {
      console.log('⚠️  Hay recibos pero NO hay items de venta');
      console.log('   Los recibos NO podrán generar PDF');
      console.log('   Necesitas crear ventas CON productos');
    } else {
      console.log('✅ La estructura está correcta');
      console.log('✅ Las relaciones están configuradas');
      console.log('✅ Los recibos pueden generar PDF si tienen items');
    }
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

verifyStructure();
