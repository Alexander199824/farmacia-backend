/**
 * @author Alexander Echeverria
 * @file app/routers/orderRoutes.js
 * @description Rutas de Pedidos en Línea con permisos por rol
 * @location app/routers/orderRoutes.js
 *
 * Endpoints disponibles:
 * - POST /api/orders - Crear pedido (cliente)
 * - GET /api/orders - Listar todos los pedidos (admin, vendedor, repartidor)
 * - GET /api/orders/my-orders - Obtener mis pedidos (cliente)
 * - GET /api/orders/stats - Estadísticas de pedidos (admin, vendedor)
 * - GET /api/orders/:id - Obtener pedido por ID
 * - PUT /api/orders/:id/status - Actualizar estado del pedido (vendedor, admin, repartidor)
 * - POST /api/orders/:id/cancel - Cancelar pedido
 * - PUT /api/orders/:id/assign-delivery - Asignar repartidor (admin, vendedor)
 */

const express = require('express');
const router = express.Router();
const {
  createOrder,
  createGuestOrder,
  trackOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  assignDeliveryPerson,
  getOrderStats,
  getPendingOrders,
  getReadyOrders,
  updateOrderPriority,
  assignSalesCoordinator,
  getOrderHistory,
  getAvailableDeliveryPersons,
  getDeliveryPersonHistory,
  getDeliveryPersonStats,
  getDeliveredToday
} = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros

// ========== ENDPOINTS PÚBLICOS (SIN AUTENTICACIÓN) ==========

// Crear pedido como invitado (SIN autenticación)
router.post('/guest', createGuestOrder);

// Rastrear pedido sin login (con número de pedido y email)
router.get('/track', trackOrder);

// ========== ENDPOINTS CON AUTENTICACIÓN ==========

// Obtener mis pedidos (clientes)
router.get('/my-orders', authMiddleware, getMyOrders);

// Obtener estadísticas (admin y vendedores)
router.get('/stats',
  authMiddleware,
  roleMiddleware('admin', 'vendedor'),
  getOrderStats
);

// ========== ENDPOINTS DE GESTIÓN PARA VENTAS ==========

// Obtener pedidos pendientes de gestión (admin, vendedor)
router.get('/pending',
  authMiddleware,
  roleMiddleware('admin', 'vendedor'),
  getPendingOrders
);

// Obtener pedidos listos para entrega (admin, vendedor, repartidor)
router.get('/ready',
  authMiddleware,
  roleMiddleware('admin', 'vendedor', 'repartidor'),
  getReadyOrders
);

// Obtener repartidores disponibles (admin, vendedor)
router.get('/deliveries/available',
  authMiddleware,
  roleMiddleware('admin', 'vendedor'),
  getAvailableDeliveryPersons
);

// ========== ENDPOINTS PARA REPARTIDORES ==========
// IMPORTANTE: Estas rutas DEBEN ir ANTES de las rutas con parámetros /:id

// Historial completo del repartidor
router.get('/delivery-person/history',
  authMiddleware,
  roleMiddleware('repartidor'),
  getDeliveryPersonHistory
);

// Estadísticas del repartidor
router.get('/delivery-person/stats',
  authMiddleware,
  roleMiddleware('repartidor'),
  getDeliveryPersonStats
);

// Pedidos entregados hoy
router.get('/delivery-person/delivered-today',
  authMiddleware,
  roleMiddleware('repartidor'),
  getDeliveredToday
);

// ========== ENDPOINTS GENERALES ==========

// Crear un pedido (clientes)
router.post('/',
  authMiddleware,
  roleMiddleware('cliente', 'admin'),
  createOrder
);

// Listar todos los pedidos (admin, vendedor, repartidor)
router.get('/',
  authMiddleware,
  roleMiddleware('admin', 'vendedor', 'repartidor'),
  getAllOrders
);

// IMPORTANTE: Las rutas con :id DEBEN ir al FINAL
// Obtener pedido por ID
router.get('/:id', authMiddleware, getOrderById);

// Actualizar estado del pedido (vendedor, admin, repartidor)
router.put('/:id/status',
  authMiddleware,
  roleMiddleware('admin', 'vendedor', 'repartidor'),
  updateOrderStatus
);

// Cancelar pedido (cliente, admin, vendedor)
router.post('/:id/cancel',
  authMiddleware,
  roleMiddleware('cliente', 'admin', 'vendedor'),
  cancelOrder
);

// Asignar repartidor (admin, vendedor)
router.put('/:id/assign-delivery',
  authMiddleware,
  roleMiddleware('admin', 'vendedor'),
  assignDeliveryPerson
);

// Actualizar prioridad del pedido (admin, vendedor)
router.put('/:id/priority',
  authMiddleware,
  roleMiddleware('admin', 'vendedor'),
  updateOrderPriority
);

// Asignar coordinador de ventas (admin)
router.put('/:id/assign-coordinator',
  authMiddleware,
  roleMiddleware('admin'),
  assignSalesCoordinator
);

// Obtener historial completo del pedido
router.get('/:id/history',
  authMiddleware,
  getOrderHistory
);

module.exports = router;
