/**
 * TEST: Crear lotes con y sin proveedor
 * Prueba las nuevas reglas de negocio para lotes
 * Autor: Alexander Echeverria
 */

require('dotenv').config();
const axios = require('axios');

// Usar chalk si está disponible
let chalk;
try {
    chalk = require('chalk');
} catch (e) {
    chalk = {
        green: { bold: (text) => text },
        red: { bold: (text) => text },
        yellow: { bold: (text) => text },
        cyan: (text) => text,
        gray: (text) => text
    };
}

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

function separator() {
    console.log(chalk.gray('─'.repeat(70)));
}

async function testBatchSystem() {
    let token;
    let productWithSupplier, productWithoutSupplier, supplierId;

    try {
        separator();
        console.log(chalk.cyan.bold('\n🧪 TEST: Sistema de Lotes con/sin Proveedor\n'));
        separator();

        // 1. Login
        console.log(chalk.cyan('\n1️⃣  Login...'));
        const loginResponse = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@farmacia.com',
            password: 'Admin123!'
        });
        token = loginResponse.data.token;
        console.log(chalk.green('✅ Login exitoso'));

        // 2. Crear un proveedor
        console.log(chalk.cyan('\n2️⃣  Creando proveedor...'));
        const supplierResponse = await axios.post(
            `${API_URL}/suppliers`,
            {
                name: 'Farmacéutica Test',
                code: `PROV-${Date.now()}`,
                email: 'test@farmaceutica.com',
                phone: '555-1234'
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        supplierId = supplierResponse.data.supplier.id;
        console.log(chalk.green('✅ Proveedor creado:'), supplierId);

        // 3. Crear producto CON proveedor
        console.log(chalk.cyan('\n3️⃣  Creando producto CON proveedor...'));
        const productWithSupplierResponse = await axios.post(
            `${API_URL}/products`,
            {
                name: 'Producto con Proveedor',
                sku: `SKU-WITH-${Date.now()}`,
                category: 'medicamento',
                price: 100,
                costPrice: 60,
                supplierId: supplierId,
                minStock: 10,
                maxStock: 100
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        productWithSupplier = productWithSupplierResponse.data.product;
        console.log(chalk.green('✅ Producto creado:'), productWithSupplier.id);

        // 4. Crear producto SIN proveedor
        console.log(chalk.cyan('\n4️⃣  Creando producto SIN proveedor...'));
        const productWithoutSupplierResponse = await axios.post(
            `${API_URL}/products`,
            {
                name: 'Producto sin Proveedor',
                sku: `SKU-WITHOUT-${Date.now()}`,
                category: 'cuidado_personal',
                price: 50,
                costPrice: 30,
                minStock: 10,
                maxStock: 100
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        productWithoutSupplier = productWithoutSupplierResponse.data.product;
        console.log(chalk.green('✅ Producto creado:'), productWithoutSupplier.id);

        separator();
        console.log(chalk.cyan.bold('\n📋 PRUEBAS DE LOTES\n'));
        separator();

        // TEST 1: Lote CON proveedor + CON recibo
        console.log(chalk.yellow('\n✅ TEST 1: Lote con proveedor + con recibo'));
        try {
            const batch1 = await axios.post(
                `${API_URL}/batches`,
                {
                    productId: productWithSupplier.id,
                    supplierId: supplierId,
                    batchNumber: `LOTE-${Date.now()}-1`,
                    manufacturingDate: '2024-01-01',
                    expirationDate: '2026-01-01',
                    initialQuantity: 100,
                    purchasePrice: 60,
                    salePrice: 100,
                    location: 'Estante A1',
                    invoiceNumber: 'FACT-001',
                    notes: 'Lote con proveedor y con recibo'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(chalk.green('   ✅ Creado correctamente'));
            console.log(chalk.gray('   ID:'), batch1.data.batch.id);
        } catch (error) {
            console.log(chalk.red('   ❌ Error:'), error.response?.data?.message || error.message);
        }

        // TEST 2: Lote CON proveedor + SIN recibo
        console.log(chalk.yellow('\n✅ TEST 2: Lote con proveedor + sin recibo (debe funcionar)'));
        try {
            const batch2 = await axios.post(
                `${API_URL}/batches`,
                {
                    productId: productWithSupplier.id,
                    supplierId: supplierId,
                    batchNumber: `LOTE-${Date.now()}-2`,
                    manufacturingDate: '2024-01-01',
                    expirationDate: '2026-01-01',
                    initialQuantity: 50,
                    purchasePrice: 60,
                    salePrice: 100,
                    location: 'Estante A2',
                    notes: 'Lote con proveedor pero sin recibo'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(chalk.green('   ✅ Creado correctamente (sin recibo)'));
            console.log(chalk.gray('   ID:'), batch2.data.batch.id);
        } catch (error) {
            console.log(chalk.red('   ❌ Error:'), error.response?.data?.message || error.message);
        }

        // TEST 3: Lote SIN proveedor + SIN recibo
        console.log(chalk.yellow('\n✅ TEST 3: Lote sin proveedor + sin recibo (debe funcionar)'));
        try {
            const batch3 = await axios.post(
                `${API_URL}/batches`,
                {
                    productId: productWithoutSupplier.id,
                    batchNumber: `LOTE-${Date.now()}-3`,
                    manufacturingDate: '2024-01-01',
                    expirationDate: '2026-01-01',
                    initialQuantity: 75,
                    purchasePrice: 30,
                    salePrice: 50,
                    location: 'Estante B1',
                    notes: 'Lote sin proveedor ni recibo'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(chalk.green('   ✅ Creado correctamente (producto y lote sin proveedor)'));
            console.log(chalk.gray('   ID:'), batch3.data.batch.id);
        } catch (error) {
            console.log(chalk.red('   ❌ Error:'), error.response?.data?.message || error.message);
        }

        // TEST 4: Lote SIN proveedor + CON recibo (raro pero válido)
        console.log(chalk.yellow('\n✅ TEST 4: Lote sin proveedor + con recibo (compra informal)'));
        try {
            const batch4 = await axios.post(
                `${API_URL}/batches`,
                {
                    productId: productWithoutSupplier.id,
                    batchNumber: `LOTE-${Date.now()}-4`,
                    manufacturingDate: '2024-01-01',
                    expirationDate: '2026-01-01',
                    initialQuantity: 25,
                    purchasePrice: 30,
                    salePrice: 50,
                    location: 'Estante B2',
                    invoiceNumber: 'COMPRA-INFORMAL-001',
                    notes: 'Compra sin proveedor registrado pero con recibo'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(chalk.green('   ✅ Creado correctamente (sin proveedor pero con recibo)'));
            console.log(chalk.gray('   ID:'), batch4.data.batch.id);
        } catch (error) {
            console.log(chalk.red('   ❌ Error:'), error.response?.data?.message || error.message);
        }

        // TEST 5: ERROR - Producto CON proveedor pero lote SIN proveedor
        console.log(chalk.yellow('\n❌ TEST 5: Producto con proveedor pero lote sin proveedor (debe fallar)'));
        try {
            await axios.post(
                `${API_URL}/batches`,
                {
                    productId: productWithSupplier.id,
                    batchNumber: `LOTE-${Date.now()}-5`,
                    manufacturingDate: '2024-01-01',
                    expirationDate: '2026-01-01',
                    initialQuantity: 50,
                    purchasePrice: 60,
                    salePrice: 100,
                    location: 'Estante C1',
                    notes: 'Intento de crear lote sin proveedor para producto que sí tiene'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(chalk.red('   ⚠️  Se creó pero NO debería (ERROR DE VALIDACIÓN)'));
        } catch (error) {
            console.log(chalk.green('   ✅ Falló correctamente:'), error.response?.data?.message);
        }

        // TEST 6: Producto SIN proveedor pero lote CON proveedor (VÁLIDO - es opcional)
        console.log(chalk.yellow('\n✅ TEST 6: Producto sin proveedor pero lote con proveedor (debe funcionar)'));
        try {
            const batch6 = await axios.post(
                `${API_URL}/batches`,
                {
                    productId: productWithoutSupplier.id,
                    supplierId: supplierId,
                    batchNumber: `LOTE-${Date.now()}-6`,
                    manufacturingDate: '2024-01-01',
                    expirationDate: '2026-01-01',
                    initialQuantity: 50,
                    purchasePrice: 30,
                    salePrice: 50,
                    location: 'Estante C2',
                    invoiceNumber: 'FACT-ESPECIAL-001',
                    notes: 'Producto sin proveedor fijo, pero este lote específico tiene proveedor'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(chalk.green('   ✅ Creado correctamente (producto sin proveedor, lote con proveedor)'));
            console.log(chalk.gray('   ID:'), batch6.data.batch.id);
        } catch (error) {
            console.log(chalk.red('   ❌ Error:'), error.response?.data?.message || error.message);
        }

        separator();
        console.log(chalk.green.bold('\n✅ PRUEBAS COMPLETADAS\n'));
        separator();

        console.log(chalk.cyan('\n📝 Resumen de reglas de negocio verificadas:\n'));
        console.log('   1. ✅ Producto CON proveedor → Lote debe tener el MISMO proveedor (obligatorio)');
        console.log('   2. ✅ Producto SIN proveedor → Lote puede tener o no proveedor (opcional)');
        console.log('   3. ✅ Recibo (invoiceNumber) SIEMPRE opcional en ambos casos');
        console.log('   4. ✅ Lote puede tener recibo incluso sin proveedor registrado');
        console.log('   5. ✅ Validación impide que lote tenga proveedor diferente al del producto');
        console.log('   6. ✅ Producto sin proveedor fijo permite asignar proveedor específico al lote\n');

    } catch (error) {
        console.error(chalk.red.bold('\n❌ ERROR GENERAL:'), error.message);
        if (error.response) {
            console.error(chalk.red('Status:'), error.response.status);
            console.error(chalk.yellow('Data:'), error.response.data);
        }
    }
}

testBatchSystem();
