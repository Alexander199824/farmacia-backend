/**
 * Test Detallado de Cloudinary con Captura Completa de Errores
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const axios = require('axios');

console.log('\n🔍 DIAGNÓSTICO DETALLADO DE CLOUDINARY\n');
console.log('═'.repeat(60));

// 1. Verificar credenciales
console.log('\n1️⃣  Credenciales:');
console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('   API Key:', process.env.CLOUDINARY_API_KEY);
console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET);

// Configurar
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// 2. Test de Ping con error completo
async function testPingDetailed() {
    console.log('\n2️⃣  Test de Ping (con captura completa de error):');
    try {
        const result = await cloudinary.api.ping();
        console.log('   ✅ Ping exitoso:', JSON.stringify(result, null, 2));
        return true;
    } catch (error) {
        console.log('   ❌ Ping falló:');
        console.log('   Error completo:', JSON.stringify(error, null, 2));
        console.log('   Message:', error.message);
        console.log('   HTTP Code:', error.http_code);
        console.log('   Error object:', error.error);
        return false;
    }
}

// 3. Test directo con HTTP (sin librería de Cloudinary)
async function testDirectHTTP() {
    console.log('\n3️⃣  Test HTTP directo a Cloudinary:');
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image`;
    
    console.log('   URL:', url);
    console.log('   Intentando llamada HTTP...');
    
    try {
        const response = await axios.get(url, {
            auth: {
                username: apiKey,
                password: apiSecret
            },
            timeout: 10000
        });
        
        console.log('   ✅ HTTP exitoso');
        console.log('   Status:', response.status);
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('   ❌ HTTP falló:');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Status Text:', error.response.statusText);
            console.log('   Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('   No response received');
            console.log('   Request:', error.request);
        } else {
            console.log('   Error:', error.message);
        }
        return false;
    }
}

// 4. Verificar que la cuenta existe
async function testAccountExists() {
    console.log('\n4️⃣  Verificar que la cuenta existe:');
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const publicUrl = `https://res.cloudinary.com/${cloudName}/image/upload/sample.jpg`;
    
    console.log('   Verificando URL pública:', publicUrl);
    
    try {
        const response = await axios.head(publicUrl, { timeout: 5000 });
        console.log('   ✅ Cuenta existe (URL pública accesible)');
        console.log('   Status:', response.status);
        return true;
    } catch (error) {
        console.log('   ❌ Cuenta no accesible públicamente');
        if (error.response) {
            console.log('   Status:', error.response.status);
            if (error.response.status === 404) {
                console.log('   ⚠️  Cloud Name podría ser incorrecto');
            }
        }
        return false;
    }
}

// 5. Test de configuración básica
function testBasicConfig() {
    console.log('\n5️⃣  Verificación de configuración:');
    
    const config = cloudinary.config();
    const issues = [];
    
    if (!config.cloud_name) {
        issues.push('❌ cloud_name no configurado');
    } else {
        console.log('   ✅ cloud_name:', config.cloud_name);
    }
    
    if (!config.api_key) {
        issues.push('❌ api_key no configurado');
    } else {
        console.log('   ✅ api_key:', config.api_key);
    }
    
    if (!config.api_secret) {
        issues.push('❌ api_secret no configurado');
    } else {
        console.log('   ✅ api_secret: ***' + config.api_secret.slice(-4));
    }
    
    if (issues.length > 0) {
        console.log('\n   Problemas encontrados:');
        issues.forEach(issue => console.log('   ' + issue));
        return false;
    }
    
    return true;
}

// Ejecutar todos los tests
async function runAllTests() {
    try {
        const configOk = testBasicConfig();
        
        if (!configOk) {
            console.log('\n❌ PROBLEMA: Configuración incompleta');
            return;
        }
        
        const accountExists = await testAccountExists();
        
        if (!accountExists) {
            console.log('\n❌ PROBLEMA: El Cloud Name parece incorrecto o la cuenta no existe');
            console.log('\n💡 Verifica en: https://cloudinary.com/console');
            console.log('   Ve a Settings → Account → Cloud name');
            return;
        }
        
        const httpOk = await testDirectHTTP();
        
        if (!httpOk) {
            console.log('\n❌ PROBLEMA: Las credenciales (API Key/Secret) son incorrectas');
            console.log('\n💡 Solución:');
            console.log('   1. Ve a https://cloudinary.com/console');
            console.log('   2. Ve a Settings → API Keys');
            console.log('   3. Copia EXACTAMENTE el API Key y API Secret');
            console.log('   4. O genera un nuevo par de credenciales');
            return;
        }
        
        const pingOk = await testPingDetailed();
        
        if (!pingOk) {
            console.log('\n❌ PROBLEMA: La librería de Cloudinary tiene problemas');
            console.log('   Prueba reinstalar: npm uninstall cloudinary && npm install cloudinary');
            return;
        }
        
        console.log('\n' + '═'.repeat(60));
        console.log('✅ CLOUDINARY CONFIGURADO CORRECTAMENTE\n');
        
    } catch (error) {
        console.error('\n❌ Error crítico:', error);
    }
}

// Ejecutar
runAllTests();