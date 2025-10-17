console.log('════════════════════════════════════════');
console.log('TEST 1: Variables ANTES de cargar módulos');
console.log('════════════════════════════════════════\n');

require('dotenv').config();

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('');

console.log('════════════════════════════════════════');
console.log('TEST 2: Variables desde env.js');
console.log('════════════════════════════════════════\n');

const env = require('./app/config/env');

console.log('host:', env.host);
console.log('port:', env.port);
console.log('database:', env.database);
console.log('');

console.log('════════════════════════════════════════');
console.log('TEST 3: Configuración de Sequelize');
console.log('════════════════════════════════════════\n');

const db = require('./app/config/db.config');

console.log('sequelize.config.host:', db.sequelize.config.host);
console.log('sequelize.config.port:', db.sequelize.config.port);
console.log('sequelize.config.database:', db.sequelize.config.database);
console.log('');

console.log('════════════════════════════════════════');
console.log('¿Todos los valores son correctos?');
console.log('Deberían ser:');
console.log('  host: dpg-d3ou8c1r0fns73dsct10-a.oregon-postgres.render.com');
console.log('  port: 5432');
console.log('  database: farmacia_elizabeth_n9uq');
console.log('════════════════════════════════════════');