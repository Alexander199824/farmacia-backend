/**
 * @author Alexander Echeverria
 * @file app/controllers/supplier.controller.js
 * @description Controlador de Proveedores
 * @location app/controllers/supplier.controller.js
 * 
 * Funcionalidades:
 * - CRUD completo de proveedores
 * - Gestión de políticas de devolución
 * - Gestión de deuda y pagos
 * - Historial de transacciones
 * - Productos por proveedor
 * - Estadísticas de compras
 */

const db = require('../config/db.config');
const Supplier = db.Supplier;
const Product = db.Product;
const Batch = db.Batch;
const Purchase = db.Purchase;
const SupplierPayment = db.SupplierPayment;
const { Op } = db.Sequelize;

// ========== CREAR PROVEEDOR ==========

exports.createSupplier = async (req, res) => {
    try {
        const {
            code,
            name,
            contactName,
            email,
            phone,
            alternativePhone,
            address,
            nit,
            acceptsReturns = false,
            returnPolicyMonthsBefore,
            returnPolicyMonthsAfter,
            returnPolicyConditions,
            paymentTerms,
            creditLimit = 0
        } = req.body;

        // Validar campos obligatorios
        if (!code || !name || !email || !phone) {
            return res.status(400).json({
                message: "Código, nombre, email y teléfono son obligatorios"
            });
        }

        // Validar código único
        const existingCode = await Supplier.findOne({ where: { code } });
        if (existingCode) {
            return res.status(400).json({
                message: "El código del proveedor ya existe"
            });
        }

        // Validar email único
        const existingEmail = await Supplier.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({
                message: "El email ya está registrado para otro proveedor"
            });
        }

        // Validar NIT único (si se proporciona)
        if (nit) {
            const existingNit = await Supplier.findOne({ where: { nit } });
            if (existingNit) {
                return res.status(400).json({
                    message: "El NIT ya está registrado para otro proveedor"
                });
            }
        }

        // Crear proveedor
        const supplier = await Supplier.create({
            code,
            name,
            contactName,
            email,
            phone,
            alternativePhone,
            address,
            nit,
            acceptsReturns,
            returnPolicyMonthsBefore,
            returnPolicyMonthsAfter,
            returnPolicyConditions,
            paymentTerms,
            creditLimit,
            currentDebt: 0,
            isActive: true
        });

        res.status(201).json({
            message: "Proveedor creado exitosamente",
            supplier
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al crear proveedor",
            error: error.message
        });
    }
};

// ========== OBTENER PROVEEDORES ==========

// Obtener todos los proveedores con filtros
exports.getAllSuppliers = async (req, res) => {
    try {
        const {
            search,
            isActive,
            acceptsReturns,
            hasDebt,
            page = 1,
            limit = 50
        } = req.query;

        const where = {};

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } },
                { contactName: { [Op.iLike]: `%${search}%` } },
                { nit: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (isActive !== undefined) where.isActive = isActive === 'true';
        if (acceptsReturns !== undefined) where.acceptsReturns = acceptsReturns === 'true';
        if (hasDebt === 'true') where.currentDebt = { [Op.gt]: 0 };

        const offset = (page - 1) * limit;

        const { count, rows: suppliers } = await Supplier.findAndCountAll({
            where,
            include: [
                {
                    model: Product,
                    as: 'products',
                    attributes: ['id', 'name', 'sku'],
                    required: false,
                    limit: 5 // Solo mostrar algunos productos en el listado
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
            suppliers
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener proveedores",
            error: error.message
        });
    }
};

// Obtener proveedor por ID
exports.getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;

        const supplier = await Supplier.findByPk(id, {
            include: [
                {
                    model: Product,
                    as: 'products',
                    attributes: ['id', 'name', 'sku', 'stock', 'price']
                },
                {
                    model: Batch,
                    as: 'batches',
                    where: { currentQuantity: { [Op.gt]: 0 } },
                    required: false,
                    attributes: ['id', 'batchNumber', 'currentQuantity', 'expirationDate'],
                    limit: 10
                },
                {
                    model: SupplierPayment,
                    as: 'payments',
                    required: false,
                    order: [['paymentDate', 'DESC']],
                    limit: 10
                }
            ]
        });

        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener proveedor",
            error: error.message
        });
    }
};

// Obtener proveedor por código
exports.getSupplierByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const supplier = await Supplier.findOne({
            where: { code },
            include: [
                {
                    model: Product,
                    as: 'products',
                    attributes: ['id', 'name', 'sku']
                }
            ]
        });

        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener proveedor",
            error: error.message
        });
    }
};

// ========== ACTUALIZAR PROVEEDOR ==========

