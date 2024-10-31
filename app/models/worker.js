module.exports = (sequelize, DataTypes) => {
  const Worker = sequelize.define('Worker', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dpi: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image: {
      type: DataTypes.BLOB('long'), // Almacenar imagen como BLOB
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users', // Nombre de la tabla de usuarios
        key: 'id'
      }
    }
  });

  Worker.associate = (models) => {
    Worker.belongsTo(models.User, {
      foreignKey: 'id',
      as: 'Users'
    });
  };

  return Worker;
};
