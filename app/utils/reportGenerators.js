const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ==================== GENERADOR DE EXCEL ====================

/**
 * Genera un archivo Excel para reportes de ventas
 */
async function generateSalesExcel(data, period) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte de Ventas');

  // Configurar metadatos
  workbook.creator = 'Farmacia Elizabeth';
  workbook.created = new Date();

  // Título
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = 'REPORTE DE VENTAS';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Información del período
  worksheet.mergeCells('A2:F2');
  worksheet.getCell('A2').value = `Período: ${period.inicio} - ${period.fin}`;
  worksheet.getCell('A2').font = { size: 12 };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // Resumen
  if (data.resumen) {
    worksheet.addRow([]);
    worksheet.addRow(['RESUMEN EJECUTIVO']).font = { bold: true, size: 12 };
    worksheet.addRow(['Ventas Totales:', `Q${data.resumen.ventasActuales || data.total || '0.00'}`]);
    worksheet.addRow(['Transacciones:', data.resumen.transaccionesActuales || data.cantidad || '0']);
    worksheet.addRow(['Ticket Promedio:', `Q${data.resumen.ticketPromedioActual || data.promedio || '0.00'}`]);

    if (data.resumen.crecimientoVentas) {
      worksheet.addRow(['Crecimiento:', `${data.resumen.crecimientoVentas}%`]);
    }
  }

  // Encabezados de datos
  worksheet.addRow([]);
  const headerRow = worksheet.addRow(['#', 'Período', 'Transacciones', 'Total Ventas', 'Ticket Promedio', 'Crecimiento']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Datos
  if (data.results && data.results.length > 0) {
    data.results.forEach((item, index) => {
      const periodo = item.fecha || item.mes || item.semana || item.trimestre || item.semestre || item.año || item.hora || item.dia || 'N/A';
      worksheet.addRow([
        index + 1,
        periodo,
        item.cantidad || 0,
        parseFloat(item.total || 0).toFixed(2),
        parseFloat(item.promedio || 0).toFixed(2),
        item.crecimiento ? `${item.crecimiento}%` : '-'
      ]);
    });
  }

  // Top Productos (si existen)
  if (data.topProductos && data.topProductos.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['TOP 10 PRODUCTOS MÁS VENDIDOS']).font = { bold: true, size: 12 };
    const productsHeaderRow = worksheet.addRow(['#', 'Producto', 'Categoría', 'Cantidad Vendida', 'Ingresos']);
    productsHeaderRow.font = { bold: true };
    productsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    productsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.topProductos.slice(0, 10).forEach((producto, index) => {
      worksheet.addRow([
        index + 1,
        producto.nombre || 'N/A',
        producto.categoria || 'N/A',
        producto.cantidadVendida || 0,
        `Q${parseFloat(producto.ingresos || 0).toFixed(2)}`
      ]);
    });
  }

  // Ajustar anchos de columnas
  worksheet.columns = [
    { width: 10 },
    { width: 25 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 }
  ];

  return workbook;
}

/**
 * Genera un archivo Excel para análisis económico
 */
