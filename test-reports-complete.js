const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Login como admin
async function login() {
  try {
    log('\n🔐 Intentando login...', 'blue');
    const response = await axios.post(`${API_URL}/users/login`, {
      email: 'admin@farmacia.com',
      password: 'Admin123!'
    });
    token = response.data.token;
    log('✅ Login exitoso', 'green');
    log(`   Usuario: ${response.data.user.firstName} ${response.data.user.lastName} (${response.data.user.role})`, 'blue');
    log(`   Token: ${token.substring(0, 30)}...`, 'blue');
    return true;
  } catch (error) {
    log('❌ Error en login: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Mensaje: ${error.response.data?.message || 'Sin mensaje'}`, 'red');
    }
    log('⚠️  Verifica que exista un usuario admin con email: admin@farmacia.com y password: Admin123!', 'yellow');
    return false;
  }
}

// Test Dashboard
async function testDashboard() {
  try {
    log('\n📊 Probando Dashboard...', 'blue');

    const periods = ['today', 'week', 'month'];

    for (const period of periods) {
      const response = await axios.get(`${API_URL}/reports/dashboard?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      log(`✅ Dashboard [${period}]:`, 'green');
      log(`   - Ventas Totales: Q${response.data.metrics.ventasTotales}`, 'magenta');
      log(`   - Transacciones: ${response.data.metrics.numeroTransacciones}`, 'magenta');
      log(`   - Productos Vendidos: ${response.data.metrics.productosVendidos}`, 'magenta');
      log(`   - Stock Bajo: ${response.data.metrics.stockBajo}`, 'magenta');
      log(`   - Próximos a Vencer: ${response.data.metrics.proximosAVencer}`, 'magenta');
      log(`   - Crecimiento: ${response.data.metrics.crecimiento}%`, 'magenta');
    }

    return true;
  } catch (error) {
    log('❌ Error en Dashboard: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// Test Reportes de Ventas
async function testSalesReports() {
  try {
    log('\n💰 Probando Reportes de Ventas...', 'blue');

    // Por producto
    const productResponse = await axios.get(`${API_URL}/reports/sales?groupBy=product&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Ventas por Producto: ${productResponse.data.results.length} productos`, 'green');

    // Por categoría
    const categoryResponse = await axios.get(`${API_URL}/reports/sales?groupBy=category`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Ventas por Categoría: ${categoryResponse.data.results.length} categorías`, 'green');

    // Por cliente
    const clientResponse = await axios.get(`${API_URL}/reports/sales?groupBy=client&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Ventas por Cliente: ${clientResponse.data.results.length} clientes`, 'green');

    return true;
  } catch (error) {
    log('❌ Error en Reportes de Ventas: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// Test Top Productos
async function testTopProducts() {
  try {
    log('\n🏆 Probando Top Productos...', 'blue');

    const response = await axios.get(`${API_URL}/reports/top-products?limit=10&sortBy=revenue`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Top 10 Productos más vendidos:`, 'green');
    response.data.topProducts.slice(0, 5).forEach((item, index) => {
      log(`   ${index + 1}. ${item.product.name}`, 'magenta');
      log(`      Cantidad: ${item.cantidadVendida} | Ingresos: Q${item.totalIngresos}`, 'magenta');
    });

    return true;
  } catch (error) {
    log('❌ Error en Top Productos: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

// Test Inventario
async function testInventory() {
  try {
    log('\n📦 Probando Reporte de Inventario...', 'blue');

    const response = await axios.get(`${API_URL}/reports/inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Inventario General:`, 'green');
    log(`   - Total Productos: ${response.data.metrics.totalProductos}`, 'magenta');
    log(`   - Valor Inventario: Q${response.data.metrics.valorInventario}`, 'magenta');
    log(`   - Stock Bajo: ${response.data.metrics.productosStockBajo}`, 'magenta');
    log(`   - Agotados: ${response.data.metrics.productosAgotados}`, 'magenta');
    log(`   - Con Lotes: ${response.data.metrics.productosConLotes}`, 'magenta');

    // Test con filtro de stock bajo
    const lowStockResponse = await axios.get(`${API_URL}/reports/inventory?stockStatus=low`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Productos con Stock Bajo: ${lowStockResponse.data.products.length}`, 'green');

    return true;
  } catch (error) {
    log('❌ Error en Inventario: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

// Test Productos por Vencer
async function testExpiringProducts() {
  try {
    log('\n⚠️  Probando Productos por Vencer...', 'blue');

    const response = await axios.get(`${API_URL}/reports/inventory/expiring?days=30`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Productos próximos a vencer (30 días):`, 'green');
    log(`   - Total Lotes: ${response.data.totalLotes}`, 'magenta');
    log(`   - Valor en Riesgo: Q${response.data.valorEnRiesgo}`, 'magenta');

    if (response.data.batches.length > 0) {
      log(`   Primeros 3 lotes:`, 'yellow');
      response.data.batches.slice(0, 3).forEach((batch, index) => {
        log(`   ${index + 1}. ${batch.product.name} - Lote: ${batch.batchNumber}`, 'magenta');
        log(`      Vence en: ${batch.daysUntilExpiry} días | Stock: ${batch.currentStock}`, 'magenta');
      });
    }

    return true;
  } catch (error) {
    log('❌ Error en Productos por Vencer: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

// Test Movimientos de Inventario
async function testInventoryMovements() {
  try {
    log('\n📋 Probando Movimientos de Inventario...', 'blue');

    const response = await axios.get(`${API_URL}/reports/inventory/movements?limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Movimientos de Inventario: ${response.data.movements.length} movimientos`, 'green');

    if (response.data.movements.length > 0) {
      log(`   Últimos 3 movimientos:`, 'yellow');
      response.data.movements.slice(0, 3).forEach((mov, index) => {
        log(`   ${index + 1}. ${mov.type} - ${mov.product?.name}`, 'magenta');
        log(`      Cantidad: ${mov.quantity} | Referencia: ${mov.reference}`, 'magenta');
      });
    }

    return true;
  } catch (error) {
    log('❌ Error en Movimientos: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

// Test Clientes
async function testClients() {
  try {
    log('\n👥 Probando Reporte de Clientes...', 'blue');

    const response = await axios.get(`${API_URL}/reports/clients?sortBy=revenue&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Análisis de Clientes:`, 'green');
    log(`   - Total Clientes: ${response.data.metrics.totalClientes}`, 'magenta');
    log(`   - Clientes Activos: ${response.data.metrics.clientesActivos}`, 'magenta');
    log(`   - Ingresos Totales: Q${response.data.metrics.ingresosTotales}`, 'magenta');

    if (response.data.clients.length > 0) {
      log(`   Top 3 Clientes:`, 'yellow');
      response.data.clients.slice(0, 3).forEach((client, index) => {
        const clientName = client.client
          ? `${client.client.firstName} ${client.client.lastName}`
          : 'Cliente Eliminado';
        log(`   ${index + 1}. ${clientName}`, 'magenta');
        log(`      Compras: ${client.numeroCompras} | Total: Q${client.totalGastado}`, 'magenta');
      });
    }

    return true;
  } catch (error) {
    log('❌ Error en Clientes: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

// Test Rendimiento Repartidores
async function testDeliveryPerformance() {
  try {
    log('\n🚚 Probando Rendimiento de Repartidores...', 'blue');

    const response = await axios.get(`${API_URL}/reports/delivery-performance`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Rendimiento de Repartidores: ${response.data.deliveryPersons.length} repartidores`, 'green');

    if (response.data.deliveryPersons.length > 0) {
      response.data.deliveryPersons.forEach((repartidor, index) => {
        const deliveryName = repartidor.deliveryPerson
          ? `${repartidor.deliveryPerson.firstName} ${repartidor.deliveryPerson.lastName}`
          : 'Repartidor Eliminado';
        log(`   ${index + 1}. ${deliveryName}`, 'magenta');
        log(`      Entregas: ${repartidor.totalEntregas} | Recaudado: Q${repartidor.totalRecaudado}`, 'magenta');
        log(`      Tiempo Promedio: ${repartidor.tiempoPromedioMinutos} min`, 'magenta');
      });
    }

    return true;
  } catch (error) {
    log('❌ Error en Rendimiento Repartidores: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

// Test Reporte Financiero
async function testFinancialReport() {
  try {
    log('\n💵 Probando Reporte Financiero...', 'blue');

    const response = await axios.get(`${API_URL}/reports/financial`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Reporte Financiero:`, 'green');
    log(`   - Ingresos Totales: Q${response.data.ingresosTotales}`, 'magenta');
    log(`   - Ventas Online: Q${response.data.ventasOnline}`, 'magenta');
    log(`   - Ventas Presenciales: Q${response.data.ventasPresenciales}`, 'magenta');
    log(`   - Ticket Promedio: Q${response.data.ticketPromedio}`, 'magenta');

    if (response.data.ingresosPorMetodo.length > 0) {
      log(`   Ingresos por Método:`, 'yellow');
      response.data.ingresosPorMetodo.forEach(metodo => {
        log(`   - ${metodo.metodo}: Q${metodo.total} (${metodo.cantidad} transacciones)`, 'magenta');
      });
    }

    return true;
  } catch (error) {
    log('❌ Error en Reporte Financiero: ' + error.message, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  log('═══════════════════════════════════════════════════════', 'blue');
  log('     🧪 PRUEBAS DEL MÓDULO DE REPORTES COMPLETO', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');

  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ No se pudo iniciar sesión. Abortando pruebas.', 'red');
    return;
  }

  const tests = [
    { name: 'Dashboard', fn: testDashboard },
    { name: 'Reportes de Ventas', fn: testSalesReports },
    { name: 'Top Productos', fn: testTopProducts },
    { name: 'Inventario', fn: testInventory },
    { name: 'Productos por Vencer', fn: testExpiringProducts },
    { name: 'Movimientos de Inventario', fn: testInventoryMovements },
    { name: 'Clientes', fn: testClients },
    { name: 'Rendimiento Repartidores', fn: testDeliveryPerformance },
    { name: 'Reporte Financiero', fn: testFinancialReport }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('                   📊 RESUMEN', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  log(`✅ Pruebas Exitosas: ${passed}`, 'green');
  log(`❌ Pruebas Fallidas: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📝 Total: ${tests.length}`, 'blue');
  log('═══════════════════════════════════════════════════════\n', 'blue');

  if (failed === 0) {
    log('🎉 ¡Todas las pruebas pasaron exitosamente!', 'green');
  } else {
    log('⚠️  Algunas pruebas fallaron. Revisa los mensajes de error arriba.', 'yellow');
  }
}

// Ejecutar
runAllTests().catch(error => {
  log('\n❌ Error fatal: ' + error.message, 'red');
  console.error(error);
});
