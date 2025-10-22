/**
 * Test de Alertas - Con Menú Interactivo
 * Autor: Alexander Echeverria
 * Ejecutar: node test-alerts.js
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;
let authToken = null;

const colors = {
    reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
    yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', magenta: '\x1b[35m'
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

function printHeader(text) {
    console.clear();
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    console.log(colors.cyan + '  ' + text + colors.reset);
    console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
}

const printSuccess = (msg) => console.log(colors.green + '✓ ' + msg + colors.reset);
const printError = (msg, e = null) => {
    console.log(colors.red + '✗ ' + msg + colors.reset);
    if (e?.response) console.log(colors.red + '  ' + JSON.stringify(e.response.data, null, 2) + colors.reset);
};
const printInfo = (msg) => console.log(colors.blue + 'ℹ ' + msg + colors.reset);
const printWarning = (msg) => console.log(colors.yellow + '⚠ ' + msg + colors.reset);
const printCritical = (msg) => console.log(colors.red + '🔴 CRÍTICO: ' + msg + colors.reset);

async function login() {
    printHeader('LOGIN');
    const email = await question('Email (admin@farmacia.com): ') || 'admin@farmacia.com';
    const password = await question('Password (Admin123!): ') || 'Admin123!';
    try {
        const res = await axios.post(`${API_URL}/users/login`, { email, password });
        authToken = res.data.token;
        printSuccess('Login exitoso!');
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getAllAlerts() {
    printHeader('TODAS LAS ALERTAS ACTIVAS');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    try {
        const res = await axios.get(`${API_URL}/alerts`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const alerts = res.data;
        const summary = alerts.summary;
        
        console.log('\n' + colors.magenta + '📊 RESUMEN DE ALERTAS:' + colors.reset);
        console.log(colors.magenta + '-'.repeat(60) + colors.reset);
        console.log(`Total de alertas: ${summary.total}`);
        console.log(colors.red + `Críticas: ${summary.critical}` + colors.reset);
        console.log(colors.yellow + `Alta prioridad: ${summary.high}` + colors.reset);
        console.log(colors.blue + `Media prioridad: ${summary.medium}` + colors.reset);
        
        // Stock bajo
        if (alerts.lowStock.count > 0) {
            console.log('\n' + colors.yellow + '⚠️  STOCK BAJO (' + alerts.lowStock.count + '):' + colors.reset);
            alerts.lowStock.products.slice(0, 5).forEach((p, i) => {
                console.log(`  ${i + 1}. ${p.name} - Stock: ${p.currentStock} (Mínimo: ${alerts.lowStock.threshold})`);
            });
        }
        
        // Por vencer
        if (alerts.expiring.count > 0) {
            console.log('\n' + colors.yellow + '⏰ POR VENCER (' + alerts.expiring.count + '):' + colors.reset);
            alerts.expiring.batches.slice(0, 5).forEach((b, i) => {
                console.log(`  ${i + 1}. ${b.product.name} (Lote ${b.batchNumber})`);
                console.log(`     ${b.message} - Pérdida estimada: Q${b.estimatedLoss}`);
            });
        }
        
        // Vencidos
        if (alerts.expired.count > 0) {
            printCritical(`PRODUCTOS VENCIDOS (${alerts.expired.count})`);
            console.log(colors.red + `Pérdida total: Q${alerts.expired.totalLoss}` + colors.reset);
            alerts.expired.batches.slice(0, 5).forEach((b, i) => {
                console.log(`  ${i + 1}. ${b.product.name} (Lote ${b.batchNumber})`);
                console.log(`     ${b.message} - Pérdida: Q${b.estimatedLoss}`);
            });
        }
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getLowStockAlerts() {
    printHeader('ALERTAS DE STOCK BAJO');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    try {
        const res = await axios.get(`${API_URL}/alerts/low-stock`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const alert = res.data;
        
        printWarning(`Productos con stock bajo: ${alert.count}`);
        printInfo(`Umbral: ${alert.threshold} unidades`);
        
        console.log('\n' + colors.yellow + 'PRODUCTOS:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(70) + colors.reset);
        
        alert.products.forEach((p, i) => {
            console.log(`\n${i + 1}. ${p.name}`);
            console.log(`   ID: ${p.id}`);
            console.log(`   Stock actual: ${p.currentStock}`);
            console.log(`   Precio: Q${p.price}`);
            console.log(`   ${p.message}`);
        });
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getExpiringAlerts() {
    printHeader('ALERTAS DE PRODUCTOS POR VENCER');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    const days = await question('Días de anticipación (30): ') || '30';
    
    try {
        const res = await axios.get(`${API_URL}/alerts/expiring?days=${days}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const alert = res.data;
        
        printWarning(`Lotes por vencer en ${days} días: ${alert.count}`);
        
        console.log('\n' + colors.yellow + 'LOTES POR VENCER:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(70) + colors.reset);
        
        alert.batches.forEach((b, i) => {
            console.log(`\n${i + 1}. ${b.product.name}`);
            console.log(`   Lote: ${b.batchNumber} (ID: ${b.id})`);
            console.log(`   Vencimiento: ${b.expirationDate}`);
            console.log(`   ${b.message}`);
            console.log(`   Cantidad: ${b.quantity} unidades`);
            console.log(`   Pérdida estimada: Q${b.estimatedLoss}`);
            
            if (b.daysUntilExpiry <= 7) {
                printCritical('¡Vence en menos de una semana!');
            }
        });
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getExpiredAlerts() {
    printHeader('ALERTAS DE PRODUCTOS VENCIDOS');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    try {
        const res = await axios.get(`${API_URL}/alerts/expired`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const alert = res.data;
        
        if (alert.count === 0) {
            printSuccess('¡No hay productos vencidos!');
        } else {
            printCritical(`PRODUCTOS VENCIDOS: ${alert.count}`);
            console.log(colors.red + `PÉRDIDA TOTAL: Q${alert.totalLoss}` + colors.reset);
            
            console.log('\n' + colors.red + 'LOTES VENCIDOS:' + colors.reset);
            console.log(colors.red + '-'.repeat(70) + colors.reset);
            
            alert.batches.forEach((b, i) => {
                console.log(`\n${i + 1}. ${b.product.name}`);
                console.log(`   Lote: ${b.batchNumber} (ID: ${b.id})`);
                console.log(`   Vencido: ${b.expirationDate}`);
                console.log(`   ${b.message}`);
                console.log(`   Cantidad: ${b.quantity} unidades`);
                console.log(`   Pérdida: Q${b.estimatedLoss}`);
            });
        }
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getPendingApprovalsAlerts() {
    printHeader('ALERTAS DE APROBACIONES PENDIENTES');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    try {
        const res = await axios.get(`${API_URL}/alerts/pending-approvals`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const alert = res.data;
        
        if (alert.count === 0) {
            printSuccess('No hay movimientos pendientes de aprobación');
        } else {
            printInfo(`Movimientos pendientes: ${alert.count}`);
            
            alert.movements.forEach((m, i) => {
                console.log(`\n${i + 1}. ${m.movementType}`);
                console.log(`   Producto: ${m.product}`);
                console.log(`   Cantidad: ${m.quantity}`);
                console.log(`   Fecha: ${m.date}`);
            });
        }
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function showMenu() {
    printHeader('TEST DE ALERTAS - FARMACIA ELIZABETH');
    console.log(authToken ? colors.green + '  ✓ Autenticado' : colors.red + '  ✗ No autenticado');
    console.log(colors.reset + '\n' + colors.yellow + '  OPCIONES:' + colors.reset);
    console.log('  1.  Login');
    console.log('  2.  Ver todas las alertas');
    console.log('  3.  Alertas de stock bajo');
    console.log('  4.  Alertas de productos por vencer');
    console.log('  5.  Alertas de productos vencidos');
    console.log('  6.  Alertas de aprobaciones pendientes');
    console.log('  0.  Salir');
    
    const opt = await question('\n  Selecciona: ');
    
    switch (opt) {
        case '1': await login(); break;
        case '2': await getAllAlerts(); break;
        case '3': await getLowStockAlerts(); break;
        case '4': await getExpiringAlerts(); break;
        case '5': await getExpiredAlerts(); break;
        case '6': await getPendingApprovalsAlerts(); break;
        case '0':
            console.log('\n' + colors.green + '¡Hasta luego!' + colors.reset + '\n');
            rl.close();
            process.exit(0);
        default:
            printWarning('Opción no válida');
            await question('\nEnter...');
    }
    
    await showMenu();
}

async function init() {
    console.log(colors.magenta);
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║        TEST DE ALERTAS - FARMACIA ELIZABETH               ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    printInfo(`Servidor: ${BASE_URL}`);
    await question('\nEnter para comenzar...');
    await showMenu();
}

init().catch(error => {
    console.error(colors.red + 'Error fatal:' + colors.reset, error);
    rl.close();
    process.exit(1);
});