# 🧪 GUÍA DEL TEST COMPLETO DE REPORTES

## 📋 Descripción

`test-reportes-completo-final.js` es una suite completa de pruebas que verifica **TODAS** las funcionalidades del sistema de reportes:

- ✅ **9 Reportes Básicos**
- ✅ **4 Reportes Avanzados**
- ✅ **6 Descargas** (3 reportes × 2 formatos)

**Total: 19 pruebas** que cubren el 100% del sistema de reportes.

---

## 🚀 Cómo Ejecutar

### 1. Asegúrate de que el servidor esté corriendo

```bash
npm start
# o
npm run dev
```

El servidor debe estar corriendo en `http://localhost:5000`

### 2. Ejecuta el test completo

```bash
node test-reportes-completo-final.js
```

### 3. Espera los resultados

El test tomará aproximadamente **15-30 segundos** dependiendo de la cantidad de datos en tu base de datos.

---

## 📊 ¿Qué prueba este test?

### PARTE 1: Reportes Básicos (9 pruebas)

1. **Dashboard** - 3 períodos (today, week, month)
2. **Reportes de Ventas** - Por producto, categoría, cliente
3. **Top Productos** - 10 productos más vendidos
4. **Inventario** - Métricas generales de inventario
5. **Productos por Vencer** - Lotes próximos a expirar
6. **Movimientos de Inventario** - Historial de movimientos
7. **Clientes** - Análisis de clientes
8. **Rendimiento Repartidores** - Métricas de delivery
9. **Reporte Financiero** - Análisis financiero general

### PARTE 2: Reportes Avanzados (4 pruebas)

1. **Períodos de Tiempo** - 7 agrupaciones diferentes
   - Por hora
   - Por día
   - Por semana
   - Por mes
   - Por trimestre
   - Por semestre
   - Por año

2. **Análisis Económico**
   - Comparación automática de períodos
   - Ventas por día de semana
   - Horas pico
   - Top productos
   - Tendencias diarias

3. **Mejores Días de Venta**
   - Mejor/peor día de la semana
   - Ranking completo de días
   - Top 10 días del mes
   - Mejores horas
   - Recomendaciones inteligentes

4. **Prueba con Rango de Fechas**
   - Filtros personalizados
   - Último mes de datos

### PARTE 3: Descargas (6 pruebas)

1. **Reporte de Ventas**
   - ✅ Excel (.xlsx)
   - ✅ PDF (.pdf)

2. **Análisis Económico**
   - ✅ Excel (.xlsx)
   - ✅ PDF (.pdf)

3. **Mejores Días de Venta**
   - ✅ Excel (.xlsx)
   - ✅ PDF (.pdf)

---

## 📁 Archivos que se Generan

Después de ejecutar el test, se crearán **6 archivos** en la raíz del proyecto:

```
farmacia-backend/
├── reporte-ventas.xlsx          (Reporte de ventas en Excel)
├── reporte-ventas.pdf           (Reporte de ventas en PDF)
├── analisis-economico.xlsx      (Análisis económico en Excel)
├── analisis-economico.pdf       (Análisis económico en PDF)
├── mejores-dias.xlsx            (Mejores días en Excel)
└── mejores-dias.pdf             (Mejores días en PDF)
```

**Tamaño aproximado:** 100-500 KB cada archivo (dependiendo de los datos)

---

## 📊 Salida del Test

El test mostrará información detallada en la consola con colores:

### Durante la Ejecución

```
🔐 Iniciando sesión...
✅ Login exitoso

╔═══════════════════════════════════════════════════════╗
║              📊 REPORTES BÁSICOS (9)                  ║
╚═══════════════════════════════════════════════════════╝

📊 Probando Dashboard...
✅ Dashboard [today]:
   - Ventas Totales: Q15,430.50
   - Transacciones: 45
   ...

╔═══════════════════════════════════════════════════════╗
║           📈 REPORTES AVANZADOS (4)                   ║
╚═══════════════════════════════════════════════════════╝

═══════════════════════════════════════
  🕐 PERÍODOS DE TIEMPO
═══════════════════════════════════════

✅ Por Hora: 24 resultados
✅ Por Día: 30 resultados
...
```

### Resumen Final

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║              📊 RESUMEN FINAL COMPLETO                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📈 ESTADÍSTICAS GENERALES:
   ✅ Pruebas Exitosas: 19/19
   ❌ Pruebas Fallidas: 0/19
   📊 Porcentaje de Éxito: 100.00%
   ⏱️  Tiempo Total: 23.45s

📋 DESGLOSE POR CATEGORÍA:
   📊 Reportes Básicos: 9 pruebas
   📈 Reportes Avanzados: 4 pruebas
   📥 Descargas: 6 archivos (3 reportes × 2 formatos)

📥 ESTADÍSTICAS DE DESCARGAS:
   ✅ Descargas Exitosas: 6/6
   ❌ Descargas Fallidas: 0/6

📁 ARCHIVOS DESCARGADOS:
   1. reporte-ventas.xlsx
      Tamaño: 45.32 KB
   2. reporte-ventas.pdf
      Tamaño: 78.21 KB
   ...

🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!
```

---

## ⚠️ Requisitos Previos

### 1. Servidor corriendo
```bash
npm start
```

### 2. Usuario admin creado

Debe existir un usuario con:
- Email: `admin@farmacia.com`
- Password: `Admin123!`
- Rol: `admin`

### 3. Base de datos con datos

Para que los reportes tengan contenido, la base de datos debe tener:
- ✅ Productos
- ✅ Facturas (invoices)
- ✅ Clientes
- ✅ Lotes de productos (opcional)
- ✅ Pedidos online (opcional)

---

## 🔧 Solución de Problemas

### ❌ Error: "Cannot connect to server"

**Problema:** El servidor no está corriendo

**Solución:**
```bash
npm start
```

### ❌ Error: "Invalid credentials"

**Problema:** No existe el usuario admin

**Solución:**
Crea un usuario admin manualmente o ejecuta el seeder de la base de datos.

### ❌ Error: "No data found"

**Problema:** La base de datos está vacía

**Solución:**
- Agrega datos de prueba manualmente
- Ejecuta un script de seed
- Realiza algunas ventas de prueba

### ⚠️ Algunas pruebas fallan

**Si solo fallan 1-2 pruebas:**
- Es normal si no tienes datos de pedidos online o delivery
- Los reportes que requieren esos datos mostrarán arrays vacíos

**Si fallan muchas pruebas:**
- Verifica que el servidor esté corriendo
- Revisa los logs del servidor para ver errores
- Asegúrate de que la base de datos esté conectada

---

## 📝 Interpretando los Resultados

### ✅ 100% de Éxito
```
✅ Pruebas Exitosas: 19/19
📊 Porcentaje de Éxito: 100.00%
```
**Significado:** ¡Todo perfecto! El sistema de reportes está completamente funcional.

### ⚠️ Éxito Parcial
```
✅ Pruebas Exitosas: 16/19
❌ Pruebas Fallidas: 3/19
📊 Porcentaje de Éxito: 84.21%
```
**Significado:** La mayoría funciona bien. Revisa qué pruebas fallaron en la sección "PRUEBAS FALLIDAS".

### ❌ Muchos Errores
```
✅ Pruebas Exitosas: 5/19
❌ Pruebas Fallidas: 14/19
📊 Porcentaje de Éxito: 26.32%
```
**Significado:** Hay un problema grave. Verifica:
- ¿Está el servidor corriendo?
- ¿Está la base de datos conectada?
- ¿Hay errores en los logs del servidor?

---

## 🎯 Verificación de Archivos Descargados

Después del test, abre cada archivo y verifica:

### Excel (.xlsx)
- ✅ Se abre correctamente en Excel/Google Sheets/LibreOffice
- ✅ Tiene formato profesional con colores
- ✅ Los datos son correctos y están formateados
- ✅ Las tablas tienen encabezados claros
- ✅ Los números están formateados como moneda

### PDF (.pdf)
- ✅ Se abre correctamente en cualquier lector PDF
- ✅ Tiene márgenes y espaciado adecuados
- ✅ Las tablas están bien alineadas
- ✅ El texto es legible
- ✅ Tiene paginación si es necesario

---

## 🚀 Siguientes Pasos

Después de que todas las pruebas pasen:

1. **Revisa los archivos descargados**
   - Abre cada Excel y PDF
   - Verifica formato y contenido

2. **Integra en tu frontend**
   - Usa los ejemplos de `GUIA_DESCARGAS_REPORTES.md`
   - Implementa botones de descarga

3. **Personaliza las plantillas**
   - Agrega logo de tu empresa
   - Ajusta colores corporativos
   - Personaliza encabezados

4. **Configura reportes programados** (futuro)
   - Envío automático por email
   - Generación diaria/semanal/mensual

---

## 📚 Documentación Relacionada

- **RESUMEN_SISTEMA_REPORTES_COMPLETO.md** - Overview del sistema completo
- **GUIA_REPORTES_AVANZADOS.md** - Guía de reportes avanzados
- **GUIA_DESCARGAS_REPORTES.md** - Guía de descargas con ejemplos
- **RESUMEN_DESCARGAS_IMPLEMENTADAS.md** - Detalles técnicos de implementación

---

## 💡 Tips

### Para ejecutar solo las descargas
```bash
node test-downloads.js
```

### Para ejecutar solo reportes avanzados
```bash
node test-advanced-reports.js
```

### Para ejecutar solo reportes básicos
```bash
node test-reports-complete.js
```

### Para ejecutar el test completo (RECOMENDADO)
```bash
node test-reportes-completo-final.js
```

---

## ✅ Checklist de Verificación

Antes de considerar el sistema listo para producción:

- [ ] Todas las 19 pruebas pasan exitosamente
- [ ] Los 6 archivos se descargan correctamente
- [ ] Los archivos Excel se abren y tienen buen formato
- [ ] Los archivos PDF se abren y son legibles
- [ ] El contenido de los reportes es correcto
- [ ] Las fechas y números están bien formateados
- [ ] Los totales y cálculos son precisos
- [ ] No hay errores en la consola del servidor
- [ ] El tiempo de respuesta es aceptable (< 5s por reporte)

---

## 🎉 ¡Listo!

Si todas las pruebas pasan y los archivos se ven bien, tu sistema de reportes está **100% funcional y listo para usar** 🚀
