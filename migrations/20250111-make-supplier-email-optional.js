'use strict';

/**
 * Migración: Hacer email opcional en suppliers
 * Autor: Alexander Echeverria
 * Fecha: 2025-01-11
 *
 * Modifica la columna email de la tabla suppliers
 * para permitir valores NULL (opcional)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('suppliers', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('suppliers', 'email', {
      type: Sequelize.STRING(255),
      allowNull: false
    });
  }
};
