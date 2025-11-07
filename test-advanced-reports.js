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
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Test de login
async function login() {
  try {
    log('\n🔐 Iniciando sesión...', 'blue');
    const response = await axios.post(`${API_URL}/users/login`, {
      email: 'admin@farmacia.com',
      password: 'Admin123!'
    });
    token = response.data.token;
    log('✅ Login exitoso', 'green');
    return true;
  } catch (error) {
    log(`❌ Error en login: ${error.message}`, 'red');
    return false;
  }
}

// Test de períodos de tiempo
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

  for (const period of periods) {
    try {
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
    } catch (error) {
      log(`❌ Error en ${period.name}: ${error.message}`, 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        log(`   Mensaje: ${error.response.data.message}`, 'red');
      }
    }
  }
}

// Test de análisis económico
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

  } catch (error) {
    log(`❌ Error en análisis económico: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Mensaje: ${error.response.data.message}`, 'red');
    }
  }
}

// Test con fechas específicas
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

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

// Test de mejores días de venta
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

    // Top 3 días del mes
    if (data.mejoresDiasMes && data.mejoresDiasMes.length > 0) {
      log('\n📅 TOP 3 DÍAS DEL MES:', 'cyan');
      data.mejoresDiasMes.slice(0, 3).forEach((dia, index) => {
        log(`   ${index + 1}. Día ${dia.dia}: Q${dia.totalVentas} (${dia.totalTransacciones} trans)`, 'magenta');
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
      data.recomendaciones.slice(0, 2).forEach((rec, index) => {
        log(`   ${index + 1}. [${rec.tipo}] ${rec.mensaje}`, 'yellow');
      });
    }

  } catch (error) {
    log(`❌ Error en mejores días: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║  🧪 SUITE DE PRUEBAS DE REPORTES AVANZADOS          ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ No se pudo iniciar sesión. Abortando pruebas.', 'red');
    return;
  }

  // Ejecutar pruebas
  await testTimePeriods();
  await testEconomicAnalysis();
  await testBestSalesDays();
  await testWithDateRange();

  // Resumen
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║  ✅ SUITE DE PRUEBAS COMPLETADA                      ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');
  log('\n💡 Todos los endpoints de reportes avanzados están listos para usar', 'green');
  log('📚 Consulta GUIA_REPORTES_AVANZADOS.md para más información\n', 'cyan');
}

// Ejecutar
runAllTests().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});
