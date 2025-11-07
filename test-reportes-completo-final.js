const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Estadísticas globales
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  failedTests: [],
  downloads: {
    total: 0,
    success: 0,
    failed: 0,
    files: []
  }
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
    }
    return false;
  }
}

// ==================== REPORTES BÁSICOS ====================

async function testDashboard() {
  stats.total++;
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
    }

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Dashboard');
    log(`❌ Error en Dashboard: ${error.message}`, 'red');
    return false;
  }
}

async function testSalesReports() {
  stats.total++;
  try {
    log('\n💰 Probando Reportes de Ventas...', 'blue');

    const productResponse = await axios.get(`${API_URL}/reports/sales?groupBy=product&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Ventas por Producto: ${productResponse.data.results.length} productos`, 'green');

    const categoryResponse = await axios.get(`${API_URL}/reports/sales?groupBy=category`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Ventas por Categoría: ${categoryResponse.data.results.length} categorías`, 'green');

    const clientResponse = await axios.get(`${API_URL}/reports/sales?groupBy=client&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Ventas por Cliente: ${clientResponse.data.results.length} clientes`, 'green');

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Reportes de Ventas');
    log(`❌ Error en Reportes de Ventas: ${error.message}`, 'red');
    return false;
  }
}

async function testTopProducts() {
  stats.total++;
  try {
    log('\n🏆 Probando Top Productos...', 'blue');

    const response = await axios.get(`${API_URL}/reports/top-products?limit=10&sortBy=revenue`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Top 10 Productos más vendidos:`, 'green');
    response.data.topProducts.slice(0, 3).forEach((item, index) => {
      log(`   ${index + 1}. ${item.product.name} - Q${item.totalIngresos}`, 'magenta');
    });

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Top Productos');
    log(`❌ Error en Top Productos: ${error.message}`, 'red');
    return false;
  }
}

async function testInventory() {
  stats.total++;
  try {
    log('\n📦 Probando Reporte de Inventario...', 'blue');

    const response = await axios.get(`${API_URL}/reports/inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Inventario General:`, 'green');
    log(`   - Total Productos: ${response.data.metrics.totalProductos}`, 'magenta');
    log(`   - Valor Inventario: Q${response.data.metrics.valorInventario}`, 'magenta');
    log(`   - Stock Bajo: ${response.data.metrics.productosStockBajo}`, 'magenta');

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Inventario');
    log(`❌ Error en Inventario: ${error.message}`, 'red');
    return false;
  }
}

async function testExpiringProducts() {
  stats.total++;
  try {
    log('\n⚠️  Probando Productos por Vencer...', 'blue');

    const response = await axios.get(`${API_URL}/reports/inventory/expiring?days=30`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Productos próximos a vencer (30 días):`, 'green');
    log(`   - Total Lotes: ${response.data.totalLotes}`, 'magenta');
    log(`   - Valor en Riesgo: Q${response.data.valorEnRiesgo}`, 'magenta');

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Productos por Vencer');
    log(`❌ Error en Productos por Vencer: ${error.message}`, 'red');
    return false;
  }
}

async function testInventoryMovements() {
  stats.total++;
  try {
    log('\n📋 Probando Movimientos de Inventario...', 'blue');

    const response = await axios.get(`${API_URL}/reports/inventory/movements?limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Movimientos de Inventario: ${response.data.movements.length} movimientos`, 'green');

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Movimientos de Inventario');
    log(`❌ Error en Movimientos: ${error.message}`, 'red');
    return false;
  }
}

async function testClients() {
  stats.total++;
  try {
    log('\n👥 Probando Reporte de Clientes...', 'blue');

    const response = await axios.get(`${API_URL}/reports/clients?sortBy=revenue&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Análisis de Clientes:`, 'green');
    log(`   - Total Clientes: ${response.data.metrics.totalClientes}`, 'magenta');
    log(`   - Clientes Activos: ${response.data.metrics.clientesActivos}`, 'magenta');
    log(`   - Ingresos Totales: Q${response.data.metrics.ingresosTotales}`, 'magenta');

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Clientes');
    log(`❌ Error en Clientes: ${error.message}`, 'red');
    return false;
  }
}

async function testDeliveryPerformance() {
  stats.total++;
  try {
    log('\n🚚 Probando Rendimiento de Repartidores...', 'blue');

    const response = await axios.get(`${API_URL}/reports/delivery-performance`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Rendimiento de Repartidores: ${response.data.deliveryPersons.length} repartidores`, 'green');

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Rendimiento Repartidores');
    log(`❌ Error en Rendimiento Repartidores: ${error.message}`, 'red');
    return false;
  }
}

