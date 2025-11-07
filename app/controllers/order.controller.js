/**
 * @author Alexander Echeverria
 * @file app/controllers/order.controller.js
 * @description Controlador de Pedidos en Línea con estados y generación automática de recibos
 * @location app/controllers/order.controller.js
 *
 * Funcionalidades:
 * - Crear pedido en línea (cliente)
 * - Listar pedidos según rol (cliente, vendedor, admin, repartidor)
 * - Actualizar estados de pedidos
 * - Generación automática de recibos al entregar
 * - Asignación de lotes FIFO al preparar pedido
 * - Control de flujo según tipo de entrega (pickup/delivery)
 */

const db = require('../config/db.config');
const Order = db.Order;
const OrderItem = db.OrderItem;
const Product = db.Product;
const Batch = db.Batch;
const User = db.User;
const Receipt = db.Receipt;
const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;
const InventoryMovement = db.InventoryMovement;
const { Op } = db.Sequelize;

// ========== CREAR PEDIDO COMO INVITADO (SIN AUTENTICACIÓN) ==========

exports.createGuestOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      guestInfo, // { firstName, lastName, email, phone, address }
      products, // Array de { productId, quantity, unitPrice }
      deliveryType, // 'pickup' o 'delivery'
      shippingAddress,
      paymentMethod,
      notes
    } = req.body;

    // Validaciones básicas
    if (!guestInfo || !guestInfo.firstName || !guestInfo.email || !guestInfo.phone) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Se requieren datos del cliente: nombre, email y teléfono"
      });
    }

    if (!products || products.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "El pedido debe tener al menos un producto"
      });
    }

    if (!deliveryType || !['pickup', 'delivery'].includes(deliveryType)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Tipo de entrega inválido. Debe ser 'pickup' o 'delivery'"
      });
    }

    if (deliveryType === 'delivery' && !shippingAddress) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Se requiere dirección de envío para delivery"
      });
    }

    // Buscar o crear usuario invitado
    let client = await User.findOne({
      where: { email: guestInfo.email },
      transaction
    });

    if (!client) {
      // Crear usuario invitado (sin contraseña)
      client = await User.create({
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName || '',
        email: guestInfo.email,
        phone: guestInfo.phone,
        address: guestInfo.address || '',
        password: Math.random().toString(36).substring(7), // Password temporal random
        role: 'cliente',
        isActive: true
      }, { transaction });
    }

    const clientId = client.id;

    // Procesar productos y calcular totales
    const orderItems = [];
    let subtotal = 0;

    for (const item of products) {
      const { productId, quantity, unitPrice } = item;

      if (!productId || !quantity || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Cada producto debe tener productId y quantity válidos"
        });
      }

      // Obtener producto
      const product = await Product.findByPk(productId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          message: `Producto con ID ${productId} no encontrado`
        });
      }

      if (!product.isActive) {
        await transaction.rollback();
        return res.status(400).json({
          message: `El producto "${product.name}" no está disponible`
        });
      }

      // Verificar stock disponible
      if (product.stock < quantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`
        });
      }

      const itemUnitPrice = unitPrice || parseFloat(product.salePrice);
      const itemSubtotal = quantity * itemUnitPrice;

      orderItems.push({
        productId,
        quantity,
        unitPrice: itemUnitPrice,
        subtotal: itemSubtotal,
        total: itemSubtotal
      });

      subtotal += itemSubtotal;
    }

    // Calcular costo de envío si aplica
    const shippingCost = deliveryType === 'delivery' ? 15.00 : 0.00;
    const total = subtotal + shippingCost;

    // Crear el pedido con estado PENDIENTE
    const order = await Order.create({
      clientId,
      deliveryType,
      shippingAddress: shippingAddress || null,
      status: 'pendiente',
      paymentMethod: paymentMethod || 'efectivo',
      paymentStatus: 'pendiente',
      subtotal,
      discount: 0,
      tax: 0,
      shippingCost,
      total,
      notes: notes || null,
      source: 'web'
    }, { transaction });

    // Crear items del pedido
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item
      }, { transaction });
    }

    await transaction.commit();

    // Recargar pedido con relaciones
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'imageUrl']
            }
          ]
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });

    res.status(201).json({
      message: "Pedido creado exitosamente",
      order: fullOrder
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear pedido invitado:', error);
    res.status(500).json({
      message: "Error al crear pedido",
      error: error.message
    });
  }
};

// ========== RASTREAR PEDIDO SIN AUTENTICACIÓN ==========

exports.trackOrder = async (req, res) => {
  try {
    const { orderNumber, email } = req.query;

    if (!orderNumber || !email) {
      return res.status(400).json({
        message: "Se requiere número de pedido y email"
      });
    }

    const order = await Order.findOne({
      where: { orderNumber },
      include: [
        {
          model: User,
          as: 'client',
          where: { email },
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'imageUrl']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        message: "Pedido no encontrado o el email no coincide"
      });
    }

    // Construir timeline
    const timeline = [
      {
        status: 'pendiente',
        timestamp: order.createdAt,
        description: 'Pedido creado'
      }
    ];

    if (order.confirmedAt) {
      timeline.push({
        status: 'confirmado',
        timestamp: order.confirmedAt,
        description: 'Pedido confirmado'
      });
    }

    if (order.preparedAt) {
      timeline.push({
        status: 'en_preparacion',
        timestamp: order.preparedAt,
        description: 'Pedido en preparación'
      });
    }

    if (order.readyAt) {
      const isPickup = order.deliveryType === 'pickup';
      timeline.push({
        status: isPickup ? 'listo_para_recoger' : 'listo_para_envio',
        timestamp: order.readyAt,
        description: isPickup
          ? 'Listo para recoger en tienda'
          : 'Listo para envío - esperando repartidor'
      });
    }

    if (order.shippedAt) {
      timeline.push({
        status: 'en_camino',
        timestamp: order.shippedAt,
        description: 'Repartidor confirmó recogida - en camino'
      });
    }

    if (order.deliveredAt) {
      timeline.push({
        status: 'entregado',
        timestamp: order.deliveredAt,
        description: 'Pedido entregado'
      });
    }

    res.status(200).json({
      order,
      timeline
    });

  } catch (error) {
    console.error('Error al rastrear pedido:', error);
    res.status(500).json({
      message: "Error al rastrear pedido",
      error: error.message
    });
  }
};

// ========== CREAR PEDIDO (CLIENTE AUTENTICADO) ==========

exports.createOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      products, // Array de { productId, quantity, unitPrice }
      deliveryType, // 'pickup' o 'delivery'
      shippingAddress,
      paymentMethod,
      notes
    } = req.body;

    // Validaciones básicas
    if (!products || products.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "El pedido debe tener al menos un producto"
      });
    }

    if (!deliveryType || !['pickup', 'delivery'].includes(deliveryType)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Tipo de entrega inválido. Debe ser 'pickup' o 'delivery'"
      });
    }

    if (deliveryType === 'delivery' && !shippingAddress) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Se requiere dirección de envío para delivery"
      });
    }

    const clientId = req.user.id; // Usuario autenticado

    // Procesar productos y calcular totales
    const orderItems = [];
    let subtotal = 0;

    for (const item of products) {
      const { productId, quantity, unitPrice } = item;

      if (!productId || !quantity || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Cada producto debe tener productId y quantity válidos"
        });
      }

      // Obtener producto
      const product = await Product.findByPk(productId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          message: `Producto con ID ${productId} no encontrado`
        });
      }

      if (!product.isActive) {
        await transaction.rollback();
        return res.status(400).json({
          message: `El producto "${product.name}" no está disponible`
        });
      }

      // Verificar stock disponible
      if (product.stock < quantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`
        });
      }

      const itemUnitPrice = unitPrice || parseFloat(product.salePrice);
      const itemSubtotal = quantity * itemUnitPrice;

      orderItems.push({
        productId,
        quantity,
        unitPrice: itemUnitPrice,
        subtotal: itemSubtotal,
        total: itemSubtotal
      });

      subtotal += itemSubtotal;
    }

    // Calcular costo de envío si aplica
    const shippingCost = deliveryType === 'delivery' ? 15.00 : 0.00; // Q15 por envío

    const total = subtotal + shippingCost;

    // Crear el pedido con estado PENDIENTE
    const order = await Order.create({
      clientId,
      deliveryType,
      shippingAddress: shippingAddress || null,
      status: 'pendiente', // ⬅️ IMPORTANTE: Siempre pendiente al crear
      paymentMethod,
      paymentStatus: 'pendiente',
      subtotal,
      discount: 0,
      tax: 0,
      shippingCost,
      total,
      notes
    }, { transaction });

    // Crear items del pedido
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item
      }, { transaction });
    }

    await transaction.commit();

    // Recargar pedido con relaciones
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'imageUrl']
            }
          ]
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });

    res.status(201).json({
      message: "Pedido creado exitosamente",
      order: fullOrder
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear pedido:', error);
    res.status(500).json({
      message: "Error al crear pedido",
      error: error.message
    });
  }
};

