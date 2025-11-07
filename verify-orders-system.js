/**
 * Script de Verificación del Sistema de Pedidos
 * Autor: Alexander Echeverria
 * Ejecutar: node verify-orders-system.js
 */

const db = require('./app/config/db.config');
const { Op } = db.Sequelize;

async function verifyOrdersSystem() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     🔍 VERIFICACIÓN DEL SISTEMA DE PEDIDOS                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Verificar conexión a BD
    console.log('📊 1. Verificando conexión a base de datos...');
    await db.sequelize.authenticate();
    console.log('   ✅ Conexión exitosa\n');

    // 2. Verificar que existan las tablas
    console.log('📋 2. Verificando tablas...');

    const [ordersTable] = await db.sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'orders'
    `);

    const [orderItemsTable] = await db.sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'order_items'
    `);

    if (ordersTable.length === 0) {
      console.log('   ❌ Tabla "orders" NO EXISTE');
      console.log('   💡 Ejecuta: node migrations/run-migration.js\n');
      return;
    } else {
      console.log('   ✅ Tabla "orders" existe');
    }

    if (orderItemsTable.length === 0) {
      console.log('   ❌ Tabla "order_items" NO EXISTE');
      console.log('   💡 Ejecuta: node migrations/run-migration.js\n');
      return;
    } else {
      console.log('   ✅ Tabla "order_items" existe\n');
    }

    // 3. Verificar productos activos
    console.log('🛍️  3. Verificando productos disponibles...');
    const productCount = await db.Product.count({
      where: { isActive: true, stock: { [Op.gt]: 0 } }
    });

    if (productCount === 0) {
      console.log('   ⚠️  NO hay productos activos con stock');
      console.log('   💡 Necesitas crear productos para poder hacer pedidos');
      console.log('   💡 Ejecuta el script SQL de productos de prueba\n');
    } else {
      console.log(`   ✅ Hay ${productCount} producto(s) disponible(s)\n`);

      // Mostrar algunos productos
      const products = await db.Product.findAll({
        where: { isActive: true, stock: { [Op.gt]: 0 } },
        limit: 5,
        attributes: ['id', 'name', 'sku', 'price', 'stock']
      });

      console.log('   📦 Productos disponibles:');
      products.forEach(p => {
        console.log(`      • ID: ${p.id} | ${p.name} (${p.sku}) - Q${p.price} | Stock: ${p.stock}`);
      });
      console.log('');
    }

    // 4. Verificar usuarios por rol
    console.log('👥 4. Verificando usuarios...');

    const roles = ['cliente', 'vendedor', 'repartidor', 'admin'];
    for (const role of roles) {
      const count = await db.User.count({ where: { role, isActive: true } });
      const icon = count > 0 ? '✅' : '⚠️';
      console.log(`   ${icon} ${role.padEnd(12)}: ${count} usuario(s)`);

      if (count === 0) {
        console.log(`      💡 Necesitas crear al menos un usuario con rol "${role}"`);
      }
    }
    console.log('');

    // 5. Verificar pedidos existentes
    console.log('📦 5. Verificando pedidos...');
    const orderCount = await db.Order.count();

    if (orderCount === 0) {
      console.log('   ℹ️  No hay pedidos en el sistema (esto es normal si es nuevo)\n');
    } else {
      console.log(`   ✅ Hay ${orderCount} pedido(s) en el sistema\n`);

      // Estadísticas por estado
      const statsByStatus = await db.Order.findAll({
        attributes: [
          'status',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      console.log('   📊 Pedidos por estado:');
      statsByStatus.forEach(stat => {
        console.log(`      • ${stat.status.padEnd(20)}: ${stat.count}`);
      });
      console.log('');

      // Estadísticas por tipo de entrega
      const statsByDelivery = await db.Order.findAll({
        attributes: [
          'deliveryType',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
        ],
        group: ['deliveryType'],
        raw: true
      });

      console.log('   📊 Pedidos por tipo de entrega:');
      statsByDelivery.forEach(stat => {
        console.log(`      • ${stat.deliveryType.padEnd(10)}: ${stat.count}`);
      });
      console.log('');

      // Últimos 5 pedidos
      const recentOrders = await db.Order.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'orderNumber', 'status', 'deliveryType', 'total', 'createdAt'],
        include: [
          {
            model: db.User,
            as: 'client',
            attributes: ['firstName', 'lastName']
          }
        ]
      });

      console.log('   📋 Últimos pedidos:');
      recentOrders.forEach(order => {
        console.log(`      • ${order.orderNumber} | ${order.status} | ${order.deliveryType} | Q${order.total} | ${order.client?.firstName} ${order.client?.lastName}`);
      });
      console.log('');
    }

    // 6. Verificar configuración de rutas
    console.log('🌐 6. Verificando configuración...');
    const env = require('./app/config/env');
    console.log(`   • Backend URL: http://localhost:${env.port || 3000}`);
    console.log(`   • Frontend URL: ${env.frontendUrl || 'http://localhost:3001'}`);
    console.log(`   • Entorno: ${env.nodeEnv || 'development'}\n`);

    // 7. Resumen y recomendaciones
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    📊 RESUMEN                                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const checks = {
      database: true,
      tables: ordersTable.length > 0 && orderItemsTable.length > 0,
      products: productCount > 0,
      users: await db.User.count({ where: { isActive: true } }) > 0,
      orders: orderCount >= 0
    };

    let allGood = true;
    for (const [key, value] of Object.entries(checks)) {
      const icon = value ? '✅' : '❌';
      console.log(`${icon} ${key.padEnd(12)}: ${value ? 'OK' : 'PROBLEMA'}`);
      if (!value) allGood = false;
    }

    console.log('\n');

    if (allGood) {
      console.log('🎉 TODO LISTO! El sistema de pedidos está correctamente configurado.\n');
      console.log('📝 PRÓXIMOS PASOS:');
      console.log('   1. Inicia el servidor: npm start');
      console.log('   2. Prueba crear un pedido desde Postman o el frontend');
      console.log('   3. Consulta la guía: DIAGNOSTICO_PEDIDOS_FRONTEND.md\n');
    } else {
      console.log('⚠️  HAY PROBLEMAS QUE RESOLVER:\n');

      if (!checks.tables) {
        console.log('❌ Tablas faltantes:');
        console.log('   💡 Ejecuta: node migrations/run-migration.js\n');
      }

      if (!checks.products) {
        console.log('❌ No hay productos:');
        console.log('   💡 Crea productos desde el panel de admin');
        console.log('   💡 O ejecuta el script SQL de productos de prueba\n');
      }

      if (!checks.users) {
        console.log('❌ No hay usuarios:');
        console.log('   💡 Crea usuarios desde la página de registro');
        console.log('   💡 O ejecuta el script SQL de usuarios de prueba\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR AL VERIFICAR EL SISTEMA:');
    console.error(error.message);
    console.error('\nDetalles:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Ejecutar verificación
verifyOrdersSystem();
