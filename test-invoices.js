/**
 * Tests de Facturas y Recibos de Venta
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

async function setupTestData() {
    console.log(colors.cyan + '\n══════ CONFIGURACIÓN INICIAL ══════\n' + colors.reset);
    
    try {
        // 1. Login como admin
        log(colors.blue, '→', 'Iniciando sesión...');
        const loginRes = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@farmacia.com',
            password: 'Admin123!'
        });
        adminToken = loginRes.data.token;
        log(colors.green, '✓', 'Login exitoso');
        
        // 2. Crear proveedor de test
        log(colors.blue, '→', 'Creando proveedor...');
        const supplierRes = await axios.post(`${API_URL}/suppliers`, {
            code: `SUP-TEST-${Date.now()}`,
            name: 'Proveedor Test Facturación',
            email: `supplier${Date.now()}@test.com`,
            phone: '12345678'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        testSupplierId = supplierRes.data.supplier.id;
        log(colors.green, '✓', `Proveedor creado: ${testSupplierId}`);
        
        // 3. Crear producto de test
        log(colors.blue, '→', 'Creando producto...');
        const productRes = await axios.post(`${API_URL}/products`, {
            sku: `PROD-INV-${Date.now()}`,
            name: 'Producto Test Facturación',
            category: 'medicamento',
            supplierId: testSupplierId,
            price: 100.00,
            costPrice: 60.00,
            minStock: 5,
            maxStock: 100
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        testProductId = productRes.data.product.id;
        log(colors.green, '✓', `Producto creado: ${testProductId}`);
        
        // 4. Crear lote con stock
        log(colors.blue, '→', 'Creando lote con stock...');
        const today = new Date();
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        const batchRes = await axios.post(`${API_URL}/batches`, {
            productId: testProductId,
            supplierId: testSupplierId,
            batchNumber: `BATCH-TEST-${Date.now()}`,
            manufacturingDate: today.toISOString().split('T')[0],
            expirationDate: futureDate.toISOString().split('T')[0],
            initialQuantity: 50,
            purchasePrice: 60.00,
            salePrice: 100.00
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        testBatchId = batchRes.data.batch.id;
        log(colors.green, '✓', `Lote creado: ${testBatchId} (50 unidades)`);
        
        // 5. Crear cliente de test
        log(colors.blue, '→', 'Creando cliente...');
        const clientRes = await axios.post(`${API_URL}/users/register`, {
            email: `client${Date.now()}@test.com`,
            password: 'Client123!',
            firstName: 'Cliente',
            lastName: 'Test',
            role: 'cliente',
            phone: '55555555'
        });
        testClientId = clientRes.data.user.id;
        log(colors.green, '✓', `Cliente creado: ${testClientId}`);
        
        console.log(colors.cyan + '\n✓ Configuración completada\n' + colors.reset);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error en configuración');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testCreateInvoiceWithClient() {
    console.log(colors.cyan + '\n══════ TEST 1: Crear Factura con Cliente ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Creando factura...');
        
        const response = await axios.post(`${API_URL}/invoices`, {
            clientId: testClientId,
            sellerId: 1, // Asumiendo que el admin es ID 1
            items: [
                {
                    productId: testProductId,
                    quantity: 5,
                    unitPrice: 100.00
                }
            ],
            paymentMethod: 'efectivo',
            discount: 0,
            tax: 0
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        testInvoiceId = response.data.invoice.id;
        
        log(colors.green, '✓', 'Factura creada exitosamente');
        log(colors.magenta, 'ℹ', `ID: ${response.data.invoice.id}`);
        log(colors.magenta, 'ℹ', `Número: ${response.data.invoice.invoiceNumber}`);
        log(colors.magenta, 'ℹ', `Total: Q${response.data.invoice.total}`);
        log(colors.magenta, 'ℹ', `Items: ${response.data.invoice.items.length}`);
        log(colors.magenta, 'ℹ', `Comprobante: ${response.data.receipt.receiptNumber}`);
        
        // Verificar que se crearon movimientos de inventario
        const movementsRes = await axios.get(
            `${API_URL}/inventory/movements/product/${testProductId}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        log(colors.magenta, 'ℹ', `Movimientos de inventario creados: ${movementsRes.data.length}`);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al crear factura');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testCreateInvoiceWithoutClient() {
    console.log(colors.cyan + '\n══════ TEST 2: Crear Factura sin Cliente (Consumidor Final) ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Creando factura para consumidor final...');
        
        const response = await axios.post(`${API_URL}/invoices`, {
            clientName: 'Consumidor Final',
            clientNit: 'CF',
            sellerId: 1,
            items: [
                {
                    productId: testProductId,
                    quantity: 3,
                    unitPrice: 100.00
                }
            ],
            paymentMethod: 'efectivo',
            discount: 10.00,
            tax: 0
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Factura creada exitosamente');
        log(colors.magenta, 'ℹ', `Número: ${response.data.invoice.invoiceNumber}`);
        log(colors.magenta, 'ℹ', `Cliente: ${response.data.invoice.clientName}`);
        log(colors.magenta, 'ℹ', `Subtotal: Q${response.data.invoice.subtotal}`);
        log(colors.magenta, 'ℹ', `Descuento: Q${response.data.invoice.discount}`);
        log(colors.magenta, 'ℹ', `Total: Q${response.data.invoice.total}`);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al crear factura');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testGetInvoiceDetails() {
    console.log(colors.cyan + '\n══════ TEST 3: Obtener Detalles de Factura ══════\n' + colors.reset);
    
    if (!testInvoiceId) {
        log(colors.yellow, '⚠', 'No hay factura de test');
        return false;
    }
    
    try {
        log(colors.blue, '→', 'Obteniendo detalles...');
        
        const response = await axios.get(`${API_URL}/invoices/${testInvoiceId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const invoice = response.data;
        
        log(colors.green, '✓', 'Detalles obtenidos');
        log(colors.magenta, 'ℹ', `Número: ${invoice.invoiceNumber}`);
        log(colors.magenta, 'ℹ', `Fecha: ${invoice.invoiceDate}`);
        log(colors.magenta, 'ℹ', `Cliente: ${invoice.client ? invoice.client.firstName + ' ' + invoice.client.lastName : 'N/A'}`);
        log(colors.magenta, 'ℹ', `Vendedor: ${invoice.seller.firstName} ${invoice.seller.lastName}`);
        log(colors.magenta, 'ℹ', `Items:`);
        
        invoice.items.forEach((item, i) => {
            log(colors.magenta, '  ', `  ${i + 1}. ${item.product.name} - ${item.quantity} x Q${item.unitPrice} = Q${item.total}`);
            log(colors.magenta, '  ', `     Lote: ${item.batch.batchNumber} (Vence: ${item.batch.expirationDate})`);
        });
        
        log(colors.magenta, 'ℹ', `Total: Q${invoice.total}`);
        log(colors.magenta, 'ℹ', `Estado: ${invoice.status}`);
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al obtener detalles');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testListInvoices() {
    console.log(colors.cyan + '\n══════ TEST 4: Listar Facturas con Filtros ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Listando facturas...');
        
        const response = await axios.get(`${API_URL}/invoices?page=1&limit=10`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Facturas listadas');
        log(colors.magenta, 'ℹ', `Total: ${response.data.total}`);
        log(colors.magenta, 'ℹ', `Página: ${response.data.page}/${response.data.totalPages}`);
        log(colors.magenta, 'ℹ', `En esta página: ${response.data.invoices.length}`);
        
        // Listar primeras 3 facturas
        response.data.invoices.slice(0, 3).forEach((inv, i) => {
            log(colors.magenta, '  ', `${i + 1}. ${inv.invoiceNumber} - Q${inv.total} - ${inv.status}`);
        });
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al listar facturas');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testCancelInvoice() {
    console.log(colors.cyan + '\n══════ TEST 5: Anular Factura ══════\n' + colors.reset);
    
    if (!testInvoiceId) {
        log(colors.yellow, '⚠', 'No hay factura de test');
        return false;
    }
    
    try {
        // Primero verificar el stock actual
        const productBefore = await axios.get(`${API_URL}/products/${testProductId}`);
        const stockBefore = productBefore.data.stock;
        
        log(colors.blue, '→', `Stock antes de anular: ${stockBefore} unidades`);
        log(colors.blue, '→', 'Anulando factura...');
        
        const response = await axios.post(
            `${API_URL}/invoices/${testInvoiceId}/cancel`,
            {
                reason: 'Test de anulación - Prueba del sistema'
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );
        
        log(colors.green, '✓', 'Factura anulada exitosamente');
        log(colors.magenta, 'ℹ', `Estado: ${response.data.invoice.status}`);
        
        // Verificar que el stock se restauró
        const productAfter = await axios.get(`${API_URL}/products/${testProductId}`);
        const stockAfter = productAfter.data.stock;
        
        log(colors.blue, '→', `Stock después de anular: ${stockAfter} unidades`);
        log(colors.magenta, 'ℹ', `Stock restaurado: ${stockAfter - stockBefore} unidades`);
        
        if (stockAfter > stockBefore) {
            log(colors.green, '✓', 'Stock correctamente restaurado');
        } else {
            log(colors.red, '✗', 'ERROR: Stock no se restauró correctamente');
        }
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al anular factura');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testInvoiceStats() {
    console.log(colors.cyan + '\n══════ TEST 6: Estadísticas de Facturas ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Obteniendo estadísticas...');
        
        const response = await axios.get(`${API_URL}/invoices/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Estadísticas obtenidas');
        log(colors.magenta, 'ℹ', `Total facturas: ${response.data.total}`);
        log(colors.magenta, 'ℹ', `Ingresos totales: Q${response.data.totalRevenue}`);
        log(colors.magenta, 'ℹ', `Ticket promedio: Q${response.data.averageTicket.average}`);
        
        log(colors.magenta, 'ℹ', 'Por estado:');
        response.data.byStatus.forEach(stat => {
            log(colors.magenta, '  ', `  ${stat.status}: ${stat.count} (Q${stat.totalAmount || 0})`);
        });
        
        log(colors.magenta, 'ℹ', 'Por método de pago:');
        response.data.byPaymentMethod.forEach(stat => {
            log(colors.magenta, '  ', `  ${stat.paymentMethod}: ${stat.count} (Q${stat.totalAmount || 0})`);
        });
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error al obtener estadísticas');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function testInsufficientStock() {
    console.log(colors.cyan + '\n══════ TEST 7: Venta con Stock Insuficiente (debe fallar) ══════\n' + colors.reset);
    
    try {
        log(colors.blue, '→', 'Intentando vender 1000 unidades (debe fallar)...');
        
        await axios.post(`${API_URL}/invoices`, {
            clientName: 'Test',
            sellerId: 1,
            items: [
                {
                    productId: testProductId,
                    quantity: 1000, // Cantidad imposible
                    unitPrice: 100.00
                }
            ],
            paymentMethod: 'efectivo'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.red, '✗', 'ERROR: La venta debería haber fallado por stock insuficiente');
        return false;
        
    } catch (error) {
        if (error.response?.status === 400) {
            log(colors.green, '✓', 'Correctamente rechazada: Stock insuficiente');
            log(colors.magenta, 'ℹ', `Mensaje: ${error.response.data.message}`);
            return true;
        } else {
            log(colors.red, '✗', 'Error inesperado');
            console.error(error.response?.data || error.message);
            return false;
        }
    }
}

async function testMultiBatchSale() {
    console.log(colors.cyan + '\n══════ TEST 8: Venta que usa Múltiples Lotes (FIFO) ══════\n' + colors.reset);
    
    try {
        // Crear segundo lote con fecha de vencimiento más lejana
        log(colors.blue, '→', 'Creando segundo lote...');
        
        const today = new Date();
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);
        
        const batch2Res = await axios.post(`${API_URL}/batches`, {
            productId: testProductId,
            supplierId: testSupplierId,
            batchNumber: `BATCH2-TEST-${Date.now()}`,
            manufacturingDate: today.toISOString().split('T')[0],
            expirationDate: futureDate.toISOString().split('T')[0],
            initialQuantity: 30,
            purchasePrice: 60.00,
            salePrice: 100.00
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', `Segundo lote creado: ${batch2Res.data.batch.batchNumber}`);
        
        // Obtener stock total
        const productRes = await axios.get(`${API_URL}/products/${testProductId}`);
        const totalStock = productRes.data.stock;
        
        log(colors.magenta, 'ℹ', `Stock total disponible: ${totalStock} unidades`);
        
        // Intentar vender cantidad que requiera ambos lotes
        log(colors.blue, '→', 'Vendiendo cantidad que usa ambos lotes...');
        
        const saleRes = await axios.post(`${API_URL}/invoices`, {
            clientName: 'Test Multi-Lote',
            sellerId: 1,
            items: [
                {
                    productId: testProductId,
                    quantity: Math.min(totalStock - 5, 40), // Usar casi todo el stock
                    unitPrice: 100.00
                }
            ],
            paymentMethod: 'efectivo'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        log(colors.green, '✓', 'Venta multi-lote exitosa');
        log(colors.magenta, 'ℹ', `Factura: ${saleRes.data.invoice.invoiceNumber}`);
        log(colors.magenta, 'ℹ', `Items en factura: ${saleRes.data.invoice.items.length}`);
        
        // Mostrar lotes usados
        saleRes.data.invoice.items.forEach((item, i) => {
            log(colors.magenta, '  ', `  ${i + 1}. Lote ${item.batch.batchNumber} - ${item.quantity} unidades`);
        });
        
        return true;
    } catch (error) {
        log(colors.red, '✗', 'Error en venta multi-lote');
        console.error(error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log(colors.magenta + '\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║       TESTS DE FACTURACIÓN Y VENTAS                       ║');
    console.log('║       Sistema FIFO con Trazabilidad de Lotes             ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    const setupOk = await setupTestData();
    if (!setupOk) {
        log(colors.red, '✗', 'Error en configuración - Abortando tests');
        process.exit(1);
    }
    
    const results = [];
    
    results.push(await testCreateInvoiceWithClient());
    results.push(await testCreateInvoiceWithoutClient());
    results.push(await testGetInvoiceDetails());
    results.push(await testListInvoices());
    results.push(await testInvoiceStats());
    results.push(await testInsufficientStock());
    results.push(await testMultiBatchSale());
    results.push(await testCancelInvoice()); // Al final para no afectar otros tests
    
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