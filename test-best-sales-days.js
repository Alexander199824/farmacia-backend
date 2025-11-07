const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

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

async function testBestSalesDays() {
  try {
    log('\n╔═══════════════════════════════════════════════════════╗', 'cyan');
    log('║     🏆 ANÁLISIS DE MEJORES DÍAS DE VENTA            ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════╝\n', 'cyan');

    // Login
    log('🔐 Iniciando sesión...', 'blue');
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      email: 'admin@farmacia.com',
      password: 'Admin123!'
    });
    const token = loginResponse.data.token;
    log('✅ Login exitoso\n', 'green');

    // Obtener análisis de mejores días
    log('📊 Obteniendo análisis de mejores días de venta...', 'yellow');
    const response = await axios.get(`${API_URL}/reports/best-sales-days`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;
    log('✅ Análisis obtenido exitosamente\n', 'green');

    // === MEJOR DÍA DE LA SEMANA ===
    log('═══════════════════════════════════════', 'blue');
    log('  🥇 MEJOR DÍA DE LA SEMANA', 'blue');
    log('═══════════════════════════════════════', 'blue');
    const bestDay = data.mejorDiaSemana;
    log(`\n📅 Día: ${bestDay.dia}`, 'green');
    log(`💰 Total Ventas: Q${bestDay.totalVentas}`, 'magenta');
    log(`🛒 Total Transacciones: ${bestDay.totalTransacciones}`, 'magenta');
    log(`🎫 Ticket Promedio: Q${bestDay.promedioTicket}`, 'magenta');
    log(`📊 Días Analizados: ${bestDay.diasContados}`, 'magenta');
    log(`📈 Promedio Ventas/Día: Q${bestDay.promedioVentasPorDia}`, 'magenta');

    // === PEOR DÍA DE LA SEMANA ===
    if (data.peorDiaSemana) {
      log('\n═══════════════════════════════════════', 'blue');
      log('  📉 PEOR DÍA DE LA SEMANA', 'blue');
      log('═══════════════════════════════════════', 'blue');
      const worstDay = data.peorDiaSemana;
      log(`\n📅 Día: ${worstDay.dia}`, 'red');
      log(`💰 Total Ventas: Q${worstDay.totalVentas}`, 'magenta');
      log(`🛒 Total Transacciones: ${worstDay.totalTransacciones}`, 'magenta');
      log(`🎫 Ticket Promedio: Q${worstDay.promedioTicket}`, 'magenta');
      log(`\n📊 Diferencia entre mejor y peor día: ${data.diferenciaEntreExtremos}`, 'yellow');
    }

    // === RANKING COMPLETO DE DÍAS ===
    log('\n═══════════════════════════════════════', 'cyan');
    log('  📊 RANKING COMPLETO DE DÍAS DE LA SEMANA', 'cyan');
    log('═══════════════════════════════════════\n', 'cyan');
    data.rankingDiasSemana.forEach((dia, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      log(`${medal} ${dia.dia}:`, 'yellow');
      log(`   💰 Q${dia.totalVentas} | 🛒 ${dia.totalTransacciones} trans | 📈 Q${dia.promedioVentasPorDia}/día`, 'white');
    });

    // === MEJORES DÍAS DEL MES ===
    log('\n═══════════════════════════════════════', 'cyan');
    log('  📅 TOP 10 DÍAS DEL MES (1-31)', 'cyan');
    log('═══════════════════════════════════════\n', 'cyan');
    data.mejoresDiasMes.slice(0, 5).forEach((dia, index) => {
      log(`${index + 1}. Día ${dia.dia} del mes:`, 'yellow');
      log(`   💰 Q${dia.totalVentas} | 🛒 ${dia.totalTransacciones} trans | 📊 ${dia.mesesContados} meses analizados`, 'white');
    });

    // === MEJORES HORAS DEL DÍA ===
    log('\n═══════════════════════════════════════', 'cyan');
    log('  ⏰ MEJORES HORAS DEL DÍA', 'cyan');
    log('═══════════════════════════════════════\n', 'cyan');
    data.mejoresHorasDia.slice(0, 5).forEach((hora, index) => {
      log(`${index + 1}. ${hora.hora}:`, 'yellow');
      log(`   💰 Q${hora.totalVentas} | 🛒 ${hora.totalTransacciones} trans | 🎫 Q${hora.promedioTicket} ticket prom`, 'white');
    });

    // === MEJORES SEMANAS DEL MES ===
    log('\n═══════════════════════════════════════', 'cyan');
    log('  📆 MEJORES SEMANAS DEL MES', 'cyan');
    log('═══════════════════════════════════════\n', 'cyan');
    data.mejorSemanaMes.forEach((semana, index) => {
      log(`${index + 1}. ${semana.semana}:`, 'yellow');
      log(`   💰 Q${semana.totalVentas} | 🛒 ${semana.totalTransacciones} trans | 🎫 Q${semana.promedioTicket} ticket prom`, 'white');
    });

    // === RECOMENDACIONES ===
    if (data.recomendaciones && data.recomendaciones.length > 0) {
      log('\n═══════════════════════════════════════', 'green');
      log('  💡 RECOMENDACIONES INTELIGENTES', 'green');
      log('═══════════════════════════════════════\n', 'green');
      data.recomendaciones.forEach((rec, index) => {
        const impactColor = rec.impacto === 'alto' ? 'red' : 'yellow';
        log(`${index + 1}. [${rec.tipo.toUpperCase()}] - Impacto: ${rec.impacto.toUpperCase()}`, impactColor);
        log(`   💡 ${rec.mensaje}\n`, 'white');
      });
    }

    // === RESUMEN VISUAL ===
    log('\n╔═══════════════════════════════════════════════════════╗', 'bgGreen');
    log('║                  📊 RESUMEN EJECUTIVO                 ║', 'bgGreen');
    log('╚═══════════════════════════════════════════════════════╝', 'bgGreen');
    log(`\n✅ Mejor día para programar inventario: ${bestDay.dia}`, 'green');
    log(`✅ Mejor hora para tener personal adicional: ${data.mejoresHorasDia[0].hora}`, 'green');
    log(`✅ Mejor semana del mes: ${data.mejorSemanaMes[0].semana}`, 'green');

    if (data.peorDiaSemana) {
      log(`\n⚠️  Día que necesita promociones: ${data.peorDiaSemana.dia}`, 'yellow');
      log(`⚠️  Oportunidad de mejora: ${data.diferenciaEntreExtremos} de diferencia entre mejor y peor día\n`, 'yellow');
    }

    log('\n╔═══════════════════════════════════════════════════════╗', 'cyan');
    log('║          ✅ ANÁLISIS COMPLETADO CON ÉXITO             ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════╝\n', 'cyan');

  } catch (error) {
    log('\n❌ ERROR EN LA PRUEBA:', 'red');
    log(`   Mensaje: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

// Ejecutar test
testBestSalesDays();