// ========== LISTAR PEDIDOS SEGÚN ROL ==========

exports.getAllOrders = async (req, res) => {
  try {
    const {
      status,
      deliveryType,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const userRole = req.user.role;
    const userId = req.user.id;

    const where = {};

    // Filtrar según rol
    if (userRole === 'cliente') {
      // Clientes solo ven sus propios pedidos
      where.clientId = userId;
    } else if (userRole === 'repartidor') {
      // Repartidores ven pedidos de delivery en estados relevantes
      where.deliveryType = 'delivery';
      where.status = {
        [Op.in]: ['confirmado', 'en_preparacion', 'listo_para_envio', 'en_camino', 'entregado']
      };
    } else if (userRole === 'vendedor') {
      // Vendedores ven todos los pedidos
      // No aplicar filtro adicional
    } else if (userRole === 'admin') {
      // Admins ven todos los pedidos
      // No aplicar filtro adicional
    } else {
      return res.status(403).json({
        message: "No tienes permisos para ver pedidos"
      });
    }

    // Filtros opcionales
    if (status) {
      // Si status es una cadena con comas, convertir a array
      if (typeof status === 'string' && status.includes(',')) {
        where.status = { [Op.in]: status.split(',').map(s => s.trim()) };
      } else {
        where.status = status;
      }
    }
    if (deliveryType) where.deliveryType = deliveryType;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: User,
          as: 'deliveryPerson',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
          required: false
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'imageUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      orders
    });

  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      message: "Error al obtener pedidos",
      error: error.message
    });
  }
};

