/**
 * Script para verificar y actualizar el rol de un usuario
 * @author Alexander Echeverria
 */

const db = require('./app/config/db.config');
const { User } = db;

async function checkAndUpdateUserRole() {
  try {
    console.log('🔍 Buscando usuarios en la base de datos...\n');

    // Obtener todos los usuarios
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      order: [['id', 'ASC']]
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      console.log('\n💡 Sugerencia: Crea un usuario administrador primero');
      process.exit(0);
    }

    console.log('📋 Usuarios encontrados:\n');
    users.forEach(user => {
      console.log(`  [${user.id}] ${user.firstName} ${user.lastName}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Rol: ${user.role || 'SIN ROL'}`);
      console.log('');
    });

    // Verificar si hay al menos un admin
    const admins = users.filter(u => u.role === 'admin');
    const vendedores = users.filter(u => u.role === 'vendedor');

    console.log(`\n📊 Resumen:`);
    console.log(`   Admins: ${admins.length}`);
    console.log(`   Vendedores: ${vendedores.length}`);
    console.log(`   Total usuarios: ${users.length}`);

    if (admins.length === 0) {
      console.log('\n⚠️  No hay usuarios con rol "admin"');
      console.log('💡 Puedes actualizar un usuario con el siguiente comando SQL:');
      console.log(`   UPDATE users SET role = 'admin' WHERE id = 1;`);
    }

    if (vendedores.length === 0) {
      console.log('\n⚠️  No hay usuarios con rol "vendedor"');
      console.log('💡 Puedes actualizar un usuario con el siguiente comando SQL:');
      console.log(`   UPDATE users SET role = 'vendedor' WHERE id = 2;`);
    }

    console.log('\n✅ Para actualizar un usuario, usa el script update-user-role.js');
    console.log('   Ejemplo: node update-user-role.js <user_id> <nuevo_rol>');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
checkAndUpdateUserRole();
