const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// ==================== AUTENTICACIÓN ====================

async function login() {
  try {
    log('\n🔐 Iniciando sesión...', 'blue');
    const response = await axios.post(`${API_URL}/users/login`, {
      email: 'admin@farmacia.com',
      password: 'Admin123!'
    });
    token = response.data.token;
    log('✅ Login exitoso', 'green');
    log(`   Usuario: ${response.data.user.firstName} ${response.data.user.lastName} (${response.data.user.role})`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Error en login: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Mensaje: ${error.response.data?.message || 'Sin mensaje'}`, 'red');
    }
    log('⚠️  Verifica que exista un usuario admin con email: admin@farmacia.com y password: Admin123!', 'yellow');
    return false;
  }
}

// ==================== REPORTES BÁSICOS ====================

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
    log(`❌ Error en Dashboard: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

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
    log(`❌ Error en Reportes de Ventas: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

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
    log(`❌ Error en Top Productos: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

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
    log(`❌ Error en Inventario: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

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
    log(`❌ Error en Productos por Vencer: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

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
    log(`❌ Error en Movimientos: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

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
    log(`❌ Error en Clientes: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

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
    log(`❌ Error en Rendimiento Repartidores: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

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
    log(`❌ Error en Reporte Financiero: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

// ==================== REPORTES AVANZADOS ====================

async function testTimePeriods() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('  🕐 PRUEBAS DE PERÍODOS DE TIEMPO', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  const periods = [
    { name: 'Por Hora', groupBy: 'hour' },
    { name: 'Por Día', groupBy: 'day' },
    { name: 'Por Semana', groupBy: 'week' },
    { name: 'Por Mes', groupBy: 'month' },
    { name: 'Por Trimestre', groupBy: 'quarter' },
    { name: 'Por Semestre', groupBy: 'semester' },
    { name: 'Por Año', groupBy: 'year' }
  ];

  try {
    for (const period of periods) {
      log(`\n📊 Probando: ${period.name} (${period.groupBy})...`, 'yellow');
      const response = await axios.get(
        `${API_URL}/reports/sales?groupBy=${period.groupBy}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const results = response.data.results;
      log(`✅ ${period.name}: ${results.length} resultados`, 'green');

      if (results.length > 0) {
        const firstResult = results[0];
        const keys = Object.keys(firstResult);
        log(`   Campos: ${keys.join(', ')}`, 'magenta');

        if (firstResult.total) {
          log(`   Primera entrada: ${firstResult.cantidad} transacciones, Total: Q${firstResult.total}`, 'magenta');
        }
      }
    }
    return true;
  } catch (error) {
    log(`❌ Error en Períodos de Tiempo: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Mensaje: ${error.response.data.message}`, 'red');
    }
    return false;
  }
}

async function testEconomicAnalysis() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('  💰 ANÁLISIS ECONÓMICO AVANZADO', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  try {
    log('📈 Obteniendo análisis económico...', 'yellow');
    const response = await axios.get(`${API_URL}/reports/economic-analysis`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;
    log('✅ Análisis económico obtenido exitosamente\n', 'green');

    // Resumen
    log('📊 RESUMEN DE VENTAS:', 'cyan');
    log(`   💵 Ventas Actuales: Q${data.resumen.ventasActuales}`, 'magenta');
    log(`   📉 Ventas Anteriores: Q${data.resumen.ventasAnteriores}`, 'magenta');
    log(`   📈 Crecimiento: ${data.resumen.crecimientoVentas}%`,
      parseFloat(data.resumen.crecimientoVentas) >= 0 ? 'green' : 'red');
    log(`   🛒 Transacciones: ${data.resumen.transaccionesActuales} (anterior: ${data.resumen.transaccionesAnteriores})`, 'magenta');
    log(`   🎫 Ticket Promedio: Q${data.resumen.ticketPromedioActual}`, 'magenta');

    // Ventas por día de semana
    if (data.ventasPorDiaSemana && data.ventasPorDiaSemana.length > 0) {
      log('\n📅 VENTAS POR DÍA DE LA SEMANA:', 'cyan');
      data.ventasPorDiaSemana.forEach(dia => {
        log(`   ${dia.dia}: ${dia.cantidad} ventas, Q${dia.total}`, 'magenta');
      });
    }

    // Horas pico
    if (data.horasPico && data.horasPico.length > 0) {
      log('\n⏰ HORAS PICO DE VENTA:', 'cyan');
      data.horasPico.forEach((hora, index) => {
        log(`   ${index + 1}. ${hora.hora} - ${hora.cantidad} ventas, Q${hora.total}`, 'magenta');
      });
    }

    // Top productos
    if (data.topProductos && data.topProductos.length > 0) {
      log('\n🏆 TOP 5 PRODUCTOS MÁS VENDIDOS:', 'cyan');
      data.topProductos.slice(0, 5).forEach((producto, index) => {
        log(`   ${index + 1}. ${producto.nombre}`, 'yellow');
        log(`      Categoría: ${producto.categoria} | Vendidos: ${producto.cantidadVendida} | Ingresos: Q${producto.ingresos}`, 'magenta');
      });
    }

    // Tendencia diaria (últimas 3 entradas)
    if (data.tendenciaDiaria && data.tendenciaDiaria.length > 0) {
      log('\n📉 TENDENCIA DIARIA (últimas 3 entradas):', 'cyan');
      data.tendenciaDiaria.slice(-3).forEach(dia => {
        log(`   ${dia.fecha}: ${dia.transacciones} trans, Q${dia.ventas}, Ticket Prom: Q${dia.ticketPromedio}`, 'magenta');
      });
    }

    return true;
  } catch (error) {
    log(`❌ Error en análisis económico: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Mensaje: ${error.response.data.message}`, 'red');
    }
    return false;
  }
}

async function testBestSalesDays() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  🏆 ANÁLISIS DE MEJORES DÍAS DE VENTA', 'cyan');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  try {
    log('📊 Obteniendo análisis de mejores días...', 'yellow');
    const response = await axios.get(`${API_URL}/reports/best-sales-days`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;
    log('✅ Análisis de mejores días obtenido\n', 'green');

    // Mejor día de la semana
    log('🥇 MEJOR DÍA DE LA SEMANA:', 'cyan');
    log(`   Día: ${data.mejorDiaSemana.dia}`, 'magenta');
    log(`   Ventas: Q${data.mejorDiaSemana.totalVentas}`, 'magenta');
    log(`   Transacciones: ${data.mejorDiaSemana.totalTransacciones}`, 'magenta');
    log(`   Promedio/Día: Q${data.mejorDiaSemana.promedioVentasPorDia}`, 'magenta');

    // Peor día
    if (data.peorDiaSemana) {
      log('\n📉 PEOR DÍA DE LA SEMANA:', 'cyan');
      log(`   Día: ${data.peorDiaSemana.dia}`, 'magenta');
      log(`   Ventas: Q${data.peorDiaSemana.totalVentas}`, 'magenta');
      log(`   Diferencia: ${data.diferenciaEntreExtremos}`, 'yellow');
    }

    // Ranking completo
    log('\n📊 RANKING DE DÍAS DE LA SEMANA:', 'cyan');
    data.rankingDiasSemana.slice(0, 3).forEach((dia, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      log(`   ${medal} ${dia.dia}: Q${dia.totalVentas} (${dia.totalTransacciones} trans)`, 'white');
    });

    // Top 3 días del mes
    if (data.mejoresDiasMes && data.mejoresDiasMes.length > 0) {
      log('\n📅 TOP 3 DÍAS DEL MES:', 'cyan');
      data.mejoresDiasMes.slice(0, 3).forEach((dia, index) => {
        log(`   ${index + 1}. Día ${dia.dia}: Q${dia.totalVentas} (${dia.totalTransacciones} trans)`, 'magenta');
      });
    }

    // Top 3 horas del día
    if (data.mejoresHorasDia && data.mejoresHorasDia.length > 0) {
      log('\n⏰ TOP 3 HORAS DEL DÍA:', 'cyan');
      data.mejoresHorasDia.slice(0, 3).forEach((hora, index) => {
        log(`   ${index + 1}. ${hora.hora}: Q${hora.totalVentas} (${hora.totalTransacciones} trans)`, 'magenta');
      });
    }

    // Mejor semana del mes
    if (data.mejorSemanaMes && data.mejorSemanaMes.length > 0) {
      log('\n📆 MEJOR SEMANA DEL MES:', 'cyan');
      const mejorSemana = data.mejorSemanaMes[0];
      log(`   ${mejorSemana.semana}: Q${mejorSemana.totalVentas}`, 'magenta');
    }

    // Recomendaciones
    if (data.recomendaciones && data.recomendaciones.length > 0) {
      log('\n💡 RECOMENDACIONES:', 'green');
      data.recomendaciones.slice(0, 3).forEach((rec, index) => {
        log(`   ${index + 1}. [${rec.tipo}] ${rec.mensaje}`, 'yellow');
      });
    }

    return true;
  } catch (error) {
    log(`❌ Error en mejores días: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

async function testWithDateRange() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('  📅 PRUEBA CON RANGO DE FECHAS', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  // Calcular fechas (último mes)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  log(`📆 Período: ${startDateStr} a ${endDateStr}`, 'yellow');

  try {
    // Test con análisis económico
    log('\n💰 Análisis económico con fechas...', 'yellow');
    const response = await axios.get(
      `${API_URL}/reports/economic-analysis?startDate=${startDateStr}&endDate=${endDateStr}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    log('✅ Análisis obtenido exitosamente', 'green');
    log(`   Ventas: Q${response.data.resumen.ventasActuales}`, 'magenta');
    log(`   Crecimiento: ${response.data.resumen.crecimientoVentas}%`, 'magenta');
    log(`   Tendencias diarias: ${response.data.tendenciaDiaria.length} días`, 'magenta');

    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

// ==================== EJECUTAR TODAS LAS PRUEBAS ====================

async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║  🧪 SUITE COMPLETA DE PRUEBAS DE REPORTES           ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ No se pudo iniciar sesión. Abortando pruebas.', 'red');
    return;
  }

  // Definir todas las pruebas
  const tests = [
    // REPORTES BÁSICOS
    { category: 'BÁSICOS', name: 'Dashboard', fn: testDashboard },
    { category: 'BÁSICOS', name: 'Reportes de Ventas', fn: testSalesReports },
    { category: 'BÁSICOS', name: 'Top Productos', fn: testTopProducts },
    { category: 'BÁSICOS', name: 'Inventario', fn: testInventory },
    { category: 'BÁSICOS', name: 'Productos por Vencer', fn: testExpiringProducts },
    { category: 'BÁSICOS', name: 'Movimientos de Inventario', fn: testInventoryMovements },
    { category: 'BÁSICOS', name: 'Clientes', fn: testClients },
    { category: 'BÁSICOS', name: 'Rendimiento Repartidores', fn: testDeliveryPerformance },
    { category: 'BÁSICOS', name: 'Reporte Financiero', fn: testFinancialReport },

    // REPORTES AVANZADOS
    { category: 'AVANZADOS', name: 'Períodos de Tiempo', fn: testTimePeriods },
    { category: 'AVANZADOS', name: 'Análisis Económico', fn: testEconomicAnalysis },
    { category: 'AVANZADOS', name: 'Mejores Días de Venta', fn: testBestSalesDays },
    { category: 'AVANZADOS', name: 'Prueba con Rango de Fechas', fn: testWithDateRange }
  ];

  let passed = 0;
  let failed = 0;
  const failedTests = [];

  // Ejecutar pruebas básicas
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║              📊 REPORTES BÁSICOS                      ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  for (const test of tests.filter(t => t.category === 'BÁSICOS')) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
      failedTests.push(test.name);
    }
  }

  // Ejecutar pruebas avanzadas
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║              📈 REPORTES AVANZADOS                    ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  for (const test of tests.filter(t => t.category === 'AVANZADOS')) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
      failedTests.push(test.name);
    }
  }

  // Resumen final
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║                  📊 RESUMEN FINAL                     ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  log('\n📈 ESTADÍSTICAS:', 'cyan');
  log(`   ✅ Pruebas Exitosas: ${passed}/${tests.length}`, 'green');
  log(`   ❌ Pruebas Fallidas: ${failed}/${tests.length}`, failed > 0 ? 'red' : 'green');
  log(`   📊 Porcentaje de Éxito: ${((passed / tests.length) * 100).toFixed(2)}%`, 'cyan');

  log('\n📋 DESGLOSE POR CATEGORÍA:', 'cyan');
  const basicTests = tests.filter(t => t.category === 'BÁSICOS');
  const basicPassed = basicTests.filter(t => !failedTests.includes(t.name)).length;
  log(`   📊 Básicos: ${basicPassed}/${basicTests.length} exitosas`, basicPassed === basicTests.length ? 'green' : 'yellow');

  const advancedTests = tests.filter(t => t.category === 'AVANZADOS');
  const advancedPassed = advancedTests.filter(t => !failedTests.includes(t.name)).length;
  log(`   📈 Avanzados: ${advancedPassed}/${advancedTests.length} exitosas`, advancedPassed === advancedTests.length ? 'green' : 'yellow');

  if (failedTests.length > 0) {
    log('\n⚠️  PRUEBAS FALLIDAS:', 'yellow');
    failedTests.forEach((testName, index) => {
      log(`   ${index + 1}. ${testName}`, 'red');
    });
  }

  log('\n═══════════════════════════════════════════════════════', 'blue');

  if (failed === 0) {
    log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!', 'green');
    log('✨ El sistema de reportes está funcionando perfectamente', 'green');
    log('\n📚 Funcionalidades disponibles:', 'cyan');
    log('   ✅ 9 Reportes básicos (Dashboard, Ventas, Productos, Inventario, etc.)', 'white');
    log('   ✅ 7 Períodos de tiempo (hora, día, semana, mes, trimestre, semestre, año)', 'white');
    log('   ✅ Análisis económico avanzado con comparaciones automáticas', 'white');
    log('   ✅ Identificación de mejores días de venta con recomendaciones', 'white');
    log('   ✅ Filtros por rangos de fechas personalizados', 'white');
  } else {
    log('\n⚠️  ALGUNAS PRUEBAS FALLARON', 'yellow');
    log('   Revisa los mensajes de error arriba para más detalles', 'yellow');
  }

  log('\n📖 Documentación:', 'cyan');
  log('   - GUIA_REPORTES_AVANZADOS.md', 'white');
  log('   - EJEMPLOS_FRONTEND_REPORTES.md', 'white');
  log('   - RESUMEN_SISTEMA_REPORTES_COMPLETO.md', 'white');

  log('\n');
}

// Ejecutar todas las pruebas
runAllTests().catch(error => {
  log('\n❌ Error fatal: ' + error.message, 'red');
  console.error(error);
  process.exit(1);
});