async function generateEconomicAnalysisExcel(data, period) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Análisis Económico');

  // Título
  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = 'ANÁLISIS ECONÓMICO AVANZADO';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Resumen
  worksheet.addRow([]);
  worksheet.addRow(['RESUMEN EJECUTIVO']).font = { bold: true, size: 12 };
  worksheet.addRow(['Ventas Actuales:', `Q${data.resumen.ventasActuales}`]);
  worksheet.addRow(['Ventas Anteriores:', `Q${data.resumen.ventasAnteriores}`]);
  worksheet.addRow(['Crecimiento:', `${data.resumen.crecimientoVentas}%`]);
  worksheet.addRow(['Transacciones Actuales:', data.resumen.transaccionesActuales]);
  worksheet.addRow(['Ticket Promedio:', `Q${data.resumen.ticketPromedioActual}`]);

  // Ventas por día de la semana
  if (data.ventasPorDiaSemana && data.ventasPorDiaSemana.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['VENTAS POR DÍA DE LA SEMANA']).font = { bold: true, size: 12 };
    const weekHeaderRow = worksheet.addRow(['Día', 'Transacciones', 'Total Ventas']);
    weekHeaderRow.font = { bold: true };
    weekHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    weekHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.ventasPorDiaSemana.forEach(dia => {
      worksheet.addRow([dia.dia, dia.cantidad, `Q${dia.total}`]);
    });
  }

  // Horas pico
  if (data.horasPico && data.horasPico.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['HORAS PICO DE VENTA']).font = { bold: true, size: 12 };
    const hoursHeaderRow = worksheet.addRow(['Hora', 'Transacciones', 'Total Ventas']);
    hoursHeaderRow.font = { bold: true };
    hoursHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    };
    hoursHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.horasPico.forEach(hora => {
      worksheet.addRow([hora.hora, hora.cantidad, `Q${hora.total}`]);
    });
  }

  // Top productos
  if (data.topProductos && data.topProductos.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['TOP PRODUCTOS MÁS VENDIDOS']).font = { bold: true, size: 12 };
    const productsHeaderRow = worksheet.addRow(['Producto', 'Categoría', 'Cantidad', 'Ingresos']);
    productsHeaderRow.font = { bold: true };
    productsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    productsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.topProductos.slice(0, 10).forEach(producto => {
      worksheet.addRow([
        producto.nombre,
        producto.categoria,
        producto.cantidadVendida,
        `Q${producto.ingresos}`
      ]);
    });
  }

  // Ajustar anchos
  worksheet.columns = [
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 }
  ];

  return workbook;
}

/**
 * Genera un archivo Excel para mejores días de venta
 */
async function generateBestSalesDaysExcel(data, period) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Mejores Días de Venta');

  // Título
  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = 'ANÁLISIS DE MEJORES DÍAS DE VENTA';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Mejor día de la semana
  worksheet.addRow([]);
  worksheet.addRow(['MEJOR DÍA DE LA SEMANA']).font = { bold: true, size: 12 };
  worksheet.addRow(['Día:', data.mejorDiaSemana.dia]);
  worksheet.addRow(['Total Ventas:', `Q${data.mejorDiaSemana.totalVentas}`]);
  worksheet.addRow(['Transacciones:', data.mejorDiaSemana.totalTransacciones]);
  worksheet.addRow(['Promedio por Día:', `Q${data.mejorDiaSemana.promedioVentasPorDia}`]);

  // Peor día
  if (data.peorDiaSemana) {
    worksheet.addRow([]);
    worksheet.addRow(['PEOR DÍA DE LA SEMANA']).font = { bold: true, size: 12 };
    worksheet.addRow(['Día:', data.peorDiaSemana.dia]);
    worksheet.addRow(['Total Ventas:', `Q${data.peorDiaSemana.totalVentas}`]);
    worksheet.addRow(['Diferencia:', data.diferenciaEntreExtremos]);
  }

  // Ranking de días de la semana
  if (data.rankingDiasSemana && data.rankingDiasSemana.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['RANKING DE DÍAS DE LA SEMANA']).font = { bold: true, size: 12 };
    const rankingHeaderRow = worksheet.addRow(['Posición', 'Día', 'Total Ventas', 'Transacciones']);
    rankingHeaderRow.font = { bold: true };
    rankingHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    rankingHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.rankingDiasSemana.forEach((dia, index) => {
      worksheet.addRow([
        index + 1,
        dia.dia,
        `Q${dia.totalVentas}`,
        dia.totalTransacciones
      ]);
    });
  }

  // Mejores días del mes
  if (data.mejoresDiasMes && data.mejoresDiasMes.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['TOP 10 DÍAS DEL MES']).font = { bold: true, size: 12 };
    const daysHeaderRow = worksheet.addRow(['Posición', 'Día del Mes', 'Total Ventas', 'Transacciones']);
    daysHeaderRow.font = { bold: true };
    daysHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    };
    daysHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.mejoresDiasMes.slice(0, 10).forEach((dia, index) => {
      worksheet.addRow([
        index + 1,
        dia.dia,
        `Q${dia.totalVentas}`,
        dia.totalTransacciones
      ]);
    });
  }

  // Recomendaciones
  if (data.recomendaciones && data.recomendaciones.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['RECOMENDACIONES INTELIGENTES']).font = { bold: true, size: 12 };
    const recHeaderRow = worksheet.addRow(['Tipo', 'Mensaje', 'Impacto']);
    recHeaderRow.font = { bold: true };
    recHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    recHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.recomendaciones.forEach(rec => {
      worksheet.addRow([rec.tipo, rec.mensaje, rec.impacto.toUpperCase()]);
    });
  }

  // Ajustar anchos
  worksheet.columns = [
    { width: 15 },
    { width: 25 },
    { width: 20 },
    { width: 20 },
    { width: 60 }
  ];

  return workbook;
}