// ========== OBTENER MIS PEDIDOS (CLIENTE) ==========

exports.getMyOrders = async (req, res) => {
  try {
    const clientId = req.user.id;

    const orders = await Order.findAll({
      where: { clientId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'imageUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      orders
    });

  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      message: "Error al obtener pedidos",
      error: error.message
    });
  }
};

// ========== OBTENER PEDIDO POR ID ==========

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'description', 'imageUrl']
            },
            {
              model: Batch,
              as: 'batch',
              attributes: ['id', 'batchNumber', 'expirationDate'],
              required: false
            }
          ]
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: User,
          as: 'deliveryPerson',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
          required: false
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'total'],
          required: false
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Verificar permisos
    if (userRole === 'cliente' && order.clientId !== userId) {
      return res.status(403).json({
        message: "No tienes permiso para ver este pedido"
      });
    }

    res.status(200).json(order);

  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({
      message: "Error al obtener pedido",
      error: error.message
    });
  }
};

// ========== ACTUALIZAR ESTADO DEL PEDIDO ==========

exports.updateOrderStatus = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { status, forceAsAdmin } = req.body; // forceAsAdmin: permite al admin actuar en emergencias
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('📝 [UPDATE STATUS] Request recibido:', {
      orderId: id,
      newStatus: status,
      userRole,
      userId,
      forceAsAdmin,
      body: req.body
    });

    // Validar que se envió el status
    if (!status) {
      await transaction.rollback();
      console.log('❌ [UPDATE STATUS] Status no proporcionado');
      return res.status(400).json({
        message: "El campo 'status' es requerido",
        received: req.body
      });
    }

    // Validar que el estado sea válido
    const validStatuses = [
      'pendiente',
      'confirmado',
      'en_preparacion',
      'listo_para_recoger',
      'listo_para_envio',
      'en_camino',
      'entregado',
      'completado',
      'cancelado'
    ];

    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      console.log('❌ [UPDATE STATUS] Estado no válido:', status);
      return res.status(400).json({
        message: "Estado no válido",
        providedStatus: status,
        validStatuses
      });
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        },
        {
          model: User,
          as: 'client'
        }
      ],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Verificar permisos según rol
    if (userRole === 'cliente') {
      await transaction.rollback();
      return res.status(403).json({
        message: "Los clientes no pueden cambiar el estado del pedido"
      });
    }

    // Validación especial: solo repartidores pueden pasar de listo_para_envio a en_camino
    // (a menos que ya tenga un repartidor asignado o el admin fuerce el cambio)
    if (order.status === 'listo_para_envio' && status === 'en_camino') {
      if (userRole === 'repartidor') {
        // El repartidor puede hacerlo ✅
      } else if (userRole === 'admin' && forceAsAdmin === true) {
        // Admin puede forzar el cambio en emergencias ✅
        console.log('⚠️ [UPDATE STATUS] Admin forzando cambio de estado (modo emergencia)');
      } else if (['admin', 'vendedor'].includes(userRole) && order.deliveryPersonId) {
        // Admin o vendedor puede hacerlo si ya hay un repartidor asignado ✅
      } else {
        await transaction.rollback();
        return res.status(403).json({
          message: "Solo el repartidor puede confirmar que recogió el pedido. Si eres admin/vendedor, primero debes asignar un repartidor al pedido.",
          hint: "Usa el endpoint PUT /api/orders/:id/assign-delivery para asignar un repartidor, o envía 'forceAsAdmin: true' si eres admin y es una emergencia"
        });
      }
    }

    // Validar transiciones de estado según deliveryType
    const currentStatus = order.status;

    console.log('🔄 [UPDATE STATUS] Validando transición:', {
      currentStatus,
      newStatus: status,
      deliveryType: order.deliveryType
    });

    if (order.deliveryType === 'pickup') {
      // Flujo para recoger en tienda (con retroceso permitido)
      const validTransitions = {
        'pendiente': ['confirmado', 'cancelado'],
        'confirmado': ['pendiente', 'en_preparacion', 'cancelado'], // ⬅️ Puede volver a pendiente
        'en_preparacion': ['confirmado', 'listo_para_recoger', 'cancelado'], // ⬅️ Puede volver a confirmado
        'listo_para_recoger': ['en_preparacion', 'entregado', 'cancelado'], // ⬅️ Puede volver a en_preparacion
        'entregado': ['completado'],
        'completado': [],
        'cancelado': []
      };

      if (!validTransitions[currentStatus]?.includes(status)) {
        await transaction.rollback();
        console.log('❌ [UPDATE STATUS] Transición no válida (pickup):', {
          from: currentStatus,
          to: status,
          validTransitions: validTransitions[currentStatus]
        });
        return res.status(400).json({
          message: `No se puede cambiar de "${currentStatus}" a "${status}" para pedidos de tipo pickup`,
          validTransitions: validTransitions[currentStatus]
        });
      }
    } else if (order.deliveryType === 'delivery') {
      // Flujo para envío a domicilio (con retroceso permitido)
      const validTransitions = {
        'pendiente': ['confirmado', 'cancelado'],
        'confirmado': ['pendiente', 'en_preparacion', 'cancelado'], // ⬅️ Puede volver a pendiente
        'en_preparacion': ['confirmado', 'listo_para_envio', 'cancelado'], // ⬅️ Puede volver a confirmado o pasar a listo
        'listo_para_envio': ['en_preparacion', 'en_camino', 'cancelado'], // ⬅️ Nuevo estado: repartidor ve el pedido aquí
        'en_camino': ['listo_para_envio', 'entregado', 'cancelado'], // ⬅️ Puede volver a listo_para_envio
        'entregado': ['completado'],
        'completado': [],
        'cancelado': []
      };

      if (!validTransitions[currentStatus]?.includes(status)) {
        await transaction.rollback();
        console.log('❌ [UPDATE STATUS] Transición no válida (delivery):', {
          from: currentStatus,
          to: status,
          validTransitions: validTransitions[currentStatus]
        });
        return res.status(400).json({
          message: `No se puede cambiar de "${currentStatus}" a "${status}" para pedidos de tipo delivery`,
          validTransitions: validTransitions[currentStatus]
        });
      }
    }

    console.log('✅ [UPDATE STATUS] Transición válida, procesando...');

    // Si el estado es "confirmado", registrar timestamp
    if (status === 'confirmado' && currentStatus !== 'confirmado') {
      await order.update({ confirmedAt: new Date() }, { transaction });
    }

    // Si el estado es "en_preparacion", asignar lotes FIFO y registrar timestamp
    if (status === 'en_preparacion' && currentStatus !== 'en_preparacion') {
      await order.update({ preparedAt: new Date() }, { transaction });
      for (const item of order.items) {
        if (!item.batchId) {
          // Obtener lote disponible (FIFO)
          const availableBatch = await Batch.findOne({
            where: {
              productId: item.productId,
              currentQuantity: { [Op.gte]: item.quantity },
              canBeSold: true,
              status: { [Op.in]: ['active', 'near_expiry'] },
              expirationDate: { [Op.gte]: new Date() }
            },
            order: [
              ['expirationDate', 'ASC'],
              ['receiptDate', 'ASC']
            ],
            transaction
          });

          if (!availableBatch) {
            await transaction.rollback();
            return res.status(400).json({
              message: `No hay lotes disponibles para "${item.product.name}"`
            });
          }

          // Asignar lote al item
          await item.update({
            batchId: availableBatch.id,
            unitCost: parseFloat(availableBatch.purchasePrice)
          }, { transaction });
        }
      }

      // Asignar vendedor si no tiene
      if (!order.sellerId) {
        await order.update({ sellerId: userId }, { transaction });
      }
    }

    // Si el estado es "listo_para_recoger", registrar timestamp
    if (status === 'listo_para_recoger' && currentStatus !== 'listo_para_recoger') {
      await order.update({ readyAt: new Date() }, { transaction });
    }

    // Si el estado es "listo_para_envio", registrar timestamp
    if (status === 'listo_para_envio' && currentStatus !== 'listo_para_envio') {
      await order.update({ readyAt: new Date() }, { transaction });
    }

    // Si el estado es "en_camino", asignar repartidor y registrar timestamp
    if (status === 'en_camino' && currentStatus !== 'en_camino') {
      await order.update({
        shippedAt: new Date(),
        deliveryPersonId: order.deliveryPersonId || (userRole === 'repartidor' ? userId : null)
      }, { transaction });
    }

    // ✅ GENERAR RECIBO AUTOMÁTICAMENTE AL ENTREGAR
    if ((status === 'entregado' || status === 'completado') &&
        (currentStatus !== 'entregado' && currentStatus !== 'completado')) {

      console.log('🧾 [RECEIPT] Iniciando generación de recibo automático...');
      console.log('🧾 [RECEIPT] Usuario actual:', {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role
      });

      // Verificar si ya existe un invoice para este pedido
      if (!order.invoiceId) {
        // Crear Invoice (factura)
        const invoice = await Invoice.create({
          clientId: order.clientId,
          sellerId: order.sellerId || userId,
          clientName: `${order.client.firstName || ''} ${order.client.lastName || ''}`.trim(),
          clientDPI: order.client.dpi,
          sellerDPI: null,
          subtotal: order.subtotal,
          discount: order.discount,
          tax: order.tax,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          status: 'completada',
          notes: `Pedido en línea ${order.orderNumber}`
        }, { transaction });

        console.log('✅ [RECEIPT] Invoice creado:', invoice.id);

        // Crear items de la factura y descontar stock
        for (const item of order.items) {
          await InvoiceItem.create({
            invoiceId: invoice.id,
            productId: item.productId,
            batchId: item.batchId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            discount: item.discount,
            subtotal: item.subtotal,
            total: item.total
          }, { transaction });

          // Descontar del lote
          const batch = await Batch.findByPk(item.batchId, { transaction });
          await batch.decrement('currentQuantity', { by: item.quantity, transaction });

          if (batch.currentQuantity - item.quantity === 0) {
            await batch.update({ status: 'depleted' }, { transaction });
          }

          // Descontar del producto
          const product = await Product.findByPk(item.productId, { transaction });
          await product.decrement('stock', { by: item.quantity, transaction });

          // Crear movimiento de inventario
          await InventoryMovement.create({
            productId: item.productId,
            batchId: item.batchId,
            movementType: 'venta',
            quantity: -item.quantity,
            previousStock: product.stock,
            newStock: product.stock - item.quantity,
            unitCost: item.unitCost,
            totalValue: item.unitCost * item.quantity,
            referenceType: 'sale', // ✅ Cambió de 'order' a 'sale' para cumplir con el enum
            referenceId: order.id,
            userId: userId,
            notes: `Venta - Pedido ${order.orderNumber}`
          }, { transaction });
        }

        console.log('✅ [RECEIPT] Items procesados y stock descontado');

        // Generar nombre del emisor (issuedBy)
        let issuedBy = 'Sistema';
        if (req.user.firstName && req.user.lastName) {
          issuedBy = `${req.user.firstName} ${req.user.lastName}`;
        } else if (req.user.firstName) {
          issuedBy = req.user.firstName;
        } else if (req.user.email) {
          issuedBy = req.user.email;
        }

        console.log('🧾 [RECEIPT] issuedBy generado:', issuedBy);

        // Generar comprobante de pago (recibo)
        const receipt = await Receipt.create({
          invoiceId: invoice.id,
          clientId: order.clientId,
          amount: order.total,
          paymentMethod: order.paymentMethod,
          currency: 'GTQ',
          issuedBy: issuedBy,
          notes: `Comprobante de Pedido ${order.orderNumber}`
        }, { transaction });

        console.log(`✅ [RECEIPT] Recibo generado automáticamente: ${receipt.receiptNumber}`);

        // Vincular invoice al pedido
        await order.update({
          invoiceId: invoice.id,
          deliveredAt: new Date()
        }, { transaction });

        console.log('✅ [RECEIPT] Invoice vinculado al pedido');
      } else {
        console.log('ℹ️ [RECEIPT] El pedido ya tiene un invoice asociado, saltando generación');
      }
    }

    // Actualizar estado del pedido
    await order.update({ status }, { transaction });

    console.log('✅ [UPDATE STATUS] Estado actualizado exitosamente');

    await transaction.commit();

    // Recargar pedido con relaciones
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku']
            }
          ]
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: User,
          as: 'deliveryPerson',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'total'],
          required: false
        }
      ]
    });

    console.log('✅ [UPDATE STATUS] Respuesta enviada');

    res.status(200).json({
      message: "Estado actualizado exitosamente",
      order: updatedOrder
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ [UPDATE STATUS] Error:', error);
    res.status(500).json({
      message: "Error al actualizar estado",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ========== CANCELAR PEDIDO ==========

exports.cancelOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    if (!reason) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Se requiere una razón para cancelar el pedido"
      });
    }

    const order = await Order.findByPk(id, { transaction });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Verificar permisos
    if (userRole === 'cliente' && order.clientId !== userId) {
      await transaction.rollback();
      return res.status(403).json({
        message: "No tienes permiso para cancelar este pedido"
      });
    }

    // No permitir cancelar si ya está entregado
    if (order.status === 'entregado' || order.status === 'completado') {
      await transaction.rollback();
      return res.status(400).json({
        message: "No se puede cancelar un pedido que ya fue entregado"
      });
    }

    if (order.status === 'cancelado') {
      await transaction.rollback();
      return res.status(400).json({
        message: "El pedido ya está cancelado"
      });
    }

    await order.update({
      status: 'cancelado',
      cancelReason: reason
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Pedido cancelado exitosamente",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: 'cancelado'
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({
      message: "Error al cancelar pedido",
      error: error.message
    });
  }
};

// ========== ASIGNAR REPARTIDOR ==========

exports.assignDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryPersonId } = req.body;
    const userRole = req.user.role;

    // Solo admins y vendedores pueden asignar repartidores
    if (!['admin', 'vendedor'].includes(userRole)) {
      return res.status(403).json({
        message: "No tienes permisos para asignar repartidores"
      });
    }

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (order.deliveryType !== 'delivery') {
      return res.status(400).json({
        message: "Solo se puede asignar repartidor a pedidos de tipo delivery"
      });
    }

    // Verificar que el repartidor existe
    const deliveryPerson = await User.findByPk(deliveryPersonId);
    if (!deliveryPerson || deliveryPerson.role !== 'repartidor') {
      return res.status(400).json({
        message: "Repartidor no válido"
      });
    }

    await order.update({ deliveryPersonId });

    res.status(200).json({
      message: "Repartidor asignado exitosamente",
      order
    });

  } catch (error) {
    console.error('Error al asignar repartidor:', error);
    res.status(500).json({
      message: "Error al asignar repartidor",
      error: error.message
    });
  }
};

