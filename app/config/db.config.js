/**
 * Configuracion completa de base de datos con todos los modelos y relaciones
 * Autor: Alexander Echeverria
 * Ubicacion: app/config/db.config.js
 */

const env = require('./env.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(env.database, env.username, env.password, {
  host: env.host,
  dialect: env.dialect,
  port: env.port,
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
db.User = require('../models/User.js')(sequelize, Sequelize);
db.Supplier = require('../models/Supplier.js')(sequelize, Sequelize);
db.Product = require('../models/Product.js')(sequelize, Sequelize);
db.Batch = require('../models/Batch.js')(sequelize, Sequelize);
db.Sale = require('../models/Sale.js')(sequelize, Sequelize);
db.SaleDetail = require('../models/SaleDetail.js')(sequelize, Sequelize);
db.Purchase = require('../models/Purchase.js')(sequelize, Sequelize);
db.PurchaseDetail = require('../models/PurchaseDetail.js')(sequelize, Sequelize);
db.InventoryMovement = require('../models/InventoryMovement.js')(sequelize, Sequelize);
db.AuditLog = require('../models/AuditLog.js')(sequelize, Sequelize);

// ========== RELACIONES DE PROVEEDORES ==========

// Proveedor tiene muchos Productos
db.Supplier.hasMany(db.Product, { 
  foreignKey: 'supplierId', 
  as: 'products',
  onDelete: 'RESTRICT'
});
db.Product.belongsTo(db.Supplier, { 
  foreignKey: 'supplierId', 
  as: 'supplier' 
});

// Proveedor tiene muchos Lotes
db.Supplier.hasMany(db.Batch, { 
  foreignKey: 'supplierId', 
  as: 'batches',
  onDelete: 'RESTRICT'
});
db.Batch.belongsTo(db.Supplier, { 
  foreignKey: 'supplierId', 
  as: 'supplier' 
});

// Proveedor tiene muchas Compras
db.Supplier.hasMany(db.Purchase, { 
  foreignKey: 'supplierId', 
  as: 'purchases',
  onDelete: 'RESTRICT'
});
db.Purchase.belongsTo(db.Supplier, { 
  foreignKey: 'supplierId', 
  as: 'supplier' 
});

// ========== RELACIONES DE PRODUCTOS Y LOTES ==========

// Producto tiene muchos Lotes
db.Product.hasMany(db.Batch, { 
  foreignKey: 'productId', 
  as: 'batches',
  onDelete: 'CASCADE'
});
db.Batch.belongsTo(db.Product, { 
  foreignKey: 'productId', 
  as: 'product' 
});

// ========== RELACIONES DE VENTAS ==========

// Usuario (Cliente) tiene muchas Ventas como cliente
db.User.hasMany(db.Sale, { 
  foreignKey: 'clientId', 
  as: 'purchases'
});
db.Sale.belongsTo(db.User, { 
  foreignKey: 'clientId', 
  as: 'client' 
});

// Usuario (Vendedor) tiene muchas Ventas como vendedor
db.User.hasMany(db.Sale, { 
  foreignKey: 'sellerId', 
  as: 'sales',
  onDelete: 'RESTRICT'
});
db.Sale.belongsTo(db.User, { 
  foreignKey: 'sellerId', 
  as: 'seller' 
});

// Venta tiene muchos Detalles de Venta
db.Sale.hasMany(db.SaleDetail, { 
  foreignKey: 'saleId', 
  as: 'details',
  onDelete: 'CASCADE'
});
db.SaleDetail.belongsTo(db.Sale, { 
  foreignKey: 'saleId', 
  as: 'sale' 
});

// Producto tiene muchos Detalles de Venta
db.Product.hasMany(db.SaleDetail, { 
  foreignKey: 'productId', 
  as: 'saleDetails'
});
db.SaleDetail.belongsTo(db.Product, { 
  foreignKey: 'productId', 
  as: 'product' 
});

// Lote tiene muchos Detalles de Venta
db.Batch.hasMany(db.SaleDetail, { 
  foreignKey: 'batchId', 
  as: 'saleDetails'
});
db.SaleDetail.belongsTo(db.Batch, { 
  foreignKey: 'batchId', 
  as: 'batch' 
});

// ========== RELACIONES DE COMPRAS ==========

// Usuario tiene muchas Compras realizadas
db.User.hasMany(db.Purchase, { 
  foreignKey: 'userId', 
  as: 'purchasesMade',
  onDelete: 'RESTRICT'
});
db.Purchase.belongsTo(db.User, { 
  foreignKey: 'userId', 
  as: 'buyer' 
});

// Compra tiene muchos Detalles de Compra
db.Purchase.hasMany(db.PurchaseDetail, { 
  foreignKey: 'purchaseId', 
  as: 'details',
  onDelete: 'CASCADE'
});
db.PurchaseDetail.belongsTo(db.Purchase, { 
  foreignKey: 'purchaseId', 
  as: 'purchase' 
});

// Producto tiene muchos Detalles de Compra
db.Product.hasMany(db.PurchaseDetail, { 
  foreignKey: 'productId', 
  as: 'purchaseDetails'
});
db.PurchaseDetail.belongsTo(db.Product, { 
  foreignKey: 'productId', 
  as: 'product' 
});

// Lote tiene muchos Detalles de Compra
db.Batch.hasMany(db.PurchaseDetail, { 
  foreignKey: 'batchId', 
  as: 'purchaseDetails'
});
db.PurchaseDetail.belongsTo(db.Batch, { 
  foreignKey: 'batchId', 
  as: 'batch' 
});

// ========== RELACIONES DE MOVIMIENTOS DE INVENTARIO ==========

// Producto tiene muchos Movimientos
db.Product.hasMany(db.InventoryMovement, { 
  foreignKey: 'productId', 
  as: 'movements',
  onDelete: 'RESTRICT'
});
db.InventoryMovement.belongsTo(db.Product, { 
  foreignKey: 'productId', 
  as: 'product' 
});

// Lote tiene muchos Movimientos
db.Batch.hasMany(db.InventoryMovement, { 
  foreignKey: 'batchId', 
  as: 'movements'
});
db.InventoryMovement.belongsTo(db.Batch, { 
  foreignKey: 'batchId', 
  as: 'batch' 
});

// Usuario tiene muchos Movimientos realizados
db.User.hasMany(db.InventoryMovement, { 
  foreignKey: 'userId', 
  as: 'movements',
  onDelete: 'RESTRICT'
});
db.InventoryMovement.belongsTo(db.User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// ========== RELACIONES DE AUDITORIA ==========

// Usuario tiene muchos Logs de Auditoria
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
    console.log('✓ Conexion a base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('✗ Error al conectar con la base de datos:', error.message);
    return false;
  }
};

db.syncDatabase = async (force = false) => {
  try {
    if (force) {
      console.log('⚠ ADVERTENCIA: Se eliminaran todas las tablas y datos');
      await sequelize.sync({ force: true });
      console.log('✓ Base de datos sincronizada (force: true)');
    } else {
      await sequelize.sync({ alter: true });
      console.log('✓ Base de datos sincronizada (alter: true)');
    }
    return true;
  } catch (error) {
    console.error('✗ Error al sincronizar base de datos:', error.message);
    return false;
  }
};

module.exports = db;