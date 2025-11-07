const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Coloca aquí tu token de admin
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzMwOTMzMzQwLCJleHAiOjE3MzM1MjUzNDB9.XsOE-7Hy6QGl3VrRfW5lWqUt16SaI8bMR9n2EcJI2us';

const headers = { Authorization: `Bearer ${TOKEN}` };

async function testEndpoint(name, url) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    const response = await axios.get(`${API_URL}${url}`, { headers });
    console.log(`✅ ${name}: OK`);
    console.log(`   Response keys:`, Object.keys(response.data).join(', '));
    return true;
  } catch (error) {
    console.log(`❌ ${name}: FAILED`);
    console.log(`   Error:`, error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de reportes...\n');

  const tests = [
    ['Dashboard', '/reports/dashboard?period=month'],
    ['Top Products', '/reports/top-products?limit=10'],
    ['Inventory', '/reports/inventory'],
    ['Expiring Products', '/reports/inventory/expiring?days=30'],
    ['Sales Report', '/reports/sales?groupBy=product'],
    ['Clients Report', '/reports/clients?limit=20'],
    ['Financial Report', '/reports/financial']
  ];

  let passed = 0;
  for (const [name, url] of tests) {
    if (await testEndpoint(name, url)) {
      passed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Espera 500ms entre pruebas
  }

  console.log(`\n\n📊 Resultados: ${passed}/${tests.length} pruebas pasaron`);

  if (passed === tests.length) {
    console.log('✅ ¡Todos los endpoints funcionan correctamente!');
  } else {
    console.log('⚠️  Algunos endpoints tienen errores');
  }
}

runTests().catch(console.error);
