/**
 * @author Alexander Echeverria
 * @file app/models/worker.js
 * @description Modelo de Trabajador - BLOB corregido para PostgreSQL
 * @location app/models/worker.js
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
      type: DataTypes.BLOB,  // ✅ Corregido: sin 'long'
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
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Worker;
};