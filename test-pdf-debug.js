const axios = require('axios');
const fs = require('fs');

async function testPDFDownload() {
  try {
    // 1. Login
    console.log('🔐 Iniciando sesión...');
    const loginResponse = await axios.post('http://localhost:5000/api/users/login', {
      email: 'admin@farmacia.com',
      password: 'Admin123!'
    });

    const token = loginResponse.data.token;
    console.log('✅ Token obtenido\n');

    // 2. Intentar descargar PDF de Mejores Días
    console.log('📥 Descargando PDF de Mejores Días...');

    const response = await axios.get(
      'http://localhost:5000/api/reports/download/best-sales-days?format=pdf',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'arraybuffer'
      }
    );

    console.log('✅ Descarga exitosa!');
    console.log('Tamaño:', response.data.length, 'bytes');

    // Guardar archivo
    fs.writeFileSync('test-debug-mejores-dias.pdf', response.data);
    console.log('✅ Archivo guardado como test-debug-mejores-dias.pdf');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));

      // Intentar parsear respuesta como JSON
      try {
        const errorData = JSON.parse(error.response.data.toString());
        console.error('Error del servidor:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('Respuesta (texto):', error.response.data.toString().substring(0, 500));
      }
    }

    process.exit(1);
  }
}

testPDFDownload();
