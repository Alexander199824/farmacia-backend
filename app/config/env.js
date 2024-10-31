const env = {
  database: 'ejerciciousalama',
  username: 'ejerciciousalama_user',
  password: '3tFkTzNfRX3YA0vUFGEFA3BltC6GFlTu',
  host: 'dpg-crvg8b88fa8c7399vm5g-a.oregon-postgres.render.com',
  dialect: 'postgres',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  jwtSecret: 'mi_secreto_super_seguro' 
};

module.exports = env;
