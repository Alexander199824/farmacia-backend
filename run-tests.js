/**
 * Script para Ejecutar Todos los Tests
 * Autor: Alexander Echeverria
 * Ubicacion: run-tests.js
 * 
 * Ejecutar: node run-tests.js [opciones]
 * 
 * Opciones:
 *   --all          Ejecutar todos los tests
 *   --basic        Solo tests básicos (config, usuarios, productos)
 *   --sales        Tests de ventas y facturación
 *   --payments     Tests de pagos con Stripe
 *   --full         Tests completos + reporte HTML
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m'
};

const testFiles = {
    basic: [
        'test-suite.js'
    ],
    sales: [
        'test-invoices.js'
    ],
    payments: [
        'test-payments.js'
    ]
};

const results = {
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0
};

function printHeader() {
    console.log('\n' + colors.cyan + colors.bold);
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║          FARMACIA ELIZABETH - TEST RUNNER                 ║');
    console.log('║          Sistema de Gestión Integral                      ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
}

function log(color, message) {
    console.log(color + message + colors.reset);
}

async function runTest(testFile) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        log(colors.blue, `\n▶ Ejecutando: ${testFile}`);
        log(colors.cyan, '─'.repeat(60));
        
        const testProcess = spawn('node', [testFile], {
            stdio: 'inherit',
            shell: true
        });
        
        testProcess.on('close', (code) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            
            if (code === 0) {
                results.passed++;
                log(colors.green, `✓ ${testFile} completado exitosamente (${duration}s)`);
            } else {
                results.failed++;
                log(colors.red, `✗ ${testFile} falló con código ${code} (${duration}s)`);
            }
            
            results.total++;
            results.duration += parseFloat(duration);
            
            resolve(code === 0);
        });
        
        testProcess.on('error', (error) => {
            log(colors.red, `✗ Error al ejecutar ${testFile}: ${error.message}`);
            results.failed++;
            results.total++;
            resolve(false);
        });
    });
}

async function runTestSuite(suiteName, files) {
    log(colors.magenta + colors.bold, `\n${'═'.repeat(60)}`);
    log(colors.magenta + colors.bold, `  ${suiteName.toUpperCase()}`);
    log(colors.magenta + colors.bold, '═'.repeat(60));
    
    for (const file of files) {
        if (fs.existsSync(file)) {
            await runTest(file);
        } else {
            log(colors.yellow, `⚠ Archivo no encontrado: ${file}`);
        }
    }
}

function printFinalReport() {
    console.log('\n' + colors.cyan + colors.bold);
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    REPORTE FINAL                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    const successRate = results.total > 0 
        ? ((results.passed / results.total) * 100).toFixed(2) 
        : 0;
    
    console.log(colors.cyan + '\n  Suites ejecutadas:  ' + colors.reset + results.total);
    console.log(colors.green + '  Exitosos:           ' + colors.reset + results.passed);
    console.log(colors.red + '  Fallidos:           ' + colors.reset + results.failed);
    console.log(colors.magenta + '  Tasa de éxito:      ' + colors.reset + successRate + '%');
    console.log(colors.blue + '  Duración total:     ' + colors.reset + results.duration.toFixed(2) + 's');
    
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    
    if (results.failed === 0 && results.total > 0) {
        console.log('\n' + colors.green + colors.bold + '  ✓ ¡TODOS LOS TESTS PASARON!' + colors.reset);
    } else if (results.failed > 0) {
        console.log('\n' + colors.red + colors.bold + '  ✗ ALGUNOS TESTS FALLARON' + colors.reset);
    } else {
        console.log('\n' + colors.yellow + colors.bold + '  ⚠ NO SE EJECUTARON TESTS' + colors.reset);
    }
    
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

function generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Tests - Farmacia Elizabeth</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }
        
        .stat-card {
            background: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .stat-card .number {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .stat-card .label {
            color: #666;
            font-size: 1.1em;
        }
        
        .stat-card.total .number { color: #667eea; }
        .stat-card.passed .number { color: #10b981; }
        .stat-card.failed .number { color: #ef4444; }
        .stat-card.rate .number { color: #f59e0b; }
        
        .details {
            padding: 40px;
        }
        
        .details h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .test-list {
            list-style: none;
        }
        
        .test-item {
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .test-item.passed {
            background: #d1fae5;
            border-left: 4px solid #10b981;
        }
        
        .test-item.failed {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e5e7eb;
        }
        
        .badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        
        .badge.success {
            background: #10b981;
            color: white;
        }
        
        .badge.error {
            background: #ef4444;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Farmacia Elizabeth</h1>
            <p>Reporte de Tests del Sistema</p>
            <p style="font-size: 0.9em; margin-top: 10px;">${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card total">
                <div class="number">${results.total}</div>
                <div class="label">Suites Ejecutadas</div>
            </div>
            <div class="stat-card passed">
                <div class="number">${results.passed}</div>
                <div class="label">Exitosos</div>
            </div>
            <div class="stat-card failed">
                <div class="number">${results.failed}</div>
                <div class="label">Fallidos</div>
            </div>
            <div class="stat-card rate">
                <div class="number">${results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0}%</div>
                <div class="label">Tasa de Éxito</div>
            </div>
        </div>
        
        <div class="details">
            <h2>Estado General</h2>
            ${results.failed === 0 && results.total > 0 
                ? '<p style="color: #10b981; font-size: 1.3em; font-weight: bold;">✓ Todos los tests pasaron exitosamente</p>'
                : '<p style="color: #ef4444; font-size: 1.3em; font-weight: bold;">✗ Algunos tests fallaron</p>'
            }
            
            <h2 style="margin-top: 40px;">Métricas</h2>
            <ul class="test-list">
                <li class="test-item ${results.passed > 0 ? 'passed' : 'failed'}">
                    <span>Tests Exitosos</span>
                    <span class="badge ${results.passed > 0 ? 'success' : 'error'}">${results.passed} de ${results.total}</span>
                </li>
                <li class="test-item ${results.failed === 0 ? 'passed' : 'failed'}">
                    <span>Tests Fallidos</span>
                    <span class="badge ${results.failed === 0 ? 'success' : 'error'}">${results.failed}</span>
                </li>
                <li class="test-item passed">
                    <span>Duración Total</span>
                    <span class="badge success">${results.duration.toFixed(2)}s</span>
                </li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Sistema de Gestión Integral - Farmacia Elizabeth</p>
            <p style="margin-top: 5px; font-size: 0.9em;">Desarrollado por Alexander Echeverria</p>
        </div>
    </div>
</body>
</html>
    `;
    
    const reportPath = path.join(__dirname, 'test-report.html');
    fs.writeFileSync(reportPath, html);
    
    log(colors.green, `\n✓ Reporte HTML generado: ${reportPath}`);
    log(colors.cyan, `  Abrir en navegador: file://${reportPath}`);
}

async function main() {
    printHeader();
    
    const args = process.argv.slice(2);
    const mode = args[0] || '--all';
    
    log(colors.magenta, `Modo de ejecución: ${mode}\n`);
    
    const startTime = Date.now();
    
    try {
        switch (mode) {
            case '--basic':
                await runTestSuite('Tests Básicos', testFiles.basic);
                break;
                
            case '--sales':
                await runTestSuite('Tests de Ventas', testFiles.sales);
                break;
                
            case '--payments':
                await runTestSuite('Tests de Pagos', testFiles.payments);
                break;
                
            case '--all':
            case '--full':
                await runTestSuite('Tests Básicos', testFiles.basic);
                await runTestSuite('Tests de Ventas', testFiles.sales);
                await runTestSuite('Tests de Pagos', testFiles.payments);
                
                if (mode === '--full') {
                    generateHTMLReport();
                }
                break;
                
            default:
                log(colors.yellow, `Modo desconocido: ${mode}`);
                log(colors.cyan, '\nModos disponibles:');
                log(colors.cyan, '  --all       Todos los tests');
                log(colors.cyan, '  --basic     Tests básicos');
                log(colors.cyan, '  --sales     Tests de ventas');
                log(colors.cyan, '  --payments  Tests de pagos');
                log(colors.cyan, '  --full      Todos + reporte HTML\n');
                process.exit(1);
        }
        
        printFinalReport();
        
        process.exit(results.failed > 0 ? 1 : 0);
        
    } catch (error) {
        log(colors.red, `\n✗ Error fatal: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

main();