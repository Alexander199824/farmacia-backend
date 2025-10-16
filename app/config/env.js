/**
 * Configuracion de variables de entorno con Cloudinary
 * Autor: Alexander Echeverria
 * Ubicacion: app/config/env.js
 */

require('dotenv').config();

const config = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'postgres',
  port: parseInt(process.env.DB_PORT) || 5432,
  
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 5,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000
  },
  
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'farmacia-elizabeth'
  },
  
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  alertDaysBeforeExpiry: parseInt(process.env.ALERT_DAYS_BEFORE_EXPIRY) || 30,
  lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD) || 10,
  
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM
  },
  
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

const requiredVars = [
  'DB_NAME', 
  'DB_USER', 
  'DB_PASSWORD', 
  'DB_HOST', 
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('ERROR: Variables de entorno faltantes:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nConfigura estas variables en tu archivo .env');
  process.exit(1);
}

module.exports = config;