// middlewares/authMiddleware.js
const env = require('../config/env'); 
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: "Acceso denegado" });

    try {
        const decoded = jwt.verify(token, env.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: "Token no válido" });
    }
};
