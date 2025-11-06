/**
 * TEST - Sistema de Perfil de Cliente Mejorado
 *
 * Pruebas para verificar las nuevas funcionalidades:
 * 1. Edición de campos individuales
 * 2. Actualización de imagen de perfil
 * 3. Cambio de contraseña (usuario normal)
 * 4. Establecer contraseña (usuario Google)
 *
 * IMPORTANTE: Reemplaza TOKEN con un token JWT válido
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/users';
const TOKEN = 'TU_TOKEN_JWT_AQUI'; // ⬅️ REEMPLAZAR CON TOKEN REAL

// Headers comunes
const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

// ========== TEST 1: Ver Perfil Actual ==========

async function test1_verPerfil() {
  console.log('\n🔍 TEST 1: Ver perfil actual');

  try {
    const response = await axios.get(`${API_URL}/profile`, { headers });

    console.log('✅ Perfil obtenido:');
    console.log('   ID:', response.data.id);
    console.log('   Nombre:', response.data.firstName, response.data.lastName);
    console.log('   Email:', response.data.email);
    console.log('   Teléfono:', response.data.phone || 'No establecido');
    console.log('   DPI:', response.data.dpi || 'No establecido');
    console.log('   Dirección:', response.data.address || 'No establecido');
    console.log('   Tiene contraseña:', response.data.password ? 'Sí' : 'No');
    console.log('   Usuario de Google:', response.data.googleId ? 'Sí' : 'No');
    console.log('   Imagen:', response.data.profileImage || 'No establecido');

    return response.data;

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return null;
  }
}

// ========== TEST 2: Actualizar SOLO el teléfono ==========

async function test2_actualizarSoloTelefono() {
  console.log('\n📱 TEST 2: Actualizar solo teléfono');

  const nuevoTelefono = '55551234';

  try {
    const response = await axios.put(
      `${API_URL}/profile`,
      { phone: nuevoTelefono },
      { headers }
    );

    console.log('✅ Teléfono actualizado:');
    console.log('   Nuevo teléfono:', response.data.user.phone);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// ========== TEST 3: Actualizar SOLO el DPI ==========

async function test3_actualizarSoloDPI() {
  console.log('\n🆔 TEST 3: Actualizar solo DPI');

  const nuevoDPI = '1234567890101';

  try {
    const response = await axios.put(
      `${API_URL}/profile`,
      { dpi: nuevoDPI },
      { headers }
    );

    console.log('✅ DPI actualizado:');
    console.log('   Nuevo DPI:', response.data.user.dpi);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// ========== TEST 4: Actualizar SOLO la dirección ==========

async function test4_actualizarSoloDireccion() {
  console.log('\n🏠 TEST 4: Actualizar solo dirección');

  const nuevaDireccion = 'Barrio El Centro, frente al parque central, Rabinal';

  try {
    const response = await axios.put(
      `${API_URL}/profile`,
      { address: nuevaDireccion },
      { headers }
    );

    console.log('✅ Dirección actualizada:');
    console.log('   Nueva dirección:', response.data.user.address);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// ========== TEST 5: Actualizar SOLO la fecha de nacimiento ==========

async function test5_actualizarSoloFechaNacimiento() {
  console.log('\n🎂 TEST 5: Actualizar solo fecha de nacimiento');

  const nuevaFecha = '1990-05-15';

  try {
    const response = await axios.put(
      `${API_URL}/profile`,
      { birthDate: nuevaFecha },
      { headers }
    );

    console.log('✅ Fecha de nacimiento actualizada:');
    console.log('   Nueva fecha:', response.data.user.birthDate);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// ========== TEST 6: Actualizar varios campos a la vez ==========

async function test6_actualizarVariosCampos() {
  console.log('\n📝 TEST 6: Actualizar varios campos a la vez');

  const updates = {
    firstName: 'Juan Carlos',
    lastName: 'Pérez López',
    phone: '98765432',
    address: 'Barrio San Sebastián, casa #12, Rabinal'
  };

  try {
    const response = await axios.put(
      `${API_URL}/profile`,
      updates,
      { headers }
    );

    console.log('✅ Varios campos actualizados:');
    console.log('   Nombre:', response.data.user.firstName);
    console.log('   Apellido:', response.data.user.lastName);
    console.log('   Teléfono:', response.data.user.phone);
    console.log('   Dirección:', response.data.user.address);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// ========== TEST 7: Intentar actualizar con DPI duplicado ==========

async function test7_dpiDuplicado() {
  console.log('\n⚠️ TEST 7: Intentar actualizar con DPI duplicado');

  const dpiExistente = '9999999999999'; // Cambia por un DPI que ya exista

  try {
    const response = await axios.put(
      `${API_URL}/profile`,
      { dpi: dpiExistente },
      { headers }
    );

    console.log('⚠️ No debería llegar aquí');

  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Error esperado:', error.response.data.message);
    } else {
      console.error('❌ Error inesperado:', error.message);
    }
  }
}

// ========== TEST 8: Actualizar imagen de perfil ==========

async function test8_actualizarImagen() {
  console.log('\n📸 TEST 8: Actualizar imagen de perfil');

  // IMPORTANTE: Necesitas tener un archivo de imagen
  // Aquí se muestra cómo sería con FormData en Node.js

  const FormData = require('form-data');
  const fs = require('fs');
  const path = require('path');

  const imagePath = path.join(__dirname, 'test-image.jpg'); // ⬅️ CREAR ESTE ARCHIVO

  if (!fs.existsSync(imagePath)) {
    console.log('⚠️ Crear un archivo test-image.jpg en el directorio del proyecto');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    const response = await axios.put(`${API_URL}/profile/image`, formData, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Imagen actualizada:');
    console.log('   URL de Cloudinary:', response.data.profileImage);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// ========== TEST 9: Cambiar contraseña (usuario normal) ==========

async function test9_cambiarContrasena() {
  console.log('\n🔐 TEST 9: Cambiar contraseña (usuario normal)');

  const currentPassword = 'Password123!'; // ⬅️ CAMBIAR POR TU CONTRASEÑA ACTUAL
  const newPassword = 'NuevoPassword456!';

  try {
    const response = await axios.post(
      `${API_URL}/change-password`,
      {
        currentPassword,
        newPassword
      },
      { headers }
    );

    console.log('✅ Contraseña cambiada:');
    console.log('   Mensaje:', response.data.message);

    // IMPORTANTE: Si cambias la contraseña, actualiza currentPassword arriba

  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Contraseña actual incorrecta');
    } else if (error.response?.status === 400) {
      console.log('❌', error.response.data.message);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// ========== TEST 10: Establecer contraseña (usuario Google) ==========

async function test10_establecerContrasenaGoogle() {
  console.log('\n🔓 TEST 10: Establecer contraseña (usuario Google)');

  const newPassword = 'MiPrimeraPassword123!';

  try {
    const response = await axios.post(
      `${API_URL}/change-password`,
      {
        // Solo enviamos newPassword (sin currentPassword)
        newPassword
      },
      { headers }
    );

    console.log('✅ Contraseña establecida:');
    console.log('   Mensaje:', response.data.message);

  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️', error.response.data.message);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// ========== TEST 11: Intentar actualizar sin enviar campos ==========

async function test11_sinCampos() {
  console.log('\n⚠️ TEST 11: Intentar actualizar sin campos');

  try {
    const response = await axios.put(
      `${API_URL}/profile`,
      {}, // Objeto vacío
      { headers }
    );

    console.log('⚠️ No debería llegar aquí');

  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Error esperado:', error.response.data.message);
    } else {
      console.error('❌ Error inesperado:', error.message);
    }
  }
}

// ========== TEST 12: Validar longitud de contraseña ==========

async function test12_contrasenaCorta() {
  console.log('\n⚠️ TEST 12: Intentar contraseña corta (menos de 8 caracteres)');

  try {
    const response = await axios.post(
      `${API_URL}/change-password`,
      {
        currentPassword: 'Password123!',
        newPassword: 'abc123' // Muy corta
      },
      { headers }
    );

    console.log('⚠️ No debería llegar aquí');

  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Error esperado:', error.response.data.message);
    } else {
      console.error('❌ Error inesperado:', error.message);
    }
  }
}

// ========== EJECUTAR TODOS LOS TESTS ==========

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('     TESTS - SISTEMA DE PERFIL DE CLIENTE');
  console.log('═══════════════════════════════════════════════════');

  // Obtener perfil inicial
  const perfil = await test1_verPerfil();

  if (!perfil) {
    console.error('\n❌ No se pudo obtener el perfil. Verifica el TOKEN.');
    return;
  }

  // Tests de actualización de campos individuales
  await test2_actualizarSoloTelefono();
  await test3_actualizarSoloDPI();
  await test4_actualizarSoloDireccion();
  await test5_actualizarSoloFechaNacimiento();
  await test6_actualizarVariosCampos();

  // Tests de validación
  await test7_dpiDuplicado();
  await test11_sinCampos();

  // Tests de imagen (comentado porque requiere archivo)
  // await test8_actualizarImagen();

  // Tests de contraseña
  // IMPORTANTE: Descomentar el test que corresponda a tu tipo de usuario

  // Si eres usuario NORMAL (con contraseña):
  // await test9_cambiarContrasena();
  // await test12_contrasenaCorta();

  // Si eres usuario de GOOGLE (sin contraseña):
  // await test10_establecerContrasenaGoogle();

  // Ver perfil final
  console.log('\n═══════════════════════════════════════════════════');
  console.log('     PERFIL FINAL');
  console.log('═══════════════════════════════════════════════════');
  await test1_verPerfil();

  console.log('\n✅ Tests completados\n');
}

// ========== TESTS INDIVIDUALES (descomentar el que quieras ejecutar) ==========

// runAllTests(); // Ejecutar todos

// test1_verPerfil();
// test2_actualizarSoloTelefono();
// test3_actualizarSoloDPI();
// test4_actualizarSoloDireccion();
// test5_actualizarSoloFechaNacimiento();
// test6_actualizarVariosCampos();
// test7_dpiDuplicado();
// test8_actualizarImagen();
// test9_cambiarContrasena();
// test10_establecerContrasenaGoogle();
// test11_sinCampos();
// test12_contrasenaCorta();

// ========== MODO DE USO ==========

/*
1. Instalar dependencias:
   npm install axios form-data

2. Obtener un TOKEN:
   - Hacer login en /api/users/login o /api/users/login-google
   - Copiar el token de la respuesta

3. Editar este archivo:
   - Reemplazar TOKEN en la línea 14
   - Reemplazar currentPassword en test9 con tu contraseña actual

4. Ejecutar:
   node TEST_PERFIL_CLIENTE.js

5. Descomentar la función que quieras probar al final del archivo
*/

// ========== EXPORTAR PARA USO EN OTROS ARCHIVOS ==========

module.exports = {
  test1_verPerfil,
  test2_actualizarSoloTelefono,
  test3_actualizarSoloDPI,
  test4_actualizarSoloDireccion,
  test5_actualizarSoloFechaNacimiento,
  test6_actualizarVariosCampos,
  test7_dpiDuplicado,
  test8_actualizarImagen,
  test9_cambiarContrasena,
  test10_establecerContrasenaGoogle,
  test11_sinCampos,
  test12_contrasenaCorta,
  runAllTests
};
