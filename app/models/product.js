/**
 * Modelo de Producto con imagenes en Cloudinary
 * Autor: Alexander Echeverria
 * Ubicacion: app/models/Product.js
 */

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    genericName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM(
        'medicamento',
        'suplemento',
        'cuidado_personal',
        'equipo_medico',
        'cosmetico',
        'higiene',
        'bebe',
        'vitaminas',
        'primeros_auxilios',
        'otros'
      ),
      defaultValue: 'medicamento'
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    presentation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    requiresPrescription: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    minStock: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    maxStock: {
      type: DataTypes.INTEGER,
      defaultValue: 500
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL de Cloudinary'
    },
    cloudinaryPublicId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Public ID de Cloudinary'
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    laboratory: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    activeIngredient: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sideEffects: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contraindications: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'products',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['sku'] },
      { unique: true, fields: ['barcode'] },
      { fields: ['supplierId'] },
      { fields: ['category'] },
      { fields: ['isActive'] }
    ]
  });

  return Product;
};