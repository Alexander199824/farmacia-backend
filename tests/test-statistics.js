/**
 * Test de Estadísticas - Con Menú Interactivo
 * Autor: Alexander Echeverria
 * Ejecutar: node test-statistics.js
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

async function getDashboard() {
    printHeader('DASHBOARD PRINCIPAL');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    const startDate = await question('Fecha inicio (YYYY-MM-DD, opcional): ') || '';
    const endDate = await question('Fecha fin (YYYY-MM-DD, opcional): ') || '';
    
    try {
        let url = `${API_URL}/statistics/dashboard`;
        if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;
        
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${authToken}` } });
        const d = res.data;
        
        console.log('\n' + colors.green + 'VENTAS:' + colors.reset);
        console.log(`Total: Q${d.sales.total}`);
        console.log(`Recibos: ${d.sales.count}`);
        console.log(`Promedio: Q${d.sales.average}`);
        
        console.log('\n' + colors.cyan + 'CLIENTES:' + colors.reset);
        console.log(`Únicos: ${d.clients.unique}`);
        
        console.log('\n' + colors.yellow + 'INVENTARIO:' + colors.reset);
        console.log(`Stock bajo: ${d.inventory.lowStock}`);
        console.log(`Agotados: ${d.inventory.outOfStock}`);
        console.log(`Por vencer: ${d.inventory.expiring}`);
        console.log(`Vencidos: ${d.inventory.expired}`);
        console.log(`Valor total: Q${d.inventory.totalValue}`);
        
        console.log('\n' + colors.magenta + 'MÉTODOS DE PAGO:' + colors.reset);
        d.paymentMethods.forEach(pm => {
            console.log(`${pm.paymentMethod}: ${pm.count} (Q${pm.total})`);
        });
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getTopProducts() {
    printHeader('PRODUCTOS MÁS VENDIDOS');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    const limit = await question('Top (10): ') || '10';
    
    try {
        const res = await axios.get(`${API_URL}/statistics/top-products?limit=${limit}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess(`Top ${res.data.count} productos:`);
        
        res.data.products.forEach((item, i) => {
            console.log(`\n${i + 1}. ${item.product?.name || 'N/A'}`);
            console.log(`   Cantidad vendida: ${item.totalQuantity}`);
            console.log(`   Ingresos: Q${item.totalRevenue}`);
            console.log(`   Veces ordenado: ${item.timesOrdered}`);
        });
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getSalesReport() {
    printHeader('REPORTE DE VENTAS');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    const startDate = await question('Fecha inicio (YYYY-MM-DD): ');
    const endDate = await question('Fecha fin (YYYY-MM-DD): ');
    const groupBy = await question('Agrupar por [day/week/month] (day): ') || 'day';
    
    if (!startDate || !endDate) {
        printWarning('Fechas requeridas');
        await question('\nEnter...');
        return;
    }
    
    try {
        const res = await axios.get(`${API_URL}/statistics/sales-report?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Reporte generado:');
        
        res.data.report.forEach((r, i) => {
            console.log(`\n${i + 1}. Período: ${r.period}`);
            console.log(`   Recibos: ${r.invoiceCount}`);
            console.log(`   Total: Q${r.totalSales}`);
            console.log(`   Promedio: Q${r.averageSale}`);
        });
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getProfitability() {
    printHeader('ANÁLISIS DE RENTABILIDAD');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    try {
        const res = await axios.get(`${API_URL}/statistics/profitability`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const s = res.data.summary;
        
        console.log('\n' + colors.green + 'RESUMEN:' + colors.reset);
        console.log(`Ingresos: Q${s.totalRevenue}`);
        console.log(`Costos: Q${s.totalCost}`);
        console.log(`Ganancia: Q${s.totalProfit}`);
        console.log(`Margen: ${s.overallMargin}`);
        
        console.log('\n' + colors.cyan + 'TOP PRODUCTOS MÁS RENTABLES:' + colors.reset);
        res.data.products.slice(0, 5).forEach((p, i) => {
            console.log(`\n${i + 1}. ${p.product.name}`);
            console.log(`   Ganancia: Q${p.profit}`);
            console.log(`   Margen: ${p.margin}`);
        });
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getTopClients() {
    printHeader('CLIENTES FRECUENTES');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    const limit = await question('Top (10): ') || '10';
    
    try {
        const res = await axios.get(`${API_URL}/statistics/top-clients?limit=${limit}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess(`Top ${res.data.count} clientes:`);
        
        res.data.clients.forEach((c, i) => {
            const client = c.client;
            console.log(`\n${i + 1}. ${client.firstName} ${client.lastName}`);
            console.log(`   Email: ${client.email}`);
            console.log(`   Compras: ${c.purchaseCount}`);
            console.log(`   Total gastado: Q${c.totalSpent}`);
            console.log(`   Ticket promedio: Q${c.averageTicket}`);
        });
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getInventoryReport() {
    printHeader('REPORTE DE INVENTARIO');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    const category = await question('Categoría (opcional): ') || '';
    
    try {
        let url = `${API_URL}/statistics/inventory`;
        if (category) url += `?category=${category}`;
        
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const s = res.data.summary;
        
        console.log('\n' + colors.green + 'RESUMEN:' + colors.reset);
        console.log(`Productos: ${s.totalProducts}`);
        console.log(`Valor total: Q${s.totalValue}`);
        console.log(`Con stock: ${s.withStock}`);
        console.log(`Stock bajo: ${s.lowStock}`);
        console.log(`Agotados: ${s.outOfStock}`);
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function getExpirationReport() {
    printHeader('REPORTE DE VENCIMIENTOS');
    if (!authToken) { printWarning('Login requerido'); await question('\nEnter...'); return; }
    
    const days = await question('Días (30): ') || '30';
    
    try {
        const res = await axios.get(`${API_URL}/statistics/expiration?days=${days}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log('\n' + colors.red + 'VENCIDOS:' + colors.reset);
        console.log(`Lotes: ${res.data.expired.count}`);
        console.log(`Pérdida: Q${res.data.expired.totalLoss}`);
        
        console.log('\n' + colors.yellow + `POR VENCER (${days} días):` + colors.reset);
        console.log(`Lotes: ${res.data.expiring.count}`);
        console.log(`Valor en riesgo: Q${res.data.expiring.valueAtRisk}`);
        
        await question('\nEnter...');
    } catch (error) {
        printError('Error', error);
        await question('\nEnter...');
    }
}

async function showMenu() {
    printHeader('TEST DE ESTADÍSTICAS - FARMACIA ELIZABETH');
    console.log(authToken ? colors.green + '  ✓ Autenticado' : colors.red + '  ✗ No autenticado');
    console.log(colors.reset + '\n' + colors.yellow + '  OPCIONES:' + colors.reset);
    console.log('  1.  Login');
    console.log('  2.  Dashboard principal');
    console.log('  3.  Productos más vendidos');
    console.log('  4.  Reporte de ventas');
    console.log('  5.  Análisis de rentabilidad');
    console.log('  6.  Clientes frecuentes');
    console.log('  7.  Reporte de inventario');
    console.log('  8.  Reporte de vencimientos');
    console.log('  0.  Salir');
    
    const opt = await question('\n  Selecciona: ');
    
    switch (opt) {
        case '1': await login(); break;
        case '2': await getDashboard(); break;
        case '3': await getTopProducts(); break;
        case '4': await getSalesReport(); break;
        case '5': await getProfitability(); break;
        case '6': await getTopClients(); break;
        case '7': await getInventoryReport(); break;
        case '8': await getExpirationReport(); break;
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
    console.log('║     TEST DE ESTADÍSTICAS - FARMACIA ELIZABETH             ║');
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