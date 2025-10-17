/**
 * Suite Principal de Tests
 * Autor: Alexander Echeverria
 * Ubicacion: test-suite.js
 * 
 * Ejecutar: node test-suite.js
 */

require('dotenv').config();
const axios = require('axios');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

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

// Variables globales para tests
let adminToken = null;
let vendedorToken = null;
let clienteToken = null;
let testUserId = null;
let testProductId = null;
let testSupplierId = null;
let testBatchId = null;
let testInvoiceId = null;

// Estadísticas
let stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
};

// ========== UTILIDADES ==========

function printHeader(text) {
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + '  ' + text + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

function printSubHeader(text) {
    console.log('\n' + colors.blue + '─'.repeat(50) + colors.reset);
    console.log(colors.blue + '  ' + text + colors.reset);
    console.log(colors.blue + '─'.repeat(50) + colors.reset + '\n');
}

function printSuccess(message) {
    stats.passed++;
    console.log(colors.green + '✓ ' + message + colors.reset);
}

function printError(message, error = null) {
    stats.failed++;
    console.log(colors.red + '✗ ' + message + colors.reset);
    if (error) {
        console.log(colors.red + '  Error: ' + error.message + colors.reset);
        if (error.response) {
            console.log(colors.red + '  Status: ' + error.response.status + colors.reset);
            console.log(colors.red + '  Data: ' + JSON.stringify(error.response.data) + colors.reset);
        }
    }
}

function printWarning(message) {
    stats.skipped++;
    console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

function printInfo(message) {
    console.log(colors.magenta + 'ℹ ' + message + colors.reset);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== TESTS DE CONFIGURACIÓN ==========

async function testConfiguration() {
    printHeader('TEST DE CONFIGURACIÓN');
    
    try {
        printInfo('Verificando variables de entorno...');
        
        const requiredVars = [
            'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST',
            'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME'
        ];
        
        let allPresent = true;
        requiredVars.forEach(varName => {
            if (process.env[varName]) {
                printSuccess(`${varName} está configurada`);
            } else {
                printError(`${varName} NO está configurada`);
                allPresent = false;
            }
        });
        
        if (allPresent) {
            printSuccess('Todas las variables de entorno requeridas están configuradas');
        } else {
            printError('Faltan variables de entorno');
        }
        
        // Test de conexión al servidor
        printInfo(`Probando conexión a ${BASE_URL}...`);
        const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
        printSuccess(`Servidor respondiendo: ${response.status}`);
        
    } catch (error) {
        printError('Error en configuración', error);
    }
}

// ========== TESTS DE USUARIOS ==========

async function testUsers() {
    printHeader('TESTS DE USUARIOS');
    
    // Test 1: Registro de usuario
    printSubHeader('1. Registro de Usuario');
    try {
        const response = await axios.post(`${API_URL}/users/register`, {
            email: `test_${Date.now()}@farmacia.com`,
            password: 'Test123456!',
            firstName: 'Usuario',
            lastName: 'Test',
            role: 'cliente',
            phone: '12345678'
        });
        
        stats.total++;
        testUserId = response.data.user.id;
        printSuccess(`Usuario registrado: ID ${testUserId}`);
        printInfo(`Token recibido: ${response.data.token.substring(0, 20)}...`);
        
    } catch (error) {
        stats.total++;
        printError('Error al registrar usuario', error);
    }
    
    // Test 2: Login tradicional
    printSubHeader('2. Login Tradicional');
    try {
        const response = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@farmacia.com',
            password: 'Admin123!'
        });
        
        stats.total++;
        adminToken = response.data.token;
        printSuccess('Login exitoso como administrador');
        printInfo(`Token: ${adminToken.substring(0, 30)}...`);
        
    } catch (error) {
        stats.total++;
        printError('Error en login', error);
    }
    
    // Test 3: Obtener perfil
    printSubHeader('3. Obtener Perfil');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/users/profile`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess(`Perfil obtenido: ${response.data.email}`);
            printInfo(`Role: ${response.data.role}`);
            printInfo(`Nombre: ${response.data.firstName} ${response.data.lastName}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener perfil', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token de autenticación');
    }
    
    // Test 4: Listar usuarios
    printSubHeader('4. Listar Usuarios');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/users?page=1&limit=5`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess(`Usuarios listados: ${response.data.total} total`);
            printInfo(`Página: ${response.data.page}/${response.data.totalPages}`);
            printInfo(`Usuarios en esta página: ${response.data.users.length}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al listar usuarios', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token de autenticación');
    }
    
    // Test 5: Actualizar perfil
    printSubHeader('5. Actualizar Perfil');
    if (adminToken) {
        try {
            const response = await axios.put(`${API_URL}/users/profile`, {
                phone: '55555555',
                address: 'Dirección de Test'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Perfil actualizado correctamente');
            printInfo(`Nuevo teléfono: ${response.data.user.phone}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al actualizar perfil', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token de autenticación');
    }
    
    // Test 6: Estadísticas de usuarios
    printSubHeader('6. Estadísticas de Usuarios');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/users/stats`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Estadísticas obtenidas');
            printInfo(`Total usuarios: ${response.data.total}`);
            printInfo(`Activos: ${response.data.active}`);
            printInfo(`Por roles:`);
            response.data.byRole.forEach(role => {
                printInfo(`  - ${role.role}: ${role.count}`);
            });
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener estadísticas', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token de autenticación');
    }
}

// ========== TESTS DE PROVEEDORES ==========

async function testSuppliers() {
    printHeader('TESTS DE PROVEEDORES');
    
    // Test 1: Crear proveedor
    printSubHeader('1. Crear Proveedor');
    if (adminToken) {
        try {
            const response = await axios.post(`${API_URL}/suppliers`, {
                code: `PROV-TEST-${Date.now()}`,
                name: 'Proveedor Test',
                email: `proveedor${Date.now()}@test.com`,
                phone: '12345678',
                acceptsReturns: true,
                returnPolicyMonthsBefore: 3
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            testSupplierId = response.data.supplier.id;
            printSuccess(`Proveedor creado: ID ${testSupplierId}`);
            printInfo(`Código: ${response.data.supplier.code}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al crear proveedor', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token de autenticación');
    }
    
    // Test 2: Listar proveedores
    printSubHeader('2. Listar Proveedores');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/suppliers`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess(`Proveedores listados: ${response.data.total}`);
            printInfo(`Proveedores activos: ${response.data.suppliers.filter(s => s.isActive).length}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al listar proveedores', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token de autenticación');
    }
    
    // Test 3: Obtener proveedor por ID
    printSubHeader('3. Obtener Proveedor por ID');
    if (adminToken && testSupplierId) {
        try {
            const response = await axios.get(`${API_URL}/suppliers/${testSupplierId}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Proveedor obtenido');
            printInfo(`Nombre: ${response.data.name}`);
            printInfo(`Email: ${response.data.email}`);
            printInfo(`Acepta devoluciones: ${response.data.acceptsReturns ? 'Sí' : 'No'}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener proveedor', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay proveedor de test');
    }
    
    // Test 4: Actualizar proveedor
    printSubHeader('4. Actualizar Proveedor');
    if (adminToken && testSupplierId) {
        try {
            const response = await axios.put(`${API_URL}/suppliers/${testSupplierId}`, {
                phone: '87654321',
                address: 'Nueva Dirección Test'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Proveedor actualizado');
            printInfo(`Nuevo teléfono: ${response.data.supplier.phone}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al actualizar proveedor', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay proveedor de test');
    }
    
    // Test 5: Estadísticas de proveedores
    printSubHeader('5. Estadísticas de Proveedores');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/suppliers/stats`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Estadísticas obtenidas');
            printInfo(`Total: ${response.data.total}`);
            printInfo(`Activos: ${response.data.active}`);
            printInfo(`Con deuda: ${response.data.withDebt}`);
            printInfo(`Deuda total: Q${response.data.totalDebt}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener estadísticas', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token de autenticación');
    }
}

// ========== TESTS DE PRODUCTOS ==========

async function testProducts() {
    printHeader('TESTS DE PRODUCTOS');
    
    // Primero necesitamos un proveedor
    if (!testSupplierId) {
        printWarning('Creando proveedor temporal para tests de productos...');
        try {
            const response = await axios.post(`${API_URL}/suppliers`, {
                code: `PROV-TEMP-${Date.now()}`,
                name: 'Proveedor Temporal',
                email: `temp${Date.now()}@test.com`,
                phone: '12345678'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            testSupplierId = response.data.supplier.id;
            printInfo(`Proveedor temporal creado: ${testSupplierId}`);
        } catch (error) {
            printError('No se pudo crear proveedor temporal', error);
            return;
        }
    }
    
    // Test 1: Crear producto
    printSubHeader('1. Crear Producto');
    if (adminToken && testSupplierId) {
        try {
            const response = await axios.post(`${API_URL}/products`, {
                sku: `PROD-TEST-${Date.now()}`,
                name: 'Producto de Test',
                category: 'medicamento',
                supplierId: testSupplierId,
                price: 50.00,
                costPrice: 30.00,
                minStock: 10,
                maxStock: 100,
                presentation: 'Caja x 20 tabletas'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            testProductId = response.data.product.id;
            printSuccess(`Producto creado: ID ${testProductId}`);
            printInfo(`SKU: ${response.data.product.sku}`);
            printInfo(`Precio: Q${response.data.product.price}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al crear producto', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token o proveedor');
    }
    
    // Test 2: Listar productos
    printSubHeader('2. Listar Productos');
    try {
        const response = await axios.get(`${API_URL}/products?page=1&limit=5`);
        
        stats.total++;
        printSuccess(`Productos listados: ${response.data.total}`);
        printInfo(`Productos en esta página: ${response.data.products.length}`);
        
    } catch (error) {
        stats.total++;
        printError('Error al listar productos', error);
    }
    
    // Test 3: Buscar producto por SKU
    printSubHeader('3. Buscar Producto por SKU');
    if (testProductId) {
        try {
            const product = await axios.get(`${API_URL}/products/${testProductId}`);
            const sku = product.data.sku;
            
            const response = await axios.get(`${API_URL}/products/sku/${sku}`);
            
            stats.total++;
            printSuccess('Producto encontrado por SKU');
            printInfo(`Nombre: ${response.data.name}`);
            printInfo(`Stock: ${response.data.stock}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al buscar producto por SKU', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay producto de test');
    }
    
    // Test 4: Actualizar producto
    printSubHeader('4. Actualizar Producto');
    if (adminToken && testProductId) {
        try {
            const response = await axios.put(`${API_URL}/products/${testProductId}`, {
                price: 55.00,
                description: 'Producto actualizado en test'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Producto actualizado');
            printInfo(`Nuevo precio: Q${response.data.product.price}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al actualizar producto', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token o producto');
    }
    
    // Test 5: Obtener productos con stock bajo
    printSubHeader('5. Productos con Stock Bajo');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/products/low-stock`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess(`Productos con stock bajo: ${response.data.count}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener productos con stock bajo', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token de autenticación');
    }
    
    // Test 6: Estadísticas de productos
    printSubHeader('6. Estadísticas de Productos');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/products/stats`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Estadísticas obtenidas');
            printInfo(`Total: ${response.data.total}`);
            printInfo(`Activos: ${response.data.active}`);
            printInfo(`Con stock: ${response.data.withStock}`);
            printInfo(`Agotados: ${response.data.outOfStock}`);
            printInfo(`Valor inventario: Q${response.data.totalInventoryValue}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener estadísticas', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token de autenticación');
    }
}

// ========== TESTS DE LOTES ==========

async function testBatches() {
    printHeader('TESTS DE LOTES');
    
    // Test 1: Crear lote
    printSubHeader('1. Crear Lote');
    if (adminToken && testProductId && testSupplierId) {
        try {
            const today = new Date();
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + 6);
            
            const response = await axios.post(`${API_URL}/batches`, {
                productId: testProductId,
                supplierId: testSupplierId,
                batchNumber: `LOTE-TEST-${Date.now()}`,
                manufacturingDate: today.toISOString().split('T')[0],
                expirationDate: futureDate.toISOString().split('T')[0],
                initialQuantity: 100,
                purchasePrice: 30.00,
                salePrice: 50.00,
                location: 'ESTANTE-A1'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            testBatchId = response.data.batch.id;
            printSuccess(`Lote creado: ID ${testBatchId}`);
            printInfo(`Número: ${response.data.batch.batchNumber}`);
            printInfo(`Cantidad: ${response.data.batch.currentQuantity}`);
            printInfo(`Estado: ${response.data.batch.status}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al crear lote', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - Faltan datos previos');
    }
    
    // Test 2: Listar lotes
    printSubHeader('2. Listar Lotes');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/batches`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess(`Lotes listados: ${response.data.total}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al listar lotes', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token');
    }
    
    // Test 3: Lotes por vencer
    printSubHeader('3. Lotes Próximos a Vencer');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/batches/expiring?days=60`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess(`Lotes por vencer (60 días): ${response.data.count}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener lotes por vencer', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token');
    }
    
    // Test 4: Estadísticas de lotes
    printSubHeader('4. Estadísticas de Lotes');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/batches/stats`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Estadísticas obtenidas');
            printInfo(`Total: ${response.data.total}`);
            printInfo(`Activos: ${response.data.active}`);
            printInfo(`Por vencer: ${response.data.nearExpiry}`);
            printInfo(`Vencidos: ${response.data.expired}`);
            printInfo(`Valor total: Q${response.data.totalValue}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener estadísticas', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token');
    }
}

// ========== TESTS DE ALERTAS ==========

async function testAlerts() {
    printHeader('TESTS DE ALERTAS');
    
    // Test 1: Todas las alertas
    printSubHeader('1. Todas las Alertas');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/alerts`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Alertas obtenidas');
            printInfo(`Total: ${response.data.summary.total}`);
            printInfo(`Críticas: ${response.data.summary.critical}`);
            printInfo(`Stock bajo: ${response.data.lowStock.count}`);
            printInfo(`Por vencer: ${response.data.expiring.count}`);
            printInfo(`Vencidos: ${response.data.expired.count}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener alertas', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token');
    }
}

// ========== TESTS DE ESTADÍSTICAS ==========

async function testStatistics() {
    printHeader('TESTS DE ESTADÍSTICAS');
    
    // Test 1: Dashboard
    printSubHeader('1. Dashboard Principal');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/statistics/dashboard`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess('Dashboard obtenido');
            printInfo(`Ventas totales: Q${response.data.sales.total}`);
            printInfo(`Recibos: ${response.data.sales.count}`);
            printInfo(`Clientes únicos: ${response.data.clients.unique}`);
            printInfo(`Valor inventario: Q${response.data.inventory.totalValue}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener dashboard', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token');
    }
    
    // Test 2: Productos más vendidos
    printSubHeader('2. Productos Más Vendidos');
    if (adminToken) {
        try {
            const response = await axios.get(`${API_URL}/statistics/top-products?limit=5`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            stats.total++;
            printSuccess(`Top productos: ${response.data.count}`);
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener top productos', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token');
    }
}

// ========== REPORTE FINAL ==========

function printFinalReport() {
    printHeader('REPORTE FINAL');
    
    const successRate = stats.total > 0 
        ? ((stats.passed / stats.total) * 100).toFixed(2) 
        : 0;
    
    console.log(colors.cyan + '  Tests ejecutados:  ' + colors.reset + stats.total);
    console.log(colors.green + '  Tests exitosos:    ' + colors.reset + stats.passed);
    console.log(colors.red + '  Tests fallidos:    ' + colors.reset + stats.failed);
    console.log(colors.yellow + '  Tests saltados:    ' + colors.reset + stats.skipped);
    console.log(colors.magenta + '  Tasa de éxito:     ' + colors.reset + successRate + '%');
    
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset + '\n');
    
    if (stats.failed === 0) {
        console.log(colors.green + '  ✓ TODOS LOS TESTS PASARON' + colors.reset);
    } else {
        console.log(colors.red + '  ✗ ALGUNOS TESTS FALLARON' + colors.reset);
    }
    
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

// ========== EJECUCIÓN PRINCIPAL ==========

async function runAllTests() {
    console.log(colors.magenta + '\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║        SUITE DE TESTS - FARMACIA ELIZABETH                ║');
    console.log('║        Sistema de Gestión Completo                        ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    printInfo(`Servidor: ${BASE_URL}`);
    printInfo(`Iniciando tests: ${new Date().toLocaleString()}`);
    
    await sleep(1000);
    
    try {
        // Tests en orden
        await testConfiguration();
        await sleep(500);
        
        await testUsers();
        await sleep(500);
        
        await testSuppliers();
        await sleep(500);
        
        await testProducts();
        await sleep(500);
        
        await testBatches();
        await sleep(500);
        
        await testAlerts();
        await sleep(500);
        
        await testStatistics();
        await sleep(500);
        
        // Reporte final
        printFinalReport();
        
    } catch (error) {
        console.error(colors.red + '\n✗ Error crítico en la ejecución de tests:' + colors.reset);
        console.error(error);
    }
    
    process.exit(stats.failed > 0 ? 1 : 0);
}

// Ejecutar
runAllTests();