const db = require('../config/db.config.js');
const Product = db.Product;

// Crear un nuevo producto con imagen
exports.create = async (req, res) => {
    try {
        const { name, description, price, stock, supplier } = req.body;
        const image = req.file ? req.file.buffer : null; // Almacenar imagen como BLOB si está presente
        const product = await Product.create({ name, description, price, stock, supplier, image });
        res.status(201).json({ message: "Producto creado con éxito", product });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el producto", error: error.message });
    }
};

// Obtener todos los productos
exports.getAll = async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los productos", error: error.message });
    }
};

// Obtener un producto por ID
exports.getById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Producto no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el producto", error: error.message });
    }
};

// Actualizar un producto con imagen
exports.update = async (req, res) => {
    try {
        const { name, description, price, stock, supplier } = req.body;
        const image = req.file ? req.file.buffer : undefined; // Actualizar solo si hay una nueva imagen
        const product = await Product.findByPk(req.params.id);
        if (product) {
            await product.update({ name, description, price, stock, supplier, image });
            res.json({ message: "Producto actualizado con éxito", product });
        } else {
            res.status(404).json({ message: "Producto no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el producto", error: error.message });
    }
};

// Eliminar un producto
exports.delete = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (product) {
            await product.destroy();
            res.json({ message: "Producto eliminado con éxito" });
        } else {
            res.status(404).json({ message: "Producto no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el producto", error: error.message });
    }
};
