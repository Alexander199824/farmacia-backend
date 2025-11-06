/**
 * TEST SIMPLE - Crear un solo producto con imagen
 * Para diagnosticar el problema de subida desde el frontend
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Usar chalk si está disponible, sino usar formato simple
let chalk;
try {
    chalk = require('chalk');
} catch (e) {
    // Fallback sin colores
    chalk = {
        green: { bold: (text) => text },
        red: { bold: (text) => text },
        yellow: { bold: (text) => text },
        cyan: (text) => text,
        gray: (text) => text
    };
}

// Función para formatear código de estado con color
function formatStatus(status) {
    if (status >= 200 && status < 300) {
        return chalk.green.bold(`✓ ${status}`);
    } else if (status >= 400 && status < 500) {
        return chalk.yellow.bold(`⚠ ${status}`);
    } else if (status >= 500) {
        return chalk.red.bold(`✗ ${status}`);
    }
    return chalk.cyan(`${status}`);
}

// Función para separador visual
function separator() {
    console.log(chalk.gray('─'.repeat(60)));
}

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;
const IMAGE_PATH = 'C:\\Users\\echev\\Downloads\\ESOMEPRAZOL-40MG-CAJA-POR14-TABLETAS-INCLINADO.jpg';

async function testSingleProduct() {
    try {
        separator();
        // 1. Login
        console.log(chalk.cyan.bold('\n1️⃣  Haciendo login...'));
        const loginResponse = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@farmacia.com',
            password: 'Admin123!'
        });

        const token = loginResponse.data.token;
        console.log(chalk.green('✅ Login exitoso'), formatStatus(loginResponse.status));

        // 2. Crear FormData
        console.log(chalk.cyan.bold('\n2️⃣  Preparando FormData...'));
        const formData = new FormData();

        // Agregar imagen
        const imageBuffer = fs.readFileSync(IMAGE_PATH);
        formData.append('image', imageBuffer, {
            filename: 'test-product.jpg',
            contentType: 'image/jpeg'
        });

        // Agregar datos del producto
        formData.append('name', 'Producto de Prueba');
        formData.append('sku', `TEST-${Date.now()}`);
        formData.append('category', 'medicamento');
        formData.append('price', '50');
        formData.append('costPrice', '30');
        formData.append('minStock', '10');
        formData.append('maxStock', '100');
        formData.append('requiresPrescription', 'false');
        formData.append('isActive', 'true');

        console.log(chalk.green('✅ FormData preparado'));

        // 3. Enviar petición
        console.log(chalk.cyan.bold('\n3️⃣  Enviando petición a /api/products...'));
        const response = await axios.post(`${API_URL}/products`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log(chalk.green.bold('\n✅ ¡Producto creado exitosamente!'), formatStatus(response.status));
        separator();
        console.log(chalk.cyan.bold('\n📦 Detalles del Producto:'));
        console.log(chalk.gray('   ID:'), chalk.white(response.data.product.id));
        console.log(chalk.gray('   Nombre:'), chalk.white(response.data.product.name));
        console.log(chalk.gray('   SKU:'), chalk.white(response.data.product.sku));
        console.log(chalk.gray('   Imagen URL:'), chalk.white(response.data.product.imageUrl));
        console.log(chalk.gray('   Cloudinary ID:'), chalk.white(response.data.product.cloudinaryPublicId));
        separator();

    } catch (error) {
        separator();
        console.error(chalk.red.bold('\n❌ ERROR:'), error.message);
        if (error.response) {
            console.error(chalk.red('📝 Status:'), formatStatus(error.response.status));
            console.error(chalk.yellow('📝 Respuesta del servidor:'));
            console.error(error.response.data);
        } else if (error.request) {
            console.error(chalk.red('📝 Sin respuesta del servidor (timeout o servidor caído)'));
        } else {
            console.error(chalk.red('📝 Error de configuración:'), error.message);
        }
        separator();
    }
}

testSingleProduct();
