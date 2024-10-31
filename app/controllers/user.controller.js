const db = require('../config/db.config.js');
const env = require('../config/env.js');
const User = db.User;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Registro de usuario
exports.register = async (req, res) => {
    try {
        const { username, password, role, userType, dpi } = req.body;
        const image = req.file ? req.file.buffer : null; // Almacena la imagen si está presente
        const user = await User.create({ username, password, role, userType, dpi, image });
        res.status(201).json({ message: "Usuario registrado exitosamente", user });
    } catch (error) {
        console.log("Error en el registro:", error);
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
        if (user) res.status(200).json(user);
        else res.status(404).json({ message: "Usuario no encontrado" });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuario", error: error.message });
    }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
    try {
        const { username, password, role, userType, dpi } = req.body;
        const image = req.file ? req.file.buffer : undefined; // Solo actualizar imagen si se envía
        const user = await User.findByPk(req.params.id);
        if (user) {
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
