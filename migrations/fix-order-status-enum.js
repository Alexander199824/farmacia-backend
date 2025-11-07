/**
 * Migración: Agregar estado 'listo_para_envio' al ENUM de status en la tabla orders
 * @author Alexander Echeverria
 * @date 2025-01-06
 * @description
 * Agrega el nuevo estado 'listo_para_envio' entre 'listo_para_recoger' y 'en_camino'
 * Este estado permite que los pedidos de delivery esperen confirmación del repartidor
 * antes de pasar a 'en_camino'
 *
 * VERSIÓN CORREGIDA: Usa SQL directo para evitar problemas con Sequelize
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Agregando estado listo_para_envio al ENUM status...');

    await queryInterface.sequelize.transaction(async (transaction) => {

      // Paso 1: Eliminar el valor DEFAULT temporalmente
      await queryInterface.sequelize.query(
        `ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;`,
        { transaction }
      );
      console.log('✅ DEFAULT eliminado temporalmente');

      // Paso 2: Crear el nuevo tipo ENUM
      await queryInterface.sequelize.query(
        `CREATE TYPE enum_orders_status_new AS ENUM (
          'pendiente',
          'confirmado',
          'en_preparacion',
          'listo_para_recoger',
          'listo_para_envio',
          'en_camino',
          'entregado',
          'completado',
          'cancelado'
        );`,
        { transaction }
      );
      console.log('✅ Nuevo ENUM creado: enum_orders_status_new');

      // Paso 3: Cambiar la columna para usar el nuevo tipo
      await queryInterface.sequelize.query(
        `ALTER TABLE orders
         ALTER COLUMN status TYPE enum_orders_status_new
         USING status::text::enum_orders_status_new;`,
        { transaction }
      );
      console.log('✅ Columna status actualizada al nuevo ENUM');

      // Paso 3: Eliminar el tipo antiguo
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS enum_orders_status CASCADE;`,
        { transaction }
      );
      console.log('✅ ENUM antiguo eliminado');

      // Paso 4: Renombrar el nuevo tipo al nombre original
      await queryInterface.sequelize.query(
        `ALTER TYPE enum_orders_status_new RENAME TO enum_orders_status;`,
        { transaction }
      );
      console.log('✅ Nuevo ENUM renombrado a enum_orders_status');

      // Paso 5: Restaurar el valor DEFAULT
      await queryInterface.sequelize.query(
        `ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pendiente';`,
        { transaction }
      );
      console.log('✅ DEFAULT restaurado');

      console.log('✅ Migración completada exitosamente');
    });
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

      // Paso 2: Crear el tipo ENUM original (sin listo_para_envio)
      await queryInterface.sequelize.query(
        `CREATE TYPE enum_orders_status_old AS ENUM (
          'pendiente',
          'confirmado',
          'en_preparacion',
          'listo_para_recoger',
          'en_camino',
          'entregado',
          'completado',
          'cancelado'
        );`,
        { transaction }
      );
      console.log('✅ ENUM original creado: enum_orders_status_old');

      // Paso 3: Cambiar la columna para usar el tipo original
      await queryInterface.sequelize.query(
        `ALTER TABLE orders
         ALTER COLUMN status TYPE enum_orders_status_old
         USING status::text::enum_orders_status_old;`,
        { transaction }
      );
      console.log('✅ Columna status actualizada al ENUM original');

      // Paso 4: Eliminar el tipo nuevo
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS enum_orders_status CASCADE;`,
        { transaction }
      );
      console.log('✅ ENUM nuevo eliminado');

      // Paso 5: Renombrar el tipo original
      await queryInterface.sequelize.query(
        `ALTER TYPE enum_orders_status_old RENAME TO enum_orders_status;`,
        { transaction }
      );
      console.log('✅ ENUM original renombrado a enum_orders_status');

      console.log('✅ Reversión completada exitosamente');
    });
  }
};
