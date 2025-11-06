/**
 * @author Alexander Echeverria
 * @file app/controllers/user.controller.js
 * @description Controlador de Usuarios con Google OAuth y Cloudinary
 * @location app/controllers/user.controller.js
 */

const db = require('../config/db.config.js');
const env = require('../config/env.js');
const { cloudinary } = require('../config/cloudinary.js');
const User = db.User;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const { Op } = require('sequelize'); // ⬅️ CAMBIADO

const googleClient = new OAuth2Client(env.googleClientId);

// ========== REGISTRO ==========

exports.register = async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            dpi,
            phone,
            address,
            birthDate,
            role = 'cliente'
        } = req.body;

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                message: "Email, contraseña, nombre y apellido son obligatorios"
            });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ message: "El email ya está registrado" });
        }

        if (dpi) {
            const existingDPI = await User.findOne({ where: { dpi } });
            if (existingDPI) {
                return res.status(400).json({ message: "El DPI ya está registrado" });
            }
        }

        const userData = {
            email,
            password,
            firstName,
            lastName,
            role,
            dpi,
            phone,
            address,
            birthDate,
            isActive: true,
            emailVerified: false
            // nit: No se usa en sistema local (solo recibos simples, no facturas)
        };

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'farmacia-elizabeth/users',
                transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
            });

            userData.profileImage = result.secure_url;
            userData.cloudinaryPublicId = result.public_id;
        }

        const user = await User.create(userData);

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            env.jwtSecret,
            { expiresIn: env.jwtExpiresIn }
        );

        res.status(201).json({
            message: "Usuario registrado exitosamente",
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        if (req.file && req.file.cloudinary_id) {
            await cloudinary.uploader.destroy(req.file.cloudinary_id);
        }

        res.status(500).json({
            message: "Error en el registro",
            error: error.message
        });
    }
};

exports.registerWithGoogle = async (req, res) => {
    try {
        const { tokenId } = req.body;

        const ticket = await googleClient.verifyIdToken({
            idToken: tokenId,
            audience: env.googleClientId
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name, family_name, picture } = payload;

        let user = await User.findOne({ where: { email } });

        if (user) {
            if (!user.googleId) {
                await user.update({ 
                    googleId,
                    emailVerified: true,
                    profileImage: picture || user.profileImage
                });
            }
        } else {
            user = await User.create({
                email,
                googleId,
                firstName: given_name,
                lastName: family_name,
                profileImage: picture,
                role: 'cliente',
                isActive: true,
                emailVerified: true,
                password: null
            });
        }

        await user.update({ lastLogin: new Date() });

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            env.jwtSecret,
            { expiresIn: env.jwtExpiresIn }
        );

        res.status(200).json({
            message: "Autenticación con Google exitosa",
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error en autenticación con Google",
            error: error.message
        });
    }
};

// ========== LOGIN ==========

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email y contraseña son obligatorios"
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        if (!user.password) {
            return res.status(401).json({
                message: "Esta cuenta fue creada con Google. Por favor, inicia sesión con Google"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "Cuenta desactivada" });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        await user.update({ lastLogin: new Date() });

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            env.jwtSecret,
            { expiresIn: env.jwtExpiresIn }
        );

        res.status(200).json({
            message: "Inicio de sesión exitoso",
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error en el inicio de sesión",
            error: error.message
        });
    }
};

exports.loginWithGoogle = async (req, res) => {
    try {
        const { tokenId } = req.body;

        if (!tokenId) {
            return res.status(400).json({
                message: "Token de Google requerido"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: tokenId,
            audience: env.googleClientId
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name, family_name, picture } = payload;

        // Buscar usuario por email o googleId
        let user = await User.findOne({
            where: {
                [Op.or]: [{ googleId }, { email }]
            }
        });

        if (user) {
            // Usuario existe - actualizar datos si es necesario
            if (!user.isActive) {
                return res.status(403).json({ message: "Cuenta desactivada" });
            }

            if (!user.googleId) {
                await user.update({ 
                    googleId, 
                    emailVerified: true,
                    profileImage: picture || user.profileImage
                });
            }

            await user.update({ lastLogin: new Date() });

        } else {
            // Usuario NO existe - crear automáticamente como CLIENTE
            user = await User.create({
                email,
                googleId,
                firstName: given_name || 'Usuario',
                lastName: family_name || 'Google',
                profileImage: picture,
                role: 'cliente', // ← ROL POR DEFECTO
                isActive: true,
                emailVerified: true,
                password: null
            });

            console.log('✅ Nuevo usuario creado automáticamente con Google:', user.email);
        }

        // Generar JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            env.jwtSecret,
            { expiresIn: env.jwtExpiresIn }
        );

        res.status(200).json({
            message: user ? "Inicio de sesión con Google exitoso" : "Usuario creado y autenticado",
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Error en inicio de sesión con Google:', error);
        res.status(500).json({
            message: "Error en inicio de sesión con Google",
            error: error.message
        });
    }
};
// ========== PERFIL ==========

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, phone, address, birthDate, dpi } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Permitir edición de campos individuales
        const updates = {};
        if (firstName !== undefined) updates.firstName = firstName;
        if (lastName !== undefined) updates.lastName = lastName;
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;
        if (birthDate !== undefined) updates.birthDate = birthDate;
        if (dpi !== undefined) {
            // Validar que el DPI no esté en uso por otro usuario
            if (dpi && dpi !== user.dpi) {
                const existingDPI = await User.findOne({
                    where: { dpi, id: { [Op.ne]: userId } }
                });
                if (existingDPI) {
                    return res.status(400).json({ message: "El DPI ya está registrado por otro usuario" });
                }
            }
            updates.dpi = dpi;
        }
        // nit: No se usa en sistema local (solo recibos simples, no facturas)

        // Si no hay cambios y no hay imagen, retornar error
        if (Object.keys(updates).length === 0 && !req.file) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }

        await user.update(updates);

        res.status(200).json({
            message: "Perfil actualizado exitosamente",
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                address: user.address,
                dpi: user.dpi,
                birthDate: user.birthDate,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar perfil",
            error: error.message
        });
    }
};

