/**
 * Modelo de Recibo de Venta (Invoice) - VERSIÓN CON DEBUG
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/invoice.js
 */

module.exports = (sequelize, DataTypes) => {
  // ✅ CRÍTICO: Acceder a Op desde sequelize ANTES de definir el modelo
  const { Op } = sequelize.Sequelize;
  
  console.log('🔧 [INVOICE MODEL] Cargando modelo Invoice...');
  console.log('🔧 [INVOICE MODEL] Op disponible:', typeof Op);

  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Numero de recibo de venta (REC-YYYYMM-000001)'
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Cliente registrado (opcional)'
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Vendedor que realiza la venta'
    },
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha de la venta'
    },
    invoiceTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Hora de la venta'
    },
    invoiceDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha y hora completa de la venta'
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
      comment: 'IVA u otros impuestos'
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia', 'credito', 'paypal', 'stripe'),
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'parcial', 'cancelado'),
      defaultValue: 'pagado'
    },
    status: {
      type: DataTypes.ENUM('completada', 'cancelada', 'devuelta', 'anulada'),
      defaultValue: 'completada'
    },
    clientName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Nombre del cliente para ventas sin registro'
    },
    clientDPI: {
      type: DataTypes.STRING(13),
      allowNull: true,
      comment: 'DPI del cliente'
    },
    clientNit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'NIT para facturacion'
    },
    sellerDPI: {
      type: DataTypes.STRING(13),
      allowNull: true,
      comment: 'DPI del vendedor'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'invoices',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['invoiceNumber'] },
      { fields: ['clientId'] },
      { fields: ['sellerId'] },
      { fields: ['invoiceDate'] },
      { fields: ['invoiceDateTime'] },
      { fields: ['invoiceTime'] },
      { fields: ['status'] },
      { fields: ['paymentMethod'] },
      { fields: ['paymentStatus'] }
    ],
    hooks: {
      beforeCreate: async (invoice, options) => {
        console.log('🔧 [INVOICE HOOK] beforeCreate ejecutándose...');
        console.log('🔧 [INVOICE HOOK] invoiceNumber actual:', invoice.invoiceNumber);
        
        const transaction = options.transaction;
        
        if (!invoice.invoiceNumber) {
          console.log('🔧 [INVOICE HOOK] Generando número de recibo...');
          
          const year = new Date().getFullYear();
          const month = String(new Date().getMonth() + 1).padStart(2, '0');
          const prefix = `REC-${year}${month}-`;
          
          console.log('🔧 [INVOICE HOOK] Prefijo:', prefix);
          console.log('🔧 [INVOICE HOOK] Op disponible en hook:', typeof Op);
          
          try {
            // Verificar que Op está definido
            if (!Op || typeof Op.like === 'undefined') {
              console.error('❌ [INVOICE HOOK] ERROR: Op no está definido correctamente');
              throw new Error('Op no disponible en el hook');
            }
            
            console.log('🔧 [INVOICE HOOK] Buscando último recibo...');
            
            const lastInvoice = await invoice.constructor.findOne({
              where: {
                invoiceNumber: {
                  [Op.like]: `${prefix}%`
                }
              },
              order: [['id', 'DESC']],
              transaction,
              lock: transaction ? transaction.LOCK.UPDATE : false
            });

            console.log('🔧 [INVOICE HOOK] Último recibo encontrado:', lastInvoice?.invoiceNumber || 'ninguno');

            let nextNumber = 1;
            if (lastInvoice && lastInvoice.invoiceNumber) {
              const parts = lastInvoice.invoiceNumber.split('-');
              if (parts.length === 3) {
                nextNumber = parseInt(parts[2]) + 1;
              }
            }

            invoice.invoiceNumber = `${prefix}${String(nextNumber).padStart(6, '0')}`;
            
            console.log('✅ [INVOICE HOOK] Número de recibo generado:', invoice.invoiceNumber);
          } catch (error) {
            console.error('❌ [INVOICE HOOK] Error generando número de recibo:', error);
            console.error('❌ [INVOICE HOOK] Error stack:', error.stack);
            throw error;
          }
        } else {
          console.log('🔧 [INVOICE HOOK] invoiceNumber ya existe:', invoice.invoiceNumber);
        }
      }
    }
  });
  
  console.log('✅ [INVOICE MODEL] Modelo Invoice cargado correctamente');

  return Invoice;
};