exports.updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            contactName,
            email,
            phone,
            alternativePhone,
            address,
            nit,
            acceptsReturns,
            returnPolicyMonthsBefore,
            returnPolicyMonthsAfter,
            returnPolicyConditions,
            paymentTerms,
            creditLimit,
            isActive
        } = req.body;

        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        // Validar email único (si cambia)
        if (email && email !== supplier.email) {
            const existingEmail = await Supplier.findOne({
                where: {
                    email,
                    id: { [Op.ne]: id }
                }
            });
            if (existingEmail) {
                return res.status(400).json({
                    message: "El email ya está en uso por otro proveedor"
                });
            }
        }

        // Validar NIT único (si cambia)
        if (nit && nit !== supplier.nit) {
            const existingNit = await Supplier.findOne({
                where: {
                    nit,
                    id: { [Op.ne]: id }
                }
            });
            if (existingNit) {
                return res.status(400).json({
                    message: "El NIT ya está en uso por otro proveedor"
                });
            }
        }

        // Preparar actualizaciones
        const updates = {};
        if (name) updates.name = name;
        if (contactName !== undefined) updates.contactName = contactName;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;
        if (alternativePhone !== undefined) updates.alternativePhone = alternativePhone;
        if (address !== undefined) updates.address = address;
        if (nit !== undefined) updates.nit = nit;
        if (acceptsReturns !== undefined) updates.acceptsReturns = acceptsReturns;
        if (returnPolicyMonthsBefore !== undefined) updates.returnPolicyMonthsBefore = returnPolicyMonthsBefore;
        if (returnPolicyMonthsAfter !== undefined) updates.returnPolicyMonthsAfter = returnPolicyMonthsAfter;
        if (returnPolicyConditions !== undefined) updates.returnPolicyConditions = returnPolicyConditions;
        if (paymentTerms !== undefined) updates.paymentTerms = paymentTerms;
        if (creditLimit !== undefined) updates.creditLimit = creditLimit;
        if (isActive !== undefined) updates.isActive = isActive;

        await supplier.update(updates);

        res.status(200).json({
            message: "Proveedor actualizado exitosamente",
            supplier
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar proveedor",
            error: error.message
        });
    }
};

// ========== ACTIVAR/DESACTIVAR PROVEEDOR ==========

exports.toggleActive = async (req, res) => {
    try {
        const { id } = req.params;

        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        await supplier.update({ isActive: !supplier.isActive });

        res.status(200).json({
            message: `Proveedor ${supplier.isActive ? 'activado' : 'desactivado'} exitosamente`,
            supplier: {
                id: supplier.id,
                name: supplier.name,
                isActive: supplier.isActive
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al cambiar estado del proveedor",
            error: error.message
        });
    }
};

// ========== ELIMINAR PROVEEDOR ==========

exports.deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        // Verificar que no tenga deuda pendiente
        if (supplier.currentDebt > 0) {
            return res.status(400).json({
                message: `No se puede eliminar el proveedor. Tiene deuda pendiente de Q${supplier.currentDebt}`
            });
        }

        // Verificar que no tenga productos activos
        const activeProducts = await Product.count({
            where: {
                supplierId: id,
                isActive: true
            }
        });

        if (activeProducts > 0) {
            return res.status(400).json({
                message: `No se puede eliminar el proveedor. Tiene ${activeProducts} producto(s) activo(s) asociado(s)`
            });
        }

        // Verificar que no tenga lotes con stock
        const activeBatches = await Batch.count({
            where: {
                supplierId: id,
                currentQuantity: { [Op.gt]: 0 }
            }
        });

        if (activeBatches > 0) {
            return res.status(400).json({
                message: `No se puede eliminar el proveedor. Tiene ${activeBatches} lote(s) con stock disponible`
            });
        }

        await supplier.destroy();

        res.status(200).json({
            message: "Proveedor eliminado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar proveedor",
            error: error.message
        });
    }
};

// ========== GESTIÓN DE DEUDA ==========

// Aumentar deuda (al crear compra a crédito)
exports.increaseDebt = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reference, notes } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "El monto debe ser mayor a 0"
            });
        }

        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        // Verificar límite de crédito
        const newDebt = parseFloat(supplier.currentDebt) + parseFloat(amount);
        if (supplier.creditLimit > 0 && newDebt > supplier.creditLimit) {
            return res.status(400).json({
                message: `Límite de crédito excedido. Límite: Q${supplier.creditLimit}, Nueva deuda sería: Q${newDebt}`
            });
        }

        // Aumentar deuda
        await supplier.increment('currentDebt', { by: amount });

        res.status(200).json({
            message: "Deuda aumentada exitosamente",
            supplier: {
                id: supplier.id,
                name: supplier.name,
                previousDebt: supplier.currentDebt,
                amountAdded: amount,
                currentDebt: newDebt,
                reference,
                notes
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al aumentar deuda",
            error: error.message
        });
    }
};