async function testFinancialReport() {
  stats.total++;
  try {
    log('\n💵 Probando Reporte Financiero...', 'blue');

    const response = await axios.get(`${API_URL}/reports/financial`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(`✅ Reporte Financiero:`, 'green');
    log(`   - Ingresos Totales: Q${response.data.ingresosTotales}`, 'magenta');
    log(`   - Ventas Online: Q${response.data.ventasOnline}`, 'magenta');
    log(`   - Ticket Promedio: Q${response.data.ticketPromedio}`, 'magenta');

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Reporte Financiero');
    log(`❌ Error en Reporte Financiero: ${error.message}`, 'red');
    return false;
  }
}

// ==================== REPORTES AVANZADOS ====================

async function testTimePeriods() {
  stats.total++;
  log('\n═══════════════════════════════════════', 'cyan');
  log('  🕐 PERÍODOS DE TIEMPO', 'cyan');
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
      const response = await axios.get(
        `${API_URL}/reports/sales?groupBy=${period.groupBy}&limit=3`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      log(`✅ ${period.name}: ${response.data.results.length} resultados`, 'green');
    }
    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Períodos de Tiempo');
    log(`❌ Error en Períodos de Tiempo: ${error.message}`, 'red');
    return false;
  }
}

async function testEconomicAnalysis() {
  stats.total++;
  log('\n═══════════════════════════════════════', 'cyan');
  log('  💰 ANÁLISIS ECONÓMICO', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  try {
    const response = await axios.get(`${API_URL}/reports/economic-analysis`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;
    log('✅ Análisis económico obtenido\n', 'green');

    log('📊 RESUMEN:', 'cyan');
    log(`   💵 Ventas Actuales: Q${data.resumen.ventasActuales}`, 'magenta');
    log(`   📈 Crecimiento: ${data.resumen.crecimientoVentas}%`, 'magenta');
    log(`   🛒 Transacciones: ${data.resumen.transaccionesActuales}`, 'magenta');
    log(`   🎫 Ticket Promedio: Q${data.resumen.ticketPromedioActual}`, 'magenta');

    if (data.ventasPorDiaSemana && data.ventasPorDiaSemana.length > 0) {
      log(`\n📅 Ventas por día: ${data.ventasPorDiaSemana.length} días`, 'cyan');
    }

    if (data.horasPico && data.horasPico.length > 0) {
      log(`⏰ Horas pico: ${data.horasPico.length} horas analizadas`, 'cyan');
    }

    if (data.topProductos && data.topProductos.length > 0) {
      log(`🏆 Top productos: ${data.topProductos.length} productos`, 'cyan');
    }

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Análisis Económico');
    log(`❌ Error en Análisis Económico: ${error.message}`, 'red');
    return false;
  }
}

async function testBestSalesDays() {
  stats.total++;
  log('\n═══════════════════════════════════════', 'cyan');
  log('  🏆 MEJORES DÍAS DE VENTA', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  try {
    const response = await axios.get(`${API_URL}/reports/best-sales-days`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;
    log('✅ Análisis de mejores días obtenido\n', 'green');

    log('🥇 MEJOR DÍA DE LA SEMANA:', 'cyan');
    log(`   Día: ${data.mejorDiaSemana.dia}`, 'magenta');
    log(`   Ventas: Q${data.mejorDiaSemana.totalVentas}`, 'magenta');
    log(`   Transacciones: ${data.mejorDiaSemana.totalTransacciones}`, 'magenta');

    if (data.peorDiaSemana) {
      log(`\n📉 Peor día: ${data.peorDiaSemana.dia} (Q${data.peorDiaSemana.totalVentas})`, 'yellow');
      log(`   Diferencia: ${data.diferenciaEntreExtremos}`, 'yellow');
    }

    if (data.rankingDiasSemana) {
      log(`\n📊 Ranking completo: ${data.rankingDiasSemana.length} días`, 'cyan');
    }

    if (data.recomendaciones && data.recomendaciones.length > 0) {
      log(`\n💡 Recomendaciones: ${data.recomendaciones.length} sugerencias`, 'green');
    }

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Mejores Días de Venta');
    log(`❌ Error en Mejores Días: ${error.message}`, 'red');
    return false;
  }
}

async function testWithDateRange() {
  stats.total++;
  log('\n═══════════════════════════════════════', 'cyan');
  log('  📅 PRUEBA CON RANGO DE FECHAS', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  log(`📆 Período: ${startDateStr} a ${endDateStr}`, 'yellow');

  try {
    const response = await axios.get(
      `${API_URL}/reports/economic-analysis?startDate=${startDateStr}&endDate=${endDateStr}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    log('✅ Análisis con fechas obtenido', 'green');
    log(`   Ventas: Q${response.data.resumen.ventasActuales}`, 'magenta');

    stats.passed++;
    return true;
  } catch (error) {
    stats.failed++;
    stats.failedTests.push('Rango de Fechas');
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

// ==================== DESCARGAS ====================

async function downloadFile(url, fileName) {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });

    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, response.data);

    const fileSize = fs.statSync(filePath).size;

    stats.downloads.success++;
    stats.downloads.files.push({
      name: fileName,
      size: (fileSize / 1024).toFixed(2) + ' KB',
      path: filePath
    });

    return { success: true, size: fileSize };
  } catch (error) {
    stats.downloads.failed++;
    return { success: false, error: error.message };
  }
}

async function testDownloads() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'bgBlue');
  log('║           📥 PRUEBAS DE DESCARGA                     ║', 'bgBlue');
  log('╚═══════════════════════════════════════════════════════╝\n', 'bgBlue');

  const downloads = [
    {
      name: 'Reporte de Ventas - Excel',
      url: `${API_URL}/reports/download/sales?format=excel&groupBy=day`,
      fileName: 'reporte-ventas.xlsx'
    },
    {
      name: 'Reporte de Ventas - PDF',
      url: `${API_URL}/reports/download/sales?format=pdf&groupBy=day`,
      fileName: 'reporte-ventas.pdf'
    },
    {
      name: 'Análisis Económico - Excel',
      url: `${API_URL}/reports/download/economic-analysis?format=excel`,
      fileName: 'analisis-economico.xlsx'
    },
    {
      name: 'Análisis Económico - PDF',
      url: `${API_URL}/reports/download/economic-analysis?format=pdf`,
      fileName: 'analisis-economico.pdf'
    },
    {
      name: 'Mejores Días - Excel',
      url: `${API_URL}/reports/download/best-sales-days?format=excel`,
      fileName: 'mejores-dias.xlsx'
    },
    {
      name: 'Mejores Días - PDF',
      url: `${API_URL}/reports/download/best-sales-days?format=pdf`,
      fileName: 'mejores-dias.pdf'
    }
  ];

  stats.downloads.total = downloads.length;

  for (const download of downloads) {
    stats.total++;
    log(`\n📥 Descargando: ${download.name}...`, 'yellow');

    const result = await downloadFile(download.url, download.fileName);

    if (result.success) {
      log(`✅ Descargado: ${download.fileName}`, 'green');
      log(`   Tamaño: ${(result.size / 1024).toFixed(2)} KB`, 'magenta');
      stats.passed++;
    } else {
      log(`❌ Error: ${result.error}`, 'red');
      stats.failed++;
      stats.failedTests.push(download.name);
    }
  }
}

// ==================== EJECUTAR TODAS LAS PRUEBAS ====================

async function runAllTests() {
  const startTime = Date.now();

  log('\n╔═══════════════════════════════════════════════════════╗', 'bgGreen');
  log('║                                                       ║', 'bgGreen');
  log('║  🧪 SUITE COMPLETA DE PRUEBAS DE REPORTES           ║', 'bgGreen');
  log('║     (Básicos + Avanzados + Descargas)               ║', 'bgGreen');
  log('║                                                       ║', 'bgGreen');
  log('╚═══════════════════════════════════════════════════════╝', 'bgGreen');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ No se pudo iniciar sesión. Abortando pruebas.', 'red');
    return;
  }

  // ==================== REPORTES BÁSICOS ====================
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║              📊 REPORTES BÁSICOS (9)                  ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  await testDashboard();
  await testSalesReports();
  await testTopProducts();
  await testInventory();
  await testExpiringProducts();
  await testInventoryMovements();
  await testClients();
  await testDeliveryPerformance();
  await testFinancialReport();

  // ==================== REPORTES AVANZADOS ====================
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║           📈 REPORTES AVANZADOS (4)                   ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  await testTimePeriods();
  await testEconomicAnalysis();
  await testBestSalesDays();
  await testWithDateRange();

  // ==================== DESCARGAS ====================
  await testDownloads();

  // ==================== RESUMEN FINAL ====================
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n\n');
  log('╔═══════════════════════════════════════════════════════╗', 'bgYellow');
  log('║                                                       ║', 'bgYellow');
  log('║              📊 RESUMEN FINAL COMPLETO                ║', 'bgYellow');
  log('║                                                       ║', 'bgYellow');
  log('╚═══════════════════════════════════════════════════════╝', 'bgYellow');

  log('\n📈 ESTADÍSTICAS GENERALES:', 'cyan');
  log(`   ✅ Pruebas Exitosas: ${stats.passed}/${stats.total}`, 'green');
  log(`   ❌ Pruebas Fallidas: ${stats.failed}/${stats.total}`, stats.failed > 0 ? 'red' : 'green');
  log(`   📊 Porcentaje de Éxito: ${((stats.passed / stats.total) * 100).toFixed(2)}%`, 'cyan');
  log(`   ⏱️  Tiempo Total: ${duration}s`, 'cyan');

  log('\n📋 DESGLOSE POR CATEGORÍA:', 'cyan');
  log('   📊 Reportes Básicos: 9 pruebas', 'white');
  log('   📈 Reportes Avanzados: 4 pruebas', 'white');
  log('   📥 Descargas: 6 archivos (3 reportes × 2 formatos)', 'white');

  log('\n📥 ESTADÍSTICAS DE DESCARGAS:', 'cyan');
  log(`   ✅ Descargas Exitosas: ${stats.downloads.success}/${stats.downloads.total}`, 'green');
  log(`   ❌ Descargas Fallidas: ${stats.downloads.failed}/${stats.downloads.total}`, stats.downloads.failed > 0 ? 'red' : 'green');

  if (stats.downloads.files.length > 0) {
    log('\n📁 ARCHIVOS DESCARGADOS:', 'cyan');
    stats.downloads.files.forEach((file, index) => {
      log(`   ${index + 1}. ${file.name}`, 'white');
      log(`      Tamaño: ${file.size}`, 'magenta');
    });
    log(`\n   📂 Ubicación: ${__dirname}`, 'yellow');
  }

  if (stats.failedTests.length > 0) {
    log('\n⚠️  PRUEBAS FALLIDAS:', 'yellow');
    stats.failedTests.forEach((testName, index) => {
      log(`   ${index + 1}. ${testName}`, 'red');
    });
  }

  log('\n═══════════════════════════════════════════════════════', 'blue');

  if (stats.failed === 0) {
    log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!', 'green');
    log('✨ El sistema de reportes está funcionando perfectamente', 'green');

    log('\n📚 FUNCIONALIDADES VERIFICADAS:', 'cyan');
    log('   ✅ 9 Reportes básicos completos', 'white');
    log('   ✅ 7 Períodos de tiempo (hora, día, semana, mes, trimestre, semestre, año)', 'white');
    log('   ✅ Análisis económico avanzado con comparaciones', 'white');
    log('   ✅ Identificación de mejores días de venta', 'white');
    log('   ✅ Filtros por rangos de fechas', 'white');
    log('   ✅ Descarga en Excel (.xlsx)', 'white');
    log('   ✅ Descarga en PDF (.pdf)', 'white');

    log('\n📖 DOCUMENTACIÓN:', 'cyan');
    log('   - RESUMEN_SISTEMA_REPORTES_COMPLETO.md', 'white');
    log('   - GUIA_REPORTES_AVANZADOS.md', 'white');
    log('   - GUIA_DESCARGAS_REPORTES.md', 'white');
    log('   - RESUMEN_DESCARGAS_IMPLEMENTADAS.md', 'white');

  } else {
    log('\n⚠️  ALGUNAS PRUEBAS FALLARON', 'yellow');
    log('   Revisa los mensajes de error arriba para más detalles', 'yellow');
    log('   Verifica que el servidor esté corriendo en http://localhost:5000', 'yellow');
    log('   Asegúrate de que la base de datos tenga datos de prueba', 'yellow');
  }

  log('\n🚀 PRÓXIMOS PASOS:', 'cyan');
  log('   1. Abre los archivos Excel y PDF descargados', 'white');
  log('   2. Verifica el formato y contenido de los reportes', 'white');
  log('   3. Integra los endpoints en tu frontend', 'white');
  log('   4. Personaliza las plantillas según tu marca', 'white');

  log('\n');
}

// Ejecutar todas las pruebas
runAllTests().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
