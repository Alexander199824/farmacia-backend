/**
 * @author Alexander Echeverria
 * @file app/controllers/products.controller.js
 * @description Controlador de Productos con Cloudinary
 * @location app/controllers/products.controller.js
 * 
 * Funcionalidades:
 * - CRUD completo de productos
 * - Subida de imágenes a Cloudinary
 * - Búsqueda avanzada por múltiples criterios
 * - Filtros por categoría, proveedor, stock
 * - Gestión de stock mínimo/máximo
 * - Productos activos/inactivos
 */

const db = require('../config/db.config.js');
const { cloudinary } = require('../config/cloudinary.js');
const Product = db.Product;
const Supplier = db.Supplier;
const Batch = db.Batch;
const { Op } = db.Sequelize;

// Crear un nuevo producto
exports.create = async (req, res) => {
    try {
        const {
            sku,
            name,
            genericName,
            description,
            category,
            subcategory,
            presentation,
            requiresPrescription,
            supplierId,
            price,
            costPrice,
            minStock = 10,
            maxStock = 500,
            barcode,
            laboratory,
            activeIngredient,
            sideEffects,
            contraindications
        } = req.body;

        // Validar que el proveedor existe
        const supplier = await Supplier.findByPk(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        // Validar SKU único
        if (sku) {
            const existingSku = await Product.findOne({ where: { sku } });
            if (existingSku) {
                return res.status(400).json({ message: "El SKU ya existe" });
            }
        }

        // Validar barcode único (si se proporciona)
        if (barcode) {
            const existingBarcode = await Product.findOne({ where: { barcode } });
            if (existingBarcode) {
                return res.status(400).json({ message: "El código de barras ya existe" });
            }
        }

        // Validar precios
        if (parseFloat(price) < parseFloat(costPrice)) {
            console.warn('⚠️ Advertencia: Precio de venta es menor que el costo');
        }

        // Preparar datos del producto
        const productData = {
            sku: sku || `PROD-${Date.now()}`, // Generar SKU si no se proporciona
            name,
            genericName,
            description,
            category,
            subcategory,
            presentation,
            requiresPrescription: requiresPrescription || false,
            supplierId,
            price,
            costPrice,
            stock: 0, // Stock inicial en 0, se actualiza con lotes
            minStock,
            maxStock,
            barcode,
            laboratory,
            activeIngredient,
            sideEffects,
            contraindications,
            isActive: true
        };

        // Si hay imagen, subirla a Cloudinary
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'farmacia-elizabeth/products',
                transformation: [{ width: 800, height: 800, crop: 'limit' }]
            });
            
            productData.imageUrl = result.secure_url;
            productData.cloudinaryPublicId = result.public_id;
        }

        const product = await Product.create(productData);

        res.status(201).json({
            message: "Producto creado exitosamente",
            product
        });
    } catch (error) {
        // Si hubo error y se subió imagen, eliminarla de Cloudinary
        if (req.file && req.file.cloudinary_id) {
            await cloudinary.uploader.destroy(req.file.cloudinary_id);
        }
        
        res.status(500).json({
            message: "Error al crear el producto",
            error: error.message
        });
    }
};

