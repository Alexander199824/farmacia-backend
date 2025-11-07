const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';

async function testSalesGroupBy(groupBy) {
  try {
    console.log(`\n🧪 Testing groupBy=${groupBy}...`);
    const response = await axios.get(`${API_URL}/reports/sales?groupBy=${groupBy}&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Success! Got ${response.data.results.length} results`);
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
    }
    return false;
  }
}

async function run() {
  // Login first
  console.log('🔐 Logging in...');
  const loginRes = await axios.post(`${API_URL}/users/login`, {
    email: 'admin@farmacia.com',
    password: 'Admin123!'
  });
  token = loginRes.data.token;
  console.log('✅ Logged in');

  // Test each groupBy option individually
  await testSalesGroupBy('product');
  await testSalesGroupBy('category');
  await testSalesGroupBy('client');
}

run().catch(console.error);
