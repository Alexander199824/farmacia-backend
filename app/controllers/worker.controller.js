const db = require('../config/db.config');
const Worker = db.Worker;
const User = db.User;

// Crear un trabajador
exports.createWorker = async (req, res) => {
  try {
    const { name, dpi, birthDate, email, phone, address, role, userId } = req.body;
    const image = req.file ? req.file.buffer : null;

    const worker = await Worker.create({
      name, dpi, birthDate, email, phone, address, role, image, userId: userId || null
    });

    res.status(201).json({ message: "Trabajador creado con éxito", worker });
  } catch (error) {
    res.status(500).json({ message: "Error al crear trabajador", error: error.message });
  }
};

// Obtener todos los trabajadores
exports.getWorkers = async (req, res) => {
  try {
    const workers = await Worker.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
    });

    res.status(200).json(workers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener trabajadores", error: error.message });
  }
};

// Obtener un trabajador por ID
exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }]
    });

    if (!worker) {
      return res.status(404).json({ message: "Trabajador no encontrado" });
    }

    res.status(200).json(worker);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener trabajador", error: error.message });
  }
};

// Actualizar un trabajador
exports.updateWorker = async (req, res) => {
  try {
    const { name, dpi, birthDate, email, phone, address, role, userId } = req.body;
    const image = req.file ? req.file.buffer : undefined; // Solo actualizar si se envía una nueva imagen

    const worker = await Worker.findByPk(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: "Trabajador no encontrado" });
    }

    await worker.update({
      name, dpi, birthDate, email, phone, address, role, image, userId: userId || null
    });

    res.status(200).json({ message: "Trabajador actualizado con éxito", worker });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar trabajador", error: error.message });
  }
};

// Eliminar un trabajador
exports.deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
      return res.status(404).json({ message: "Trabajador no encontrado" });
    }

    await worker.destroy();
    res.status(200).json({ message: "Trabajador eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar trabajador", error: error.message });
  }
};
