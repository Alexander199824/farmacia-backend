/**
 * @author Alexander Echeverria
 * @file app/models/client.js
 * @description Modelo de Cliente - BLOB corregido para PostgreSQL
 * @location app/models/client.js
 */

module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
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
      allowNull: false,
      comment: 'DPI del cliente'
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Email del cliente'
    },
    phone: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
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
      },
      comment: 'Relación con tabla Users'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['dpi'],
        name: 'unique_client_dpi'
      },
      {
        unique: true,
        fields: ['email'],
        name: 'unique_client_email'
      },
      {
        fields: ['userId']
      }
    ]
  });

  Client.associate = (models) => {
    Client.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Client;
};