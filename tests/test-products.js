/**
 * Test Completo de Productos - Con Menú Interactivo
 * Autor: Alexander Echeverria
 * Ubicación: tests/test-products.js
 * 
 * Ejecutar: node test-products.js
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;
const TEST_IMAGE_PATH = 'C:\\Users\\echev\\Downloads\\ESOMEPRAZOL-40MG-CAJA-POR14-TABLETAS-INCLINADO.jpg';

// Variables globales
let authToken = null;

// Colores
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

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
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    console.log(colors.cyan + '  ' + text + colors.reset);
    console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
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

// ========== AUTENTICACIÓN ==========

async function login() {
    printHeader('LOGIN');
    
    const email = await question('Email (default: admin@farmacia.com): ') || 'admin@farmacia.com';
    const password = await question('Password (default: Admin123!): ') || 'Admin123!';
    
    try {
        const response = await axios.post(`${API_URL}/users/login`, { email, password });
        authToken = response.data.token;
        printSuccess('Login exitoso!');
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error en login', error);
        await question('\nPresiona Enter para continuar...');
    }
}

// ========== PRODUCTOS ==========

async function createProduct() {
    printHeader('CREAR NUEVO PRODUCTO');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const timestamp = Date.now();
    const sku = await question(`SKU (default: PROD-${timestamp}): `) || `PROD-${timestamp}`;
    const name = await question('Nombre del producto: ');
    const genericName = await question('Nombre genérico (opcional): ') || null;
    const description = await question('Descripción (opcional): ') || null;
    
    console.log('\nCategorías: medicamento, suplemento, cuidado_personal, equipo_medico, cosmetico, higiene, bebe, vitaminas, primeros_auxilios, otros');
    const category = await question('Categoría (default: medicamento): ') || 'medicamento';
    
    const presentation = await question('Presentación (ej: Caja x 14 tabletas): ') || null;
    const supplierId = await question('ID del proveedor: ');
    const price = await question('Precio de venta: ');
    const costPrice = await question('Precio de costo: ');
    const minStock = await question('Stock mínimo (default: 10): ') || '10';
    const maxStock = await question('Stock máximo (default: 500): ') || '500';
    const barcode = await question('Código de barras (opcional): ') || null;
    const requiresPrescription = await question('¿Requiere receta? (si/no, default: no): ') || 'no';
    
    const withImage = await question('¿Incluir imagen? (si/no): ');
    
    try {
        let response;
        
        if (withImage.toLowerCase() === 'si' || withImage.toLowerCase() === 's') {
            if (!fs.existsSync(TEST_IMAGE_PATH)) {
                printWarning('Archivo de imagen no encontrado');
                printInfo('Creando producto sin imagen...');
            } else {
                const formData = new FormData();
                formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
                formData.append('sku', sku);
                formData.append('name', name);
                if (genericName) formData.append('genericName', genericName);
                if (description) formData.append('description', description);
                formData.append('category', category);
                if (presentation) formData.append('presentation', presentation);
                formData.append('supplierId', supplierId);
                formData.append('price', price);
                formData.append('costPrice', costPrice);
                formData.append('minStock', minStock);
                formData.append('maxStock', maxStock);
                if (barcode) formData.append('barcode', barcode);
                formData.append('requiresPrescription', requiresPrescription.toLowerCase() === 'si');
                
                response = await axios.post(`${API_URL}/products`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${authToken}`
                    }
                });
            }
        }
        
        if (!response) {
            response = await axios.post(`${API_URL}/products`, {
                sku, name, genericName, description, category, presentation,
                supplierId, price, costPrice, minStock, maxStock, barcode,
                requiresPrescription: requiresPrescription.toLowerCase() === 'si'
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
        }
        
        printSuccess('Producto creado exitosamente!');
        printInfo(`ID: ${response.data.product.id}`);
        printInfo(`SKU: ${response.data.product.sku}`);
        printInfo(`Nombre: ${response.data.product.name}`);
        printInfo(`Precio: Q${response.data.product.price}`);
        if (response.data.product.imageUrl) {
            printInfo(`📷 Imagen: ${response.data.product.imageUrl}`);
        }
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al crear producto', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function listProducts() {
    printHeader('LISTAR PRODUCTOS');
    
    const page = await question('Página (default: 1): ') || '1';
    const limit = await question('Límite (default: 10): ') || '10';
    const search = await question('Buscar (opcional): ') || '';
    const category = await question('Categoría (opcional): ') || '';
    
    try {
        let url = `${API_URL}/products?page=${page}&limit=${limit}`;
        if (search) url += `&search=${search}`;
        if (category) url += `&category=${category}`;
        
        const response = await axios.get(url);
        
        printSuccess(`Total de productos: ${response.data.total}`);
        printInfo(`Página ${response.data.page} de ${response.data.totalPages}`);
        
        console.log('\n' + colors.yellow + 'LISTADO DE PRODUCTOS:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(80) + colors.reset);
        
        response.data.products.forEach((product, index) => {
            console.log(`\n${colors.cyan}${index + 1}. ${product.name}${colors.reset}`);
            console.log(`   ID: ${product.id} | SKU: ${product.sku}`);
            console.log(`   Categoría: ${product.category}`);
            console.log(`   Precio: Q${product.price} | Costo: Q${product.costPrice}`);
            console.log(`   Stock: ${product.stock} (Min: ${product.minStock})`);
            console.log(`   Activo: ${product.isActive ? '✓' : '✗'}`);
            console.log(`   Imagen: ${product.imageUrl ? '📷 Sí' : 'No'}`);
        });
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al listar productos', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getProductById() {
    printHeader('OBTENER PRODUCTO POR ID');
    
    const productId = await question('ID del producto: ');
    
    try {
        const response = await axios.get(`${API_URL}/products/${productId}`);
        const p = response.data;
        
        console.log('\n' + colors.green + 'INFORMACIÓN DEL PRODUCTO:' + colors.reset);
        console.log(colors.green + '-'.repeat(60) + colors.reset);
        console.log(`ID: ${p.id}`);
        console.log(`SKU: ${p.sku}`);
        console.log(`Nombre: ${p.name}`);
        console.log(`Nombre genérico: ${p.genericName || 'N/A'}`);
        console.log(`Descripción: ${p.description || 'N/A'}`);
        console.log(`Categoría: ${p.category}`);
        console.log(`Subcategoría: ${p.subcategory || 'N/A'}`);
        console.log(`Presentación: ${p.presentation || 'N/A'}`);
        console.log(`Precio venta: Q${p.price}`);
        console.log(`Precio costo: Q${p.costPrice}`);
        console.log(`Stock actual: ${p.stock}`);
        console.log(`Stock mínimo: ${p.minStock}`);
        console.log(`Stock máximo: ${p.maxStock}`);
        console.log(`Código barras: ${p.barcode || 'N/A'}`);
        console.log(`Requiere receta: ${p.requiresPrescription ? 'Sí' : 'No'}`);
        console.log(`Activo: ${p.isActive ? 'Sí' : 'No'}`);
        console.log(`Laboratorio: ${p.laboratory || 'N/A'}`);
        console.log(`Imagen: ${p.imageUrl || 'Sin imagen'}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener producto', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function updateProduct() {
    printHeader('ACTUALIZAR PRODUCTO');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const productId = await question('ID del producto: ');
    
    console.log('\n' + colors.blue + 'Valores actuales (Enter para no cambiar):' + colors.reset);
    
    const name = await question('Nombre: ');
    const price = await question('Precio: ');
    const costPrice = await question('Costo: ');
    const minStock = await question('Stock mínimo: ');
    const description = await question('Descripción: ');
    
    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (costPrice) updateData.costPrice = costPrice;
    if (minStock) updateData.minStock = minStock;
    if (description) updateData.description = description;
    
    if (Object.keys(updateData).length === 0) {
        printWarning('No hay cambios');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.put(`${API_URL}/products/${productId}`, updateData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Producto actualizado!');
        printInfo(`Nombre: ${response.data.product.name}`);
        printInfo(`Precio: Q${response.data.product.price}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al actualizar', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function deleteProduct() {
    printHeader('ELIMINAR PRODUCTO');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const productId = await question('ID del producto: ');
    const confirm = await question('¿Confirmar eliminación? (si/no): ');
    
    if (confirm.toLowerCase() !== 'si') {
        printWarning('Cancelado');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        await axios.delete(`${API_URL}/products/${productId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Producto eliminado!');
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al eliminar', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getLowStockProducts() {
    printHeader('PRODUCTOS CON STOCK BAJO');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.get(`${API_URL}/products/low-stock`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess(`Productos con stock bajo: ${response.data.count}`);
        
        response.data.products.forEach((p, i) => {
            console.log(`\n${i + 1}. ${p.name}`);
            console.log(`   Stock: ${p.stock} (Mínimo: ${p.minStock})`);
            console.log(`   Precio: Q${p.price}`);
        });
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getProductStats() {
    printHeader('ESTADÍSTICAS DE PRODUCTOS');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.get(`${API_URL}/products/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const s = response.data;
        
        console.log('\n' + colors.green + 'ESTADÍSTICAS:' + colors.reset);
        console.log(`Total: ${s.total}`);
        console.log(`Activos: ${s.active}`);
        console.log(`Con stock: ${s.withStock}`);
        console.log(`Agotados: ${s.outOfStock}`);
        console.log(`Stock bajo: ${s.lowStock}`);
        console.log(`Valor inventario: Q${s.totalInventoryValue}`);
        
        console.log('\n' + colors.cyan + 'Por categoría:' + colors.reset);
        s.byCategory.forEach(cat => {
            console.log(`  ${cat.category}: ${cat.count}`);
        });
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function searchByBarcode() {
    printHeader('BUSCAR POR CÓDIGO DE BARRAS');
    
    const barcode = await question('Código de barras: ');
    
    try {
        const response = await axios.get(`${API_URL}/products/barcode/${barcode}`);
        const p = response.data;
        
        printSuccess('Producto encontrado!');
        console.log(`\nNombre: ${p.name}`);
        console.log(`SKU: ${p.sku}`);
        console.log(`Precio: Q${p.price}`);
        console.log(`Stock: ${p.stock}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Producto no encontrado', error);
        await question('\nPresiona Enter para continuar...');
    }
}

// ========== MENÚ ==========

async function showMenu() {
    printHeader('TEST DE PRODUCTOS - FARMACIA ELIZABETH');
    
    console.log(colors.cyan + '  Estado:' + colors.reset);
    console.log(authToken ? colors.green + '  ✓ Autenticado' : colors.red + '  ✗ No autenticado');
    console.log(colors.reset);
    
    console.log('\n' + colors.yellow + '  OPCIONES:' + colors.reset);
    console.log('  1.  Login');
    console.log('  2.  Crear producto');
    console.log('  3.  Listar productos');
    console.log('  4.  Obtener producto por ID');
    console.log('  5.  Actualizar producto');
    console.log('  6.  Eliminar producto');
    console.log('  7.  Productos con stock bajo');
    console.log('  8.  Buscar por código de barras');
    console.log('  9.  Ver estadísticas');
    console.log('  0.  Salir');
    
    const option = await question('\n  Selecciona: ');
    
    switch (option) {
        case '1': await login(); break;
        case '2': await createProduct(); break;
        case '3': await listProducts(); break;
        case '4': await getProductById(); break;
        case '5': await updateProduct(); break;
        case '6': await deleteProduct(); break;
        case '7': await getLowStockProducts(); break;
        case '8': await searchByBarcode(); break;
        case '9': await getProductStats(); break;
        case '0':
            console.log('\n' + colors.green + '¡Hasta luego!' + colors.reset + '\n');
            rl.close();
            process.exit(0);
        default:
            printWarning('Opción no válida');
            await question('\nPresiona Enter...');
    }
    
    await showMenu();
}

async function init() {
    console.log(colors.magenta);
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     TEST DE PRODUCTOS - FARMACIA ELIZABETH                ║');
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