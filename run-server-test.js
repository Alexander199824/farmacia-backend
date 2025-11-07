const { spawn } = require('child_process');
const axios = require('axios');

// Start server
console.log('🚀 Starting server...');
const server = spawn('node', ['server.js'], {
  cwd: __dirname
});

server.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString().trim()}`);
});

// Wait for server to start, then run test
setTimeout(async () => {
  try {
    console.log('\n🧪 Running test...\n');

    // Login
    const loginRes = await axios.post('http://localhost:5000/api/users/login', {
      email: 'admin@farmacia.com',
      password: 'Admin123!'
    });
    const token = loginRes.data.token;
    console.log('✅ Logged in');

    // Test product groupBy
    console.log('\n🧪 Testing groupBy=product...');
    const response = await axios.get('http://localhost:5000/api/reports/sales?groupBy=product&limit=5', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Success!', response.data);

  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  } finally {
    server.kill();
    process.exit();
  }
}, 3000);
