/**
 * Test Completo de Proveedores - Con Menú Interactivo
 * Autor: Alexander Echeverria
 * Ubicación: tests/test-suppliers.js
 * 
 * Ejecutar: node test-suppliers.js
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Variables globales
let authToken = null;

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// Configurar readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function printHeader(text) {
    console.clear();
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + '  ' + text + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

function printSuccess(message) {
    console.log(colors.green + '✓ ' + message + colors.reset);
}

function printError(message, error = null) {
    console.log(colors.red + '✗ ' + message + colors.reset);
    if (error && error.response) {
        console.log(colors.red + '  Status: ' + error.response.status + colors.reset);
        console.log(colors.red + '  Error: ' + JSON.stringify(error.response.data, null, 2) + colors.reset);
    }
}

function printInfo(message) {
    console.log(colors.blue + 'ℹ ' + message + colors.reset);
}

function printWarning(message) {
    console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

// ========== FUNCIONES DE AUTENTICACIÓN ==========

async function login() {
    printHeader('LOGIN');
    
    const email = await question('Email (default: admin@farmacia.com): ') || 'admin@farmacia.com';
    const password = await question('Password (default: Admin123!): ') || 'Admin123!';
    
    try {
        const response = await axios.post(`${API_URL}/users/login`, {
            email,
            password
        });
        
        authToken = response.data.token;
        printSuccess('Login exitoso!');
        printInfo(`Usuario: ${response.data.user.email}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error en login', error);
        await question('\nPresiona Enter para continuar...');
    }
}

// ========== FUNCIONES DE PROVEEDORES ==========

async function createSupplier() {
    printHeader('CREAR NUEVO PROVEEDOR');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const timestamp = Date.now();
    const code = await question(`Código (default: PROV-${timestamp}): `) || `PROV-${timestamp}`;
    const name = await question('Nombre: ');
    const contactName = await question('Nombre de contacto: ') || null;
    const email = await question(`Email (default: prov${timestamp}@test.com): `) || `prov${timestamp}@test.com`;
    const phone = await question('Teléfono: ');
    const alternativePhone = await question('Teléfono alternativo (opcional): ') || null;
    const address = await question('Dirección (opcional): ') || null;
    const nit = await question('NIT (opcional): ') || null;
    const acceptsReturns = await question('¿Acepta devoluciones? (si/no, default: si): ') || 'si';
    const returnPolicyMonthsBefore = await question('Meses antes de vencimiento para devolver (default: 3): ') || '3';
    const creditLimit = await question('Límite de crédito (default: 0): ') || '0';
    
    try {
        const response = await axios.post(`${API_URL}/suppliers`, {
            code,
            name,
            contactName,
            email,
            phone,
            alternativePhone,
            address,
            nit,
            acceptsReturns: acceptsReturns.toLowerCase() === 'si',
            returnPolicyMonthsBefore: parseInt(returnPolicyMonthsBefore),
            creditLimit: parseFloat(creditLimit)
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Proveedor creado exitosamente!');
        printInfo(`ID: ${response.data.supplier.id}`);
        printInfo(`Código: ${response.data.supplier.code}`);
        printInfo(`Nombre: ${response.data.supplier.name}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al crear proveedor', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function listSuppliers() {
    printHeader('LISTAR TODOS LOS PROVEEDORES');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const page = await question('Página (default: 1): ') || '1';
    const limit = await question('Límite por página (default: 10): ') || '10';
    const search = await question('Buscar (opcional): ') || '';
    
    try {
        let url = `${API_URL}/suppliers?page=${page}&limit=${limit}`;
        if (search) url += `&search=${search}`;
        
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess(`Total de proveedores: ${response.data.total}`);
        printInfo(`Página ${response.data.page} de ${response.data.totalPages}`);
        
        console.log('\n' + colors.yellow + 'LISTADO DE PROVEEDORES:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(80) + colors.reset);
        
        response.data.suppliers.forEach((supplier, index) => {
            console.log(`\n${colors.cyan}${index + 1}. ${supplier.name}${colors.reset}`);
            console.log(`   ID: ${supplier.id}`);
            console.log(`   Código: ${supplier.code}`);
            console.log(`   Email: ${supplier.email}`);
            console.log(`   Teléfono: ${supplier.phone}`);
            console.log(`   Activo: ${supplier.isActive ? '✓' : '✗'}`);
            console.log(`   Acepta devoluciones: ${supplier.acceptsReturns ? 'Sí' : 'No'}`);
            console.log(`   Deuda actual: Q${supplier.currentDebt}`);
            console.log(`   Límite crédito: Q${supplier.creditLimit}`);
        });
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al listar proveedores', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getSupplierById() {
    printHeader('OBTENER PROVEEDOR POR ID');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const supplierId = await question('ID del proveedor: ');
    
    if (!supplierId) {
        printWarning('ID requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.get(`${API_URL}/suppliers/${supplierId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const s = response.data;
        
        console.log('\n' + colors.green + 'INFORMACIÓN DEL PROVEEDOR:' + colors.reset);
        console.log(colors.green + '-'.repeat(60) + colors.reset);
        console.log(`ID: ${s.id}`);
        console.log(`Código: ${s.code}`);
        console.log(`Nombre: ${s.name}`);
        console.log(`Contacto: ${s.contactName || 'N/A'}`);
        console.log(`Email: ${s.email}`);
        console.log(`Teléfono: ${s.phone}`);
        console.log(`Teléfono alt: ${s.alternativePhone || 'N/A'}`);
        console.log(`Dirección: ${s.address || 'N/A'}`);
        console.log(`NIT: ${s.nit || 'N/A'}`);
        console.log(`Acepta devoluciones: ${s.acceptsReturns ? 'Sí' : 'No'}`);
        if (s.acceptsReturns) {
            console.log(`  - Meses antes: ${s.returnPolicyMonthsBefore}`);
            console.log(`  - Meses después: ${s.returnPolicyMonthsAfter}`);
        }
        console.log(`Términos de pago: ${s.paymentTerms || 'N/A'}`);
        console.log(`Límite crédito: Q${s.creditLimit}`);
        console.log(`Deuda actual: Q${s.currentDebt}`);
        console.log(`Activo: ${s.isActive ? 'Sí' : 'No'}`);
        console.log(`Productos: ${s.products ? s.products.length : 0}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener proveedor', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function updateSupplier() {
    printHeader('ACTUALIZAR PROVEEDOR');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const supplierId = await question('ID del proveedor a actualizar: ');
    
    if (!supplierId) {
        printWarning('ID requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    console.log('\n' + colors.blue + 'Ingresa los nuevos valores (Enter para mantener actual):' + colors.reset);
    
    const name = await question('Nombre: ');
    const contactName = await question('Contacto: ');
    const phone = await question('Teléfono: ');
    const address = await question('Dirección: ');
    const creditLimit = await question('Límite de crédito: ');
    
    const updateData = {};
    if (name) updateData.name = name;
    if (contactName) updateData.contactName = contactName;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (creditLimit) updateData.creditLimit = parseFloat(creditLimit);
    
    if (Object.keys(updateData).length === 0) {
        printWarning('No se ingresaron cambios');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.put(`${API_URL}/suppliers/${supplierId}`, updateData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Proveedor actualizado exitosamente!');
        printInfo(`Nombre: ${response.data.supplier.name}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al actualizar proveedor', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function deleteSupplier() {
    printHeader('ELIMINAR PROVEEDOR');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const supplierId = await question('ID del proveedor a eliminar: ');
    
    if (!supplierId) {
        printWarning('ID requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const confirm = await question(`¿Estás seguro de eliminar el proveedor ${supplierId}? (si/no): `);
    
    if (confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 's') {
        printWarning('Operación cancelada');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        await axios.delete(`${API_URL}/suppliers/${supplierId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Proveedor eliminado exitosamente!');
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al eliminar proveedor', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function registerPayment() {
    printHeader('REGISTRAR PAGO A PROVEEDOR');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const supplierId = await question('ID del proveedor: ');
    const amount = await question('Monto del pago: ');
    const paymentMethod = await question('Método [efectivo/transferencia/cheque/tarjeta]: ');
    const referenceNumber = await question('Número de referencia (opcional): ') || null;
    const notes = await question('Notas (opcional): ') || null;
    
    try {
        const response = await axios.post(`${API_URL}/suppliers/${supplierId}/register-payment`, {
            amount: parseFloat(amount),
            paymentMethod,
            referenceNumber,
            notes
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Pago registrado exitosamente!');
        printInfo(`Deuda anterior: Q${response.data.supplier.previousDebt}`);
        printInfo(`Monto pagado: Q${response.data.supplier.amountPaid}`);
        printInfo(`Deuda actual: Q${response.data.supplier.currentDebt}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al registrar pago', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getPaymentHistory() {
    printHeader('HISTORIAL DE PAGOS');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const supplierId = await question('ID del proveedor: ');
    const limit = await question('Límite de registros (default: 20): ') || '20';
    
    try {
        const response = await axios.get(`${API_URL}/suppliers/${supplierId}/payment-history?limit=${limit}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess(`Historial de ${response.data.supplier.name}`);
        printInfo(`Deuda actual: Q${response.data.supplier.currentDebt}`);
        
        console.log('\n' + colors.yellow + 'PAGOS REGISTRADOS:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(80) + colors.reset);
        
        response.data.payments.forEach((payment, index) => {
            console.log(`\n${colors.cyan}${index + 1}. Pago del ${new Date(payment.paymentDate).toLocaleDateString()}${colors.reset}`);
            console.log(`   Monto: Q${payment.amount}`);
            console.log(`   Método: ${payment.paymentMethod}`);
            console.log(`   Referencia: ${payment.referenceNumber || 'N/A'}`);
            console.log(`   Saldo antes: Q${payment.balanceBefore}`);
            console.log(`   Saldo después: Q${payment.balanceAfter}`);
        });
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener historial', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getSupplierStats() {
    printHeader('ESTADÍSTICAS DE PROVEEDORES');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.get(`${API_URL}/suppliers/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const stats = response.data;
        
        console.log('\n' + colors.green + 'ESTADÍSTICAS GENERALES:' + colors.reset);
        console.log(colors.green + '-'.repeat(60) + colors.reset);
        console.log(`Total de proveedores: ${stats.total}`);
        console.log(`Activos: ${stats.active}`);
        console.log(`Inactivos: ${stats.inactive}`);
        console.log(`Aceptan devoluciones: ${stats.acceptReturns}`);
        console.log(`Con deuda: ${stats.withDebt}`);
        console.log(`Deuda total: Q${stats.totalDebt}`);
        console.log(`Deuda promedio: Q${stats.averageDebt?.average || 0}`);
        
        if (stats.topByDebt && stats.topByDebt.length > 0) {
            console.log('\n' + colors.yellow + 'TOP 5 CON MÁS DEUDA:' + colors.reset);
            stats.topByDebt.forEach((supplier, index) => {
                console.log(`${index + 1}. ${supplier.name} - Q${supplier.currentDebt}`);
            });
        }
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener estadísticas', error);
        await question('\nPresiona Enter para continuar...');
    }
}

// ========== MENÚ PRINCIPAL ==========

async function showMenu() {
    printHeader('TEST DE PROVEEDORES - FARMACIA ELIZABETH');
    
    console.log(colors.cyan + '  Estado de autenticación:' + colors.reset);
    if (authToken) {
        console.log(colors.green + '  ✓ Autenticado' + colors.reset);
    } else {
        console.log(colors.red + '  ✗ No autenticado' + colors.reset);
    }
    
    console.log('\n' + colors.yellow + '  OPCIONES:' + colors.reset);
    console.log('  1.  Login');
    console.log('  2.  Crear proveedor');
    console.log('  3.  Listar proveedores');
    console.log('  4.  Obtener proveedor por ID');
    console.log('  5.  Actualizar proveedor');
    console.log('  6.  Eliminar proveedor');
    console.log('  7.  Registrar pago');
    console.log('  8.  Ver historial de pagos');
    console.log('  9.  Ver estadísticas');
    console.log('  0.  Salir');
    
    const option = await question('\n  Selecciona una opción: ');
    
    switch (option) {
        case '1':
            await login();
            break;
        case '2':
            await createSupplier();
            break;
        case '3':
            await listSuppliers();
            break;
        case '4':
            await getSupplierById();
            break;
        case '5':
            await updateSupplier();
            break;
        case '6':
            await deleteSupplier();
            break;
        case '7':
            await registerPayment();
            break;
        case '8':
            await getPaymentHistory();
            break;
        case '9':
            await getSupplierStats();
            break;
        case '0':
            console.log('\n' + colors.green + '¡Hasta luego!' + colors.reset + '\n');
            rl.close();
            process.exit(0);
            break;
        default:
            printWarning('Opción no válida');
            await question('\nPresiona Enter para continuar...');
    }
    
    await showMenu();
}

// ========== INICIAR ==========

async function init() {
    console.log(colors.magenta + '\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║      TEST DE PROVEEDORES - FARMACIA ELIZABETH             ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    printInfo(`Servidor: ${BASE_URL}`);
    
    await question('\nPresiona Enter para comenzar...');
    await showMenu();
}

init().catch(error => {
    console.error(colors.red + 'Error fatal:' + colors.reset, error);
    rl.close();
    process.exit(1);
});