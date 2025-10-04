/**
 * @author Alexander Echeverria
 * @file app/models/user.js
 * @description Modelo de Usuario - BLOB corregido para PostgreSQL
 * @location app/models/user.js
 */

const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Nombre de usuario único'
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('administrador', 'vendedor', 'cliente'),
            allowNull: false
        },
        userType: {
            type: DataTypes.ENUM('trabajador', 'cliente'),
            allowNull: false
        },
        dpi: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'DPI único del usuario'
        },
        image: {
            type: DataTypes.BLOB,  // ✅ Corregido: sin 'long'
            allowNull: true
        }
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['username'],
                name: 'unique_user_username'
            },
            {
                unique: true,
                fields: ['dpi'],
                name: 'unique_user_dpi'
            },
            {
                fields: ['role']
            },
            {
                fields: ['userType']
            }
        ],
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            }
        }
    });

    return User;
};