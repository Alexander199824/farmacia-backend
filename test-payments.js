/**
 * Tests de Pagos con Stripe
 * Autor: Alexander Echeverria
 * Ubicacion: test-payments.js
 * 
 * Ejecutar: node test-payments.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

let adminToken = null;
let testPaymentId = null;
let testPaymentIntentId = null;
let testClientSecret = null;

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(color, symbol, message) {
    console.log(color + symbol + ' ' + message + colors.reset);
}

async function setup() {
    console.log(colors.cyan + '\n══════ CONFIGURACIÓN ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Iniciando sesión...');
        const response = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@farmacia.com',
            password: 'Admin123!'
        });
        
        adminToken = response.data.token;
        log(colors.green, '✓', 'Login exitoso');
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error en login');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testCreatePaymentIntent() {
    console.log(colors.cyan + '\n══════ TEST 1: Crear Payment Intent ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Creando Payment Intent de Q100.00...');
        
        // Stripe requiere cantidades en centavos
        const amount = 10000; // Q100.00 = 10000 centavos
        
        const response = await axios.post(`${API_URL}/payments/create-intent`, {
            amount: amount,
            currency: 'gtq',
            metadata: {
                test: 'true',
                description: 'Pago de prueba'
            }
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        testPaymentId = response.data.paymentId;
        testClientSecret = response.data.clientSecret;
        
        log(colors.green, '✓', 'Payment Intent creado exitosamente');
        log(colors.magenta, 'ℹ', `Payment ID: ${testPaymentId}`);
        log(colors.magenta, 'ℹ', `Monto: Q${response.data.amount}`);
        log(colors.magenta, 'ℹ', `Moneda: ${response.data.currency}`);
        log(colors.magenta, 'ℹ', `Client Secret: ${testClientSecret.substring(0, 30)}...`);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al crear Payment Intent');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testGetPaymentStatus() {
    console.log(colors.cyan + '\n══════ TEST 2: Obtener Estado de Pago ══════\n' + colors.reset);
    
    if (!testPaymentId) {
        log(colors.yellow, '⚠', 'No hay pago de test');
        return false;
    }
    
    try {
        log(colors.blue, '→', 'Consultando estado del pago...');
        
        const response = await axios.get(`${API_URL}/payments/${testPaymentId}/status`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Estado obtenido');
        log(colors.magenta, 'ℹ', `ID: ${response.data.payment.id}`);
        log(colors.magenta, 'ℹ', `Monto: Q${response.data.payment.amount}`);
        log(colors.magenta, 'ℹ', `Estado: ${response.data.payment.status}`);
        log(colors.magenta, 'ℹ', `Moneda: ${response.data.payment.currency}`);
        
        if (response.data.stripeInfo) {
            log(colors.magenta, 'ℹ', 'Info de Stripe:');
            log(colors.magenta, '  ', `  Estado: ${response.data.stripeInfo.status}`);
            if (response.data.stripeInfo.lastPaymentError) {
                log(colors.yellow, '  ', `  Error: ${response.data.stripeInfo.lastPaymentError}`);
            }
        }
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al obtener estado');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testListPayments() {
    console.log(colors.cyan + '\n══════ TEST 3: Listar Pagos ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Listando pagos...');
        
        const response = await axios.get(`${API_URL}/payments?page=1&limit=10`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Pagos listados');
        log(colors.magenta, 'ℹ', `Total: ${response.data.total}`);
        log(colors.magenta, 'ℹ', `Página: ${response.data.page}/${response.data.totalPages}`);
        log(colors.magenta, 'ℹ', `En esta página: ${response.data.payments.length}`);
        
        // Mostrar primeros 3 pagos
        response.data.payments.slice(0, 3).forEach((payment, i) => {
            log(colors.magenta, '  ', `${i + 1}. Q${payment.amount} - ${payment.status} - ${payment.currency}`);
        });
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al listar pagos');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testPaymentStats() {
    console.log(colors.cyan + '\n══════ TEST 4: Estadísticas de Pagos ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Obteniendo estadísticas...');
        
        const response = await axios.get(`${API_URL}/payments/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Estadísticas obtenidas');
        log(colors.magenta, 'ℹ', `Total pagos: ${response.data.total}`);
        log(colors.magenta, 'ℹ', `Exitosos: ${response.data.succeeded}`);
        log(colors.magenta, 'ℹ', `Fallidos: ${response.data.failed}`);
        log(colors.magenta, 'ℹ', `Pendientes: ${response.data.pending}`);
        log(colors.magenta, 'ℹ', `Monto total: Q${response.data.totalAmount}`);
        log(colors.magenta, 'ℹ', `Promedio: Q${response.data.averageAmount.average}`);
        
        log(colors.magenta, 'ℹ', 'Por estado:');
        response.data.byStatus.forEach(stat => {
            log(colors.magenta, '  ', `  ${stat.status}: ${stat.count} (Q${stat.totalAmount || 0})`);
        });
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al obtener estadísticas');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testInvalidAmount() {
    console.log(colors.cyan + '\n══════ TEST 5: Monto Inválido (debe fallar) ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Intentando crear pago con monto negativo...');
        
        await axios.post(`${API_URL}/payments/create-intent`, {
            amount: -100, // Monto negativo inválido
            currency: 'gtq'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.red, '✗', 'ERROR: Debería haber rechazado el monto negativo');
        return false;
        
    } catch (error) {
        if (error.response?.status === 400) {
            log(colors.green, '✓', 'Correctamente rechazado: Monto inválido');
            log(colors.magenta, 'ℹ', `Mensaje: ${error.response.data.error || error.response.data.message}`);
            return true;
        } else {
            log(colors.red, '✗', 'Error inesperado');
            console.error(error.response?.data || error.message);
            return false;
        }
    }
}

async function testCancelPaymentIntent() {
    console.log(colors.cyan + '\n══════ TEST 6: Cancelar Payment Intent ══════\n' + colors.reset);
    
    try {
        // Crear un nuevo payment intent para cancelar
        log(colors.blue, '→', 'Creando Payment Intent para cancelar...');
        
        const createRes = await axios.post(`${API_URL}/payments/create-intent`, {
            amount: 5000, // Q50.00
            currency: 'gtq'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const paymentIdToCancel = createRes.data.paymentId;
        log(colors.green, '✓', `Payment Intent creado: ${paymentIdToCancel}`);
        
        // Ahora cancelarlo
        log(colors.blue, '→', 'Cancelando Payment Intent...');
        
        const cancelRes = await axios.post(
            `${API_URL}/payments/${paymentIdToCancel}/cancel`,
            {
                cancellation_reason: 'requested_by_customer'
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );
        
        log(colors.green, '✓', 'Payment Intent cancelado');
        log(colors.magenta, 'ℹ', `Estado: ${cancelRes.data.payment.status}`);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al cancelar Payment Intent');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testFilterPayments() {
    console.log(colors.cyan + '\n══════ TEST 7: Filtrar Pagos por Estado ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Filtrando pagos exitosos...');
        
        const response = await axios.get(`${API_URL}/payments?status=succeeded`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Filtro aplicado');
        log(colors.magenta, 'ℹ', `Pagos exitosos encontrados: ${response.data.total}`);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al filtrar pagos');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log(colors.magenta + '\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║       TESTS DE PAGOS CON STRIPE                           ║');
    console.log('║       Payment Intents y Procesamiento                     ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    const setupOk = await setup();
    if (!setupOk) {
        log(colors.red, '✗', 'Error en configuración - Abortando tests');
        process.exit(1);
    }
    
    // Verificar que Stripe esté configurado
    if (!process.env.STRIPE_SECRET_KEY) {
        log(colors.yellow, '⚠', 'STRIPE_SECRET_KEY no está configurado');
        log(colors.yellow, '⚠', 'Algunos tests pueden fallar');
    }
    
    const results = [];
    
    results.push(await testCreatePaymentIntent());
    results.push(await testGetPaymentStatus());
    results.push(await testListPayments());
    results.push(await testPaymentStats());
    results.push(await testInvalidAmount());
    results.push(await testFilterPayments());
    results.push(await testCancelPaymentIntent());
    
    // Reporte final
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════\n' + colors.reset);
    const passed = results.filter(r => r === true).length;
    const failed = results.filter(r => r === false).length;
    
    console.log(colors.cyan + '  RESUMEN:' + colors.reset);
    console.log(colors.green + `  ✓ Tests exitosos: ${passed}` + colors.reset);
    console.log(colors.red + `  ✗ Tests fallidos: ${failed}` + colors.reset);
    console.log(colors.magenta + `  Total: ${results.length}` + colors.reset);
    
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════\n' + colors.reset);
    
    process.exit(failed > 0 ? 1 : 0);
}

runAllTests();