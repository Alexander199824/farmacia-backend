/**
 * Test Completo de Auditor�a - Con Men� Interactivo
 * Autor: Alexander Echeverria
 * Ubicaci�n: tests/test-audit.js
 *
 * Ejecutar: node tests/test-audit.js
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

// Configuraci�n
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Variables globales
let authToken = null;

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

// Funci�n para hacer preguntas
function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

// Utilidades de impresi�n
function printHeader(text) {
    console.clear();
    console.log('\n' + colors.cyan + 'P'.repeat(70) + colors.reset);
    console.log(colors.cyan + '  ' + text + colors.reset);
    console.log(colors.cyan + 'P'.repeat(70) + colors.reset + '\n');
}

function printSuccess(message) {
    console.log(colors.green + ' ' + message + colors.reset);
}

function printError(message, error = null) {
    console.log(colors.red + ' ' + message + colors.reset);
    if (error && error.response) {
        console.log(colors.red + '  Status: ' + error.response.status + colors.reset);
        console.log(colors.red + '  Error: ' + JSON.stringify(error.response.data, null, 2) + colors.reset);
    } else if (error) {
        console.log(colors.red + '  Error: ' + error.message + colors.reset);
    }
}

function printInfo(message) {
    console.log(colors.blue + '9 ' + message + colors.reset);
}

function printWarning(message) {
    console.log(colors.yellow + '� ' + message + colors.reset);
}

// ========== AUTENTICACI�N ==========

async function login() {
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

// Login autom�tico
async function autoLogin() {
    try {
        const response = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@farmacia.com',
            password: 'Admin123!'
        });

        authToken = response.data.token;
        return true;
    } catch (error) {
        console.log(colors.red + 'Error en login autom�tico. Usando modo manual.' + colors.reset);
        return false;
    }
}

// ========== FUNCIONES DE AUDITOR�A ==========

async function getAllLogs() {
    printHeader('LISTAR TODOS LOS LOGS DE AUDITOR�A');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    const page = await question('P�gina (default: 1): ') || '1';
    const limit = await question('L�mite por p�gina (default: 20): ') || '20';

    console.log('\n' + colors.blue + 'Filtros opcionales (Enter para omitir):' + colors.reset);
    const action = await question('Acci�n (create/update/delete/login/etc): ') || '';
    const entity = await question('Entidad (user/product/batch/etc): ') || '';
    const severity = await question('Severidad (info/warning/error/critical): ') || '';
    const status = await question('Estado (success/failure): ') || '';
    const userId = await question('ID de usuario: ') || '';

    try {
        let url = `${API_URL}/audit/logs?page=${page}&limit=${limit}`;
        if (action) url += `&action=${action}`;
        if (entity) url += `&entity=${entity}`;
        if (severity) url += `&severity=${severity}`;
        if (status) url += `&status=${status}`;
        if (userId) url += `&userId=${userId}`;

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        printSuccess(`Total de logs: ${response.data.total}`);
        printInfo(`P�gina ${response.data.page} de ${response.data.totalPages}`);

        console.log('\n' + colors.yellow + 'LOGS DE AUDITOR�A:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(80) + colors.reset);

        response.data.logs.forEach((log, index) => {
            const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema';
            console.log(`\n${colors.cyan}${index + 1}. ${log.action.toUpperCase()} - ${log.entity}${colors.reset}`);
            console.log(`   ID: ${log.id}`);
            console.log(`   Usuario: ${userName} (ID: ${log.userId || 'N/A'})`);
            console.log(`   Entidad ID: ${log.entityId || 'N/A'}`);
            console.log(`   Severidad: ${log.severity}`);
            console.log(`   Estado: ${log.status}`);
            console.log(`   IP: ${log.ipAddress || 'N/A'}`);
            console.log(`   M�todo: ${log.method || 'N/A'}`);
            console.log(`   Endpoint: ${log.endpoint || 'N/A'}`);
            console.log(`   Fecha: ${new Date(log.createdAt).toLocaleString()}`);
            if (log.changes) {
                console.log(`   Cambios: ${JSON.stringify(log.changes).substring(0, 100)}...`);
            }
        });

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al listar logs', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getLogById() {
    printHeader('OBTENER LOG POR ID');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    const logId = await question('ID del log: ');

    if (!logId) {
        printWarning('ID requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    try {
        const response = await axios.get(`${API_URL}/audit/logs/${logId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const log = response.data;

        console.log('\n' + colors.green + 'INFORMACI�N DEL LOG:' + colors.reset);
        console.log(colors.green + '-'.repeat(70) + colors.reset);
        console.log(`ID: ${log.id}`);
        console.log(`Acci�n: ${log.action}`);
        console.log(`Entidad: ${log.entity}`);
        console.log(`Entidad ID: ${log.entityId || 'N/A'}`);
        const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema';
        console.log(`Usuario: ${userName} (${log.user ? log.user.email : 'N/A'})`);
        console.log(`Role: ${log.user ? log.user.role : 'N/A'}`);
        console.log(`Email: ${log.user ? log.user.email : 'N/A'}`);
        console.log(`Nombre: ${log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A'}`);
        console.log(`Severidad: ${log.severity}`);
        console.log(`Estado: ${log.status}`);
        console.log(`IP: ${log.ipAddress || 'N/A'}`);
        console.log(`User Agent: ${log.userAgent || 'N/A'}`);
        console.log(`M�todo HTTP: ${log.method || 'N/A'}`);
        console.log(`Endpoint: ${log.endpoint || 'N/A'}`);
        console.log(`Descripci�n: ${log.description || 'N/A'}`);
        console.log(`Fecha: ${new Date(log.createdAt).toLocaleString()}`);

        if (log.changes) {
            console.log('\n' + colors.cyan + 'CAMBIOS REGISTRADOS:' + colors.reset);
            console.log(JSON.stringify(log.changes, null, 2));
        }

        if (log.metadata) {
            console.log('\n' + colors.cyan + 'METADATA:' + colors.reset);
            console.log(JSON.stringify(log.metadata, null, 2));
        }

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener log', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getLogsByUser() {
    printHeader('OBTENER LOGS POR USUARIO');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    const userId = await question('ID del usuario: ');
    const limit = await question('L�mite de resultados (default: 20): ') || '20';

    if (!userId) {
        printWarning('ID de usuario requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    try {
        const response = await axios.get(`${API_URL}/audit/logs/user/${userId}?limit=${limit}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const logs = response.data;

        printSuccess(`Logs encontrados: ${logs.length}`);

        console.log('\n' + colors.yellow + 'HISTORIAL DEL USUARIO:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(80) + colors.reset);

        logs.forEach((log, index) => {
            const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema';
            console.log(`\n${colors.cyan}${index + 1}. ${log.action.toUpperCase()} - ${log.entity}${colors.reset}`);
            console.log(`   ID Log: ${log.id}`);
            console.log(`   Usuario: ${userName}`);
            console.log(`   Severidad: ${log.severity} | Estado: ${log.status}`);
            console.log(`   Descripci�n: ${log.description || 'N/A'}`);
            console.log(`   Fecha: ${new Date(log.createdAt).toLocaleString()}`);
        });

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener logs del usuario', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getLogsByEntity() {
    printHeader('OBTENER LOGS POR ENTIDAD');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    console.log('\n' + colors.blue + 'Entidades disponibles:' + colors.reset);
    console.log('  user, product, batch, supplier, sale, purchase, inventory_movement');

    const entity = await question('\nNombre de la entidad: ');
    const entityId = await question('ID espec�fico de la entidad (opcional): ') || '';
    const limit = await question('L�mite de resultados (default: 20): ') || '20';

    if (!entity) {
        printWarning('Nombre de entidad requerido');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    try {
        let url = entityId
            ? `${API_URL}/audit/logs/entity/${entity}/${entityId}?limit=${limit}`
            : `${API_URL}/audit/logs/entity/${entity}?limit=${limit}`;

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const logs = response.data;

        printSuccess(`Logs encontrados: ${logs.length}`);

        console.log('\n' + colors.yellow + `HISTORIAL DE ${entity.toUpperCase()}:` + colors.reset);
        console.log(colors.yellow + '-'.repeat(80) + colors.reset);

        logs.forEach((log, index) => {
            const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema';
            console.log(`\n${colors.cyan}${index + 1}. ${log.action.toUpperCase()}${colors.reset}`);
            console.log(`   ID Log: ${log.id}`);
            console.log(`   Entidad ID: ${log.entityId || 'N/A'}`);
            console.log(`   Usuario: ${userName}`);
            console.log(`   Severidad: ${log.severity} | Estado: ${log.status}`);
            console.log(`   Descripci�n: ${log.description || 'N/A'}`);
            console.log(`   Fecha: ${new Date(log.createdAt).toLocaleString()}`);
        });

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener logs de la entidad', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getAuditStats() {
    printHeader('ESTAD�STICAS DE AUDITOR�A');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    console.log('\n' + colors.blue + 'Rango de fechas (opcional):' + colors.reset);
    const startDate = await question('Fecha inicio (YYYY-MM-DD): ') || '';
    const endDate = await question('Fecha fin (YYYY-MM-DD): ') || '';

    try {
        let url = `${API_URL}/audit/stats`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const stats = response.data;

        console.log('\n' + colors.green + 'ESTAD�STICAS GENERALES:' + colors.reset);
        console.log(colors.green + '-'.repeat(70) + colors.reset);
        console.log(`Total de logs: ${stats.totalLogs}`);
        console.log(`Eventos cr�ticos: ${stats.criticalEvents}`);
        console.log(`Acciones fallidas: ${stats.failedActions}`);

        console.log('\n' + colors.cyan + 'POR ACCI�N:' + colors.reset);
        console.log(colors.cyan + '-'.repeat(70) + colors.reset);
        stats.byAction.forEach(action => {
            console.log(`${action.action.padEnd(20)}: ${action.count} eventos`);
        });

        console.log('\n' + colors.yellow + 'POR SEVERIDAD:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(70) + colors.reset);
        stats.bySeverity.forEach(severity => {
            console.log(`${severity.severity.padEnd(20)}: ${severity.count} eventos`);
        });

        console.log('\n' + colors.magenta + 'POR ESTADO:' + colors.reset);
        console.log(colors.magenta + '-'.repeat(70) + colors.reset);
        stats.byStatus.forEach(status => {
            console.log(`${status.status.padEnd(20)}: ${status.count} eventos`);
        });

        if (stats.topUsers && stats.topUsers.length > 0) {
            console.log('\n' + colors.blue + 'USUARIOS M�S ACTIVOS:' + colors.reset);
            console.log(colors.blue + '-'.repeat(70) + colors.reset);
            stats.topUsers.forEach((userStat, index) => {
                const userName = userStat.user ? `${userStat.user.firstName} ${userStat.user.lastName}` : `Usuario ID: ${userStat.userId}`;
                console.log(`${index + 1}. ${userName}: ${userStat.count} acciones`);
            });
        }

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener estad�sticas', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getRecentActivity() {
    printHeader('ACTIVIDAD RECIENTE');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    const hours = await question('�ltimas X horas (default: 24): ') || '24';
    const limit = await question('L�mite de resultados (default: 50): ') || '50';

    try {
        const response = await axios.get(`${API_URL}/audit/recent?hours=${hours}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const data = response.data;

        printSuccess(`Periodo: ${data.period}`);
        printInfo(`Total de eventos: ${data.count}`);

        console.log('\n' + colors.yellow + 'ACTIVIDAD RECIENTE:' + colors.reset);
        console.log(colors.yellow + '-'.repeat(80) + colors.reset);

        data.logs.forEach((log, index) => {
            const timeAgo = getTimeAgo(new Date(log.createdAt));
            const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema';
            console.log(`\n${colors.cyan}${index + 1}. ${log.action.toUpperCase()} - ${log.entity}${colors.reset}`);
            console.log(`   Usuario: ${userName} (${log.user ? log.user.role : 'N/A'})`);
            console.log(`   Estado: ${log.status} | Severidad: ${log.severity}`);
            console.log(`   IP: ${log.ipAddress || 'N/A'}`);
            console.log(`   Hace: ${timeAgo}`);
        });

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener actividad reciente', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function cleanOldLogs() {
    printHeader('LIMPIAR LOGS ANTIGUOS');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    printWarning('Esta acci�n es IRREVERSIBLE y solo puede ser ejecutada por administradores');
    printInfo('Se eliminar�n logs antiguos excepto los de severidad cr�tica o alta');

    const days = await question('\nEliminar logs m�s antiguos que X d�as (default: 90): ') || '90';
    const confirm = await question(`�Confirmar eliminaci�n de logs de m�s de ${days} d�as? (si/no): `);

    if (confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 's') {
        printWarning('Operaci�n cancelada');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    try {
        const response = await axios.delete(`${API_URL}/audit/clean`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { days: parseInt(days) }
        });

        printSuccess(response.data.message);
        printInfo(`Logs eliminados: ${response.data.deletedCount}`);
        printInfo(`Periodo: M�s de ${response.data.olderThan}`);

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al limpiar logs', error);
        await question('\nPresiona Enter para continuar...');
    }
}

// Funci�n auxiliar para calcular tiempo transcurrido
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds} segundos`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} horas`;
    return `${Math.floor(seconds / 86400)} d�as`;
}

// ========== FUNCIONES AUXILIARES PARA LISTAR ELEMENTOS ==========

async function listAvailableItems(entityType) {
    try {
        let endpoint = '';
        let itemsKey = '';

        switch(entityType.toLowerCase()) {
            case 'user':
                endpoint = '/users';
                itemsKey = 'users';
                break;
            case 'product':
                endpoint = '/products';
                itemsKey = 'products';
                break;
            case 'batch':
                endpoint = '/batches';
                itemsKey = 'batches';
                break;
            case 'supplier':
                endpoint = '/suppliers';
                itemsKey = 'suppliers';
                break;
            case 'invoice':
                endpoint = '/invoices';
                itemsKey = 'invoices';
                break;
            default:
                return null;
        }

        const response = await axios.get(`${API_URL}${endpoint}?limit=20`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const items = response.data[itemsKey] || response.data.data || response.data;

        if (!items || items.length === 0) {
            printWarning(`No hay elementos de tipo ${entityType} disponibles`);
            return null;
        }

        console.log('\n' + colors.cyan + `ELEMENTOS DISPONIBLES (${entityType.toUpperCase()}):` + colors.reset);
        console.log(colors.cyan + '-'.repeat(70) + colors.reset);

        items.slice(0, 10).forEach((item) => {
            let displayText = '';

            if (entityType.toLowerCase() === 'user') {
                displayText = `${item.firstName} ${item.lastName} (${item.email})`;
            } else if (entityType.toLowerCase() === 'product') {
                displayText = `${item.name} - ${item.description || 'Sin descripci�n'}`;
            } else if (entityType.toLowerCase() === 'supplier') {
                displayText = `${item.name} - ${item.contactName || 'Sin contacto'}`;
            } else if (entityType.toLowerCase() === 'invoice') {
                displayText = `Factura - Total: Q${item.total || 0}`;
            } else {
                displayText = JSON.stringify(item).substring(0, 50) + '...';
            }

            console.log(`  ${colors.green}${item.id}${colors.reset}. ${displayText}`);
        });

        if (items.length > 10) {
            console.log(`\n  ${colors.yellow}... y ${items.length - 10} m�s${colors.reset}`);
        }

        return items;
    } catch (error) {
        printWarning(`No se pudieron listar elementos de tipo ${entityType}`);
        console.log(colors.yellow + '  Puedes ingresar el ID manualmente' + colors.reset);
        return null;
    }
}

function getUserDisplayName(user) {
    if (!user) return 'Sistema';
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Usuario desconocido';
}

// ========== NUEVAS FUNCIONES DE VERIFICACI�N ==========

async function whoCreatedItem() {
    printHeader('�QUI�N CRE� ESTE ELEMENTO?');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    console.log('\n' + colors.blue + 'Entidades disponibles:' + colors.reset);
    console.log('  User, Product, Batch, Supplier, Invoice, Receipt, Payment, Purchase, InventoryMovement');

    const entity = await question('\nTipo de entidad: ');

    // Intentar listar elementos disponibles
    await listAvailableItems(entity);

    const entityId = await question('\nID del elemento: ');

    if (!entity || !entityId) {
        printWarning('Entidad e ID son requeridos');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    try {
        const response = await axios.get(
            `${API_URL}/audit/logs/entity/${entity}/${entityId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        const logs = response.data;
        const creationLog = logs.find(log => log.action === 'CREATE');

        if (!creationLog) {
            printWarning(`No se encontr� registro de creaci�n para ${entity} #${entityId}`);
            console.log('\n' + colors.yellow + 'Posibles razones:' + colors.reset);
            console.log('  - El elemento fue creado antes de implementar auditor�a');
            console.log('  - El ID es incorrecto');
            console.log('  - Los logs fueron limpiados');
        } else {
            console.log('\n' + colors.green + 'T ELEMENTO ENCONTRADO:' + colors.reset);
            console.log(colors.green + '-'.repeat(70) + colors.reset);
            console.log(`\nEntidad: ${colors.cyan}${creationLog.entity}${colors.reset}`);
            console.log(`ID: ${colors.cyan}${creationLog.entityId}${colors.reset}`);
            const userName = creationLog.user ? `${creationLog.user.firstName} ${creationLog.user.lastName}` : 'Sistema';
            console.log(`\n${colors.yellow}CREADO POR:${colors.reset}`);
            console.log(`  Usuario: ${colors.magenta}${userName}${colors.reset}`);
            console.log(`  Email: ${creationLog.user ? creationLog.user.email : 'N/A'}`);
            console.log(`  Role: ${creationLog.user ? creationLog.user.role : 'N/A'}`);
            console.log(`  ID Usuario: ${creationLog.userId || 'N/A'}`);
            console.log(`\n${colors.yellow}DETALLES:${colors.reset}`);
            console.log(`  Fecha: ${new Date(creationLog.createdAt).toLocaleString()}`);
            console.log(`  IP: ${creationLog.ipAddress || 'N/A'}`);
            console.log(`  Descripci�n: ${creationLog.description || 'N/A'}`);
            console.log(`  Estado: ${creationLog.status === 'success' ? colors.green + 'T Exitoso' + colors.reset : colors.red + '� Fallido' + colors.reset}`);

            if (creationLog.newValue) {
                console.log(`\n${colors.cyan}VALORES INICIALES:${colors.reset}`);
                console.log(JSON.stringify(creationLog.newValue, null, 2));
            }
        }

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al buscar informaci�n de creaci�n', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function whoModifiedItem() {
    printHeader('�QUI�N MODIFIC� ESTE ELEMENTO?');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    console.log('\n' + colors.blue + 'Entidades disponibles:' + colors.reset);
    console.log('  User, Product, Batch, Supplier, Invoice, Receipt, Payment, Purchase, InventoryMovement');

    const entity = await question('\nTipo de entidad: ');

    // Intentar listar elementos disponibles
    await listAvailableItems(entity);

    const entityId = await question('\nID del elemento: ');
    const limit = await question('Mostrar �ltimas X modificaciones (default: 10): ') || '10';

    if (!entity || !entityId) {
        printWarning('Entidad e ID son requeridos');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    try {
        const response = await axios.get(
            `${API_URL}/audit/logs/entity/${entity}/${entityId}?limit=${limit}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        const logs = response.data;
        const updateLogs = logs.filter(log => log.action === 'UPDATE');

        if (updateLogs.length === 0) {
            printWarning(`No se encontraron modificaciones para ${entity} #${entityId}`);
            console.log('\n' + colors.yellow + 'El elemento puede no haber sido modificado a�n' + colors.reset);
        } else {
            printSuccess(`Se encontraron ${updateLogs.length} modificaciones`);

            console.log('\n' + colors.yellow + `HISTORIAL DE MODIFICACIONES:` + colors.reset);
            console.log(colors.yellow + '-'.repeat(80) + colors.reset);

            updateLogs.forEach((log, index) => {
                const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema';
                console.log(`\n${colors.cyan}MODIFICACI�N #${index + 1}:${colors.reset}`);
                console.log(`  Modificado por: ${colors.magenta}${userName}${colors.reset}`);
                console.log(`  Role: ${log.user ? log.user.role : 'N/A'}`);
                console.log(`  Usuario ID: ${log.userId || 'N/A'}`);
                console.log(`  Fecha: ${new Date(log.createdAt).toLocaleString()}`);
                console.log(`  IP: ${log.ipAddress || 'N/A'}`);
                console.log(`  Estado: ${log.status === 'success' ? colors.green + 'T Exitoso' + colors.reset : colors.red + '� Fallido' + colors.reset}`);
                console.log(`  Descripci�n: ${log.description || 'N/A'}`);

                if (log.previousValue) {
                    console.log(`\n  ${colors.blue}Valor anterior:${colors.reset}`);
                    console.log('  ' + JSON.stringify(log.previousValue, null, 2).split('\n').join('\n  '));
                }

                if (log.newValue) {
                    console.log(`\n  ${colors.green}Nuevo valor:${colors.reset}`);
                    console.log('  ' + JSON.stringify(log.newValue, null, 2).split('\n').join('\n  '));
                }

                console.log(colors.yellow + '  ' + '-'.repeat(78) + colors.reset);
            });
        }

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al buscar modificaciones', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function whoDeletedItem() {
    printHeader('�QUI�N ELIMIN� ESTE ELEMENTO?');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    console.log('\n' + colors.blue + 'Entidades disponibles:' + colors.reset);
    console.log('  User, Product, Batch, Supplier, Invoice, Receipt, Payment, Purchase, InventoryMovement');

    const entity = await question('\nTipo de entidad: ');

    // Intentar listar elementos disponibles
    await listAvailableItems(entity);

    const entityId = await question('\nID del elemento eliminado: ');

    if (!entity || !entityId) {
        printWarning('Entidad e ID son requeridos');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    try {
        const response = await axios.get(
            `${API_URL}/audit/logs/entity/${entity}/${entityId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        const logs = response.data;
        const deletionLog = logs.find(log => log.action === 'DELETE');

        if (!deletionLog) {
            printWarning(`No se encontr� registro de eliminaci�n para ${entity} #${entityId}`);
            console.log('\n' + colors.yellow + 'Posibles razones:' + colors.reset);
            console.log('  - El elemento no ha sido eliminado');
            console.log('  - El ID es incorrecto');
            console.log('  - Los logs de eliminaci�n fueron limpiados');
        } else {
            console.log('\n' + colors.red + '� ELEMENTO ELIMINADO:' + colors.reset);
            console.log(colors.red + '-'.repeat(70) + colors.reset);
            console.log(`\nEntidad: ${colors.cyan}${deletionLog.entity}${colors.reset}`);
            console.log(`ID: ${colors.cyan}${deletionLog.entityId}${colors.reset}`);
            const userName = deletionLog.user ? `${deletionLog.user.firstName} ${deletionLog.user.lastName}` : 'Sistema';
            console.log(`\n${colors.yellow}ELIMINADO POR:${colors.reset}`);
            console.log(`  Usuario: ${colors.magenta}${userName}${colors.reset}`);
            console.log(`  Email: ${deletionLog.user ? deletionLog.user.email : 'N/A'}`);
            console.log(`  Role: ${deletionLog.user ? deletionLog.user.role : 'N/A'}`);
            console.log(`  ID Usuario: ${deletionLog.userId || 'N/A'}`);
            console.log(`\n${colors.yellow}DETALLES DE LA ELIMINACI�N:${colors.reset}`);
            console.log(`  Fecha: ${new Date(deletionLog.createdAt).toLocaleString()}`);
            console.log(`  IP: ${deletionLog.ipAddress || 'N/A'}`);
            console.log(`  Descripci�n: ${deletionLog.description || 'N/A'}`);
            console.log(`  Estado: ${deletionLog.status === 'success' ? colors.green + 'T Exitoso' + colors.reset : colors.red + '� Fallido' + colors.reset}`);
            console.log(`  Severidad: ${deletionLog.severity}`);

            if (deletionLog.previousValue) {
                console.log(`\n${colors.cyan}�LTIMO ESTADO ANTES DE ELIMINAR:${colors.reset}`);
                console.log(JSON.stringify(deletionLog.previousValue, null, 2));
            }

            // Mostrar historial completo del elemento
            console.log(`\n${colors.magenta}HISTORIAL COMPLETO DEL ELEMENTO:${colors.reset}`);
            console.log(colors.magenta + '-'.repeat(70) + colors.reset);

            logs.forEach((log, index) => {
                const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema';
                const actionColor = log.action === 'CREATE' ? colors.green :
                                   log.action === 'UPDATE' ? colors.yellow :
                                   log.action === 'DELETE' ? colors.red : colors.blue;
                console.log(`\n${index + 1}. ${actionColor}${log.action}${colors.reset} - ${new Date(log.createdAt).toLocaleString()}`);
                console.log(`   Por: ${userName}`);
            });
        }

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al buscar informaci�n de eliminaci�n', error);
        await question('\nPresiona Enter para continuar...');
    }
}

async function getCompleteHistory() {
    printHeader('HISTORIAL COMPLETO DE UN ELEMENTO');

    if (!authToken) {
        printWarning('Debes hacer login primero');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    console.log('\n' + colors.blue + 'Entidades disponibles:' + colors.reset);
    console.log('  User, Product, Batch, Supplier, Invoice, Receipt, Payment, Purchase, InventoryMovement');

    const entity = await question('\nTipo de entidad: ');

    // Intentar listar elementos disponibles
    await listAvailableItems(entity);

    const entityId = await question('\nID del elemento: ');

    if (!entity || !entityId) {
        printWarning('Entidad e ID son requeridos');
        await question('\nPresiona Enter para continuar...');
        return;
    }

    try {
        const response = await axios.get(
            `${API_URL}/audit/logs/entity/${entity}/${entityId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        const logs = response.data;

        if (logs.length === 0) {
            printWarning(`No se encontraron registros para ${entity} #${entityId}`);
        } else {
            printSuccess(`Se encontraron ${logs.length} eventos en el historial`);

            // Resumen
            const creationLog = logs.find(log => log.action === 'CREATE');
            const updateLogs = logs.filter(log => log.action === 'UPDATE');
            const deletionLog = logs.find(log => log.action === 'DELETE');

            console.log('\n' + colors.cyan + 'P'.repeat(70) + colors.reset);
            console.log(colors.cyan + '  RESUMEN DEL ELEMENTO' + colors.reset);
            console.log(colors.cyan + 'P'.repeat(70) + colors.reset);

            if (creationLog) {
                const userName = creationLog.user ? `${creationLog.user.firstName} ${creationLog.user.lastName}` : 'Sistema';
                console.log(`\n${colors.green}T CREADO:${colors.reset}`);
                console.log(`  Por: ${userName}`);
                console.log(`  Fecha: ${new Date(creationLog.createdAt).toLocaleString()}`);
            }

            if (updateLogs.length > 0) {
                console.log(`\n${colors.yellow}� MODIFICACIONES: ${updateLogs.length}${colors.reset}`);
                const uniqueUsers = [...new Set(updateLogs.map(log => {
                    return log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema';
                }))];
                console.log(`  Usuarios que modificaron: ${uniqueUsers.join(', ')}`);
            }

            if (deletionLog) {
                const userName = deletionLog.user ? `${deletionLog.user.firstName} ${deletionLog.user.lastName}` : 'Sistema';
                console.log(`\n${colors.red}� ELIMINADO:${colors.reset}`);
                console.log(`  Por: ${userName}`);
                console.log(`  Fecha: ${new Date(deletionLog.createdAt).toLocaleString()}`);
            }

            // L�nea de tiempo
            console.log('\n' + colors.magenta + 'P'.repeat(70) + colors.reset);
            console.log(colors.magenta + '  L�NEA DE TIEMPO COMPLETA' + colors.reset);
            console.log(colors.magenta + 'P'.repeat(70) + colors.reset);

            logs.forEach((log, index) => {
                const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema';
                const actionColor = log.action === 'CREATE' ? colors.green :
                                   log.action === 'UPDATE' ? colors.yellow :
                                   log.action === 'DELETE' ? colors.red : colors.blue;

                console.log(`\n${actionColor}${index + 1}. ${log.action}${colors.reset} - ${new Date(log.createdAt).toLocaleString()}`);
                console.log(`   Usuario: ${userName} (${log.user ? log.user.role : 'N/A'})`);
                console.log(`   IP: ${log.ipAddress || 'N/A'}`);
                console.log(`   Estado: ${log.status === 'success' ? 'T' : '�'} ${log.status}`);
                if (log.description) {
                    console.log(`   Descripci�n: ${log.description}`);
                }
            });
        }

        await question('\nPresiona Enter para continuar...');
    } catch (error) {
        printError('Error al obtener historial completo', error);
        await question('\nPresiona Enter para continuar...');
    }
}

// ========== MEN� PRINCIPAL ==========

async function showMenu() {
    printHeader('TEST DE AUDITOR�A - FARMACIA ELIZABETH');

    console.log(colors.cyan + '  Estado de autenticaci�n:' + colors.reset);
    if (authToken) {
        console.log(colors.green + '   Autenticado' + colors.reset);
    } else {
        console.log(colors.red + '   No autenticado' + colors.reset);
    }

    console.log('\n' + colors.yellow + '  OPCIONES GENERALES:' + colors.reset);
    console.log('  1.  Login');
    console.log('  2.  Listar todos los logs');
    console.log('  3.  Obtener log por ID');
    console.log('  4.  Obtener logs por usuario');
    console.log('  5.  Obtener logs por entidad');
    console.log('  6.  Ver estad�sticas de auditor�a');
    console.log('  7.  Ver actividad reciente');
    console.log('  8.  Limpiar logs antiguos (Admin)');
    console.log('\n' + colors.cyan + '  VERIFICACI�N DE TRAZABILIDAD:' + colors.reset);
    console.log('  9.  �Qui�n cre� este elemento?');
    console.log('  10. �Qui�n modific� este elemento?');
    console.log('  11. �Qui�n elimin� este elemento?');
    console.log('  12. Ver historial completo de un elemento');
    console.log('\n  0.  Salir');

    const option = await question('\n  Selecciona una opci�n: ');

    switch (option) {
        case '1':
            await login();
            break;
        case '2':
            await getAllLogs();
            break;
        case '3':
            await getLogById();
            break;
        case '4':
            await getLogsByUser();
            break;
        case '5':
            await getLogsByEntity();
            break;
        case '6':
            await getAuditStats();
            break;
        case '7':
            await getRecentActivity();
            break;
        case '8':
            await cleanOldLogs();
            break;
        case '9':
            await whoCreatedItem();
            break;
        case '10':
            await whoModifiedItem();
            break;
        case '11':
            await whoDeletedItem();
            break;
        case '12':
            await getCompleteHistory();
            break;
        case '0':
            console.log('\n' + colors.green + '�Hasta luego!' + colors.reset + '\n');
            rl.close();
            process.exit(0);
            break;
        default:
            printWarning('Opci�n no v�lida');
            await question('\nPresiona Enter para continuar...');
    }

    await showMenu();
}

// ========== INICIAR ==========

async function init() {
    console.log(colors.magenta + '\n');
    console.log('TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW');
    console.log('Q                                                               Q');
    console.log('Q        TEST DE AUDITOR�A - FARMACIA ELIZABETH                 Q');
    console.log('Q        Sistema de Logs y Trazabilidad                         Q');
    console.log('Q                                                               Q');
    console.log('ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]');
    console.log(colors.reset);

    printInfo(`Servidor: ${BASE_URL}`);
    printInfo(`Hora: ${new Date().toLocaleString()}`);

    // Intentar login autom�tico
    console.log('\n' + colors.blue + 'Intentando login autom�tico...' + colors.reset);
    const logged = await autoLogin();

    if (logged) {
        printSuccess('Login autom�tico exitoso! (admin@farmacia.com)');
    } else {
        printWarning('Login autom�tico fallido. Usa la opci�n 1 para hacer login manual.');
    }

    await question('\nPresiona Enter para comenzar...');

    await showMenu();
}

init().catch(error => {
    console.error(colors.red + 'Error fatal:' + colors.reset, error);
    rl.close();
    process.exit(1);
});
