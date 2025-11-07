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
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Login
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

// Test de descarga de reporte de ventas
async function testDownloadSalesReport() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('  📥 DESCARGA DE REPORTE DE VENTAS', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  const formats = ['excel', 'pdf'];

  for (const format of formats) {
    try {
      log(`\n📊 Descargando reporte en ${format.toUpperCase()}...`, 'yellow');

      const response = await axios.get(
        `${API_URL}/reports/download/sales?format=${format}&groupBy=day`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'arraybuffer'
        }
      );

      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const fileName = `test-reporte-ventas.${extension}`;
      const filePath = path.join(__dirname, fileName);

      fs.writeFileSync(filePath, response.data);

      const fileSize = fs.statSync(filePath).size;
      log(`✅ Archivo ${format.toUpperCase()} descargado exitosamente`, 'green');
      log(`   Archivo: ${fileName}`, 'magenta');
      log(`   Tamaño: ${(fileSize / 1024).toFixed(2)} KB`, 'magenta');
      log(`   Ruta: ${filePath}`, 'magenta');

    } catch (error) {
      log(`❌ Error descargando ${format.toUpperCase()}: ${error.message}`, 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
      }
    }
  }
}

// Test de descarga de análisis económico
async function testDownloadEconomicAnalysis() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('  📥 DESCARGA DE ANÁLISIS ECONÓMICO', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  const formats = ['excel', 'pdf'];

  for (const format of formats) {
    try {
      log(`\n💰 Descargando análisis económico en ${format.toUpperCase()}...`, 'yellow');

      const response = await axios.get(
        `${API_URL}/reports/download/economic-analysis?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'arraybuffer'
        }
      );

      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const fileName = `test-analisis-economico.${extension}`;
      const filePath = path.join(__dirname, fileName);

      fs.writeFileSync(filePath, response.data);

      const fileSize = fs.statSync(filePath).size;
      log(`✅ Archivo ${format.toUpperCase()} descargado exitosamente`, 'green');
      log(`   Archivo: ${fileName}`, 'magenta');
      log(`   Tamaño: ${(fileSize / 1024).toFixed(2)} KB`, 'magenta');
      log(`   Ruta: ${filePath}`, 'magenta');

    } catch (error) {
      log(`❌ Error descargando ${format.toUpperCase()}: ${error.message}`, 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
      }
    }
  }
}

// Test de descarga de mejores días
async function testDownloadBestSalesDays() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('  📥 DESCARGA DE MEJORES DÍAS DE VENTA', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  const formats = ['excel', 'pdf'];

  for (const format of formats) {
    try {
      log(`\n🏆 Descargando mejores días en ${format.toUpperCase()}...`, 'yellow');

      const response = await axios.get(
        `${API_URL}/reports/download/best-sales-days?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'arraybuffer'
        }
      );

      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const fileName = `test-mejores-dias-venta.${extension}`;
      const filePath = path.join(__dirname, fileName);

      fs.writeFileSync(filePath, response.data);

      const fileSize = fs.statSync(filePath).size;
      log(`✅ Archivo ${format.toUpperCase()} descargado exitosamente`, 'green');
      log(`   Archivo: ${fileName}`, 'magenta');
      log(`   Tamaño: ${(fileSize / 1024).toFixed(2)} KB`, 'magenta');
      log(`   Ruta: ${filePath}`, 'magenta');

    } catch (error) {
      log(`❌ Error descargando ${format.toUpperCase()}: ${error.message}`, 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
      }
    }
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║    📥 PRUEBAS DE DESCARGA DE REPORTES              ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ No se pudo iniciar sesión. Abortando pruebas.', 'red');
    return;
  }

  // Ejecutar pruebas
  await testDownloadSalesReport();
  await testDownloadEconomicAnalysis();
  await testDownloadBestSalesDays();

  // Resumen
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║              ✅ PRUEBAS COMPLETADAS                   ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  log('\n📁 Archivos generados en la raíz del proyecto:', 'cyan');
  log('   - test-reporte-ventas.xlsx', 'white');
  log('   - test-reporte-ventas.pdf', 'white');
  log('   - test-analisis-economico.xlsx', 'white');
  log('   - test-analisis-economico.pdf', 'white');
  log('   - test-mejores-dias-venta.xlsx', 'white');
  log('   - test-mejores-dias-venta.pdf', 'white');

  log('\n💡 Abre los archivos para verificar que se generaron correctamente', 'green');
  log('📚 Los archivos se descargaron en: ' + __dirname + '\n', 'cyan');
}

// Ejecutar
runAllTests().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
