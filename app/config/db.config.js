/**
 * Configuracion completa de base de datos - FINAL CORREGIDO
 * Autor: Alexander Echeverria
 * Ubicacion: app/config/db.config.js
 */

const env = require('./env.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(env.database, env.username, env.password, {
  host: env.host,
  dialect: env.dialect,
  port: parseInt(process.env.DB_PORT) || 5432,
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
  logging: env.nodeEnv === 'development' ? console.log : false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ========== IMPORTAR MODELOS ==========
db.User = require('../models/user.js')(sequelize, Sequelize);
db.Supplier = require('../models/Supplier.js')(sequelize, Sequelize);
db.SupplierPayment = require('../models/SupplierPayment.js')(sequelize, Sequelize);
db.Product = require('../models/product.js')(sequelize, Sequelize);
db.Batch = require('../models/batch.js')(sequelize, Sequelize);
db.Invoice = require('../models/invoice.js')(sequelize, Sequelize);
db.InvoiceItem = require('../models/invoiceItem.js')(sequelize, Sequelize);
db.InventoryMovement = require('../models/inventoryMovement.js')(sequelize, Sequelize);
db.AuditLog = require('../models/auditLog.js')(sequelize, Sequelize);
db.Receipt = require('../models/receipt.js')(sequelize, Sequelize);
db.Payment = require('../models/payment.js')(sequelize, Sequelize);

// ========== RELACIONES DE PROVEEDORES ==========

// Supplier -> Products
db.Supplier.hasMany(db.Product, { 
  foreignKey: 'supplierId', 
  as: 'products',
  onDelete: 'RESTRICT'
});
db.Product.belongsTo(db.Supplier, { 
  foreignKey: 'supplierId', 
  as: 'supplier' 
});

// Supplier -> Batches
db.Supplier.hasMany(db.Batch, { 
  foreignKey: 'supplierId', 
  as: 'batches',
  onDelete: 'RESTRICT'
});
db.Batch.belongsTo(db.Supplier, { 
  foreignKey: 'supplierId', 
  as: 'supplier' 
});

// Supplier -> SupplierPayments
db.Supplier.hasMany(db.SupplierPayment, { 
  foreignKey: 'supplierId', 
  as: 'payments',
  onDelete: 'CASCADE'
});
db.SupplierPayment.belongsTo(db.Supplier, { 
  foreignKey: 'supplierId', 
  as: 'supplier' 
});

// ========== RELACIONES DE PRODUCTOS Y LOTES ==========

db.Product.hasMany(db.Batch, { 
  foreignKey: 'productId', 
  as: 'batches',
  onDelete: 'CASCADE'
});
db.Batch.belongsTo(db.Product, { 
  foreignKey: 'productId', 
  as: 'product' 
});

// ========== RELACIONES DE FACTURAS (RECIBOS DE VENTA) ==========

// User (Cliente) -> Invoices
db.User.hasMany(db.Invoice, { 
  foreignKey: 'clientId', 
  as: 'invoicesAsClient'
});
db.Invoice.belongsTo(db.User, { 
  foreignKey: 'clientId', 
  as: 'client' 
});

// User (Vendedor) -> Invoices
db.User.hasMany(db.Invoice, { 
  foreignKey: 'sellerId', 
  as: 'invoicesAsSeller',
  onDelete: 'RESTRICT'
});
db.Invoice.belongsTo(db.User, { 
  foreignKey: 'sellerId', 
  as: 'seller' 
});

// Invoice -> InvoiceItems
db.Invoice.hasMany(db.InvoiceItem, { 
  foreignKey: 'invoiceId', 
  as: 'items',
  onDelete: 'CASCADE'
});
db.InvoiceItem.belongsTo(db.Invoice, { 
  foreignKey: 'invoiceId', 
  as: 'invoice' 
});

// Product -> InvoiceItems
db.Product.hasMany(db.InvoiceItem, { 
  foreignKey: 'productId', 
  as: 'invoiceItems'
});
db.InvoiceItem.belongsTo(db.Product, { 
  foreignKey: 'productId', 
  as: 'product' 
});

// Batch -> InvoiceItems
db.Batch.hasMany(db.InvoiceItem, { 
  foreignKey: 'batchId', 
  as: 'invoiceItems'
});
db.InvoiceItem.belongsTo(db.Batch, { 
  foreignKey: 'batchId', 
  as: 'batch' 
});

// ========== RELACIONES DE MOVIMIENTOS DE INVENTARIO ==========

// Product -> InventoryMovements
db.Product.hasMany(db.InventoryMovement, { 
  foreignKey: 'productId', 
  as: 'movements',
  onDelete: 'RESTRICT'
});
db.InventoryMovement.belongsTo(db.Product, { 
  foreignKey: 'productId', 
  as: 'product' 
});

// Batch -> InventoryMovements
db.Batch.hasMany(db.InventoryMovement, { 
  foreignKey: 'batchId', 
  as: 'movements'
});
db.InventoryMovement.belongsTo(db.Batch, { 
  foreignKey: 'batchId', 
  as: 'batch' 
});

// User (quien realizó el movimiento) -> InventoryMovements
db.User.hasMany(db.InventoryMovement, { 
  foreignKey: 'userId', 
  as: 'movementsCreated',
  onDelete: 'RESTRICT'
});
db.InventoryMovement.belongsTo(db.User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// User (quien aprobó el movimiento) -> InventoryMovements
db.User.hasMany(db.InventoryMovement, { 
  foreignKey: 'approvedBy', 
  as: 'movementsApproved'
});
db.InventoryMovement.belongsTo(db.User, { 
  foreignKey: 'approvedBy', 
  as: 'approver' 
});

// ========== RELACIONES DE RECIBOS (COMPROBANTES) ==========

// Invoice -> Receipts
db.Invoice.hasMany(db.Receipt, { 
  foreignKey: 'invoiceId', 
  as: 'receipts',
  onDelete: 'CASCADE'
});
db.Receipt.belongsTo(db.Invoice, { 
  foreignKey: 'invoiceId', 
  as: 'invoice' 
});

// User (Cliente) -> Receipts
db.User.hasMany(db.Receipt, { 
  foreignKey: 'clientId', 
  as: 'receipts'
});
db.Receipt.belongsTo(db.User, { 
  foreignKey: 'clientId', 
  as: 'client' 
});

// Payment -> Receipts
db.Payment.hasMany(db.Receipt, { 
  foreignKey: 'paymentId', 
  as: 'receipts'
});
db.Receipt.belongsTo(db.Payment, { 
  foreignKey: 'paymentId', 
  as: 'payment' 
});

// ========== RELACIONES DE AUDITORIA ==========

db.User.hasMany(db.AuditLog, { 
  foreignKey: 'userId', 
  as: 'auditLogs'
});
db.AuditLog.belongsTo(db.User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// ========== FUNCIONES AUXILIARES ==========

db.testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexion a base de datos establecida');
    return true;
  } catch (error) {
    console.error('✗ Error conectando:', error.message);
    return false;
  }
};

db.syncDatabase = async (force = false) => {
  try {
    if (force) {
      console.log('⚠ ADVERTENCIA: Eliminando todas las tablas');
      await sequelize.sync({ force: true });
      console.log('✓ Base de datos sincronizada (force)');
    } else {
      await sequelize.sync({ alter: true });
      console.log('✓ Base de datos sincronizada (alter)');
    }
    return true;
  } catch (error) {
    console.error('✗ Error sincronizando:', error.message);
    return false;
  }
};

module.exports = db;