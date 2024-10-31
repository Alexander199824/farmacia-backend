// config/multerConfig.js
const multer = require('multer');
const storage = multer.memoryStorage(); // Almacena el archivo en memoria para acceso directo
const upload = multer({ storage });
module.exports = upload;