// ========== ESTADÍSTICAS DE PEDIDOS ==========

exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const stats = {
      total: await Order.count({ where: dateFilter }),

      byStatus: await Order.findAll({
        where: dateFilter,
        attributes: [
          'status',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalAmount']
        ],
        group: ['status'],
        raw: true
      }),

      byDeliveryType: await Order.findAll({
        where: dateFilter,
        attributes: [
          'deliveryType',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('total')), 'totalAmount']
        ],
        group: ['deliveryType'],
        raw: true
      }),

      totalRevenue: await Order.sum('total', {
        where: {
          status: { [Op.notIn]: ['cancelado'] },
          ...dateFilter
        }
      }) || 0
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      message: "Error al obtener estadísticas",
      error: error.message
    });
  }
};

// ========== ENDPOINTS ESPECÍFICOS PARA GESTIÓN DE VENTAS ==========

/**
 * Obtener pedidos pendientes de gestión (para área de ventas)
 * Estados: pendiente, confirmado, en_preparacion
 */
exports.getPendingOrders = async (req, res) => {
  try {
    const { deliveryType, priority, limit = 50 } = req.query;
    const userRole = req.user.role;

    // Solo vendedores y admins pueden ver pedidos pendientes
    if (!['admin', 'vendedor'].includes(userRole)) {
      return res.status(403).json({
        message: "No tienes permisos para ver pedidos pendientes"
      });
    }

    const where = {
      status: {
        [Op.in]: ['pendiente', 'confirmado', 'en_preparacion']
      }
    };

    if (deliveryType) where.deliveryType = deliveryType;
    if (priority) where.priority = priority;

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'imageUrl', 'stock']
            }
          ]
        }
      ],
      order: [
        ['priority', 'DESC'], // Urgente primero
        ['createdAt', 'ASC']  // Más antiguos primero
      ],
      limit: parseInt(limit)
    });

    res.status(200).json({
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    res.status(500).json({
      message: "Error al obtener pedidos pendientes",
      error: error.message
    });
  }
};

