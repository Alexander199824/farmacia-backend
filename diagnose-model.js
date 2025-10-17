/**
 * Script de Diagnóstico de Modelos
 * Ejecutar: node diagnose-model.js
 */

require('dotenv').config();
const db = require('./app/config/db.config');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(color, symbol, message) {
    console.log(color + symbol + ' ' + message + colors.reset);
}

async function diagnose() {
    console.log(colors.cyan + '\n═══════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '  DIAGNÓSTICO DE MODELOS' + colors.reset);
    console.log(colors.cyan + '═══════════════════════════════════════════════════════\n' + colors.reset);

    try {
        // 1. Verificar que el modelo Invoice existe
        log(colors.cyan, '→', 'Verificando modelo Invoice...');
        
        if (!db.Invoice) {
            log(colors.red, '✗', 'ERROR: Modelo Invoice no está definido en db');
            return false;
        }
        
        log(colors.green, '✓', 'Modelo Invoice existe');
        
        // 2. Verificar hooks
        log(colors.cyan, '→', 'Verificando hooks del modelo...');
        
        const hasHooks = db.Invoice.options && db.Invoice.options.hooks;
        
        if (!hasHooks) {
            log(colors.red, '✗', 'ERROR: No se encontraron hooks en el modelo');
            return false;
        }
        
        log(colors.green, '✓', 'Hooks encontrados');
        
        // 3. Intentar crear un Invoice de prueba
        log(colors.cyan, '→', 'Intentando crear un recibo de prueba...');
        
        const transaction = await db.sequelize.transaction();
        
        try {
            const testInvoice = await db.Invoice.create({
                sellerId: 1,
                clientName: 'Test Diagnóstico',
                subtotal: 100.00,
                total: 100.00,
                paymentMethod: 'efectivo',
                status: 'completada'
            }, { transaction });
            
            await transaction.rollback();
            
            log(colors.green, '✓', `Recibo de prueba creado exitosamente: ${testInvoice.invoiceNumber}`);
            
            // 4. Verificar el formato del número
            const numberFormat = /^REC-\d{6}-\d{6}$/;
            
            if (numberFormat.test(testInvoice.invoiceNumber)) {
                log(colors.green, '✓', 'Formato de número correcto (REC-YYYYMM-NNNNNN)');
            } else {
                log(colors.yellow, '⚠', `Formato de número inesperado: ${testInvoice.invoiceNumber}`);
            }
            
            return true;
            
        } catch (error) {
            await transaction.rollback();
            log(colors.red, '✗', 'ERROR al crear recibo de prueba:');
            console.error(error.message);
            console.error(error.stack);
            return false;
        }
        
    } catch (error) {
        log(colors.red, '✗', 'ERROR en diagnóstico:');
        console.error(error.message);
        console.error(error.stack);
        return false;
    } finally {
        await db.sequelize.close();
    }
}

// Ejecutar diagnóstico
diagnose().then(success => {
    console.log(colors.cyan + '\n═══════════════════════════════════════════════════════' + colors.reset);
    
    if (success) {
        console.log(colors.green + '  ✅ DIAGNÓSTICO EXITOSO' + colors.reset);
        console.log(colors.green + '  El modelo está funcionando correctamente' + colors.reset);
    } else {
        console.log(colors.red + '  ❌ DIAGNÓSTICO FALLIDO' + colors.reset);
        console.log(colors.yellow + '  Revisa los errores arriba' + colors.reset);
    }
    
    console.log(colors.cyan + '═══════════════════════════════════════════════════════\n' + colors.reset);
    
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error(colors.red + '\n❌ Error fatal:' + colors.reset);
    console.error(err);
    process.exit(1);
});