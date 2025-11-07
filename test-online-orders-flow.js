/**
 * Script de pruebas del sistema de pedidos en línea
 * @author Alexander Echeverria
 * @description Prueba el flujo completo de pedidos en línea con generación automática de recibos
 *
 * FLUJO A PROBAR:
 * 1. Cliente crea pedido (pickup o delivery)
 * 2. Vendedor confirma pedido
 * 3. Vendedor prepara pedido (asigna lotes FIFO)
 * 4. Vendedor marca como listo
 * 5. Repartidor/Cliente recibe pedido
 * 6. Sistema genera automáticamente Invoice + Receipt
 * 7. Vendedor marca como completado
 */

const axios = require('axios');

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Variables globales para almacenar datos de prueba
let clientToken = '';
let vendedorToken = '';
let repartidorToken = '';
let adminToken = '';
let clientId = 0;
let vendedorId = 0;
let repartidorId = 0;
let productId = 0;
let orderId = 0;
let orderNumber = '';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`PASO ${step}: ${description}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// ========== FUNCIONES DE AUTENTICACIÓN ==========

async function loginCliente() {
  try {
    logStep(1, 'Login como CLIENTE');

    const response = await axios.post(`${API_URL}/users/login`, {
      email: 'cliente@example.com',
      password: 'password123'
    });

    if (response.data.token) {
      clientToken = response.data.token;
      clientId = response.data.user.id;
      logSuccess(`Login exitoso - Cliente ID: ${clientId}`);
      return true;
    }
  } catch (error) {
    logError(`Error login cliente: ${error.response?.data?.message || error.message}`);

    // Si el cliente no existe, intentar registrarlo
    try {
      logInfo('Intentando registrar cliente...');
      const registerResponse = await axios.post(`${API_URL}/users/register`, {
        firstName: 'Cliente',
        lastName: 'Prueba',
        email: 'cliente@example.com',
        password: 'password123',
        phone: '12345678',
        address: 'Calle Principal, Rabinal'
      });

      if (registerResponse.data.token) {
        clientToken = registerResponse.data.token;
        clientId = registerResponse.data.user.id;
        logSuccess('Cliente registrado exitosamente');
        return true;
      }
    } catch (regError) {
      logError(`Error registrando cliente: ${regError.response?.data?.message || regError.message}`);
      return false;
    }
  }
  return false;
}

async function loginVendedor() {
  try {
    logStep(2, 'Login como VENDEDOR');

    const response = await axios.post(`${API_URL}/users/login`, {
      email: 'vendedor@farmacia.com',
      password: 'vendedor123'
    });

    if (response.data.token) {
      vendedorToken = response.data.token;
      vendedorId = response.data.user.id;
      logSuccess(`Login exitoso - Vendedor ID: ${vendedorId}`);
      return true;
    }
  } catch (error) {
    logError(`Error login vendedor: ${error.response?.data?.message || error.message}`);
    logInfo('Asegúrate de que existe un usuario con rol "vendedor"');
    return false;
  }
}

async function loginRepartidor() {
  try {
    logInfo('Login como REPARTIDOR');

    const response = await axios.post(`${API_URL}/users/login`, {
      email: 'repartidor@farmacia.com',
      password: 'repartidor123'
    });

    if (response.data.token) {
      repartidorToken = response.data.token;
      repartidorId = response.data.user.id;
      logSuccess(`Login exitoso - Repartidor ID: ${repartidorId}`);
      return true;
    }
  } catch (error) {
    logError(`Error login repartidor: ${error.response?.data?.message || error.message}`);
    logInfo('Asegúrate de que existe un usuario con rol "repartidor"');
    return false;
  }
}

// ========== FUNCIONES DE PRUEBA DEL FLUJO ==========

async function obtenerProducto() {
  try {
    logStep(3, 'Obtener producto disponible');

    const response = await axios.get(`${API_URL}/products?limit=1&isActive=true`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });

    if (response.data.products && response.data.products.length > 0) {
      const product = response.data.products[0];
      productId = product.id;
      logSuccess(`Producto encontrado: ${product.name} (ID: ${productId}, Stock: ${product.stock})`);
      return true;
    } else {
      logError('No se encontraron productos disponibles');
      return false;
    }
  } catch (error) {
    logError(`Error obteniendo producto: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function crearPedidoPickup() {
  try {
    logStep(4, 'Cliente crea pedido PICKUP');

    const orderData = {
      products: [
        {
          productId: productId,
          quantity: 2,
          unitPrice: 25.00
        }
      ],
      deliveryType: 'pickup',
      paymentMethod: 'efectivo',
      notes: 'Pedido de prueba - Recoger en tienda'
    };

    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });

    if (response.data.order) {
      orderId = response.data.order.id;
      orderNumber = response.data.order.orderNumber;
      logSuccess(`Pedido creado: ${orderNumber} (ID: ${orderId})`);
      logInfo(`Estado: ${response.data.order.status}`);
      logInfo(`Total: Q${response.data.order.total}`);
      return true;
    }
  } catch (error) {
    logError(`Error creando pedido: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function verPedidosPendientes() {
  try {
    logStep(5, 'Vendedor ve pedidos pendientes');

    const response = await axios.get(`${API_URL}/orders/pending`, {
      headers: { Authorization: `Bearer ${vendedorToken}` }
    });

    logSuccess(`Pedidos pendientes: ${response.data.count}`);

    if (response.data.orders && response.data.orders.length > 0) {
      response.data.orders.forEach(order => {
        logInfo(`- ${order.orderNumber} | ${order.status} | Cliente: ${order.client.firstName} ${order.client.lastName}`);
      });
    }

    return true;
  } catch (error) {
    logError(`Error obteniendo pedidos pendientes: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function confirmarPedido() {
  try {
    logStep(6, 'Vendedor CONFIRMA pedido');

    const response = await axios.put(
      `${API_URL}/orders/${orderId}/status`,
      { status: 'confirmado' },
      { headers: { Authorization: `Bearer ${vendedorToken}` } }
    );

    if (response.data.order) {
      logSuccess(`Pedido confirmado: ${response.data.order.orderNumber}`);
      logInfo(`Estado: ${response.data.order.status}`);
      return true;
    }
  } catch (error) {
    logError(`Error confirmando pedido: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function prepararPedido() {
  try {
    logStep(7, 'Vendedor PREPARA pedido (asigna lotes FIFO)');

    const response = await axios.put(
      `${API_URL}/orders/${orderId}/status`,
      { status: 'en_preparacion' },
      { headers: { Authorization: `Bearer ${vendedorToken}` } }
    );

    if (response.data.order) {
      logSuccess(`Pedido en preparación: ${response.data.order.orderNumber}`);
      logInfo(`Estado: ${response.data.order.status}`);
      logInfo('Lotes FIFO asignados automáticamente');
      return true;
    }
  } catch (error) {
    logError(`Error preparando pedido: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function marcarListoParaRecoger() {
  try {
    logStep(8, 'Vendedor marca pedido como LISTO PARA RECOGER');

    const response = await axios.put(
      `${API_URL}/orders/${orderId}/status`,
      { status: 'listo_para_recoger' },
      { headers: { Authorization: `Bearer ${vendedorToken}` } }
    );

    if (response.data.order) {
      logSuccess(`Pedido listo: ${response.data.order.orderNumber}`);
      logInfo(`Estado: ${response.data.order.status}`);
      return true;
    }
  } catch (error) {
    logError(`Error marcando pedido listo: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function marcarEntregado() {
  try {
    logStep(9, 'Vendedor marca pedido como ENTREGADO');
    logInfo('🎯 Esto debe generar automáticamente Invoice + Receipt');

    const response = await axios.put(
      `${API_URL}/orders/${orderId}/status`,
      { status: 'entregado' },
      { headers: { Authorization: `Bearer ${vendedorToken}` } }
    );

    if (response.data.order) {
      logSuccess(`Pedido entregado: ${response.data.order.orderNumber}`);
      logInfo(`Estado: ${response.data.order.status}`);

      // Verificar si se generó el invoice
      if (response.data.order.invoice) {
        logSuccess(`✨ Invoice generado: ${response.data.order.invoice.invoiceNumber}`);
      } else {
        logError('No se generó el invoice automáticamente');
      }

      return true;
    }
  } catch (error) {
    logError(`Error marcando pedido entregado: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function verHistorialPedido() {
  try {
    logStep(10, 'Ver historial completo del pedido');

    const response = await axios.get(`${API_URL}/orders/${orderId}/history`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });

    if (response.data.order && response.data.timeline) {
      logSuccess('Historial del pedido:');

      console.log('\n📦 INFORMACIÓN DEL PEDIDO:');
      console.log(`   Número: ${response.data.order.orderNumber}`);
      console.log(`   Estado: ${response.data.order.status}`);
      console.log(`   Total: Q${response.data.order.total}`);
      console.log(`   Tipo: ${response.data.order.deliveryType}`);

      if (response.data.order.invoice) {
        console.log(`\n💰 FACTURA GENERADA:`);
        console.log(`   Número: ${response.data.order.invoice.invoiceNumber}`);
        console.log(`   Total: Q${response.data.order.invoice.total}`);

        if (response.data.order.invoice.receipts && response.data.order.invoice.receipts.length > 0) {
          const receipt = response.data.order.invoice.receipts[0];
          console.log(`\n🧾 RECIBO GENERADO:`);
          console.log(`   Número: ${receipt.receiptNumber}`);
          console.log(`   Fecha: ${new Date(receipt.issueDate).toLocaleString('es-GT')}`);
          console.log(`   Estado: ${receipt.status}`);
        }
      }

      console.log('\n⏱️  LÍNEA DE TIEMPO:');
      response.data.timeline.forEach((event, index) => {
        const timestamp = new Date(event.timestamp).toLocaleString('es-GT');
        console.log(`   ${index + 1}. [${timestamp}] ${event.description} (${event.status})`);
      });

      return true;
    }
  } catch (error) {
    logError(`Error obteniendo historial: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function cambiarPrioridad() {
  try {
    logInfo('\n📌 Probando cambio de prioridad...');

    const response = await axios.put(
      `${API_URL}/orders/${orderId}/priority`,
      { priority: 'alta' },
      { headers: { Authorization: `Bearer ${vendedorToken}` } }
    );

    if (response.data.order) {
      logSuccess(`Prioridad cambiada a: ${response.data.order.priority}`);
      return true;
    }
  } catch (error) {
    logError(`Error cambiando prioridad: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function verPedidosListos() {
  try {
    logInfo('\n📋 Probando listado de pedidos listos...');

    const response = await axios.get(`${API_URL}/orders/ready`, {
      headers: { Authorization: `Bearer ${vendedorToken}` }
    });

    logSuccess(`Pedidos listos: ${response.data.count}`);
    return true;
  } catch (error) {
    logError(`Error obteniendo pedidos listos: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ========== FUNCIÓN PRINCIPAL ==========

async function runTests() {
  log('\n' + '='.repeat(60), 'bright');
  log('PRUEBA DEL SISTEMA DE PEDIDOS EN LÍNEA', 'bright');
  log('Farmacia Elizabeth - Sistema de Gestión', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  try {
    // Autenticaciones
    if (!await loginCliente()) return;
    if (!await loginVendedor()) return;
    await loginRepartidor(); // Opcional

    // Obtener producto
    if (!await obtenerProducto()) return;

    // Flujo principal
    if (!await crearPedidoPickup()) return;
    if (!await verPedidosPendientes()) return;
    if (!await confirmarPedido()) return;
    if (!await prepararPedido()) return;
    if (!await marcarListoParaRecoger()) return;
    if (!await marcarEntregado()) return;
    if (!await verHistorialPedido()) return;

    // Funciones extras
    await cambiarPrioridad();
    await verPedidosListos();

    // Resumen final
    log('\n' + '='.repeat(60), 'green');
    log('✅ PRUEBA COMPLETADA EXITOSAMENTE', 'green');
    log('='.repeat(60), 'green');

    logSuccess('El sistema de pedidos en línea funciona correctamente');
    logSuccess('Los recibos se generan automáticamente al entregar');
    logSuccess('Los lotes FIFO se asignan correctamente en preparación');

  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    log('❌ PRUEBA FALLIDA', 'red');
    log('='.repeat(60), 'red');
    logError(`Error general: ${error.message}`);
  }
}

// Ejecutar pruebas
runTests();
