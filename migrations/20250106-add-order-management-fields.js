/**
 * Migración: Agregar campos de gestión avanzada a Orders
 * @author Alexander Echeverria
 * @date 2025-01-06
 *
 * Agrega campos para mejorar la gestión de pedidos en línea:
 * - Timestamps de cambios de estado
 * - Campo de prioridad
 * - Campo de origen del pedido
 * - Campos de tracking
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Verificar si la tabla existe
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('orders')) {
        console.log('⚠️  Tabla orders no existe. Saltando migración.');
        await transaction.commit();
        return;
      }

      // Agregar campos de timestamps de estado
      await queryInterface.addColumn('orders', 'confirmedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha en que se confirmó el pedido'
      }, { transaction });

      await queryInterface.addColumn('orders', 'preparedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha en que se preparó el pedido'
      }, { transaction });

      await queryInterface.addColumn('orders', 'readyAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha en que estuvo listo (para recoger o enviar)'
      }, { transaction });

      await queryInterface.addColumn('orders', 'shippedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha en que salió para entrega (solo delivery)'
      }, { transaction });

      // Agregar campo de prioridad
      await queryInterface.addColumn('orders', 'priority', {
        type: Sequelize.ENUM('normal', 'alta', 'urgente'),
        defaultValue: 'normal',
        comment: 'Prioridad del pedido'
      }, { transaction });

      // Agregar campo de origen
      await queryInterface.addColumn('orders', 'source', {
        type: Sequelize.ENUM('web', 'app', 'telefono', 'whatsapp', 'tienda'),
        defaultValue: 'web',
        comment: 'Canal de origen del pedido'
      }, { transaction });

      // Agregar campo de tracking
      await queryInterface.addColumn('orders', 'trackingNumber', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Número de seguimiento (para delivery externo)'
      }, { transaction });

      // Agregar campo de coordinador de ventas
      await queryInterface.addColumn('orders', 'salesCoordinatorId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Coordinador de ventas asignado'
      }, { transaction });

      // Agregar índices para mejorar consultas
      await queryInterface.addIndex('orders', ['priority'], {
        name: 'idx_orders_priority',
        transaction
      });

      await queryInterface.addIndex('orders', ['source'], {
        name: 'idx_orders_source',
        transaction
      });

      await queryInterface.addIndex('orders', ['salesCoordinatorId'], {
        name: 'idx_orders_sales_coordinator',
        transaction
      });

      console.log('✅ Migración completada: Campos de gestión agregados a orders');

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Eliminar índices
      await queryInterface.removeIndex('orders', 'idx_orders_priority', { transaction });
      await queryInterface.removeIndex('orders', 'idx_orders_source', { transaction });
      await queryInterface.removeIndex('orders', 'idx_orders_sales_coordinator', { transaction });

      // Eliminar columnas
      await queryInterface.removeColumn('orders', 'confirmedAt', { transaction });
      await queryInterface.removeColumn('orders', 'preparedAt', { transaction });
      await queryInterface.removeColumn('orders', 'readyAt', { transaction });
      await queryInterface.removeColumn('orders', 'shippedAt', { transaction });
      await queryInterface.removeColumn('orders', 'priority', { transaction });
      await queryInterface.removeColumn('orders', 'source', { transaction });
      await queryInterface.removeColumn('orders', 'trackingNumber', { transaction });
      await queryInterface.removeColumn('orders', 'salesCoordinatorId', { transaction });

      console.log('✅ Rollback completado: Campos removidos de orders');

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback:', error);
      throw error;
    }
  }
};
