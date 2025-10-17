/**
 * Modelo de Recibo de Venta (Invoice) - SIN IVA OBLIGATORIO
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/invoice.js
 * 
 * CORRECCIÓN COMPLETA: 
 * - Hook beforeValidate para generar invoiceNumber
 * - Generación correcta de invoiceDate, invoiceTime e invoiceDateTime
 * - Eliminados defaultValue problemáticos
 */

module.exports = (sequelize, DataTypes) => {
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
      comment: 'Fecha de la venta (generado en hook)'
    },
    invoiceTime: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: 'Hora de la venta (generado en hook)'
    },
    invoiceDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Fecha y hora completa de la venta (generado en hook)'
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
      defaultValue: 0.00,
      comment: 'Descuento aplicado'
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
      comment: 'IVA solo para facturas fiscales (opcional)'
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
      comment: 'NIT para facturacion fiscal (opcional)'
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
      beforeValidate: async (invoice, options) => {
        // ✅ CAMBIO CRÍTICO: Mover generación a beforeValidate
        // Esto asegura que invoiceNumber, invoiceDate e invoiceTime existan ANTES de la validación
        
        const now = new Date();
        
        // ✅ CORRECCIÓN: Generar fechas y hora si no existen
        if (!invoice.invoiceDateTime) {
          invoice.invoiceDateTime = now;
        }
        
        if (!invoice.invoiceDate) {
          // Formato YYYY-MM-DD
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          invoice.invoiceDate = `${year}-${month}-${day}`;
        }
        
        if (!invoice.invoiceTime) {
          // Formato HH:MM:SS (solo la hora, sin fecha ni zona horaria)
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          invoice.invoiceTime = `${hours}:${minutes}:${seconds}`;
        }
        
        // Generar número de recibo si no existe
        if (invoice.invoiceNumber) {
          // Ya tiene número, no hacer nada más
          return;
        }

        try {
          console.log('🔧 [INVOICE] Generando invoiceNumber...');
          
          const transaction = options.transaction;
          
          // Generar prefijo con año y mes
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const prefix = `REC-${year}${month}-`;
          
          console.log('🔧 [INVOICE] Prefijo:', prefix);

          // Buscar último recibo del mes
          const { Op } = sequelize.Sequelize;
          
          const lastInvoice = await Invoice.findOne({
            where: {
              invoiceNumber: {
                [Op.like]: `${prefix}%`
              }
            },
            order: [['id', 'DESC']],
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined
          });

          console.log('🔧 [INVOICE] Último recibo:', lastInvoice?.invoiceNumber || 'ninguno');

          // Calcular siguiente número
          let nextNumber = 1;
          if (lastInvoice && lastInvoice.invoiceNumber) {
            const parts = lastInvoice.invoiceNumber.split('-');
            if (parts.length === 3) {
              nextNumber = parseInt(parts[2], 10) + 1;
            }
          }

          // Generar número completo
          invoice.invoiceNumber = `${prefix}${String(nextNumber).padStart(6, '0')}`;
          
          console.log('✅ [INVOICE] Número generado:', invoice.invoiceNumber);
          
        } catch (error) {
          console.error('❌ [INVOICE] Error generando número:', error);
          throw new Error(`Error generando número de recibo: ${error.message}`);
        }
      }
    }
  });

  return Invoice;
};