exports.updateProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "No se proporcionó ninguna imagen"
            });
        }

        // Eliminar imagen anterior de Cloudinary si existe
        if (user.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(user.cloudinaryPublicId);
            } catch (error) {
                console.error('Error al eliminar imagen anterior:', error);
            }
        }

        // Subir nueva imagen a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'farmacia-elizabeth/users',
            transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
        });

        // Actualizar usuario con nueva imagen
        await user.update({
            profileImage: result.secure_url,
            cloudinaryPublicId: result.public_id
        });

        res.status(200).json({
            message: "Imagen de perfil actualizada exitosamente",
            profileImage: user.profileImage
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar imagen de perfil",
            error: error.message
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                message: "La nueva contraseña debe tener al menos 8 caracteres"
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // CASO 1: Usuario tiene contraseña existente
        if (user.password) {
            if (!currentPassword) {
                return res.status(400).json({
                    message: "Debe proporcionar su contraseña actual"
                });
            }

            const isValidPassword = await user.comparePassword(currentPassword);
            if (!isValidPassword) {
                return res.status(401).json({ message: "Contraseña actual incorrecta" });
            }

            await user.update({ password: newPassword });

            return res.status(200).json({
                message: "Contraseña actualizada exitosamente"
            });
        }

        // CASO 2: Usuario de Google sin contraseña (puede establecer una)
        if (user.googleId && !user.password) {
            // Permitir establecer contraseña sin requerir la actual
            await user.update({ password: newPassword });

            return res.status(200).json({
                message: "Contraseña establecida exitosamente. Ahora puedes iniciar sesión con email y contraseña además de Google"
            });
        }

        // CASO 3: Sin contraseña y sin Google (error inesperado)
        return res.status(400).json({
            message: "Estado de cuenta inválido. Contacte al administrador"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al cambiar contraseña",
            error: error.message
        });
    }
};

// ========== CRUD (ADMIN) ==========

exports.getAllUsers = async (req, res) => {
    try {
        const { role, isActive, search, page = 1, limit = 50 } = req.query;

        const where = {};

        if (role) where.role = role;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        if (search) {
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { dpi: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows: users } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            users
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener usuarios",
            error: error.message
        });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener usuario",
            error: error.message
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, dpi, phone, address, birthDate } = req.body;

        const validRoles = ['admin', 'vendedor', 'bodega', 'repartidor', 'cliente'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({
                message: `Rol inválido. Roles válidos: ${validRoles.join(', ')}`
            });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ message: "El email ya está registrado" });
        }

        if (dpi) {
            const existingDPI = await User.findOne({ where: { dpi } });
            if (existingDPI) {
                return res.status(400).json({ message: "El DPI ya está registrado" });
            }
        }

        const userData = {
            email,
            password,
            firstName,
            lastName,
            role: role || 'cliente',
            dpi,
            phone,
            address,
            birthDate,
            isActive: true
            // nit: No se usa en sistema local (solo recibos simples, no facturas)
        };

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'farmacia-elizabeth/users',
                transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
            });

            userData.profileImage = result.secure_url;
            userData.cloudinaryPublicId = result.public_id;
        }

        const user = await User.create(userData);

        res.status(201).json({
            message: "Usuario creado exitosamente",
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al crear usuario",
            error: error.message
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, firstName, lastName, role, dpi, phone, address, birthDate, isActive } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (role) {
            const validRoles = ['admin', 'vendedor', 'bodega', 'repartidor', 'cliente'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    message: `Rol inválido. Roles válidos: ${validRoles.join(', ')}`
                });
            }
        }

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({
                where: { email, id: { [Op.ne]: id } }
            });
            if (existingEmail) {
                return res.status(400).json({ message: "El email ya está en uso" });
            }
        }

        if (dpi && dpi !== user.dpi) {
            const existingDPI = await User.findOne({
                where: { dpi, id: { [Op.ne]: id } }
            });
            if (existingDPI) {
                return res.status(400).json({ message: "El DPI ya está registrado" });
            }
        }

        const updates = {};
        if (email) updates.email = email;
        if (firstName) updates.firstName = firstName;
        if (lastName) updates.lastName = lastName;
        if (role) updates.role = role;
        if (dpi !== undefined) updates.dpi = dpi;
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;
        if (birthDate !== undefined) updates.birthDate = birthDate;
        if (isActive !== undefined) updates.isActive = isActive;
        // nit: No se usa en sistema local (solo recibos simples, no facturas)

        if (req.file) {
            if (user.cloudinaryPublicId) {
                await cloudinary.uploader.destroy(user.cloudinaryPublicId);
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'farmacia-elizabeth/users',
                transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
            });

            updates.profileImage = result.secure_url;
            updates.cloudinaryPublicId = result.public_id;
        }

        await user.update(updates);

        res.status(200).json({
            message: "Usuario actualizado exitosamente",
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar usuario",
            error: error.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (user.id === req.user.id) {
            return res.status(400).json({
                message: "No puedes eliminar tu propia cuenta"
            });
        }

        if (user.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(user.cloudinaryPublicId);
        }

        await user.destroy();

        res.status(200).json({
            message: "Usuario eliminado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar usuario",
            error: error.message
        });
    }
};

