/**
 * Modelo de Cliente
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/Client.js
 */

module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    dpi: {
      type: DataTypes.STRING(13),
      allowNull: false,
      unique: true
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.BLOB,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'clients',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['dpi'] },
      { unique: true, fields: ['email'] }
    ]
  });

  return Client;
};