// Registrar pago a proveedor
exports.registerPayment = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const {
            amount,
            paymentMethod,
            referenceNumber,
            notes
        } = req.body;

        if (!amount || amount <= 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: "El monto debe ser mayor a 0"
            });
        }

        const supplier = await Supplier.findByPk(id, { transaction });
        if (!supplier) {
            await transaction.rollback();
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        if (supplier.currentDebt === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: "El proveedor no tiene deuda pendiente"
            });
        }

        if (parseFloat(amount) > parseFloat(supplier.currentDebt)) {
            await transaction.rollback();
            return res.status(400).json({
                message: `El monto a pagar (Q${amount}) excede la deuda actual (Q${supplier.currentDebt})`
            });
        }

        const previousDebt = parseFloat(supplier.currentDebt);
        const newDebt = previousDebt - parseFloat(amount);

        // Reducir deuda
        await supplier.update(
            { currentDebt: newDebt },
            { transaction }
        );

        // Registrar pago
        const payment = await SupplierPayment.create({
            supplierId: id,
            amount: parseFloat(amount),
            paymentMethod,
            referenceNumber,
            balanceBefore: previousDebt,
            balanceAfter: newDebt,
            notes
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: "Pago registrado exitosamente",
            payment,
            supplier: {
                id: supplier.id,
                name: supplier.name,
                previousDebt,
                amountPaid: amount,
                currentDebt: newDebt
            }
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            message: "Error al registrar pago",
            error: error.message
        });
    }
};

// Obtener historial de pagos a proveedor
exports.getPaymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20 } = req.query;

        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        const payments = await SupplierPayment.findAll({
            where: { supplierId: id },
            order: [['paymentDate', 'DESC']],
            limit: parseInt(limit)
        });

        res.status(200).json({
            supplier: {
                id: supplier.id,
                name: supplier.name,
                currentDebt: supplier.currentDebt
            },
            payments
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener historial de pagos",
            error: error.message
        });
    }
};

// ========== PRODUCTOS Y COMPRAS ==========

// Obtener productos de un proveedor
exports.getSupplierProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.query;

        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        const where = { supplierId: id };
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const products = await Product.findAll({
            where,
            include: [
                {
                    model: Batch,
                    as: 'batches',
                    where: { currentQuantity: { [Op.gt]: 0 } },
                    required: false,
                    attributes: ['id', 'batchNumber', 'currentQuantity', 'expirationDate']
                }
            ],
            order: [['name', 'ASC']]
        });

        res.status(200).json({
            supplier: {
                id: supplier.id,
                name: supplier.name
            },
            totalProducts: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener productos del proveedor",
            error: error.message
        });
    }
};

// Obtener lotes de un proveedor
exports.getSupplierBatches = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        const where = { supplierId: id };
        if (status) where.status = status;

        const batches = await Batch.findAll({
            where,
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku']
                }
            ],
            order: [['expirationDate', 'ASC']]
        });

        res.status(200).json({
            supplier: {
                id: supplier.id,
                name: supplier.name
            },
            totalBatches: batches.length,
            batches
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener lotes del proveedor",
            error: error.message
        });
    }
};

// ========== ESTADÍSTICAS ==========

exports.getSupplierStats = async (req, res) => {
    try {
        const stats = {
            total: await Supplier.count(),
            active: await Supplier.count({ where: { isActive: true } }),
            inactive: await Supplier.count({ where: { isActive: false } }),
            
            acceptReturns: await Supplier.count({ where: { acceptsReturns: true } }),
            
            withDebt: await Supplier.count({
                where: { currentDebt: { [Op.gt]: 0 } }
            }),

            totalDebt: await Supplier.sum('currentDebt') || 0,

            averageDebt: await Supplier.findOne({
                where: { currentDebt: { [Op.gt]: 0 } },
                attributes: [
                    [db.Sequelize.fn('AVG', db.Sequelize.col('currentDebt')), 'average']
                ]
            }),

            topByDebt: await Supplier.findAll({
                where: { currentDebt: { [Op.gt]: 0 } },
                order: [['currentDebt', 'DESC']],
                limit: 5,
                attributes: ['id', 'name', 'code', 'currentDebt']
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

// Estadísticas de un proveedor específico
exports.getSupplierDetailedStats = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.receiptDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const stats = {
            supplier: {
                id: supplier.id,
                name: supplier.name,
                code: supplier.code,
                currentDebt: supplier.currentDebt
            },

            products: {
                total: await Product.count({ where: { supplierId: id } }),
                active: await Product.count({
                    where: { supplierId: id, isActive: true }
                })
            },

            batches: {
                total: await Batch.count({ where: { supplierId: id } }),
                active: await Batch.count({
                    where: {
                        supplierId: id,
                        status: 'active'
                    }
                }),
                expiring: await Batch.count({
                    where: {
                        supplierId: id,
                        status: 'near_expiry'
                    }
                }),
                expired: await Batch.count({
                    where: {
                        supplierId: id,
                        status: 'expired'
                    }
                })
            },

            inventory: {
                totalValue: await Batch.sum(
                    db.Sequelize.literal('currentQuantity * "purchasePrice"'),
                    {
                        where: {
                            supplierId: id,
                            currentQuantity: { [Op.gt]: 0 }
                        }
                    }
                ) || 0
            },

            payments: {
                count: await SupplierPayment.count({ where: { supplierId: id } }),
                total: await SupplierPayment.sum('amount', {
                    where: { supplierId: id }
                }) || 0
            }
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener estadísticas del proveedor",
            error: error.message
        });
    }
};