/**
 * Obtener pedidos listos para entrega
 * Estados: listo_para_recoger, listo_para_envio, en_camino
 */
exports.getReadyOrders = async (req, res) => {
  try {
    const { deliveryType } = req.query;
    const userRole = req.user.role;

    if (!['admin', 'vendedor', 'repartidor'].includes(userRole)) {
      return res.status(403).json({
        message: "No tienes permisos"
      });
    }

    const where = {
      status: {
        [Op.in]: ['listo_para_recoger', 'listo_para_envio', 'en_camino']
      }
    };

    if (deliveryType) where.deliveryType = deliveryType;

    // Repartidores solo ven delivery y estados relevantes
    if (userRole === 'repartidor') {
      where.deliveryType = 'delivery';
      where.status = {
        [Op.in]: ['listo_para_envio', 'en_camino'] // Solo ven pedidos listos para enviar o ya en camino
      };
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address']
        },
        {
          model: User,
          as: 'deliveryPerson',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
          required: false
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'imageUrl']
            }
          ]
        }
      ],
      order: [['readyAt', 'ASC']]
    });

    res.status(200).json({
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('Error al obtener pedidos listos:', error);
    res.status(500).json({
      message: "Error al obtener pedidos listos",
      error: error.message
    });
  }
};

/**
 * Cambiar prioridad del pedido
 */
