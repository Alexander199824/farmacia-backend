/**
 * @author Alexander Echeverria
 * @file app/middlewares/roleMiddleware.js
 * @description Middleware para control de acceso por roles
 * @location app/middlewares/roleMiddleware.js
 * 
 * Funcionalidades:
 * - Verifica que el usuario tenga el rol requerido
 * - Permite múltiples roles para una ruta
 * - Bloquea acceso a usuarios sin permisos
 */

/**
 * Middleware de verificación de roles
 * @param {string|string[]} allowedRoles - Rol o array de roles permitidos
 * @returns {Function} Middleware
 */
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                return res.status(401).json({
                    message: "Autenticación requerida"
                });
            }

            // Verificar que el usuario tenga un rol
            if (!req.user.role) {
                return res.status(403).json({
                    message: "Usuario sin rol asignado"
                });
            }

            // Convertir allowedRoles a array si es un string
            const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Verificar que el rol del usuario esté en la lista de roles permitidos
            console.log('🔍 [ROLE MIDDLEWARE] Verificando permisos:', {
                endpoint: req.originalUrl,
                method: req.method,
                allowedRoles: rolesArray,
                userRole: req.user.role,
                userId: req.user.id,
                match: rolesArray.includes(req.user.role)
            });

            if (!rolesArray.includes(req.user.role)) {
                console.log('❌ [ROLE MIDDLEWARE] Acceso denegado');
                return res.status(403).json({
                    message: "No tienes permisos para acceder a este recurso",
                    requiredRoles: rolesArray,
                    yourRole: req.user.role
                });
            }

            console.log('✅ [ROLE MIDDLEWARE] Acceso permitido');

            // Usuario autorizado
            next();
        } catch (error) {
            console.error('Error en roleMiddleware:', error);
            return res.status(500).json({
                message: "Error al verificar permisos"
            });
        }
    };
};

/**
 * Middleware para solo administradores
 */
const adminOnly = roleMiddleware('admin');

/**
 * Middleware para administradores y vendedores
 */
const adminOrSeller = roleMiddleware('admin', 'vendedor');

/**
 * Middleware para administradores y bodega
 */
const adminOrWarehouse = roleMiddleware('admin', 'bodega');

/**
 * Middleware para cualquier empleado (no clientes)
 */
const employeeOnly = roleMiddleware('admin', 'vendedor', 'bodega', 'repartidor');

module.exports = {
    roleMiddleware,
    adminOnly,
    adminOrSeller,
    adminOrWarehouse,
    employeeOnly
};