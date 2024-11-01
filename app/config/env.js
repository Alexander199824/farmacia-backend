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
  jwtSecret: 'mi_secreto_super_seguro',
  stripeSecretKey: 'sk_test_51Q9AMkB3EtWqqOZ24k1VyZOOgpCNnVY0CunpMiDNtdS9auObuqik24wzWMIJd09gWmvqSgfs55j1A8MPXtCiBjEf00zin7p46b' // Reemplaza con tu clave de Stripe
};

module.exports = env;
