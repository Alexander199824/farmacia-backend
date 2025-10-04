/**
 * @author Alexander Echeverria
 * @file app/models/worker.js
 * @description Modelo de Trabajador - CORREGIDO
 * @location app/models/worker.js
 * 
 * Correcciones:
 * - Asociación foreignKey corregida de 'id' a 'userId'
 * - Alias corregido de 'Users' a 'user'
 */

module.exports = (sequelize, DataTypes) => {
  const Worker = sequelize.define('Worker', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dpi: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image: {
      type: DataTypes.BLOB('long'),
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  });

  Worker.associate = (models) => {
    Worker.belongsTo(models.User, {
      foreignKey: 'userId',  // ✅ CORREGIDO: era 'id'
      as: 'user'             // ✅ CORREGIDO: era 'Users'
    });
  };

  return Worker;
};