exports.updateOrderPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const userRole = req.user.role;

    if (!['admin', 'vendedor'].includes(userRole)) {
      return res.status(403).json({
        message: "No tienes permisos para cambiar prioridad"
      });
    }

    if (!['normal', 'alta', 'urgente'].includes(priority)) {
      return res.status(400).json({
        message: "Prioridad inválida. Debe ser: normal, alta o urgente"
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    await order.update({ priority });

    res.status(200).json({
      message: "Prioridad actualizada",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        priority: order.priority
      }
    });

  } catch (error) {
    console.error('Error al actualizar prioridad:', error);
    res.status(500).json({
      message: "Error al actualizar prioridad",
      error: error.message
    });
  }
};

/**
 * Asignar coordinador de ventas
 */
exports.assignSalesCoordinator = async (req, res) => {
  try {
    const { id } = req.params;
    const { salesCoordinatorId } = req.body;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        message: "Solo administradores pueden asignar coordinadores"
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Verificar que el coordinador existe
    const coordinator = await User.findByPk(salesCoordinatorId);
    if (!coordinator || !['admin', 'vendedor'].includes(coordinator.role)) {
      return res.status(400).json({
        message: "Coordinador no válido"
      });
    }

    await order.update({ salesCoordinatorId });

    res.status(200).json({
      message: "Coordinador asignado exitosamente",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        salesCoordinatorId
      }
    });

  } catch (error) {
    console.error('Error al asignar coordinador:', error);
    res.status(500).json({
      message: "Error al asignar coordinador",
      error: error.message
    });
  }
};

