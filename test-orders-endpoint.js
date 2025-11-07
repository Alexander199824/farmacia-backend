/**
 * Script para probar el endpoint de pedidos directamente
 */

const axios = require('axios');

async function testOrdersEndpoint() {
  try {
    console.log('🔍 Probando endpoint de pedidos...\n');

    // Primero hacer login
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/users/login', {
      email: 'admin@farmacia.com', // Cambia esto por tu usuario
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    // Obtener pedidos
    console.log('2️⃣ Obteniendo pedidos...');
    const ordersResponse = await axios.get('http://localhost:3000/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ Pedidos obtenidos: ${ordersResponse.data.orders.length}\n`);

    // Mostrar primeros 3 pedidos
    console.log('📋 Primeros pedidos:\n');
    ordersResponse.data.orders.slice(0, 3).forEach(order => {
      console.log(`Pedido: ${order.orderNumber}`);
      console.log(`  • deliveryType: ${order.deliveryType || 'UNDEFINED'}`);
      console.log(`  • status: ${order.status}`);
      console.log(`  • total: Q${order.total}`);
      console.log(`  • cliente: ${order.client?.firstName} ${order.client?.lastName}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testOrdersEndpoint();
