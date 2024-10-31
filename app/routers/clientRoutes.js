// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const {
  createClient,
  getAllClients,
  getClientByDPI,
  updateClient,
  deleteClient
} = require('../controllers/client.controller');
const authMiddleware = require('../middlewares/authMiddleware'); // Importa authMiddleware

// Crear un nuevo cliente con soporte de imagen
router.post('/', authMiddleware, upload.single('image'), createClient);

// Obtener todos los clientes
router.get('/', authMiddleware, getAllClients);

// Obtener un cliente por DPI
router.get('/by-dpi/:dpi', authMiddleware, getClientByDPI);

// Actualizar un cliente
router.put('/:id', authMiddleware, upload.single('image'), updateClient);

// Eliminar un cliente
router.delete('/:id', authMiddleware, deleteClient);

module.exports = router;