// ==================== GENERADOR DE PDF ====================

/**
 * Genera un PDF para reportes de ventas
 */
function generateSalesPDF(data, period) {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

  // Título
  doc.fontSize(20).font('Helvetica-Bold').text('REPORTE DE VENTAS', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(`Período: ${period.inicio} - ${period.fin}`, { align: 'center' });
  doc.moveDown(2);

  // Resumen
  if (data.resumen) {
    doc.fontSize(14).font('Helvetica-Bold').text('RESUMEN EJECUTIVO');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Ventas Totales: Q${data.resumen.ventasActuales || data.total || '0.00'}`);
    doc.text(`Transacciones: ${data.resumen.transaccionesActuales || data.cantidad || '0'}`);
    doc.text(`Ticket Promedio: Q${data.resumen.ticketPromedioActual || data.promedio || '0.00'}`);
    if (data.resumen.crecimientoVentas) {
      doc.text(`Crecimiento: ${data.resumen.crecimientoVentas}%`);
    }
    doc.moveDown(2);
  }

  // Tabla de datos
  if (data.results && data.results.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('DETALLE DE VENTAS');
    doc.moveDown();

    // Encabezados de tabla
    const tableTop = doc.y;
    const itemHeight = 25;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Período', 50, tableTop, { width: 150 });
    doc.text('Trans.', 200, tableTop, { width: 60, align: 'right' });
    doc.text('Total Ventas', 270, tableTop, { width: 100, align: 'right' });
    doc.text('Ticket Prom.', 380, tableTop, { width: 100, align: 'right' });

    // Línea separadora
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Datos
    let y = tableTop + 20;
    doc.fontSize(9).font('Helvetica');

    data.results.slice(0, 20).forEach((item, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const periodo = item.fecha || item.mes || item.semana || item.trimestre || item.semestre || item.año || item.hora || item.dia || 'N/A';
      doc.text(periodo, 50, y, { width: 150 });
      doc.text(item.cantidad || '0', 200, y, { width: 60, align: 'right' });
      doc.text(`Q${parseFloat(item.total || 0).toFixed(2)}`, 270, y, { width: 100, align: 'right' });
      doc.text(`Q${parseFloat(item.promedio || 0).toFixed(2)}`, 380, y, { width: 100, align: 'right' });

      y += itemHeight;
    });
  }

  // Top Productos
  if (data.topProductos && data.topProductos.length > 0) {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('TOP 10 PRODUCTOS MÁS VENDIDOS');
    doc.moveDown();

    const tableTop = doc.y;
    const itemHeight = 25;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Producto', 50, tableTop, { width: 200 });
    doc.text('Categoría', 260, tableTop, { width: 100 });
    doc.text('Cantidad', 370, tableTop, { width: 80, align: 'right' });
    doc.text('Ingresos', 460, tableTop, { width: 80, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 20;
    doc.fontSize(9).font('Helvetica');

    data.topProductos.slice(0, 10).forEach((producto, index) => {
      doc.text(producto.nombre || 'N/A', 50, y, { width: 200 });
      doc.text(producto.categoria || 'N/A', 260, y, { width: 100 });
      doc.text(producto.cantidadVendida || '0', 370, y, { width: 80, align: 'right' });
      doc.text(`Q${parseFloat(producto.ingresos || 0).toFixed(2)}`, 460, y, { width: 80, align: 'right' });

      y += itemHeight;
    });
  }

  // Footer
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    doc.fontSize(8).font('Helvetica').text(
      `Generado por Farmacia Elizabeth - ${new Date().toLocaleString('es-GT')}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
    doc.text(
      `Página ${i + 1} de ${pages.count}`,
      50,
      doc.page.height - 35,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Genera un PDF para análisis económico
 */
function generateEconomicAnalysisPDF(data, period) {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

  // Título
  doc.fontSize(20).font('Helvetica-Bold').text('ANÁLISIS ECONÓMICO AVANZADO', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(`Período: ${period.inicio} - ${period.fin}`, { align: 'center' });
  doc.moveDown(2);

  // Resumen Ejecutivo
  doc.fontSize(14).font('Helvetica-Bold').text('RESUMEN EJECUTIVO');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Ventas Actuales: Q${data.resumen.ventasActuales}`);
  doc.text(`Ventas Anteriores: Q${data.resumen.ventasAnteriores}`);
  doc.text(`Crecimiento: ${data.resumen.crecimientoVentas}%`);
  doc.text(`Transacciones Actuales: ${data.resumen.transaccionesActuales}`);
  doc.text(`Ticket Promedio: Q${data.resumen.ticketPromedioActual}`);
  doc.moveDown(2);

  // Ventas por día de la semana
  if (data.ventasPorDiaSemana && data.ventasPorDiaSemana.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('VENTAS POR DÍA DE LA SEMANA');
    doc.moveDown();

    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Día', 50, tableTop, { width: 100 });
    doc.text('Transacciones', 200, tableTop, { width: 100, align: 'right' });
    doc.text('Total Ventas', 350, tableTop, { width: 100, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

    let y = tableTop + 20;
    doc.fontSize(9).font('Helvetica');

    data.ventasPorDiaSemana.forEach(dia => {
      doc.text(dia.dia, 50, y, { width: 100 });
      doc.text(dia.cantidad.toString(), 200, y, { width: 100, align: 'right' });
      doc.text(`Q${dia.total}`, 350, y, { width: 100, align: 'right' });
      y += 20;
    });

    doc.moveDown(2);
  }

  // Horas Pico
  if (data.horasPico && data.horasPico.length > 0) {
    if (doc.y > 650) doc.addPage();

    doc.fontSize(14).font('Helvetica-Bold').text('HORAS PICO DE VENTA');
    doc.moveDown();

    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Hora', 50, tableTop, { width: 100 });
    doc.text('Transacciones', 200, tableTop, { width: 100, align: 'right' });
    doc.text('Total Ventas', 350, tableTop, { width: 100, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

    let y = tableTop + 20;
    doc.fontSize(9).font('Helvetica');

    data.horasPico.slice(0, 10).forEach(hora => {
      doc.text(hora.hora, 50, y, { width: 100 });
      doc.text(hora.cantidad.toString(), 200, y, { width: 100, align: 'right' });
      doc.text(`Q${hora.total}`, 350, y, { width: 100, align: 'right' });
      y += 20;
    });
  }

  // Footer
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    doc.fontSize(8).font('Helvetica').text(
      `Generado por Farmacia Elizabeth - ${new Date().toLocaleString('es-GT')}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Genera un PDF para mejores días de venta
 */
function generateBestSalesDaysPDF(data, period) {
  try {
    // Validaciones
    if (!data) {
      console.error('generateBestSalesDaysPDF: data is undefined');
      throw new Error('Datos no proporcionados');
    }
    if (!period) {
      console.error('generateBestSalesDaysPDF: period is undefined');
      throw new Error('Período no proporcionado');
    }
    if (!data.mejorDiaSemana) {
      console.error('generateBestSalesDaysPDF: mejorDiaSemana is undefined');
      throw new Error('No hay datos de mejor día de la semana');
    }

    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    // Título
    doc.fontSize(20).font('Helvetica-Bold').text('ANÁLISIS DE MEJORES DÍAS DE VENTA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Período: ${period.inicio || 'N/A'} - ${period.fin || 'N/A'}`, { align: 'center' });
    doc.moveDown(2);

    // Mejor día de la semana
    doc.fontSize(14).font('Helvetica-Bold').text('MEJOR DÍA DE LA SEMANA');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Día: ${data.mejorDiaSemana.dia || 'N/A'}`);
    doc.text(`Total Ventas: Q${data.mejorDiaSemana.totalVentas || '0.00'}`);
    doc.text(`Transacciones: ${data.mejorDiaSemana.totalTransacciones || 0}`);
    doc.text(`Promedio por Día: Q${data.mejorDiaSemana.promedioVentasPorDia || '0.00'}`);
    doc.moveDown(2);

    // Peor día
    if (data.peorDiaSemana) {
      doc.fontSize(14).font('Helvetica-Bold').text('PEOR DÍA DE LA SEMANA');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Día: ${data.peorDiaSemana.dia}`);
      doc.text(`Total Ventas: Q${data.peorDiaSemana.totalVentas}`);
      doc.text(`Diferencia: ${data.diferenciaEntreExtremos}`);
      doc.moveDown(2);
    }

    // Ranking de días
    if (data.rankingDiasSemana && data.rankingDiasSemana.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('RANKING DE DÍAS DE LA SEMANA');
      doc.moveDown();

      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('#', 50, tableTop, { width: 30 });
      doc.text('Día', 90, tableTop, { width: 100 });
      doc.text('Ventas', 250, tableTop, { width: 100, align: 'right' });
      doc.text('Trans.', 380, tableTop, { width: 80, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

      let y = tableTop + 20;
      doc.fontSize(9).font('Helvetica');

      data.rankingDiasSemana.forEach((dia, index) => {
        doc.text((index + 1).toString(), 50, y, { width: 30 });
        doc.text(dia.dia, 90, y, { width: 100 });
        doc.text(`Q${dia.totalVentas}`, 250, y, { width: 100, align: 'right' });
        doc.text(dia.totalTransacciones.toString(), 380, y, { width: 80, align: 'right' });
        y += 20;
      });
    }

    // Recomendaciones
    if (data.recomendaciones && data.recomendaciones.length > 0) {
      if (doc.y > 650) doc.addPage();

      doc.moveDown(2);
      doc.fontSize(14).font('Helvetica-Bold').text('RECOMENDACIONES INTELIGENTES');
      doc.moveDown();

      doc.fontSize(10).font('Helvetica');
      data.recomendaciones.forEach((rec, index) => {
        doc.font('Helvetica-Bold').text(`${index + 1}. [${rec.tipo.toUpperCase()}] - Impacto: ${rec.impacto.toUpperCase()}`);
        doc.font('Helvetica').text(rec.mensaje, { indent: 20 });
        doc.moveDown(0.5);
      });
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i);
      doc.fontSize(8).font('Helvetica').text(
        `Generado por Farmacia Elizabeth - ${new Date().toLocaleString('es-GT')}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }

    return doc;
  } catch (error) {
    console.error('Error en generateBestSalesDaysPDF:', error);
    throw error;
  }
}

/**
 * Genera un archivo Excel para ventas completas detalladas
 */
async function generateSalesCompleteExcel(data, periodLabel) {
  const workbook = new ExcelJS.Workbook();

  // === HOJA 1: RESUMEN ===
  const resumenSheet = workbook.addWorksheet('Resumen');

  // Título
  resumenSheet.mergeCells('A1:F1');
  resumenSheet.getCell('A1').value = 'VENTAS COMPLETAS - REPORTE DETALLADO';
  resumenSheet.getCell('A1').font = { size: 18, bold: true };
  resumenSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  resumenSheet.getRow(1).height = 35;

  // Período
  resumenSheet.mergeCells('A2:F2');
  resumenSheet.getCell('A2').value = `Período: ${periodLabel}`;
  resumenSheet.getCell('A2').font = { size: 12, bold: true };
  resumenSheet.getCell('A2').alignment = { horizontal: 'center' };

  // Resumen ejecutivo
  resumenSheet.addRow([]);
  resumenSheet.addRow(['RESUMEN EJECUTIVO']).font = { bold: true, size: 14, color: { argb: 'FF0066CC' } };
  resumenSheet.addRow(['Total Ventas:', `Q${data.resumen.totalVentas}`]);
  resumenSheet.addRow(['Total Transacciones:', data.resumen.totalTransacciones]);
  resumenSheet.addRow(['Ticket Promedio:', `Q${data.resumen.ticketPromedio}`]);
  resumenSheet.addRow(['Total Productos Vendidos:', data.resumen.totalProductosVendidos]);

  // Ventas por método de pago
  if (data.ventasPorMetodo && data.ventasPorMetodo.length > 0) {
    resumenSheet.addRow([]);
    resumenSheet.addRow(['VENTAS POR MÉTODO DE PAGO']).font = { bold: true, size: 12 };
    const metodoHeaderRow = resumenSheet.addRow(['Método de Pago', 'Transacciones', 'Total']);
    metodoHeaderRow.font = { bold: true };
    metodoHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    metodoHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.ventasPorMetodo.forEach(metodo => {
      resumenSheet.addRow([metodo.metodo, metodo.cantidad, `Q${metodo.total.toFixed(2)}`]);
    });
  }

  // Top productos
  if (data.topProductos && data.topProductos.length > 0) {
    resumenSheet.addRow([]);
    resumenSheet.addRow(['TOP 10 PRODUCTOS MÁS VENDIDOS']).font = { bold: true, size: 12 };
    const topHeaderRow = resumenSheet.addRow(['Producto', 'Categoría', 'Cantidad', 'Ingresos']);
    topHeaderRow.font = { bold: true };
    topHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    topHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.topProductos.slice(0, 10).forEach(producto => {
      resumenSheet.addRow([
        producto.nombre,
        producto.categoria,
        producto.cantidad,
        `Q${producto.ingresos.toFixed(2)}`
      ]);
    });
  }

  resumenSheet.columns = [
    { width: 30 },
    { width: 20 },
    { width: 20 },
    { width: 20 }
  ];

  // === HOJA 2: VENTAS DETALLADAS ===
  const ventasSheet = workbook.addWorksheet('Ventas Detalladas');

  ventasSheet.mergeCells('A1:I1');
  ventasSheet.getCell('A1').value = 'DETALLE DE VENTAS';
  ventasSheet.getCell('A1').font = { size: 16, bold: true };
  ventasSheet.getCell('A1').alignment = { horizontal: 'center' };
  ventasSheet.getRow(1).height = 25;

  // Encabezados
  const ventasHeaderRow = ventasSheet.addRow([
    'Nº Factura',
    'Fecha',
    'Hora',
    'Cliente',
    'NIT',
    'Vendedor',
    'Método Pago',
    'Subtotal',
    'Descuento',
    'Total'
  ]);
  ventasHeaderRow.font = { bold: true };
  ventasHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  ventasHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Datos de ventas
  data.ventas.forEach(venta => {
    const fecha = new Date(venta.fecha);
    ventasSheet.addRow([
      venta.numero,
      fecha.toLocaleDateString('es-GT'),
      fecha.toLocaleTimeString('es-GT'),
      venta.cliente.nombre,
      venta.cliente.nit,
      venta.vendedor,
      venta.metodoPago,
      `Q${venta.subtotal}`,
      `Q${venta.descuento}`,
      `Q${venta.total}`
    ]);
  });

  ventasSheet.columns = [
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 25 },
    { width: 15 },
    { width: 20 },
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 12 }
  ];

  // === HOJA 3: PRODUCTOS VENDIDOS ===
  const productosSheet = workbook.addWorksheet('Productos Vendidos');

  productosSheet.mergeCells('A1:F1');
  productosSheet.getCell('A1').value = 'DETALLE DE PRODUCTOS VENDIDOS';
  productosSheet.getCell('A1').font = { size: 16, bold: true };
  productosSheet.getCell('A1').alignment = { horizontal: 'center' };
  productosSheet.getRow(1).height = 25;

  const productosHeaderRow = productosSheet.addRow([
    'Nº Factura',
    'Fecha',
    'Producto',
    'SKU',
    'Categoría',
    'Cantidad',
    'Precio Unit.',
    'Subtotal'
  ]);
  productosHeaderRow.font = { bold: true };
  productosHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };
  productosHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Datos de productos
  data.ventas.forEach(venta => {
    const fecha = new Date(venta.fecha);
    venta.items.forEach(item => {
      productosSheet.addRow([
        venta.numero,
        fecha.toLocaleDateString('es-GT'),
        item.producto,
        item.sku,
        item.categoria,
        item.cantidad,
        `Q${item.precioUnitario}`,
        `Q${item.subtotal}`
      ]);
    });
  });

  productosSheet.columns = [
    { width: 15 },
    { width: 12 },
    { width: 30 },
    { width: 15 },
    { width: 20 },
    { width: 10 },
    { width: 12 },
    { width: 12 }
  ];

  // === HOJA 4: TENDENCIA DIARIA ===
  if (data.tendenciaDiaria && data.tendenciaDiaria.length > 0) {
    const tendenciaSheet = workbook.addWorksheet('Tendencia Diaria');

    tendenciaSheet.mergeCells('A1:C1');
    tendenciaSheet.getCell('A1').value = 'TENDENCIA DIARIA DE VENTAS';
    tendenciaSheet.getCell('A1').font = { size: 16, bold: true };
    tendenciaSheet.getCell('A1').alignment = { horizontal: 'center' };

    const tendenciaHeaderRow = tendenciaSheet.addRow(['Fecha', 'Transacciones', 'Total Ventas']);
    tendenciaHeaderRow.font = { bold: true };
    tendenciaHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    };
    tendenciaHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.tendenciaDiaria.forEach(dia => {
      tendenciaSheet.addRow([
        dia.fecha,
        dia.cantidad,
        `Q${dia.total.toFixed(2)}`
      ]);
    });

    tendenciaSheet.columns = [
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];
  }

  return workbook;
}

/**
 * Genera un PDF para ventas completas detalladas
 */
function generateSalesCompletePDF(data, periodLabel) {
  const doc = new PDFDocument({ margin: 40, size: 'LETTER' });

  // Título principal
  doc.fontSize(18).font('Helvetica-Bold').text('VENTAS COMPLETAS', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Reporte Detallado', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica-Bold').text(`Período: ${periodLabel}`, { align: 'center' });
  doc.moveDown(2);

  // Resumen ejecutivo
  doc.fontSize(14).font('Helvetica-Bold').text('RESUMEN EJECUTIVO');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');

  // Cuadro de resumen
  const startY = doc.y;
  doc.rect(50, startY, 250, 80).stroke();

  doc.text(`Total Ventas: Q${data.resumen.totalVentas}`, 60, startY + 10);
  doc.text(`Transacciones: ${data.resumen.totalTransacciones}`, 60, startY + 25);
  doc.text(`Ticket Promedio: Q${data.resumen.ticketPromedio}`, 60, startY + 40);
  doc.text(`Productos Vendidos: ${data.resumen.totalProductosVendidos}`, 60, startY + 55);

  doc.y = startY + 90;
  doc.moveDown();

  // Ventas por método de pago
  if (data.ventasPorMetodo && data.ventasPorMetodo.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('VENTAS POR MÉTODO DE PAGO');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Método', 50, tableTop);
    doc.text('Trans.', 200, tableTop, { width: 60, align: 'right' });
    doc.text('Total', 270, tableTop, { width: 100, align: 'right' });

    doc.moveTo(50, tableTop + 12).lineTo(400, tableTop + 12).stroke();

    let y = tableTop + 15;
    doc.fontSize(9).font('Helvetica');

    data.ventasPorMetodo.forEach(metodo => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(metodo.metodo, 50, y);
      doc.text(metodo.cantidad.toString(), 200, y, { width: 60, align: 'right' });
      doc.text(`Q${metodo.total.toFixed(2)}`, 270, y, { width: 100, align: 'right' });
      y += 15;
    });

    doc.y = y + 10;
  }

  // Top productos
  if (data.topProductos && data.topProductos.length > 0) {
    if (doc.y > 650) doc.addPage();

    doc.fontSize(12).font('Helvetica-Bold').text('TOP 10 PRODUCTOS');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Producto', 50, tableTop, { width: 200 });
    doc.text('Cant.', 260, tableTop, { width: 50, align: 'right' });
    doc.text('Ingresos', 320, tableTop, { width: 80, align: 'right' });

    doc.moveTo(50, tableTop + 12).lineTo(400, tableTop + 12).stroke();

    let y = tableTop + 15;
    doc.fontSize(8).font('Helvetica');

    data.topProductos.slice(0, 10).forEach(producto => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(producto.nombre, 50, y, { width: 200 });
      doc.text(producto.cantidad.toString(), 260, y, { width: 50, align: 'right' });
      doc.text(`Q${producto.ingresos.toFixed(2)}`, 320, y, { width: 80, align: 'right' });
      y += 12;
    });
  }

  // Nueva página para ventas detalladas
  doc.addPage();
  doc.fontSize(14).font('Helvetica-Bold').text('DETALLE DE VENTAS');
  doc.moveDown();

  const tableTop = doc.y;
  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('Factura', 50, tableTop, { width: 60 });
  doc.text('Fecha', 115, tableTop, { width: 60 });
  doc.text('Cliente', 180, tableTop, { width: 120 });
  doc.text('Método', 305, tableTop, { width: 80 });
  doc.text('Total', 390, tableTop, { width: 80, align: 'right' });

  doc.moveTo(50, tableTop + 10).lineTo(550, tableTop + 10).stroke();

  let y = tableTop + 13;
  doc.fontSize(7).font('Helvetica');

  // Mostrar primeras 50 ventas en PDF (limitado por espacio)
  data.ventas.slice(0, 50).forEach(venta => {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }

    const fecha = new Date(venta.fecha);
    doc.text(venta.numero, 50, y, { width: 60 });
    doc.text(fecha.toLocaleDateString('es-GT'), 115, y, { width: 60 });
    doc.text(venta.cliente.nombre, 180, y, { width: 120 });
    doc.text(venta.metodoPago, 305, y, { width: 80 });
    doc.text(`Q${venta.total}`, 390, y, { width: 80, align: 'right' });

    y += 12;
  });

  if (data.ventas.length > 50) {
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica-Oblique').text(
      `Mostrando las primeras 50 ventas de ${data.ventas.length} totales. Descargue el Excel para ver todas.`,
      { align: 'center' }
    );
  }

  // Footer en todas las páginas
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    doc.fontSize(8).font('Helvetica').text(
      `Generado por Farmacia Elizabeth - ${new Date().toLocaleString('es-GT')}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
    doc.text(
      `Página ${i + 1} de ${pages.count}`,
      50,
      doc.page.height - 35,
      { align: 'center' }
    );
  }

  return doc;
}

module.exports = {
  generateSalesExcel,
  generateEconomicAnalysisExcel,
  generateBestSalesDaysExcel,
  generateSalesPDF,
  generateEconomicAnalysisPDF,
  generateBestSalesDaysPDF,
  generateSalesCompleteExcel,
  generateSalesCompletePDF
};
