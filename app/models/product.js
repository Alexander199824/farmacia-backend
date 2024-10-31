module.exports = (sequelize, Sequelize) => {
    const Product = sequelize.define('productos', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.STRING
        },
        price: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        stock: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        supplier: {
            type: Sequelize.STRING,
            allowNull: false
        },
        image: {
            type: Sequelize.BLOB('long'), // Campo para almacenar la imagen como BLOB
            allowNull: true
        }
    });

    return Product;
};
