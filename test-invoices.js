/**
 * Tests de Ventas (Recibos de Venta) y Comprobantes
 * Autor: Alexander Echeverria
 * Ubicacion: test-invoices.js
 * 
 * Ejecutar: node test-invoices.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Variables globales
let adminToken = null;
let testProductId = null;
let testSupplierId = null;
let testBatchId = null;
let testClientId = null;
let testInvoiceId = null;
let testReceiptId = null;

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// SETUP: PREPARACIÓN DE DATOS DE PRUEBA
// ============================================================

async function setupTestData() {
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  CONFIGURACIÓN INICIAL' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════\n' + colors.reset);
    
    try {
        // 1. Login como admin
        log(colors.blue, '→', 'Iniciando sesión como admin...');
        const loginRes = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@farmacia.com',
            password: 'Admin123!'
        });
        adminToken = loginRes.data.token;
        log(colors.green, '✓', 'Login exitoso');
        await sleep(200);
        
        // 2. Crear proveedor de test
        log(colors.blue, '→', 'Creando proveedor de prueba...');
        const supplierRes = await axios.post(`${API_URL}/suppliers`, {
            code: `SUP-TEST-${Date.now()}`,
            name: 'Proveedor Test Ventas',
            email: `supplier${Date.now()}@test.com`,
            phone: '12345678',
            acceptsReturns: true
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        testSupplierId = supplierRes.data.supplier.id;
        log(colors.green, '✓', `Proveedor creado: ID ${testSupplierId}`);
        await sleep(200);
        
        // 3. Crear producto de test
        log(colors.blue, '→', 'Creando producto de prueba...');
        const productRes = await axios.post(`${API_URL}/products`, {
            sku: `PROD-SALES-${Date.now()}`,
            name: 'Producto Test Ventas',
            category: 'medicamento',
            subcategory: 'analgésico',
            presentation: 'tabletas',
            supplierId: testSupplierId,
            price: 100.00,
            costPrice: 60.00,
            minStock: 5,
            maxStock: 200,
            isActive: true
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        testProductId = productRes.data.product.id;
        log(colors.green, '✓', `Producto creado: ID ${testProductId}`);
        await sleep(200);
        
        // 4. Crear lote con stock
        log(colors.blue, '→', 'Creando lote con stock inicial...');
        const today = new Date();
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        const batchRes = await axios.post(`${API_URL}/batches`, {
            productId: testProductId,
            supplierId: testSupplierId,
            batchNumber: `BATCH-SALES-${Date.now()}`,
            manufacturingDate: today.toISOString().split('T')[0],
            expirationDate: futureDate.toISOString().split('T')[0],
            initialQuantity: 100,
            purchasePrice: 60.00,
            salePrice: 100.00,
            canBeSold: true
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        testBatchId = batchRes.data.batch.id;
        log(colors.green, '✓', `Lote creado: ID ${testBatchId} (100 unidades disponibles)`);
        await sleep(200);
        
        // 5. Crear cliente de test
        log(colors.blue, '→', 'Creando cliente de prueba...');
        const clientRes = await axios.post(`${API_URL}/users/register`, {
            email: `client${Date.now()}@test.com`,
            password: 'Client123!',
            firstName: 'Cliente',
            lastName: 'Test',
            role: 'cliente',
            phone: '55555555',
            dpi: '1234567890123',
            nit: '12345678'
        });
        testClientId = clientRes.data.user.id;
        log(colors.green, '✓', `Cliente creado: ID ${testClientId}`);
        await sleep(200);
        
        log(colors.cyan, '\n✓', 'Configuración completada exitosamente\n');
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error en configuración');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        return false;
    }
}

// ============================================================
// TEST 1: CREAR VENTA CON CLIENTE REGISTRADO
// ============================================================

async function testCreateSaleWithClient() {
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  TEST 1: Crear Venta con Cliente Registrado' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Creando venta con cliente registrado...');
        
        const response = await axios.post(`${API_URL}/invoices`, {
            clientId: testClientId,
            sellerId: 1, // ID del admin
            items: [
                {
                    productId: testProductId,
                    quantity: 10,
                    unitPrice: 100.00,
                    discount: 0
                }
            ],
            paymentMethod: 'efectivo',
            discount: 0,
            tax: 0,
            notes: 'Venta de prueba con cliente registrado'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        testInvoiceId = response.data.invoice.id;
        
        log(colors.green, '✓', 'Venta creada exitosamente');
        log(colors.magenta, 'ℹ', `ID Venta: ${response.data.invoice.id}`);
        log(colors.magenta, 'ℹ', `Número Recibo: ${response.data.invoice.invoiceNumber}`);
        log(colors.magenta, 'ℹ', `Total: Q${response.data.invoice.total}`);
        log(colors.magenta, 'ℹ', `Items: ${response.data.invoice.items.length}`);
        log(colors.magenta, 'ℹ', `Cliente: ${response.data.invoice.client.firstName} ${response.data.invoice.client.lastName}`);
        log(colors.magenta, 'ℹ', `Comprobante: ${response.data.receipt.receiptNumber}`);
        
        // Verificar que el stock se redujo
        const productCheck = await axios.get(`${API_URL}/products/${testProductId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        log(colors.magenta, 'ℹ', `Stock después de venta: ${productCheck.data.stock} unidades`);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al crear venta');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        return false;
    }
}

// ============================================================
// TEST 2: CREAR VENTA SIN CLIENTE (CONSUMIDOR FINAL)
// ============================================================

async function testCreateSaleWithoutClient() {
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  TEST 2: Crear Venta sin Cliente (Consumidor Final)' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Creando venta para consumidor final...');
        
        const response = await axios.post(`${API_URL}/invoices`, {
            clientName: 'Consumidor Final',
            clientNit: 'CF',
            sellerId: 1,
            items: [
                {
                    productId: testProductId,
                    quantity: 5,
                    unitPrice: 100.00
                }
            ],
            paymentMethod: 'efectivo',
            discount: 25.00,
            tax: 0,
            notes: 'Venta sin cliente registrado'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Venta creada exitosamente');
        log(colors.magenta, 'ℹ', `Número Recibo: ${response.data.invoice.invoiceNumber}`);
        log(colors.magenta, 'ℹ', `Cliente: ${response.data.invoice.clientName}`);
        log(colors.magenta, 'ℹ', `Subtotal: Q${response.data.invoice.subtotal}`);
        log(colors.magenta, 'ℹ', `Descuento: Q${response.data.invoice.discount}`);
        log(colors.magenta, 'ℹ', `Total: Q${response.data.invoice.total}`);
        log(colors.magenta, 'ℹ', `Comprobante: ${response.data.receipt.receiptNumber}`);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al crear venta');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        return false;
    }
}

// ============================================================
// TEST 3: OBTENER DETALLES DE VENTA
// ============================================================

async function testGetSaleDetails() {
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  TEST 3: Obtener Detalles de Venta' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════\n' + colors.reset);
    
    if (!testInvoiceId) {
        log(colors.yellow, '⚠', 'No hay venta de prueba para consultar');
        return false;
    }
    
    try {
        log(colors.blue, '→', 'Obteniendo detalles de la venta...');
        
        const response = await axios.get(`${API_URL}/invoices/${testInvoiceId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const sale = response.data;
        
        log(colors.green, '✓', 'Detalles obtenidos exitosamente');
        log(colors.magenta, 'ℹ', `Número: ${sale.invoiceNumber}`);
        log(colors.magenta, 'ℹ', `Fecha: ${sale.invoiceDate} ${sale.invoiceTime}`);
        log(colors.magenta, 'ℹ', `Cliente: ${sale.client ? sale.client.firstName + ' ' + sale.client.lastName : sale.clientName}`);
        log(colors.magenta, 'ℹ', `Vendedor: ${sale.seller.firstName} ${sale.seller.lastName}`);
        log(colors.magenta, 'ℹ', `Estado: ${sale.status}`);
        log(colors.magenta, 'ℹ', `Pago: ${sale.paymentMethod} (${sale.paymentStatus})`);
        
        log(colors.magenta, 'ℹ', '\n  Items de la venta:');
        sale.items.forEach((item, i) => {
            log(colors.magenta, '  ', `    ${i + 1}. ${item.product.name}`);
            log(colors.magenta, '  ', `       Cantidad: ${item.quantity} x Q${item.unitPrice} = Q${item.total}`);
            log(colors.magenta, '  ', `       Lote: ${item.batch.batchNumber}`);
            log(colors.magenta, '  ', `       Vence: ${item.batch.expirationDate}`);
        });
        
        log(colors.magenta, '\n  ', `Subtotal: Q${sale.subtotal}`);
        log(colors.magenta, '  ', `Descuento: Q${sale.discount}`);
        log(colors.magenta, '  ', `Impuestos: Q${sale.tax}`);
        log(colors.magenta, '  ', `TOTAL: Q${sale.total}`);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al obtener detalles');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        return false;
    }
}

// ============================================================
// TEST 4: LISTAR VENTAS CON PAGINACIÓN
// ============================================================

async function testListSales() {
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  TEST 4: Listar Ventas con Paginación' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Listando ventas...');
        
        const response = await axios.get(`${API_URL}/invoices?page=1&limit=10`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Ventas listadas exitosamente');
        log(colors.magenta, 'ℹ', `Total de ventas: ${response.data.total}`);
        log(colors.magenta, 'ℹ', `Página: ${response.data.page} de ${response.data.totalPages}`);
        log(colors.magenta, 'ℹ', `En esta página: ${response.data.invoices.length} ventas`);
        
        if (response.data.invoices.length > 0) {
            log(colors.magenta, 'ℹ', '\n  Primeras ventas:');
            response.data.invoices.slice(0, 3).forEach((sale, i) => {
                log(colors.magenta, '  ', `    ${i + 1}. ${sale.invoiceNumber} - Q${sale.total} - ${sale.status}`);
            });
        }
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al listar ventas');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        return false;
    }
}

// ============================================================
// TEST 5: ESTADÍSTICAS DE VENTAS
// ============================================================

async function testSalesStats() {
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  TEST 5: Estadísticas de Ventas' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Obteniendo estadísticas...');
        
        const response = await axios.get(`${API_URL}/invoices/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const stats = response.data;
        
        log(colors.green, '✓', 'Estadísticas obtenidas');
        log(colors.magenta, 'ℹ', `Total de ventas: ${stats.total}`);
        log(colors.magenta, 'ℹ', `Ingresos totales: Q${stats.totalRevenue.toFixed(2)}`);
        
        if (stats.averageTicket && stats.averageTicket.average) {
            log(colors.magenta, 'ℹ', `Ticket promedio: Q${parseFloat(stats.averageTicket.average).toFixed(2)}`);
        }
        
        if (stats.byStatus && stats.byStatus.length > 0) {
            log(colors.magenta, 'ℹ', '\n  Por estado:');
            stats.byStatus.forEach(stat => {
                log(colors.magenta, '  ', `    ${stat.status}: ${stat.count} ventas (Q${stat.totalAmount || 0})`);
            });
        }
        
        if (stats.byPaymentMethod && stats.byPaymentMethod.length > 0) {
            log(colors.magenta, 'ℹ', '\n  Por método de pago:');
            stats.byPaymentMethod.forEach(stat => {
                log(colors.magenta, '  ', `    ${stat.paymentMethod}: ${stat.count} ventas (Q${stat.totalAmount || 0})`);
            });
        }
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al obtener estadísticas');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        return false;
    }
}

// ============================================================
// TEST 6: VENTA CON STOCK INSUFICIENTE (DEBE FALLAR)
// ============================================================

async function testInsufficientStock() {
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  TEST 6: Venta con Stock Insuficiente (debe fallar)' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Intentando vender 500 unidades (debe fallar)...');
        
        await axios.post(`${API_URL}/invoices`, {
            clientName: 'Test Stock',
            sellerId: 1,
            items: [
                {
                    productId: testProductId,
                    quantity: 500, // Cantidad imposible
                    unitPrice: 100.00
                }
            ],
            paymentMethod: 'efectivo'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.red, '✗', 'ERROR: La venta debería haber fallado');
        return false;
        
    } catch (error) {
        if (error.response && error.response.status === 400) {
            log(colors.green, '✓', 'Correctamente rechazada por stock insuficiente');
            log(colors.magenta, 'ℹ', `Mensaje: ${error.response.data.message}`);
            return true;
        } else {
            log(colors.red, '✗', 'Error inesperado');
            console.error(error.response?.data || error.message);
            return false;
        }
    }
}

// ============================================================
// TEST 7: VENTA CON MÚLTIPLES LOTES (FIFO)
// ============================================================

async function testMultiBatchSale() {
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  TEST 7: Venta con Múltiples Lotes (FIFO)' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════\n' + colors.reset);
    
    try {
        // Crear segundo lote con fecha de vencimiento más lejana
        log(colors.blue, '→', 'Creando segundo lote...');
        
        const today = new Date();
        const farFutureDate = new Date();
        farFutureDate.setFullYear(farFutureDate.getFullYear() + 2);
        
        const batch2Res = await axios.post(`${API_URL}/batches`, {
            productId: testProductId,
            supplierId: testSupplierId,
            batchNumber: `BATCH2-SALES-${Date.now()}`,
            manufacturingDate: today.toISOString().split('T')[0],
            expirationDate: farFutureDate.toISOString().split('T')[0],
            initialQuantity: 50,
            purchasePrice: 60.00,
            salePrice: 100.00,
            canBeSold: true
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', `Segundo lote creado: ${batch2Res.data.batch.batchNumber}`);
        await sleep(300);
        
        // Verificar stock total
        const productRes = await axios.get(`${API_URL}/products/${testProductId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const totalStock = productRes.data.stock;
        
        log(colors.magenta, 'ℹ', `Stock total disponible: ${totalStock} unidades`);
        
        // Vender cantidad que requiera ambos lotes
        log(colors.blue, '→', 'Vendiendo cantidad que usa ambos lotes...');
        
        // Vender 95 unidades (usará el lote 1 que tiene ~85 y el lote 2 que tiene 50)
        const quantityToSell = Math.min(95, totalStock - 5);
        
        const saleRes = await axios.post(`${API_URL}/invoices`, {
            clientName: 'Test Multi-Lote',
            sellerId: 1,
            items: [
                {
                    productId: testProductId,
                    quantity: quantityToSell,
                    unitPrice: 100.00
                }
            ],
            paymentMethod: 'tarjeta',
            notes: 'Prueba de FIFO con múltiples lotes'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Venta multi-lote exitosa');
        log(colors.magenta, 'ℹ', `Recibo: ${saleRes.data.invoice.invoiceNumber}`);
        log(colors.magenta, 'ℹ', `Items en recibo: ${saleRes.data.invoice.items.length}`);
        log(colors.magenta, 'ℹ', `Cantidad total vendida: ${quantityToSell} unidades`);
        
        // Mostrar lotes usados (FIFO)
        log(colors.magenta, 'ℹ', '\n  Lotes usados (FIFO):');
        saleRes.data.invoice.items.forEach((item, i) => {
            log(colors.magenta, '  ', `    ${i + 1}. Lote ${item.batch.batchNumber} - ${item.quantity} unidades`);
            log(colors.magenta, '  ', `       Vence: ${item.batch.expirationDate}`);
        });
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error en venta multi-lote');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        return false;
    }
}

// ============================================================
// TEST 8: ANULAR VENTA
// ============================================================

async function testCancelSale() {
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  TEST 8: Anular Venta' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════\n' + colors.reset);
    
    if (!testInvoiceId) {
        log(colors.yellow, '⚠', 'No hay venta de prueba para anular');
        return false;
    }
    
    try {
        // Verificar stock antes de anular
        const productBefore = await axios.get(`${API_URL}/products/${testProductId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const stockBefore = productBefore.data.stock;
        
        log(colors.blue, '→', `Stock actual: ${stockBefore} unidades`);
        log(colors.blue, '→', 'Anulando venta...');
        
        const response = await axios.post(
            `${API_URL}/invoices/${testInvoiceId}/cancel`,
            {
                reason: 'Prueba de anulación del sistema - Test automatizado'
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );
        
        log(colors.green, '✓', 'Venta anulada exitosamente');
        log(colors.magenta, 'ℹ', `Estado: ${response.data.invoice.status}`);
        
        await sleep(300);
        
        // Verificar que el stock se restauró
        const productAfter = await axios.get(`${API_URL}/products/${testProductId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const stockAfter = productAfter.data.stock;
        
        log(colors.blue, '→', `Stock después de anular: ${stockAfter} unidades`);
        
        if (stockAfter > stockBefore) {
            log(colors.green, '✓', `Stock restaurado correctamente: +${stockAfter - stockBefore} unidades`);
            return true;
        } else {
            log(colors.red, '✗', 'ERROR: Stock no se restauró correctamente');
            return false;
        }
        
    } catch (error) {
        log(colors.red, '✗', 'Error al anular venta');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        return false;
    }
}

// ============================================================
// EJECUTAR TODOS LOS TESTS
// ============================================================

async function runAllTests() {
    console.log(colors.magenta + '\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║     SUITE DE TESTS: VENTAS Y COMPROBANTES               ║');
    console.log('║     Sistema FIFO con Trazabilidad de Lotes             ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    // Setup inicial
    const setupOk = await setupTestData();
    if (!setupOk) {
        log(colors.red, '✗', 'Error en configuración - Abortando tests');
        process.exit(1);
    }
    
    await sleep(500);
    
    // Ejecutar tests
    const results = [];
    
    results.push(await testCreateSaleWithClient());
    await sleep(500);
    
    results.push(await testCreateSaleWithoutClient());
    await sleep(500);
    
    results.push(await testGetSaleDetails());
    await sleep(500);
    
    results.push(await testListSales());
    await sleep(500);
    
    results.push(await testSalesStats());
    await sleep(500);
    
    results.push(await testInsufficientStock());
    await sleep(500);
    
    results.push(await testMultiBatchSale());
    await sleep(500);
    
    results.push(await testCancelSale());
    await sleep(500);
    
    // Reporte final
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  RESUMEN DE TESTS' + colors.reset);
    console.log(colors.cyan + '══════════════════════════════════════════════════════════' + colors.reset);
    
    const passed = results.filter(r => r === true).length;
    const failed = results.filter(r => r === false).length;
    const total = results.length;
    
    console.log('');
    console.log(colors.green + `  ✓ Tests exitosos: ${passed}` + colors.reset);
    console.log(colors.red + `  ✗ Tests fallidos:  ${failed}` + colors.reset);
    console.log(colors.magenta + `  Total:            ${total}` + colors.reset);
    console.log('');
    
    if (failed === 0) {
        console.log(colors.green + '  🎉 ¡Todos los tests pasaron exitosamente!' + colors.reset);
    } else {
        console.log(colors.red + '  ⚠️  Algunos tests fallaron. Revisar detalles arriba.' + colors.reset);
    }
    
    console.log(colors.cyan + '\n══════════════════════════════════════════════════════════\n' + colors.reset);
    
    process.exit(failed > 0 ? 1 : 0);
}

// Ejecutar
runAllTests().catch(err => {
    console.error(colors.red + '\n✗ Error fatal en suite de tests:' + colors.reset);
    console.error(err);
    process.exit(1);
});