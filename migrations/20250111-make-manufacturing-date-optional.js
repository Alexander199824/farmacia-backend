'use strict';

/**
 * Migración: Hacer manufacturingDate opcional en batches
 * Autor: Alexander Echeverria
 * Fecha: 2025-01-11
 *
 * Modifica la columna manufacturingDate de la tabla batches
 * para permitir valores NULL (opcional)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('batches', 'manufacturingDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Fecha de fabricacion (opcional)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('batches', 'manufacturingDate', {
      type: Sequelize.DATEONLY,
      allowNull: false,
      comment: 'Fecha de fabricacion'
    });
  }
};
