// controllers/client.controller.js
const db = require('../config/db.config');
const Client = db.Client;

// Crear un nuevo cliente
exports.createClient = async (req, res) => {
  try {
    const { name, dpi, birthDate, email, phone, address } = req.body;
    const image = req.file ? req.file.buffer : null; // Almacena la imagen como BLOB

    // Verifica si el DPI o correo ya existe en la tabla de clientes
    const existingClient = await Client.findOne({ where: { dpi } });
    if (existingClient) {
      return res.status(400).json({ message: "DPI ya existe para otro cliente." });
    }

    const client = await Client.create({
      name, dpi, birthDate, email, phone, address, image
    });

    res.status(201).json({ message: "Cliente creado con éxito", client });
  } catch (error) {
    res.status(500).json({ message: "Error al crear cliente", error: error.message });
  }
};

// Obtener todos los clientes
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener clientes", error: error.message });
  }
};

// Obtener un cliente por DPI
exports.getClientByDPI = async (req, res) => {
  try {
    const { dpi } = req.params;
    const client = await Client.findOne({ where: { dpi } });
    if (client) {
      res.status(200).json(client);
    } else {
      res.status(404).json({ message: "Cliente no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al buscar el cliente", error: error.message });
  }
};

// Actualizar un cliente
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dpi, birthDate, email, phone, address } = req.body;
    const image = req.file ? req.file.buffer : null;

    const client = await Client.findByPk(id);
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });

    await client.update({ name, dpi, birthDate, email, phone, address, image });
    res.status(200).json({ message: "Cliente actualizado con éxito", client });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar cliente", error: error.message });
  }
};

// Eliminar un cliente
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });

    await client.destroy();
    res.status(200).json({ message: "Cliente eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar cliente", error: error.message });
  }
};