// Obtener todos los productos con filtros
exports.getAll = async (req, res) => {
    try {
        const {
            search,
            category,
            supplierId,
            requiresPrescription,
            isActive,
            stockStatus, // 'low', 'ok', 'high', 'out'
            page = 1,
            limit = 50
        } = req.query;

        const where = {};

        // Búsqueda por texto (nombre, SKU, barcode, genericName)
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { genericName: { [Op.iLike]: `%${search}%` } },
                { sku: { [Op.iLike]: `%${search}%` } },
                { barcode: { [Op.iLike]: `%${search}%` } },
                { laboratory: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (category) where.category = category;
        if (supplierId) where.supplierId = supplierId;
        if (requiresPrescription !== undefined) where.requiresPrescription = requiresPrescription === 'true';
        if (isActive !== undefined) where.isActive = isActive === 'true';

        // Filtro por estado de stock
        if (stockStatus) {
            switch (stockStatus) {
                case 'out':
                    where.stock = 0;
                    break;
                case 'low':
                    where.stock = { 
                        [Op.and]: [
                            { [Op.gt]: 0 },
                            { [Op.lte]: db.Sequelize.col('minStock') }
                        ]
                    };
                    break;
                case 'high':
                    where.stock = { [Op.gte]: db.Sequelize.col('maxStock') };
                    break;
                case 'ok':
                    where.stock = {
                        [Op.and]: [
                            { [Op.gt]: db.Sequelize.col('minStock') },
                            { [Op.lt]: db.Sequelize.col('maxStock') }
                        ]
                    };
                    break;
            }
        }

        const offset = (page - 1) * limit;

        const { count, rows: products } = await Product.findAndCountAll({
            where,
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Batch,
                    as: 'batches',
                    attributes: ['id', 'batchNumber', 'currentQuantity', 'expirationDate', 'status'],
                    where: { 
                        currentQuantity: { [Op.gt]: 0 }
                    },
                    required: false
                }
            ],
            order: [['name', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            products
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener los productos",
            error: error.message
        });
    }
};

// Obtener un producto por ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id, {
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'code', 'email', 'phone', 'acceptsReturns']
                },
                {
                    model: Batch,
                    as: 'batches',
                    attributes: [
                        'id', 'batchNumber', 'currentQuantity', 'initialQuantity',
                        'manufacturingDate', 'expirationDate', 'status', 'canBeSold',
                        'purchasePrice', 'salePrice', 'location'
                    ],
                    order: [['expirationDate', 'ASC']]
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener el producto",
            error: error.message
        });
    }
};

// Obtener producto por SKU
exports.getBySku = async (req, res) => {
    try {
        const { sku } = req.params;

        const product = await Product.findOne({
            where: { sku },
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'code']
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener el producto",
            error: error.message
        });
    }
};

// Obtener producto por código de barras
exports.getByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;

        const product = await Product.findOne({
            where: { barcode },
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Batch,
                    as: 'batches',
                    where: { 
                        currentQuantity: { [Op.gt]: 0 },
                        canBeSold: true,
                        status: { [Op.in]: ['active', 'near_expiry'] }
                    },
                    required: false,
                    order: [['expirationDate', 'ASC']],
                    limit: 1
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener el producto",
            error: error.message
        });
    }
};

// Actualizar un producto
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            genericName,
            description,
            category,
            subcategory,
            presentation,
            requiresPrescription,
            supplierId,
            price,
            costPrice,
            minStock,
            maxStock,
            barcode,
            laboratory,
            activeIngredient,
            sideEffects,
            contraindications,
            isActive
        } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        // Si cambia el barcode, validar que sea único
        if (barcode && barcode !== product.barcode) {
            const existingBarcode = await Product.findOne({ 
                where: { 
                    barcode,
                    id: { [Op.ne]: id }
                } 
            });
            if (existingBarcode) {
                return res.status(400).json({ message: "El código de barras ya existe" });
            }
        }

        // Si cambia el proveedor, validar que existe
        if (supplierId && supplierId !== product.supplierId) {
            const supplier = await Supplier.findByPk(supplierId);
            if (!supplier) {
                return res.status(404).json({ message: "Proveedor no encontrado" });
            }
        }

        // Preparar datos de actualización
        const updates = {};
        if (name) updates.name = name;
        if (genericName !== undefined) updates.genericName = genericName;
        if (description !== undefined) updates.description = description;
        if (category) updates.category = category;
        if (subcategory !== undefined) updates.subcategory = subcategory;
        if (presentation !== undefined) updates.presentation = presentation;
        if (requiresPrescription !== undefined) updates.requiresPrescription = requiresPrescription;
        if (supplierId) updates.supplierId = supplierId;
        if (price) updates.price = price;
        if (costPrice) updates.costPrice = costPrice;
        if (minStock !== undefined) updates.minStock = minStock;
        if (maxStock !== undefined) updates.maxStock = maxStock;
        if (barcode !== undefined) updates.barcode = barcode;
        if (laboratory !== undefined) updates.laboratory = laboratory;
        if (activeIngredient !== undefined) updates.activeIngredient = activeIngredient;
        if (sideEffects !== undefined) updates.sideEffects = sideEffects;
        if (contraindications !== undefined) updates.contraindications = contraindications;
        if (isActive !== undefined) updates.isActive = isActive;

        // Si hay nueva imagen
        if (req.file) {
            // Eliminar imagen anterior de Cloudinary si existe
            if (product.cloudinaryPublicId) {
                await cloudinary.uploader.destroy(product.cloudinaryPublicId);
            }

            // Subir nueva imagen
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'farmacia-elizabeth/products',
                transformation: [{ width: 800, height: 800, crop: 'limit' }]
            });

            updates.imageUrl = result.secure_url;
            updates.cloudinaryPublicId = result.public_id;
        }

        await product.update(updates);

        res.status(200).json({
            message: "Producto actualizado exitosamente",
            product
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar el producto",
            error: error.message
        });
    }
};

