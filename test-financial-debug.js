const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testFinancial() {
  try {
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email: 'admin@farmacia.com',
      password: 'Admin123!'
    });
    const token = loginRes.data.token;
    console.log('✅ Logged in');

    console.log('\n💵 Testing Financial Report...');
    const response = await axios.get(`${API_URL}/reports/financial`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testFinancial();
