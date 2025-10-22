/**
 * Test Completo de Usuarios - Con Menú Interactivo
 * Autor: Alexander Echeverria
 * Ubicación: tests/test-users.js
 * 
 * Ejecutar: node test-users.js
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');
const FormData = require('form-data');
const fs = require('fs');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Variables globales
let authToken = null;
let currentUserId = null;

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

// Configurar readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para hacer preguntas
function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

// Utilidades de impresión
function printHeader(text) {
    console.clear();
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

// ========== FUNCIONES DE USUARIO ==========

async function loginUser() {
    printHeader('LOGIN DE USUARIO');
    
    const email = await question('Email (default: admin@farmacia.com): ') || 'admin@farmacia.com';
    const password = await question('Password (default: Admin123!): ') || 'Admin123!';
    
    try {
        const response = await axios.post(`${API_URL}/users/login`, {
            email,
            password
        });
        
        authToken = response.data.token;
        printSuccess('Login exitoso!');
        printInfo(`Token: ${authToken.substring(0, 30)}...`);
        printInfo(`Usuario: ${response.data.user.email}`);
        printInfo(`Role: ${response.data.user.role}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error en login', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function registerUser() {
    printHeader('REGISTRAR NUEVO USUARIO');
    
    const timestamp = Date.now();
    const email = await question(`Email (default: test${timestamp}@farmacia.com): `) || `test${timestamp}@farmacia.com`;
    const password = await question('Password (default: Test123!): ') || 'Test123!';
    const firstName = await question('Nombre (default: Usuario): ') || 'Usuario';
    const lastName = await question('Apellido (default: Test): ') || 'Test';
    const role = await question('Role [admin/vendedor/bodega/repartidor/cliente] (default: cliente): ') || 'cliente';
    const phone = await question('Teléfono (opcional): ') || null;
    const dpi = await question('DPI (opcional): ') || null;
    
    try {
        const response = await axios.post(`${API_URL}/users/register`, {
            email,
            password,
            firstName,
            lastName,
            role,
            phone,
            dpi
        });
        
        printSuccess('Usuario registrado exitosamente!');
        printInfo(`ID: ${response.data.user.id}`);
        printInfo(`Email: ${response.data.user.email}`);
        printInfo(`Nombre: ${response.data.user.firstName} ${response.data.user.lastName}`);
        printInfo(`Role: ${response.data.user.role}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al registrar usuario', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function listUsers() {
    printHeader('LISTAR TODOS LOS USUARIOS');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const page = await question('Página (default: 1): ') || '1';
    const limit = await question('Límite por página (default: 10): ') || '10';
    const role = await question('Filtrar por role (opcional): ') || '';
    const search = await question('Buscar por nombre/email (opcional): ') || '';
    
    try {
        let url = `${API_URL}/users?page=${page}&limit=${limit}`;
        if (role) url += `&role=${role}`;
        if (search) url += `&search=${search}`;
        
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess(`Total de usuarios: ${response.data.total}`);
        printInfo(`Página ${response.data.page} de ${response.data.totalPages}`);
        
        console.log('\n' + colors.yellow + 'LISTADO DE USUARIOS:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(80) + colors.reset);
        
        response.data.users.forEach((user, index) => {
            console.log(`\n${colors.cyan}${index + 1}. ${user.firstName} ${user.lastName}${colors.reset}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Activo: ${user.isActive ? '✓' : '✗'}`);
            console.log(`   DPI: ${user.dpi || 'N/A'}`);
            console.log(`   Teléfono: ${user.phone || 'N/A'}`);
        });
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al listar usuarios', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getUserById() {
    printHeader('OBTENER USUARIO POR ID');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const userId = await question('ID del usuario: ');
    
    if (!userId) {
        printWarning('ID requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.get(`${API_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const user = response.data;
        
        console.log('\n' + colors.green + 'INFORMACIÓN DEL USUARIO:' + colors.reset);
        console.log(colors.green + '-'.repeat(60) + colors.reset);
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Nombre: ${user.firstName} ${user.lastName}`);
        console.log(`Role: ${user.role}`);
        console.log(`Activo: ${user.isActive ? 'Sí' : 'No'}`);
        console.log(`Email verificado: ${user.emailVerified ? 'Sí' : 'No'}`);
        console.log(`DPI: ${user.dpi || 'N/A'}`);
        console.log(`NIT: ${user.nit || 'N/A'}`);
        console.log(`Teléfono: ${user.phone || 'N/A'}`);
        console.log(`Dirección: ${user.address || 'N/A'}`);
        console.log(`Fecha nacimiento: ${user.birthDate || 'N/A'}`);
        console.log(`Último login: ${user.lastLogin || 'N/A'}`);
        console.log(`Creado: ${user.createdAt}`);
        console.log(`Imagen: ${user.profileImage || 'Sin imagen'}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener usuario', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function updateUser() {
    printHeader('ACTUALIZAR USUARIO');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const userId = await question('ID del usuario a actualizar: ');
    
    if (!userId) {
        printWarning('ID requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    console.log('\n' + colors.blue + 'Ingresa los nuevos valores (Enter para mantener actual):' + colors.reset);
    
    const firstName = await question('Nombre: ');
    const lastName = await question('Apellido: ');
    const phone = await question('Teléfono: ');
    const address = await question('Dirección: ');
    const role = await question('Role [admin/vendedor/bodega/repartidor/cliente]: ');
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (role) updateData.role = role;
    
    if (Object.keys(updateData).length === 0) {
        printWarning('No se ingresaron cambios');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.put(`${API_URL}/users/${userId}`, updateData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Usuario actualizado exitosamente!');
        printInfo(`Nombre: ${response.data.user.firstName} ${response.data.user.lastName}`);
        printInfo(`Email: ${response.data.user.email}`);
        printInfo(`Role: ${response.data.user.role}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al actualizar usuario', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function deleteUser() {
    printHeader('ELIMINAR USUARIO');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const userId = await question('ID del usuario a eliminar: ');
    
    if (!userId) {
        printWarning('ID requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const confirm = await question(`¿Estás seguro de eliminar el usuario ${userId}? (si/no): `);
    
    if (confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 's') {
        printWarning('Operación cancelada');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        await axios.delete(`${API_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Usuario eliminado exitosamente!');
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al eliminar usuario', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function toggleActiveUser() {
    printHeader('ACTIVAR/DESACTIVAR USUARIO');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const userId = await question('ID del usuario: ');
    
    if (!userId) {
        printWarning('ID requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.patch(`${API_URL}/users/${userId}/toggle-active`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Estado actualizado!');
        printInfo(`Usuario: ${response.data.user.email}`);
        printInfo(`Estado: ${response.data.user.isActive ? 'ACTIVO' : 'INACTIVO'}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al cambiar estado', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getUserStats() {
    printHeader('ESTADÍSTICAS DE USUARIOS');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.get(`${API_URL}/users/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const stats = response.data;
        
        console.log('\n' + colors.green + 'ESTADÍSTICAS GENERALES:' + colors.reset);
        console.log(colors.green + '-'.repeat(60) + colors.reset);
        console.log(`Total de usuarios: ${stats.total}`);
        console.log(`Usuarios activos: ${stats.active}`);
        console.log(`Usuarios inactivos: ${stats.inactive}`);
        console.log(`Con Google OAuth: ${stats.withGoogle}`);
        console.log(`Con contraseña: ${stats.withPassword}`);
        console.log(`Logins recientes (7 días): ${stats.recentLogins}`);
        
        console.log('\n' + colors.cyan + 'POR ROLES:' + colors.reset);
        console.log(colors.cyan + '-'.repeat(60) + colors.reset);
        stats.byRole.forEach(role => {
            console.log(`${role.role}: ${role.count} usuarios`);
        });
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener estadísticas', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getMyProfile() {
    printHeader('MI PERFIL');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        const response = await axios.get(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const user = response.data;
        
        console.log('\n' + colors.green + 'TU PERFIL:' + colors.reset);
        console.log(colors.green + '-'.repeat(60) + colors.reset);
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Nombre: ${user.firstName} ${user.lastName}`);
        console.log(`Role: ${user.role}`);
        console.log(`Activo: ${user.isActive ? 'Sí' : 'No'}`);
        console.log(`Teléfono: ${user.phone || 'N/A'}`);
        console.log(`Dirección: ${user.address || 'N/A'}`);
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener perfil', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function changePassword() {
    printHeader('CAMBIAR CONTRASEÑA');
    
    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    const currentPassword = await question('Contraseña actual: ');
    const newPassword = await question('Nueva contraseña: ');
    const confirmPassword = await question('Confirmar nueva contraseña: ');
    
    if (newPassword !== confirmPassword) {
        printError('Las contraseñas no coinciden');
        await question('\nPresiona Enter para continuar...');
        return;
    }
    
    try {
        await axios.post(`${API_URL}/users/change-password`, {
            currentPassword,
            newPassword
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        printSuccess('Contraseña cambiada exitosamente!');
        
        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al cambiar contraseña', error);
        await question('\nPresiona Enter para continuar...');
    }
}

// ========== MENÚ PRINCIPAL ==========

async function showMenu() {
    printHeader('TEST DE USUARIOS - FARMACIA ELIZABETH');
    
    console.log(colors.cyan + '  Estado de autenticación:' + colors.reset);
    if (authToken) {
        console.log(colors.green + '  ✓ Autenticado' + colors.reset);
    } else {
        console.log(colors.red + '  ✗ No autenticado' + colors.reset);
    }
    
    console.log('\n' + colors.yellow + '  OPCIONES:' + colors.reset);
    console.log('  1.  Login');
    console.log('  2.  Registrar nuevo usuario');
    console.log('  3.  Listar todos los usuarios');
    console.log('  4.  Obtener usuario por ID');
    console.log('  5.  Actualizar usuario');
    console.log('  6.  Eliminar usuario');
    console.log('  7.  Activar/Desactivar usuario');
    console.log('  8.  Ver estadísticas');
    console.log('  9.  Ver mi perfil');
    console.log('  10. Cambiar mi contraseña');
    console.log('  0.  Salir');
    
    const option = await question('\n  Selecciona una opción: ');
    
    switch (option) {
        case '1':
            await loginUser();
            break;
        case '2':
            await registerUser();
            break;
        case '3':
            await listUsers();
            break;
        case '4':
            await getUserById();
            break;
        case '5':
            await updateUser();
            break;
        case '6':
            await deleteUser();
            break;
        case '7':
            await toggleActiveUser();
            break;
        case '8':
            await getUserStats();
            break;
        case '9':
            await getMyProfile();
            break;
        case '10':
            await changePassword();
            break;
        case '0':
            console.log('\n' + colors.green + '¡Hasta luego!' + colors.reset + '\n');
            rl.close();
            process.exit(0);
            break;
        default:
            printWarning('Opción no válida');
            await question('\nPresiona Enter para continuar...');
    }
    
    await showMenu();
}

// ========== INICIAR ==========

async function init() {
    console.log(colors.magenta + '\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║        TEST DE USUARIOS - FARMACIA ELIZABETH              ║');
    console.log('║        Sistema de Gestión Completo                        ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    printInfo(`Servidor: ${BASE_URL}`);
    printInfo(`Hora: ${new Date().toLocaleString()}`);
    
    await question('\nPresiona Enter para comenzar...');
    
    await showMenu();
}

init().catch(error => {
    console.error(colors.red + 'Error fatal:' + colors.reset, error);
    rl.close();
    process.exit(1);
});