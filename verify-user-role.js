/**
 * Script para verificar el rol de un usuario
 * Autor: Alexander Echeverria
 */

const db = require('./app/config/db.config');

async function verifyUserRole() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║         🔍 VERIFICADOR DE ROLES DE USUARIO              ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    await db.sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Obtener el email del usuario desde argumentos de línea de comando
    const email = process.argv[2];

    if (!email) {
      console.log('ℹ️  Mostrando todos los usuarios...\n');

      // Listar todos los usuarios disponibles
      console.log('📋 Usuarios disponibles en la base de datos:\n');
      const allUsers = await db.User.findAll({
        attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive'],
        order: [['role', 'ASC'], ['firstName', 'ASC']]
      });

      if (allUsers.length === 0) {
        console.log('  ❌ No hay usuarios en la base de datos\n');
        process.exit(1);
      }

      console.log(`  ${'Estado'.padEnd(8)} | ${'Rol'.padEnd(12)} | ${'Nombre'.padEnd(25)} | Email`);
      console.log(`  ${'-'.repeat(8)} | ${'-'.repeat(12)} | ${'-'.repeat(25)} | ${'-'.repeat(30)}`);

      allUsers.forEach(u => {
        const status = u.isActive ? '✅ Activo' : '❌ Inact.';
        const role = u.role.padEnd(12);
        const name = `${u.firstName} ${u.lastName}`.padEnd(25);
        console.log(`  ${status} | ${role} | ${name} | ${u.email}`);
      });

      console.log('\n💡 Tip: Para ver detalles de un usuario específico, usa:');
      console.log('   node verify-user-role.js <email>\n');

      process.exit(0);
    }

    // Buscar el usuario
    const user = await db.User.findOne({
      where: { email },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive']
    });

    if (!user) {
      console.log(`❌ No se encontró usuario con email: ${email}\n`);

      // Listar todos los usuarios disponibles
      console.log('📋 Usuarios disponibles en la base de datos:\n');
      const allUsers = await db.User.findAll({
        attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive'],
        order: [['role', 'ASC']]
      });

      allUsers.forEach(u => {
        console.log(`  ${u.isActive ? '✅' : '❌'} [${u.role}] ${u.firstName} ${u.lastName} - ${u.email}`);
      });
      console.log('');

      process.exit(1);
    }

    // Mostrar información del usuario
    console.log('✅ Usuario encontrado:\n');
    console.log('  🆔 ID:', user.id);
    console.log('  📧 Email:', user.email);
    console.log('  👤 Nombre:', `${user.firstName} ${user.lastName}`);
    console.log('  🎭 Rol:', user.role);
    console.log('  🟢 Activo:', user.isActive ? 'Sí' : 'No');
    console.log('');

    // Verificar si el rol es válido
    const validRoles = ['admin', 'vendedor', 'bodega', 'repartidor', 'cliente'];
    if (!validRoles.includes(user.role)) {
      console.log('⚠️  ADVERTENCIA: El rol no es válido');
      console.log('   Roles válidos:', validRoles.join(', '));
      console.log('');
    }

    // Verificar permisos específicos
    console.log('📋 Permisos para actualizar estado de pedidos:');
    const canUpdateOrderStatus = ['admin', 'vendedor', 'repartidor'].includes(user.role);
    console.log(`  ${canUpdateOrderStatus ? '✅' : '❌'} Puede actualizar estado de pedidos`);

    if (user.role === 'repartidor') {
      console.log('  ✅ Puede cambiar de "listo_para_envio" a "en_camino"');
      console.log('  ✅ Puede cambiar de "en_camino" a "entregado"');
    }
    console.log('');

    // Verificar pedidos asignados (solo para repartidores)
    if (user.role === 'repartidor') {
      const activeOrders = await db.Order.count({
        where: {
          deliveryPersonId: user.id,
          status: ['listo_para_envio', 'en_camino']
        }
      });

      console.log('📦 Pedidos asignados:');
      console.log(`  🚚 Pedidos activos: ${activeOrders}`);
      console.log('');
    }

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              ✅ VERIFICACIÓN COMPLETADA                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

// Ejecutar verificación
verifyUserRole();
