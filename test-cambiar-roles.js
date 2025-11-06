/**
 * Script de Prueba - Cambiar Roles de Usuarios
 * Autor: Alexander Echeverria
 * Ubicación: test-cambiar-roles.js
 *
 * Ejecutar: node test-cambiar-roles.js
 *
 * Este script prueba el cambio de roles de usuarios:
 * - admin → bodega
 * - admin → vendedor
 * - admin → repartidor
 */

require('dotenv').config();
const axios = require('axios');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let adminToken = null;

// Utilidades de impresión
function printHeader(text) {
  console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + '  ' + text + colors.reset);
  console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

function printSuccess(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

function printError(message, error = null) {
  console.log(colors.red + '✗ ' + message + colors.reset);
  if (error && error.response) {
    console.log(colors.red + '  Status: ' + error.response.status + colors.reset);
    console.log(colors.red + '  Error: ' + JSON.stringify(error.response.data, null, 2) + colors.reset);
  } else if (error) {
    console.log(colors.red + '  Error: ' + error.message + colors.reset);
  }
}

function printInfo(message) {
  console.log(colors.blue + 'ℹ ' + message + colors.reset);
}

function printWarning(message) {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

// ========== FUNCIONES DE TEST ==========

async function loginComoAdmin() {
  printHeader('PASO 1: Login como Admin');

  try {
    const response = await axios.post(`${API_URL}/users/login`, {
      email: 'admin@farmacia.com',
      password: 'Admin123!'
    });

    adminToken = response.data.token;

    printSuccess('Login exitoso');
    printInfo(`Email: ${response.data.user.email}`);
    printInfo(`Role: ${response.data.user.role}`);
    printInfo(`Token: ${adminToken.substring(0, 40)}...`);

    return true;
  } catch (error) {
    printError('Error en login', error);
    return false;
  }
}

async function listarUsuarios() {
  printHeader('PASO 2: Listar Usuarios Actuales');

  try {
    const response = await axios.get(`${API_URL}/users?limit=100`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const users = response.data.users;

    printSuccess(`Total de usuarios: ${users.length}`);

    console.log('\n' + colors.yellow + 'USUARIOS EN EL SISTEMA:' + colors.reset);
    console.log(colors.yellow + '-'.repeat(80) + colors.reset);

    users.forEach((user, index) => {
      console.log(
        `${index + 1}. ID: ${colors.cyan}${user.id}${colors.reset} | ` +
        `${user.firstName} ${user.lastName} | ` +
        `Email: ${user.email} | ` +
        `Rol: ${colors.magenta}${user.role}${colors.reset}`
      );
    });

    return users;
  } catch (error) {
    printError('Error al listar usuarios', error);
    return [];
  }
}

async function crearUsuarioDePrueba(rol) {
  const timestamp = Date.now();
  const email = `test-${rol}-${timestamp}@farmacia.com`;

  try {
    const response = await axios.post(
      `${API_URL}/users`,
      {
        email: email,
        password: 'Test123!',
        firstName: 'Usuario',
        lastName: `Test ${rol}`,
        role: 'cliente'  // Crear primero como cliente
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    printSuccess(`Usuario de prueba creado: ${email}`);
    printInfo(`ID: ${response.data.user.id}`);
    printInfo(`Rol inicial: ${response.data.user.role}`);

    return response.data.user;
  } catch (error) {
    printError('Error al crear usuario de prueba', error);
    return null;
  }
}

async function cambiarRol(userId, nuevoRol) {
  try {
    printInfo(`Cambiando usuario ${userId} a rol ${nuevoRol}...`);

    const response = await axios.put(
      `${API_URL}/users/${userId}`,
      { role: nuevoRol },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    printSuccess(`¡Rol actualizado exitosamente!`);
    printInfo(`Usuario: ${response.data.user.email}`);
    printInfo(`Nuevo rol: ${colors.magenta}${response.data.user.role}${colors.reset}`);

    return true;
  } catch (error) {
    printError(`Error al cambiar rol a ${nuevoRol}`, error);
    return false;
  }
}

async function verificarCambioRol(userId, rolEsperado) {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const rolActual = response.data.role;

    if (rolActual === rolEsperado) {
      printSuccess(`Verificación exitosa: El usuario tiene el rol "${rolActual}"`);
      return true;
    } else {
      printError(`Verificación fallida: Se esperaba "${rolEsperado}" pero es "${rolActual}"`);
      return false;
    }
  } catch (error) {
    printError('Error al verificar cambio de rol', error);
    return false;
  }
}

async function probarCambioARol(rolDestino) {
  printHeader(`PRUEBA: Cambiar Usuario a Rol "${rolDestino.toUpperCase()}"`);

  // Crear usuario de prueba
  printInfo('Creando usuario de prueba...');
  const usuario = await crearUsuarioDePrueba(rolDestino);

  if (!usuario) {
    printError('No se pudo crear usuario de prueba');
    return false;
  }

  console.log(''); // Línea en blanco

  // Cambiar rol
  const cambioExitoso = await cambiarRol(usuario.id, rolDestino);

  if (!cambioExitoso) {
    printError(`No se pudo cambiar el usuario a ${rolDestino}`);
    return false;
  }

  console.log(''); // Línea en blanco

  // Verificar cambio
  const verificado = await verificarCambioRol(usuario.id, rolDestino);

  if (verificado) {
    printSuccess(`✅ PRUEBA EXITOSA: Usuario cambiado a "${rolDestino}" correctamente`);
  } else {
    printError(`❌ PRUEBA FALLIDA: El cambio a "${rolDestino}" no se aplicó correctamente`);
  }

  return verificado;
}

async function probarCambiosMultiples() {
  printHeader('PRUEBA: Cambios Múltiples en el Mismo Usuario');

  // Crear usuario
  const usuario = await crearUsuarioDePrueba('multi');
  if (!usuario) return false;

  console.log('');

  // Cambiar a diferentes roles
  const roles = ['vendedor', 'bodega', 'repartidor', 'admin', 'cliente'];

  for (const rol of roles) {
    printInfo(`Cambiando a ${rol}...`);
    const exito = await cambiarRol(usuario.id, rol);

    if (!exito) {
      printError(`Falló el cambio a ${rol}`);
      return false;
    }

    await verificarCambioRol(usuario.id, rol);
    console.log(''); // Línea en blanco
  }

  printSuccess('✅ Todos los cambios múltiples fueron exitosos');
  return true;
}

async function probarRolesInvalidos() {
  printHeader('PRUEBA: Roles Inválidos (Debe Fallar)');

  const usuario = await crearUsuarioDePrueba('invalid');
  if (!usuario) return false;

  console.log('');

  const rolesInvalidos = [
    'Vendedor',     // Mayúscula
    'ADMIN',        // Todo mayúsculas
    'bodega ',      // Espacio al final
    ' repartidor',  // Espacio al inicio
    'empleado',     // No existe
    'superadmin'    // No existe
  ];

  let todosFallaron = true;

  for (const rolInvalido of rolesInvalidos) {
    try {
      printInfo(`Probando rol inválido: "${rolInvalido}"`);

      await axios.put(
        `${API_URL}/users/${usuario.id}`,
        { role: rolInvalido },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Si llegó aquí, NO debería haber pasado
      printError(`❌ ERROR: El rol inválido "${rolInvalido}" fue aceptado (no debería)`);
      todosFallaron = false;

    } catch (error) {
      if (error.response?.status === 400) {
        printSuccess(`Correctamente rechazado: "${rolInvalido}"`);
      } else {
        printWarning(`Error inesperado con "${rolInvalido}": ${error.response?.status}`);
      }
    }
  }

  console.log('');

  if (todosFallaron) {
    printSuccess('✅ PRUEBA EXITOSA: Todos los roles inválidos fueron rechazados');
  } else {
    printError('❌ PRUEBA FALLIDA: Algunos roles inválidos fueron aceptados');
  }

  return todosFallaron;
}

async function mostrarResumenFinal(resultados) {
  printHeader('RESUMEN FINAL DE PRUEBAS');

  console.log(colors.yellow + 'Resultados:' + colors.reset);

  resultados.forEach((resultado, index) => {
    const icon = resultado.exitoso ? colors.green + '✓' : colors.red + '✗';
    console.log(`${icon} ${resultado.nombre}${colors.reset}`);
  });

  console.log('');

  const totalExitosos = resultados.filter(r => r.exitoso).length;
  const totalFallidos = resultados.filter(r => !r.exitoso).length;

  console.log(colors.cyan + `Total de pruebas: ${resultados.length}` + colors.reset);
  console.log(colors.green + `Exitosas: ${totalExitosos}` + colors.reset);
  console.log(colors.red + `Fallidas: ${totalFallidos}` + colors.reset);

  if (totalFallidos === 0) {
    console.log('\n' + colors.green + '🎉 ¡TODAS LAS PRUEBAS PASARON!' + colors.reset + '\n');
  } else {
    console.log('\n' + colors.red + '⚠️ ALGUNAS PRUEBAS FALLARON' + colors.reset + '\n');
  }
}

// ========== EJECUTAR TODAS LAS PRUEBAS ==========

async function ejecutarTodasLasPruebas() {
  console.log(colors.magenta + '\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║      TEST DE CAMBIO DE ROLES - FARMACIA ELIZABETH         ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  printInfo(`Servidor: ${BASE_URL}`);
  printInfo(`Fecha: ${new Date().toLocaleString()}`);

  const resultados = [];

  // 1. Login
  const loginExitoso = await loginComoAdmin();
  if (!loginExitoso) {
    printError('No se pudo hacer login. Verifica que existe el usuario admin@farmacia.com con password Admin123!');
    process.exit(1);
  }

  // 2. Listar usuarios actuales
  await listarUsuarios();

  // 3. Probar cambio a Bodega
  const resultadoBodega = await probarCambioARol('bodega');
  resultados.push({ nombre: 'Cambio a Bodega', exitoso: resultadoBodega });

  // 4. Probar cambio a Vendedor
  const resultadoVendedor = await probarCambioARol('vendedor');
  resultados.push({ nombre: 'Cambio a Vendedor', exitoso: resultadoVendedor });

  // 5. Probar cambio a Repartidor
  const resultadoRepartidor = await probarCambioARol('repartidor');
  resultados.push({ nombre: 'Cambio a Repartidor', exitoso: resultadoRepartidor });

  // 6. Probar cambio a Admin
  const resultadoAdmin = await probarCambioARol('admin');
  resultados.push({ nombre: 'Cambio a Admin', exitoso: resultadoAdmin });

  // 7. Probar cambios múltiples
  const resultadoMultiple = await probarCambiosMultiples();
  resultados.push({ nombre: 'Cambios múltiples', exitoso: resultadoMultiple });

  // 8. Probar roles inválidos
  const resultadoInvalidos = await probarRolesInvalidos();
  resultados.push({ nombre: 'Rechazo de roles inválidos', exitoso: resultadoInvalidos });

  // Mostrar resumen
  await mostrarResumenFinal(resultados);
}

// ========== INICIAR ==========

ejecutarTodasLasPruebas().catch(error => {
  console.error(colors.red + '\n❌ Error fatal en las pruebas:' + colors.reset);
  console.error(error);
  process.exit(1);
});
