/**
 * Modelo de Pedido en Línea (Order)
 * @author Alexander Echeverria
 * @location app/models/order.js
 *
 * Funcionalidades:
 * - Pedidos en línea con diferentes estados
 * - Soporte para pickup y delivery
 * - Generación automática de recibos al entregar
 * - Control de estados según tipo de entrega
 */

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Número de pedido (PED-YYYYMM-000001)'
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'invoices',
        key: 'id'
      },
      comment: 'Factura generada cuando se completa el pedido'
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Cliente que realiza el pedido'
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Vendedor asignado (opcional)'
    },
    deliveryPersonId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Repartidor asignado (solo para delivery)'
    },
    deliveryType: {
      type: DataTypes.ENUM('pickup', 'delivery'),
      allowNull: false,
      comment: 'Tipo de entrega: pickup = recoger en tienda, delivery = envío a domicilio'
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Dirección de envío (solo para delivery)'
    },
    status: {
      type: DataTypes.ENUM(
        'pendiente',
        'confirmado',
        'en_preparacion',
        'listo_para_recoger',
        'listo_para_envio',
        'en_camino',
        'entregado',
        'completado',
        'cancelado'
      ),
      defaultValue: 'pendiente',
      comment: 'Estado del pedido'
    },
    paymentMethod: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia', 'paypal', 'stripe'),
      allowNull: false,
      defaultValue: 'efectivo'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'parcial', 'cancelado'),
      defaultValue: 'pendiente'
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    shippingCost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
      comment: 'Costo de envío (solo para delivery)'
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas del pedido o instrucciones especiales'
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Razón de cancelación si aplica'
    },
    estimatedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha estimada de entrega'
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha real de entrega'
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha en que se confirmó el pedido'
    },
    preparedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha en que se preparó el pedido'
    },
    readyAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha en que estuvo listo (para recoger o enviar)'
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha en que salió para entrega (solo delivery)'
    },
    priority: {
      type: DataTypes.ENUM('normal', 'alta', 'urgente'),
      defaultValue: 'normal',
      comment: 'Prioridad del pedido'
    },
    source: {
      type: DataTypes.ENUM('web', 'app', 'telefono', 'whatsapp', 'tienda'),
      defaultValue: 'web',
      comment: 'Canal de origen del pedido'
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Número de seguimiento (para delivery externo)'
    },
    salesCoordinatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Coordinador de ventas asignado'
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['orderNumber'] },
      { fields: ['clientId'] },
      { fields: ['sellerId'] },
      { fields: ['deliveryPersonId'] },
      { fields: ['salesCoordinatorId'] },
      { fields: ['status'] },
      { fields: ['deliveryType'] },
      { fields: ['paymentStatus'] },
      { fields: ['priority'] },
      { fields: ['source'] },
      { fields: ['createdAt'] }
    ],
    hooks: {
      beforeValidate: async (order, options) => {
        // Generar número de pedido si no existe
        if (order.orderNumber) {
          return;
        }

        try {
          console.log('🔧 [ORDER] Generando orderNumber...');

          const transaction = options.transaction;
          const now = new Date();

          // Generar prefijo con año y mes
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const prefix = `PED-${year}${month}-`;

          console.log('🔧 [ORDER] Prefijo:', prefix);

          // Buscar último pedido del mes
          const { Op } = sequelize.Sequelize;

          const lastOrder = await Order.findOne({
            where: {
              orderNumber: {
                [Op.like]: `${prefix}%`
              }
            },
            order: [['id', 'DESC']],
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined
          });

          console.log('🔧 [ORDER] Último pedido:', lastOrder?.orderNumber || 'ninguno');

          // Calcular siguiente número
          let nextNumber = 1;
          if (lastOrder && lastOrder.orderNumber) {
            const parts = lastOrder.orderNumber.split('-');
            if (parts.length === 3) {
              nextNumber = parseInt(parts[2], 10) + 1;
            }
          }

          // Generar número completo
          order.orderNumber = `${prefix}${String(nextNumber).padStart(6, '0')}`;

          console.log('✅ [ORDER] Número generado:', order.orderNumber);

        } catch (error) {
          console.error('❌ [ORDER] Error generando número:', error);
          throw new Error(`Error generando número de pedido: ${error.message}`);
        }
      }
    }
  });

  return Order;
};
