/**
 * Modelo de Usuario con imagenes en Cloudinary
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/User.js
 */

const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Null si registro con Google'
    },
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      comment: 'ID de Google OAuth'
    },
    role: {
      type: DataTypes.ENUM('admin', 'vendedor', 'bodega', 'repartidor', 'cliente'),
      allowNull: false,
      defaultValue: 'cliente',
      comment: 'Rol asignado internamente'
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    dpi: {
      type: DataTypes.STRING(13),
      allowNull: true,
      unique: true
    },
    nit: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    profileImage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL de Cloudinary'
    },
    cloudinaryPublicId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Public ID de Cloudinary para eliminar imagen'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['googleId'] },
      { unique: true, fields: ['dpi'] },
      { fields: ['role'] },
      { fields: ['isActive'] }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  User.prototype.comparePassword = async function(password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return User;
};