/**
 * Script para actualizar el rol de un usuario
 * @author Alexander Echeverria
 *
 * Uso: node update-user-role.js <user_id> <nuevo_rol>
 * Ejemplo: node update-user-role.js 1 admin
 */

const db = require('./app/config/db.config');
const { User } = db;

const validRoles = ['admin', 'vendedor', 'bodega', 'repartidor', 'cliente'];

async function updateUserRole() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.log('❌ Faltan argumentos');
      console.log('\n📖 Uso: node update-user-role.js <user_id> <nuevo_rol>');
      console.log('\n✅ Roles válidos:');
      console.log('   - admin');
      console.log('   - vendedor');
      console.log('   - bodega');
      console.log('   - repartidor');
      console.log('   - cliente');
      console.log('\n📝 Ejemplo: node update-user-role.js 1 admin');
      process.exit(1);
    }

    const userId = parseInt(args[0]);
    const newRole = args[1].toLowerCase();

    if (isNaN(userId)) {
      console.log('❌ El ID del usuario debe ser un número');
      process.exit(1);
    }

    if (!validRoles.includes(newRole)) {
      console.log(`❌ Rol inválido: "${newRole}"`);
      console.log('\n✅ Roles válidos:', validRoles.join(', '));
      process.exit(1);
    }

    // Buscar usuario
    const user = await User.findByPk(userId);

    if (!user) {
      console.log(`❌ Usuario con ID ${userId} no encontrado`);
      process.exit(1);
    }

    console.log(`\n🔍 Usuario encontrado:`);
    console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol actual: ${user.role || 'SIN ROL'}`);
    console.log(`   Nuevo rol: ${newRole}`);

    // Actualizar rol
    await user.update({ role: newRole });

    console.log('\n✅ Rol actualizado exitosamente');
    console.log('\n💡 Ahora el usuario puede:');

    if (newRole === 'admin') {
      console.log('   - Acceder a todas las funcionalidades');
      console.log('   - Gestionar usuarios');
      console.log('   - Ver y gestionar todos los pedidos');
    } else if (newRole === 'vendedor') {
      console.log('   - Ver y gestionar todos los pedidos');
      console.log('   - Actualizar estados de pedidos');
      console.log('   - Asignar repartidores');
    } else if (newRole === 'repartidor') {
      console.log('   - Ver pedidos de delivery');
      console.log('   - Actualizar estados de pedidos en camino');
    } else if (newRole === 'cliente') {
      console.log('   - Crear pedidos online');
      console.log('   - Ver sus propios pedidos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
updateUserRole();
