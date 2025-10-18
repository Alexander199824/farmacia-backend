/**
 * Suite Principal de Tests con Subida de Imágenes
 * Autor: Alexander Echeverria
 * Ubicacion: test-suite.js
 * 
 * Ejecutar: node test-suite.js
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Ruta de la imagen de test
const TEST_IMAGE_PATH = 'C:\\Users\\echev\\Downloads\\ESOMEPRAZOL-40MG-CAJA-POR14-TABLETAS-INCLINADO.jpg';

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
let testProductImageUrl = null; // Nueva variable para almacenar el URL de Cloudinary

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

/**
 * Verificar si existe el archivo de imagen
 */
function checkImageFile() {
    printInfo('Verificando archivo de imagen...');
    
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
        printWarning(`Archivo de imagen no encontrado: ${TEST_IMAGE_PATH}`);
        printInfo('Los tests de productos continuarán sin imagen');
        return false;
    }
    
    const stats = fs.statSync(TEST_IMAGE_PATH);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    printSuccess(`Archivo de imagen encontrado (${fileSizeInMB} MB)`);
    return true;
}

// ========== TESTS DE CONFIGURACIÓN ==========

async function testConfiguration() {
    printHeader('TEST DE CONFIGURACIÓN');
    
    try {
        printInfo('Verificando variables de entorno...');
        
        const requiredVars = [
            'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST',
            'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 
            'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'
        ];
        
        let allPresent = true;
        requiredVars.forEach(varName => {
            if (process.env[varName]) {
                if (varName.includes('SECRET') || varName.includes('KEY')) {
                    printSuccess(`${varName} está configurada (oculta)`);
                } else {
                    printSuccess(`${varName}: ${process.env[varName]}`);
                }
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
        
        // Verificar archivo de imagen
        checkImageFile();
        
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
    
    // Test 1: Crear producto CON IMAGEN
    printSubHeader('1. Crear Producto con Imagen');
    if (adminToken && testSupplierId) {
        try {
            const hasImage = fs.existsSync(TEST_IMAGE_PATH);
            
            if (!hasImage) {
                printWarning('Archivo de imagen no encontrado, creando producto sin imagen...');
                
                // Crear producto SIN imagen
                const response = await axios.post(`${API_URL}/products`, {
                    sku: `PROD-TEST-${Date.now()}`,
                    name: 'Esomeprazol 40mg - Test',
                    genericName: 'Esomeprazol',
                    category: 'medicamento',
                    subcategory: 'gastrico',
                    presentation: 'Caja x 14 tabletas',
                    supplierId: testSupplierId,
                    price: 85.00,
                    costPrice: 55.00,
                    minStock: 10,
                    maxStock: 100,
                    requiresPrescription: false,
                    laboratory: 'Laboratorio Test',
                    activeIngredient: 'Esomeprazol magnesio'
                }, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                
                stats.total++;
                testProductId = response.data.product.id;
                printSuccess(`Producto creado SIN imagen: ID ${testProductId}`);
                printInfo(`SKU: ${response.data.product.sku}`);
                printInfo(`Precio: Q${response.data.product.price}`);
                
            } else {
                printInfo('📤 Preparando subida de imagen a Cloudinary...');
                
                // Crear FormData
                const formData = new FormData();
                
                // Agregar la imagen
                formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
                
                // Agregar los demás campos del producto
                formData.append('sku', `PROD-TEST-${Date.now()}`);
                formData.append('name', 'Esomeprazol 40mg - Test');
                formData.append('genericName', 'Esomeprazol');
                formData.append('category', 'medicamento');
                formData.append('subcategory', 'gastrico');
                formData.append('presentation', 'Caja x 14 tabletas');
                formData.append('supplierId', testSupplierId);
                formData.append('price', '85.00');
                formData.append('costPrice', '55.00');
                formData.append('minStock', '10');
                formData.append('maxStock', '100');
                formData.append('requiresPrescription', 'false');
                formData.append('laboratory', 'Laboratorio Test');
                formData.append('activeIngredient', 'Esomeprazol magnesio');
                
                printInfo('☁️  Subiendo producto con imagen a Cloudinary...');
                
                // Hacer la petición con FormData
                const response = await axios.post(`${API_URL}/products`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${adminToken}`
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
                
                stats.total++;
                testProductId = response.data.product.id;
                testProductImageUrl = response.data.product.imageUrl;
                
                printSuccess(`✅ Producto creado CON imagen: ID ${testProductId}`);
                printInfo(`SKU: ${response.data.product.sku}`);
                printInfo(`Precio: Q${response.data.product.price}`);
                printInfo(`📷 Imagen URL: ${testProductImageUrl}`);
                printInfo(`🔑 Cloudinary ID: ${response.data.product.cloudinaryPublicId}`);
            }
            
        } catch (error) {
            stats.total++;
            printError('Error al crear producto', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay token o proveedor');
    }
    
    // Test 2: Verificar imagen del producto
    printSubHeader('2. Verificar Imagen del Producto');
    if (testProductId && testProductImageUrl) {
        try {
            printInfo('Verificando que la imagen sea accesible desde Cloudinary...');
            
            const imageResponse = await axios.head(testProductImageUrl);
            
            stats.total++;
            printSuccess('✅ Imagen accesible desde Cloudinary');
            printInfo(`Status: ${imageResponse.status}`);
            printInfo(`Content-Type: ${imageResponse.headers['content-type']}`);
            
        } catch (error) {
            stats.total++;
            printError('❌ Error al verificar imagen en Cloudinary', error);
        }
    } else if (!testProductImageUrl) {
        stats.total++;
        printWarning('Saltando - Producto creado sin imagen');
    } else {
        stats.total++;
        printWarning('Saltando - No hay producto de test');
    }
    
    // Test 3: Obtener producto y verificar URL de imagen
    printSubHeader('3. Obtener Producto y Verificar Datos de Imagen');
    if (testProductId) {
        try {
            const response = await axios.get(`${API_URL}/products/${testProductId}`);
            
            stats.total++;
            printSuccess('Producto obtenido correctamente');
            printInfo(`Nombre: ${response.data.name}`);
            printInfo(`Stock: ${response.data.stock}`);
            
            if (response.data.imageUrl) {
                printSuccess(`✅ Producto tiene imagen almacenada`);
                printInfo(`📷 Image URL: ${response.data.imageUrl}`);
                printInfo(`🔑 Cloudinary Public ID: ${response.data.cloudinaryPublicId}`);
            } else {
                printWarning('⚠️  Producto no tiene imagen');
            }
            
        } catch (error) {
            stats.total++;
            printError('Error al obtener producto', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay producto de test');
    }
    
    // Test 4: Listar productos
    printSubHeader('4. Listar Productos');
    try {
        const response = await axios.get(`${API_URL}/products?page=1&limit=5`);
        
        stats.total++;
        printSuccess(`Productos listados: ${response.data.total}`);
        printInfo(`Productos en esta página: ${response.data.products.length}`);
        
        // Verificar cuántos tienen imagen
        const withImages = response.data.products.filter(p => p.imageUrl).length;
        printInfo(`📷 Productos con imagen: ${withImages}/${response.data.products.length}`);
        
    } catch (error) {
        stats.total++;
        printError('Error al listar productos', error);
    }
    
    // Test 5: Buscar producto por SKU
    printSubHeader('5. Buscar Producto por SKU');
    if (testProductId) {
        try {
            const product = await axios.get(`${API_URL}/products/${testProductId}`);
            const sku = product.data.sku;
            
            const response = await axios.get(`${API_URL}/products/sku/${sku}`);
            
            stats.total++;
            printSuccess('Producto encontrado por SKU');
            printInfo(`Nombre: ${response.data.name}`);
            printInfo(`Stock: ${response.data.stock}`);
            
            if (response.data.imageUrl) {
                printInfo(`📷 Tiene imagen: Sí`);
            }
            
        } catch (error) {
            stats.total++;
            printError('Error al buscar producto por SKU', error);
        }
    } else {
        stats.total++;
        printWarning('Saltando - No hay producto de test');
    }
    
    // Test 6: Actualizar producto CON NUEVA IMAGEN
    printSubHeader('6. Actualizar Producto (cambiar imagen)');
    if (adminToken && testProductId && fs.existsSync(TEST_IMAGE_PATH)) {
        try {
            printInfo('📤 Preparando actualización con nueva imagen...');
            
            const formData = new FormData();
            
            // Agregar nueva imagen (la misma para test, pero simula un cambio)
            formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
            
            // Agregar campos a actualizar
            formData.append('price', '90.00');
            formData.append('description', 'Producto actualizado en test con nueva imagen');
            
            printInfo('☁️  Subiendo actualización a Cloudinary...');
            
            const response = await axios.put(`${API_URL}/products/${testProductId}`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${adminToken}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            stats.total++;
            printSuccess('✅ Producto actualizado con nueva imagen');
            printInfo(`Nuevo precio: Q${response.data.product.price}`);
            printInfo(`📷 Nueva imagen URL: ${response.data.product.imageUrl}`);
            
            // Verificar que la imagen anterior fue eliminada de Cloudinary
            // (esto lo hace automáticamente el backend)
            printInfo('🗑️  La imagen anterior fue eliminada de Cloudinary automáticamente');
            
        } catch (error) {
            stats.total++;
            printError('Error al actualizar producto', error);
        }
    } else if (!fs.existsSync(TEST_IMAGE_PATH)) {
        stats.total++;
        printWarning('Saltando - Archivo de imagen no disponible');
    } else {
        stats.total++;
        printWarning('Saltando - No hay token o producto');
    }
    
    // Test 7: Obtener productos con stock bajo
    printSubHeader('7. Productos con Stock Bajo');
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
    
    // Test 8: Estadísticas de productos
    printSubHeader('8. Estadísticas de Productos');
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
                purchasePrice: 55.00,
                salePrice: 85.00,
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
            
            if (response.data.products && response.data.products.length > 0) {
                printInfo('Top 3:');
                response.data.products.slice(0, 3).forEach((item, idx) => {
                    printInfo(`  ${idx + 1}. ${item.product?.name || 'N/A'} (${item.totalQuantity || 0} vendidos)`);
                });
            }
            
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
    
    if (testProductImageUrl) {
        console.log('\n' + colors.cyan + '📷 INFORMACIÓN DE IMAGEN DE TEST:' + colors.reset);
        console.log(colors.green + '  URL Cloudinary:    ' + colors.reset + testProductImageUrl);
        console.log(colors.green + '  Producto ID:       ' + colors.reset + testProductId);
    }
    
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
    console.log('║        Con Soporte de Imágenes en Cloudinary             ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    printInfo(`Servidor: ${BASE_URL}`);
    printInfo(`Imagen de test: ${path.basename(TEST_IMAGE_PATH)}`);
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