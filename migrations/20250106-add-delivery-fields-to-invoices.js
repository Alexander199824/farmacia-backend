'use strict';

/**
 * Migración: Agregar campos de delivery a invoices
 * Autor: Alexander Echeverria
 * Fecha: 2025-01-06
 *
 * Agrega campos para:
 * - Tipo de entrega (delivery/pickup)
 * - Asignación de repartidor
 * - Estado de preparación
 * - Dirección de entrega
 * - Notas de entrega
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('invoices', 'deliveryType', {
      type: Sequelize.ENUM('pickup', 'delivery'),
      allowNull: false,
      defaultValue: 'pickup',
      comment: 'Tipo de entrega: recoger en tienda o delivery'
    });

    await queryInterface.addColumn('invoices', 'preparationStatus', {
      type: Sequelize.ENUM('pendiente', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado'),
      defaultValue: 'pendiente',
      comment: 'Estado de preparación del pedido'
    });

    await queryInterface.addColumn('invoices', 'deliveryPersonId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Repartidor asignado al pedido'
    });

    await queryInterface.addColumn('invoices', 'deliveryAddress', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Dirección de entrega completa'
    });

    await queryInterface.addColumn('invoices', 'deliveryPhone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Teléfono de contacto para la entrega'
    });

    await queryInterface.addColumn('invoices', 'deliveryNotes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Notas o instrucciones especiales de entrega'
    });

    await queryInterface.addColumn('invoices', 'estimatedDeliveryTime', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Tiempo estimado de entrega'
    });

    await queryInterface.addColumn('invoices', 'actualDeliveryTime', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Tiempo real de entrega'
    });

    await queryInterface.addColumn('invoices', 'preparedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Fecha y hora cuando el pedido estuvo listo'
    });

    await queryInterface.addColumn('invoices', 'preparedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Usuario que preparó el pedido'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('invoices', 'deliveryType');
    await queryInterface.removeColumn('invoices', 'preparationStatus');
    await queryInterface.removeColumn('invoices', 'deliveryPersonId');
    await queryInterface.removeColumn('invoices', 'deliveryAddress');
    await queryInterface.removeColumn('invoices', 'deliveryPhone');
    await queryInterface.removeColumn('invoices', 'deliveryNotes');
    await queryInterface.removeColumn('invoices', 'estimatedDeliveryTime');
    await queryInterface.removeColumn('invoices', 'actualDeliveryTime');
    await queryInterface.removeColumn('invoices', 'preparedAt');
    await queryInterface.removeColumn('invoices', 'preparedBy');

    // Eliminar el ENUM
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invoices_deliveryType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invoices_preparationStatus";');
  }
};