/**
 * Obtener historial completo del pedido
 */
exports.getOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku']
            },
            {
              model: Batch,
              as: 'batch',
              attributes: ['id', 'batchNumber', 'expirationDate'],
              required: false
            }
          ]
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: User,
          as: 'deliveryPerson',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
          required: false
        },
        {
          model: User,
          as: 'salesCoordinator',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'total', 'status'],
          required: false,
          include: [
            {
              model: db.Receipt,
              as: 'receipts',
              attributes: ['id', 'receiptNumber', 'issueDate', 'status'],
              required: false
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Construir línea de tiempo
    const timeline = [
      {
        status: 'pendiente',
        timestamp: order.createdAt,
        description: 'Pedido creado'
      }
    ];

    if (order.confirmedAt) {
      timeline.push({
        status: 'confirmado',
        timestamp: order.confirmedAt,
        description: 'Pedido confirmado'
      });
    }

    if (order.preparedAt) {
      timeline.push({
        status: 'en_preparacion',
        timestamp: order.preparedAt,
        description: 'Pedido en preparación'
      });
    }

    if (order.readyAt) {
      const isPickup = order.deliveryType === 'pickup';
      timeline.push({
        status: isPickup ? 'listo_para_recoger' : 'listo_para_envio',
        timestamp: order.readyAt,
        description: isPickup
          ? 'Listo para recoger en tienda'
          : 'Listo para envío - esperando repartidor'
      });
    }

    if (order.shippedAt) {
      timeline.push({
        status: 'en_camino',
        timestamp: order.shippedAt,
        description: 'Repartidor confirmó recogida - en camino'
      });
    }

    if (order.deliveredAt) {
      timeline.push({
        status: 'entregado',
        timestamp: order.deliveredAt,
        description: 'Pedido entregado'
      });
    }

    res.status(200).json({
      order,
      timeline
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      message: "Error al obtener historial",
      error: error.message
    });
  }
};

/**
 * Obtener repartidores disponibles
 * Endpoint: GET /api/orders/deliveries/available
 */
exports.getAvailableDeliveryPersons = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Solo admins y vendedores pueden ver repartidores
    if (!['admin', 'vendedor'].includes(userRole)) {
      return res.status(403).json({
        message: "No tienes permisos para ver repartidores"
      });
    }

    // Buscar todos los usuarios con rol repartidor activos
    const deliveryPersons = await User.findAll({
      where: {
        role: 'repartidor',
        isActive: true
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address'],
      order: [['firstName', 'ASC']]
    });

    // Obtener estadísticas de pedidos por repartidor
    const deliveryPersonsWithStats = await Promise.all(
      deliveryPersons.map(async (person) => {
        const activeOrders = await Order.count({
          where: {
            deliveryPersonId: person.id,
            status: {
              [Op.in]: ['en_camino']
            }
          }
        });

        const completedToday = await Order.count({
          where: {
            deliveryPersonId: person.id,
            status: 'entregado',
            deliveredAt: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        });

        return {
          id: person.id,
          firstName: person.firstName,
          lastName: person.lastName,
          fullName: `${person.firstName} ${person.lastName}`,
          email: person.email,
          phone: person.phone,
          address: person.address,
          stats: {
            activeOrders,
            completedToday
          }
        };
      })
    );

    res.status(200).json({
      count: deliveryPersonsWithStats.length,
      deliveryPersons: deliveryPersonsWithStats
    });

  } catch (error) {
    console.error('Error al obtener repartidores disponibles:', error);
    res.status(500).json({
      message: "Error al obtener repartidores disponibles",
      error: error.message
    });
  }
};

// ========== HISTORIAL DE PEDIDOS DEL REPARTIDOR ==========

/**
 * Obtener historial completo de pedidos del repartidor
 * Endpoint: GET /api/orders/delivery-person/history
 */
