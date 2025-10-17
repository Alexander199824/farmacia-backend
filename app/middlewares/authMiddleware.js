/**
 * @author Alexander Echeverria
 * @file app/middlewares/authMiddleware.js
 * @description Middleware de autenticación con JWT
 * @location app/middlewares/authMiddleware.js
 * 
 * Funcionalidades:
 * - Valida token JWT
 * - Verifica que el usuario exista y esté activo
 * - Agrega información del usuario al request
 */

const env = require('../config/env'); 
const jwt = require('jsonwebtoken');
const db = require('../config/db.config');
const User = db.User;

module.exports = async (req, res, next) => {
    try {
        // Extraer token del header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: "Acceso denegado. No se proporcionó token de autenticación" 
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verificar el token
        let decoded;
        try {
            decoded = jwt.verify(token, env.jwtSecret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: "Token expirado. Por favor, inicia sesión nuevamente" 
                });
            }
            return res.status(401).json({ 
                message: "Token no válido" 
            });
        }

        // Verificar que el usuario exista en la base de datos
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({ 
                message: "Usuario no encontrado" 
            });
        }

        // Verificar que el usuario esté activo
        if (!user.isActive) {
            return res.status(403).json({ 
                message: "Cuenta desactivada. Contacta al administrador" 
            });
        }

        // Agregar información del usuario al request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        };

        next();
    } catch (error) {
        console.error('Error en authMiddleware:', error);
        return res.status(500).json({ 
            message: "Error interno del servidor" 
        });
    }
};