// Activar/Desactivar producto
exports.toggleActive = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        await product.update({ isActive: !product.isActive });

        res.status(200).json({
            message: `Producto ${product.isActive ? 'activado' : 'desactivado'} exitosamente`,
            product
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al cambiar estado del producto",
            error: error.message
        });
    }
};

// Eliminar un producto (soft delete)
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        // Verificar que no tenga stock
        if (product.stock > 0) {
            return res.status(400).json({
                message: "No se puede eliminar un producto con stock. Stock actual: " + product.stock
            });
        }

        // Verificar que no tenga lotes activos
        const activeBatches = await Batch.count({
            where: {
                productId: id,
                currentQuantity: { [Op.gt]: 0 }
            }
        });

        if (activeBatches > 0) {
            return res.status(400).json({
                message: `No se puede eliminar. El producto tiene ${activeBatches} lote(s) con stock`
            });
        }

        // Eliminar imagen de Cloudinary si existe
        if (product.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(product.cloudinaryPublicId);
        }

        await product.destroy();

        res.status(200).json({
            message: "Producto eliminado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar el producto",
            error: error.message
        });
    }
};

// Obtener productos con stock bajo
exports.getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: {
                stock: {
                    [Op.and]: [
                        { [Op.gt]: 0 },
                        { [Op.lte]: db.Sequelize.col('minStock') }
                    ]
                },
                isActive: true
            },
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'email', 'phone']
                }
            ],
            order: [['stock', 'ASC']]
        });

        res.status(200).json({
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener productos con stock bajo",
            error: error.message
        });
    }
};

// Obtener productos agotados
exports.getOutOfStockProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: {
                stock: 0,
                isActive: true
            },
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'email', 'phone']
                }
            ],
            order: [['name', 'ASC']]
        });

        res.status(200).json({
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener productos agotados",
            error: error.message
        });
    }
};

// Obtener estadísticas de productos
exports.getProductStats = async (req, res) => {
    try {
        const stats = {
            total: await Product.count(),
            active: await Product.count({ where: { isActive: true } }),
            inactive: await Product.count({ where: { isActive: false } }),
            withStock: await Product.count({ where: { stock: { [Op.gt]: 0 } } }),
            outOfStock: await Product.count({ where: { stock: 0 } }),
            lowStock: await Product.count({
                where: {
                    stock: {
                        [Op.and]: [
                            { [Op.gt]: 0 },
                            { [Op.lte]: db.Sequelize.col('minStock') }
                        ]
                    }
                }
            }),
            requiresPrescription: await Product.count({ where: { requiresPrescription: true } }),
            
            byCategory: await Product.findAll({
                attributes: [
                    'category',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
                ],
                group: ['category'],
                order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']]
            }),

            totalInventoryValue: await Product.sum(
                db.Sequelize.literal('stock * "costPrice"')
            ) || 0
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener estadísticas",
            error: error.message
        });
    }
};