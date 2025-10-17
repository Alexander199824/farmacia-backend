require('dotenv').config();

console.log('╔════════════════════════════════════════╗');
console.log('║   VERIFICACIÓN DE VARIABLES .env      ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***oculto***' : '❌ NO DEFINIDO');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***oculto***' : '❌ NO DEFINIDO');

console.log('\n¿Las variables se leen correctamente? 🤔');