exports.getDeliveryPersonHistory = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      search
    } = req.query;

    const userRole = req.user.role;
    const userId = req.user.id;

    // Solo repartidores pueden acceder
    if (userRole !== 'repartidor') {
      return res.status(403).json({
        message: "Este endpoint es solo para repartidores"
      });
    }

    const where = {
      deliveryPersonId: userId,
      deliveryType: 'delivery'
    };

    // Filtro por estado
    if (status) {
      where.status = status;
    } else {
      // Por defecto mostrar todos los estados relevantes
      where.status = {
        [Op.in]: ['listo_para_envio', 'en_camino', 'entregado', 'completado']
      };
    }

    // Filtro por rango de fechas
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Búsqueda por número de pedido o dirección
    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.iLike]: `%${search}%` } },
        { shippingAddress: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'imageUrl']
            }
          ]
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'total'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      orders
    });

  } catch (error) {
    console.error('Error al obtener historial del repartidor:', error);
    res.status(500).json({
      message: "Error al obtener historial",
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas del repartidor
 * Endpoint: GET /api/orders/delivery-person/stats
 */
exports.getDeliveryPersonStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query; // today, week, month, all
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole !== 'repartidor') {
      return res.status(403).json({
        message: "Este endpoint es solo para repartidores"
      });
    }

    // Calcular rango de fechas según periodo
    let startDate;
    const endDate = new Date();

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = null;
    }

    const baseWhere = {
      deliveryPersonId: userId,
      deliveryType: 'delivery'
    };

    if (startDate) {
      baseWhere.deliveredAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Pedidos entregados
    const entregados = await Order.count({
      where: {
        ...baseWhere,
        status: 'entregado'
      }
    });

    // Pedidos en camino
    const enCamino = await Order.count({
      where: {
        deliveryPersonId: userId,
        status: 'en_camino'
      }
    });

    // Pedidos listos para recoger
    const listosParaEnvio = await Order.count({
      where: {
        deliveryType: 'delivery',
        status: 'listo_para_envio',
        deliveryPersonId: null // Sin asignar aún
      }
    });

    // Total recaudado
    const totalRecaudado = await Order.sum('total', {
      where: {
        ...baseWhere,
        status: 'entregado'
      }
    }) || 0;

    // Pedidos por día de la semana (si es periodo semanal o mensual)
    let pedidosPorDia = null;
    if (period === 'week' || period === 'month') {
      const ordersWithDates = await Order.findAll({
        where: {
          ...baseWhere,
          status: 'entregado'
        },
        attributes: [
          [db.Sequelize.fn('DATE', db.Sequelize.col('deliveredAt')), 'fecha'],
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'cantidad']
        ],
        group: [db.Sequelize.fn('DATE', db.Sequelize.col('deliveredAt'))],
        raw: true,
        order: [[db.Sequelize.fn('DATE', db.Sequelize.col('deliveredAt')), 'ASC']]
      });

      pedidosPorDia = ordersWithDates;
    }

    // Promedio de tiempo de entrega (en minutos)
    const ordersWithTimes = await Order.findAll({
      where: {
        ...baseWhere,
        status: 'entregado',
        shippedAt: { [Op.not]: null },
        deliveredAt: { [Op.not]: null }
      },
      attributes: ['shippedAt', 'deliveredAt']
    });

    let avgDeliveryTime = 0;
    if (ordersWithTimes.length > 0) {
      const totalMinutes = ordersWithTimes.reduce((sum, order) => {
        const diff = new Date(order.deliveredAt) - new Date(order.shippedAt);
        return sum + (diff / 1000 / 60); // convertir a minutos
      }, 0);
      avgDeliveryTime = Math.round(totalMinutes / ordersWithTimes.length);
    }

    res.status(200).json({
      period,
      stats: {
        entregados,
        enCamino,
        listosParaEnvio,
        totalRecaudado: parseFloat(totalRecaudado).toFixed(2),
        promedioTiempoEntrega: avgDeliveryTime, // en minutos
        pedidosPorDia
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del repartidor:', error);
    res.status(500).json({
      message: "Error al obtener estadísticas",
      error: error.message
    });
  }
};

/**
 * Obtener pedidos entregados HOY
 * Endpoint: GET /api/orders/delivery-person/delivered-today
 */
exports.getDeliveredToday = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole !== 'repartidor') {
      return res.status(403).json({
        message: "Este endpoint es solo para repartidores"
      });
    }

    // Obtener inicio del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.findAll({
      where: {
        deliveryPersonId: userId,
        status: 'entregado',
        deliveredAt: {
          [Op.gte]: today
        }
      },
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'address']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'imageUrl']
            }
          ]
        }
      ],
      order: [['deliveredAt', 'DESC']]
    });

    const totalRecaudado = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    res.status(200).json({
      count: orders.length,
      totalRecaudado: totalRecaudado.toFixed(2),
      orders
    });

  } catch (error) {
    console.error('Error al obtener pedidos entregados hoy:', error);
    res.status(500).json({
      message: "Error al obtener pedidos entregados",
      error: error.message
    });
  }
};
