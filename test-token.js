/**
 * Script para probar autenticación y permisos
 * Uso: node test-token.js TU_EMAIL TU_PASSWORD
 */

const axios = require('axios');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('\n❌ Uso: node test-token.js EMAIL PASSWORD\n');
  console.log('Ejemplo: node test-token.js admin@test.com 12345678\n');
  process.exit(1);
}

const BASE_URL = 'http://localhost:5000'; // Ajusta el puerto si es diferente

async function testAuthentication() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     🔐 PRUEBA DE AUTENTICACIÓN Y PERMISOS                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Login
    console.log('1️⃣  Intentando login...');
    console.log(`   Email: ${email}`);

    const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
      email,
      password
    });

    console.log('   ✅ Login exitoso!\n');

    const { token, user } = loginResponse.data;

    console.log('👤 DATOS DEL USUARIO:');
    console.log(`   • ID: ${user.id}`);
    console.log(`   • Nombre: ${user.firstName} ${user.lastName}`);
    console.log(`   • Email: ${user.email}`);
    console.log(`   • Rol: ${user.role}`);
    console.log(`   • Activo: ${user.isActive}\n`);

    console.log('🔑 TOKEN JWT:');
    console.log(`   ${token.substring(0, 50)}...`);
    console.log('');

    // Decodificar token (sin verificar)
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('📋 CONTENIDO DEL TOKEN:');
      console.log('   ', JSON.stringify(payload, null, 2).replace(/\n/g, '\n   '));
      console.log('');
    }

    // 2. Probar endpoint de pedidos
    console.log('2️⃣  Probando acceso a /api/orders...\n');

    try {
      const ordersResponse = await axios.get(`${BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('   ✅ ACCESO EXITOSO!\n');
      console.log('   📦 Respuesta:');
      console.log(`   • Total de pedidos: ${ordersResponse.data.total || ordersResponse.data.orders?.length || 0}`);
      console.log(`   • Página: ${ordersResponse.data.page || 1}`);
      console.log(`   • Pedidos en respuesta: ${ordersResponse.data.orders?.length || 0}\n`);

      if (ordersResponse.data.orders && ordersResponse.data.orders.length > 0) {
        console.log('   Primeros pedidos:');
        ordersResponse.data.orders.slice(0, 3).forEach(order => {
          console.log(`   • ${order.orderNumber} - ${order.status} - Q${order.total}`);
        });
      } else {
        console.log('   ℹ️  No hay pedidos en el sistema (esto es normal si es nuevo)');
      }

    } catch (ordersError) {
      console.log('   ❌ ERROR AL ACCEDER A /api/orders\n');

      if (ordersError.response) {
        console.log('   📛 Respuesta del servidor:');
        console.log(`   • Status: ${ordersError.response.status}`);
        console.log(`   • Mensaje: ${ordersError.response.data?.message || ordersError.response.data}`);
        console.log('');

        if (ordersError.response.status === 401) {
          console.log('   🔍 PROBLEMA: Token no válido o expirado');
          console.log('   💡 Posibles causas:');
          console.log('      1. El middleware de autenticación no está leyendo el token correctamente');
          console.log('      2. El secreto JWT no coincide');
          console.log('      3. El token expiró\n');
        } else if (ordersError.response.status === 403) {
          console.log('   🔍 PROBLEMA: Sin permisos');
          console.log('   💡 Posibles causas:');
          console.log('      1. El middleware de roles no está permitiendo tu rol');
          console.log('      2. Tu usuario tiene un rol diferente al esperado');
          console.log('      3. Hay un error en roleMiddleware\n');
        }
      } else {
        console.log('   ❌ Error de red o servidor no disponible');
        console.log(`   ${ordersError.message}\n`);
      }
    }

    // 3. Probar endpoint específico según rol
    console.log('\n3️⃣  Probando endpoints según tu rol...\n');

    if (user.role === 'cliente') {
      try {
        const myOrdersResponse = await axios.get(`${BASE_URL}/api/orders/my-orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`   ✅ /api/orders/my-orders: ${myOrdersResponse.data.orders?.length || 0} pedidos`);
      } catch (e) {
        console.log(`   ❌ /api/orders/my-orders: ${e.response?.data?.message || e.message}`);
      }
    }

    if (['admin', 'vendedor'].includes(user.role)) {
      try {
        const statsResponse = await axios.get(`${BASE_URL}/api/orders/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`   ✅ /api/orders/stats: ${statsResponse.data.total || 0} pedidos totales`);
      } catch (e) {
        console.log(`   ❌ /api/orders/stats: ${e.response?.data?.message || e.message}`);
      }
    }

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    📊 DIAGNÓSTICO                             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('✅ Login: OK');
    console.log('✅ Token generado: OK');
    console.log(`✅ Usuario: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log('');
    console.log('💡 COPIA ESTE TOKEN PARA USAR EN POSTMAN/FRONTEND:');
    console.log('');
    console.log(token);
    console.log('');

  } catch (error) {
    console.log('\n❌ ERROR EN LOGIN:\n');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Mensaje: ${error.response.data?.message || error.response.data}`);
      console.log('');

      if (error.response.status === 401) {
        console.log('   💡 Credenciales incorrectas o usuario no encontrado');
        console.log('   💡 Verifica el email y la contraseña\n');
      }
    } else {
      console.log(`   ${error.message}`);
      console.log('   💡 Asegúrate de que el servidor esté corriendo en:', BASE_URL);
      console.log('   💡 Ejecuta: npm start\n');
    }
  }
}

testAuthentication();
