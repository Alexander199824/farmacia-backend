/**
 * @author Alexander Echeverria
 * @file app/config/db.config.js
 * @description Configuración de base de datos con todos los modelos del sistema
 * @location app/config/db.config.js
 * 
 * Configura:
 * - Conexión a PostgreSQL
 * - Pool de conexiones
 * - Modelos principales
 * - Nuevos modelos: Batch, Receipt, InventoryMovement, AuditLog
 * - Relaciones entre modelos
 */

const env = require('./env.js');
const Sequelize = require('sequelize');

// Crear instancia de Sequelize
const sequelize = new Sequelize(env.database, env.username, env.password, {
  host: env.host,
  dialect: env.dialect,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: env.pool.max,
    min: env.pool.min,
    acquire: env.pool.acquire,
    idle: env.pool.idle,
  },
  logging: false // Cambiar a console.log para debugging
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ========== MODELOS PRINCIPALES ==========
db.Product = require('../models/product.js')(sequelize, Sequelize);
db.User = require('../models/user.js')(sequelize, Sequelize);
db.Worker = require('../models/worker.js')(sequelize, Sequelize);
db.Client = require('../models/client.js')(sequelize, Sequelize);
db.Invoice = require('../models/invoice.js')(sequelize, Sequelize);
db.InvoiceItem = require('../models/invoiceItem.js')(sequelize, Sequelize);
db.Payment = require('../models/payment.js')(sequelize, Sequelize);

// ========== NUEVOS MODELOS ==========
db.Batch = require('../models/batch.js')(sequelize, Sequelize);
db.Receipt = require('../models/receipt.js')(sequelize, Sequelize);
db.InventoryMovement = require('../models/inventoryMovement.js')(sequelize, Sequelize);
db.AuditLog = require('../models/auditLog.js')(sequelize, Sequelize);

// ========== RELACIONES EXISTENTES ==========
// Facturas e Items
db.Invoice.hasMany(db.InvoiceItem, { as: 'items', foreignKey: 'invoiceId' });
db.InvoiceItem.belongsTo(db.Invoice, { foreignKey: 'invoiceId' });
db.InvoiceItem.belongsTo(db.Product, { foreignKey: 'productId' });

// Usuarios
db.Worker.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.Client.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// ========== NUEVAS RELACIONES ==========

// Lotes (Batches)
db.Product.hasMany(db.Batch, { 
    foreignKey: 'productId', 
    as: 'batches' 
});
db.Batch.belongsTo(db.Product, { 
    foreignKey: 'productId', 
    as: 'product' 
});

// Recibos (Receipts)
db.Invoice.hasMany(db.Receipt, { 
    foreignKey: 'invoiceId', 
    as: 'receipts' 
});
db.Receipt.belongsTo(db.Invoice, { 
    foreignKey: 'invoiceId', 
    as: 'invoice' 
});

db.Client.hasMany(db.Receipt, { 
    foreignKey: 'clientId', 
    as: 'receipts' 
});
db.Receipt.belongsTo(db.Client, { 
    foreignKey: 'clientId', 
    as: 'client' 
});

db.Payment.hasMany(db.Receipt, { 
    foreignKey: 'paymentId', 
    as: 'receipts' 
});
db.Receipt.belongsTo(db.Payment, { 
    foreignKey: 'paymentId', 
    as: 'payment' 
});

// Movimientos de Inventario
db.Product.hasMany(db.InventoryMovement, { 
    foreignKey: 'productId', 
    as: 'movements' 
});
db.InventoryMovement.belongsTo(db.Product, { 
    foreignKey: 'productId', 
    as: 'product' 
});

db.Batch.hasMany(db.InventoryMovement, { 
    foreignKey: 'batchId', 
    as: 'movements' 
});
db.InventoryMovement.belongsTo(db.Batch, { 
    foreignKey: 'batchId', 
    as: 'batch' 
});

db.User.hasMany(db.InventoryMovement, { 
    foreignKey: 'userId', 
    as: 'movements' 
});
db.InventoryMovement.belongsTo(db.User, { 
    foreignKey: 'userId', 
    as: 'user' 
});

db.User.hasMany(db.InventoryMovement, { 
    foreignKey: 'approvedBy', 
    as: 'approvedMovements' 
});
db.InventoryMovement.belongsTo(db.User, { 
    foreignKey: 'approvedBy', 
    as: 'approver' 
});

// Auditoría
db.User.hasMany(db.AuditLog, { 
    foreignKey: 'userId', 
    as: 'auditLogs' 
});
db.AuditLog.belongsTo(db.User, { 
    foreignKey: 'userId', 
    as: 'user' 
});

// Relación Cliente-Factura
db.Client.hasMany(db.Invoice, {
    foreignKey: 'clientId',
    as: 'invoices'
});
db.Invoice.belongsTo(db.Client, {
    foreignKey: 'clientId',
    as: 'client'
});

module.exports = db;