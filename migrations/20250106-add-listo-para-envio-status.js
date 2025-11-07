/**
 * Migración: Agregar estado 'listo_para_envio' al ENUM de status en la tabla orders
 * @author Alexander Echeverria
 * @date 2025-01-06
 * @description
 * Agrega el nuevo estado 'listo_para_envio' entre 'listo_para_recoger' y 'en_camino'
 * Este estado permite que los pedidos de delivery esperen confirmación del repartidor
 * antes de pasar a 'en_camino'
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Agregando estado listo_para_envio al ENUM status...');

    // Para PostgreSQL y MySQL, necesitamos recrear el ENUM
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Paso 1: Cambiar la columna a VARCHAR temporal
      await queryInterface.changeColumn('orders', 'status', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pendiente'
      }, { transaction });

      console.log('✅ Columna status convertida a VARCHAR temporalmente');

      // Paso 2: Eliminar el ENUM antiguo (si existe)
      try {
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "enum_orders_status" CASCADE;`,
          { transaction }
        );
        console.log('✅ ENUM antiguo eliminado');
      } catch (error) {
        console.log('ℹ️  No se pudo eliminar ENUM (probablemente MySQL):', error.message);
      }

      // Paso 3: Recrear la columna con el nuevo ENUM
      await queryInterface.changeColumn('orders', 'status', {
        type: Sequelize.ENUM(
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
        allowNull: false,
        defaultValue: 'pendiente',
        comment: 'Estado del pedido'
      }, { transaction });

      console.log('✅ Nuevo ENUM creado con estado listo_para_envio');
    });

    console.log('✅ Migración completada exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Revirtiendo: eliminando estado listo_para_envio del ENUM status...');

    await queryInterface.sequelize.transaction(async (transaction) => {
      // Paso 1: Actualizar cualquier pedido que esté en listo_para_envio
      await queryInterface.sequelize.query(
        `UPDATE orders SET status = 'en_preparacion' WHERE status = 'listo_para_envio';`,
        { transaction }
      );

      console.log('✅ Pedidos en listo_para_envio movidos a en_preparacion');

      // Paso 2: Cambiar la columna a VARCHAR temporal
      await queryInterface.changeColumn('orders', 'status', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pendiente'
      }, { transaction });

      // Paso 3: Eliminar el ENUM antiguo (si existe)
      try {
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "enum_orders_status" CASCADE;`,
          { transaction }
        );
      } catch (error) {
        console.log('ℹ️  No se pudo eliminar ENUM (probablemente MySQL):', error.message);
      }

      // Paso 4: Recrear la columna con el ENUM original (sin listo_para_envio)
      await queryInterface.changeColumn('orders', 'status', {
        type: Sequelize.ENUM(
          'pendiente',
          'confirmado',
          'en_preparacion',
          'listo_para_recoger',
          'en_camino',
          'entregado',
          'completado',
          'cancelado'
        ),
        allowNull: false,
        defaultValue: 'pendiente',
        comment: 'Estado del pedido'
      }, { transaction });

      console.log('✅ ENUM restaurado al estado original');
    });

    console.log('✅ Reversión completada exitosamente');
  }
};
