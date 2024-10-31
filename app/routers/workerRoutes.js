const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const {
  createWorker,
  getWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
} = require('../controllers/worker.controller');

// Crear un trabajador (con soporte para cargar imagen)
router.post('/', upload.single('image'), createWorker);

// Obtener todos los trabajadores
router.get('/', getWorkers);

// Obtener un trabajador por ID
router.get('/:id', getWorkerById);

// Actualizar un trabajador
router.put('/:id', upload.single('image'), updateWorker);

// Eliminar un trabajador
router.delete('/:id', deleteWorker);

module.exports = router;
