/**
 * @author Alexander Echeverria
 * @file app/controllers/user.controller.js
 * @description Controlador de Usuarios - Incluye endpoint /profile
 * @location app/controllers/user.controller.js
 * 
 * Funcionalidades:
 * - Registro de usuarios
 * - Login con JWT
 * - CRUD completo de usuarios
 * - Obtener perfil del usuario autenticado
 */

const db = require('../config/db.config.js');
const env = require('../config/env.js');
const User = db.User;
const Worker = db.Worker;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Registro de usuario
exports.register = async (req, res) => {
    try {
        const { username, password, role, userType, dpi } = req.body;
        const image = req.file ? req.file.buffer : null;

        // Verifica si el DPI o nombre de usuario ya existe en la tabla de usuarios
        const existingUser = await User.findOne({ where: { dpi } });
        if (existingUser) {
            return res.status(400).json({ message: "DPI ya registrado para otro usuario." });
        }

        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ message: "Nombre de usuario ya en uso." });
        }

        // Crea el usuario si pasa las verificaciones
        const user = await User.create({ username, password, role, userType, dpi, image });
        res.status(201).json({ message: "Usuario registrado exitosamente", user });
    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ message: "Error en el registro", error: error.message });
    }
};

// Inicio de sesión
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (user && await bcrypt.compare(password, user.password)) {
            // Incluir DPI en el token
            const token = jwt.sign({ id: user.id, role: user.role, dpi: user.dpi }, env.jwtSecret, { expiresIn: '1h' });
            res.json({ message: "Inicio de sesión exitoso", token });
        } else {
            res.status(401).json({ message: "Credenciales incorrectas" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error en el inicio de sesión", error: error.message });
    }
};

// Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'dpi', 'role', 'userType'],
            include: [{
                model: Worker,
                as: 'user',
                attributes: ['name', 'email', 'phone'],
                required: false
            }]
        });
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Buscar también en la tabla de Workers por DPI si no hay relación directa
        let workerData = user.user;
        if (!workerData) {
            workerData = await Worker.findOne({
                where: { dpi: user.dpi },
                attributes: ['name', 'email', 'phone']
            });
        }

        res.json({
            id: user.id,
            dpi: user.dpi,
            name: workerData?.name || user.username,
            email: workerData?.email || null,
            phone: workerData?.phone || null,
            role: user.role,
            userType: user.userType
        });
    } catch (error) {
        console.error('Error en getProfile:', error);
        res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
    }
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
    }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuario", error: error.message });
    }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
    try {
        const { username, password, role, userType, dpi } = req.body;
        const image = req.file ? req.file.buffer : undefined;
        const user = await User.findByPk(req.params.id);
        
        if (user) {
            // Actualiza solo los campos proporcionados
            user.username = username || user.username;
            user.password = password ? await bcrypt.hash(password, 12) : user.password;
            user.role = role || user.role;
            user.userType = userType || user.userType;
            user.dpi = dpi || user.dpi;
            if (image !== undefined) user.image = image;
            await user.save();

            res.status(200).json({ message: "Usuario actualizado exitosamente", user });
        } else {
            res.status(404).json({ message: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
    }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            await user.destroy();
            res.status(200).json({ message: "Usuario eliminado exitosamente" });
        } else {
            res.status(404).json({ message: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
    }
};