exports.toggleActiveUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        await user.update({ isActive: !user.isActive });

        res.status(200).json({
            message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} exitosamente`,
            user: {
                id: user.id,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al cambiar estado del usuario",
            error: error.message
        });
    }
};

exports.getUserStats = async (req, res) => {
    try {
        const stats = {
            total: await User.count(),
            active: await User.count({ where: { isActive: true } }),
            inactive: await User.count({ where: { isActive: false } }),
            
            byRole: await User.findAll({
                attributes: [
                    'role',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
                ],
                group: ['role']
            }),

            withGoogle: await User.count({
                where: { googleId: { [Op.ne]: null } }
            }),

            withPassword: await User.count({
                where: { password: { [Op.ne]: null } }
            }),

            recentLogins: await User.count({
                where: {
                    lastLogin: {
                        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            })
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener estadísticas",
            error: error.message
        });
    }
};

// ========== GOOGLE OAUTH CON REDIRECTS (OPCIÓN B) ==========

exports.initiateGoogleAuth = (req, res) => {
    try {
        const client = new OAuth2Client(
            env.googleClientId,
            env.googleClientSecret,
            env.googleCallbackURL || 'http://localhost:5000/api/users/auth/google/callback'
        );

        const authorizeUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            prompt: 'select_account'
        });

        console.log('🔄 Redirigiendo a Google para autenticación');
        res.redirect(authorizeUrl);
    } catch (error) {
        console.error('❌ Error al iniciar Google Auth:', error);
        res.redirect(`${env.frontendUrl}/login?error=oauth_init_failed`);
    }
};

exports.googleAuthCallback = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            console.error('❌ No se recibió código de Google');
            return res.redirect(`${env.frontendUrl}/login?error=no_code`);
        }

        console.log('🔄 Procesando código de autorización de Google');

        const client = new OAuth2Client(
            env.googleClientId,
            env.googleClientSecret,
            env.googleCallbackURL || 'http://localhost:5000/api/users/auth/google/callback'
        );

        const { tokens } = await client.getToken(code);
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: env.googleClientId
        });

        const googleUser = ticket.getPayload();
        const { sub: googleId, email, given_name, family_name, picture } = googleUser;

        console.log('✅ Usuario autenticado con Google:', email);

        let user = await User.findOne({ where: { email } });

        if (!user) {
            user = await User.create({
                firstName: given_name || 'Usuario',
                lastName: family_name || 'Google',
                email: email,
                password: null,
                googleId: googleId,
                profileImage: picture,
                role: 'cliente',
                isActive: true,
                emailVerified: true
            });

            console.log('✅ Nuevo usuario creado vía Google OAuth:', user.email);
        } else if (!user.googleId) {
            await user.update({ 
                googleId: googleId,
                emailVerified: true,
                profileImage: picture || user.profileImage
            });

            console.log('✅ Usuario existente vinculado con Google:', user.email);
        }

        if (!user.isActive) {
            console.warn('⚠️ Intento de login con cuenta desactivada:', user.email);
            return res.redirect(`${env.frontendUrl}/login?error=account_disabled`);
        }

        await user.update({ lastLogin: new Date() });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            env.jwtSecret,
            { expiresIn: env.jwtExpiresIn }
        );

        console.log('✅ Token JWT generado para:', user.email);

        const redirectUrl = `${env.frontendUrl}/auth/success?token=${token}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.firstName)}`;
        
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('❌ Error en Google OAuth callback:', error);
        res.redirect(`${env.frontendUrl}/login?error=oauth_failed&details=${encodeURIComponent(error.message)}`);
    }
};