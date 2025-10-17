require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        port: process.env.DB_PORT,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    }
);

console.log('🔌 Intentando conectar a la base de datos...\n');
console.log('Host:', process.env.DB_HOST);
console.log('Puerto:', process.env.DB_PORT);
console.log('Base de datos:', process.env.DB_NAME);
console.log('Usuario:', process.env.DB_USER);
console.log('\n---\n');

sequelize.authenticate()
    .then(() => {
        console.log('✅ ¡CONEXIÓN EXITOSA!');
        console.log('La base de datos está accesible.\n');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ ERROR DE CONEXIÓN:');
        console.error('Código:', err.original?.code);
        console.error('Mensaje:', err.message);
        console.error('\n💡 POSIBLES SOLUCIONES:');
        console.error('1. Verifica que tu IP esté permitida en Render.com');
        console.error('2. Verifica que la base de datos esté activa (no en "Sleeping")');
        console.error('3. Verifica que las credenciales sean correctas\n');
        process.exit(1);
    });