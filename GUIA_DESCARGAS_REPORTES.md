# 📥 GUÍA DE DESCARGAS DE REPORTES

## ✅ FUNCIONALIDADES IMPLEMENTADAS

El sistema ahora permite descargar reportes en dos formatos:
- 📊 **Excel (.xlsx)** - Para análisis detallado y manipulación de datos
- 📄 **PDF (.pdf)** - Para impresión y presentaciones

---

## 🎯 ENDPOINTS DISPONIBLES

### 1. Descarga de Reporte de Ventas

**Endpoint:** `GET /api/reports/download/sales`

**Parámetros:**
| Parámetro | Tipo | Valores | Descripción |
|-----------|------|---------|-------------|
| `format` | string | `excel` o `pdf` | Formato del archivo |
| `groupBy` | string | `hour`, `day`, `week`, `month`, `quarter`, `semester`, `year` | Período de agrupación |
| `startDate` | date | YYYY-MM-DD | Fecha inicio (opcional) |
| `endDate` | date | YYYY-MM-DD | Fecha fin (opcional) |

**Ejemplo:**
```bash
# Descargar en Excel
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/reports/download/sales?format=excel&groupBy=month" \
  --output reporte-ventas.xlsx

# Descargar en PDF
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/reports/download/sales?format=pdf&groupBy=day&startDate=2024-01-01&endDate=2024-12-31" \
  --output reporte-ventas.pdf
```

**Contenido del archivo:**
- ✅ Resumen ejecutivo (ventas totales, transacciones, ticket promedio)
- ✅ Detalle de ventas por período
- ✅ Top 10 productos más vendidos (si disponible)
- ✅ Gráficos y formateo profesional (Excel)

---

### 2. Descarga de Análisis Económico

**Endpoint:** `GET /api/reports/download/economic-analysis`

**Parámetros:**
| Parámetro | Tipo | Valores | Descripción |
|-----------|------|---------|-------------|
| `format` | string | `excel` o `pdf` | Formato del archivo |
| `startDate` | date | YYYY-MM-DD | Fecha inicio (opcional) |
| `endDate` | date | YYYY-MM-DD | Fecha fin (opcional) |

**Ejemplo:**
```bash
# Excel
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/reports/download/economic-analysis?format=excel" \
  --output analisis-economico.xlsx

# PDF
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/reports/download/economic-analysis?format=pdf" \
  --output analisis-economico.pdf
```

**Contenido del archivo:**
- ✅ Resumen ejecutivo con comparación de períodos
- ✅ Ventas por día de la semana
- ✅ Horas pico de venta
- ✅ Top productos más vendidos
- ✅ Tendencias y análisis de crecimiento

---

### 3. Descarga de Mejores Días de Venta

**Endpoint:** `GET /api/reports/download/best-sales-days`

**Parámetros:**
| Parámetro | Tipo | Valores | Descripción |
|-----------|------|---------|-------------|
| `format` | string | `excel` o `pdf` | Formato del archivo |
| `startDate` | date | YYYY-MM-DD | Fecha inicio (opcional) |
| `endDate` | date | YYYY-MM-DD | Fecha fin (opcional) |

**Ejemplo:**
```bash
# Excel
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/reports/download/best-sales-days?format=excel" \
  --output mejores-dias.xlsx

# PDF
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/reports/download/best-sales-days?format=pdf" \
  --output mejores-dias.pdf
```

**Contenido del archivo:**
- ✅ Mejor y peor día de la semana
- ✅ Ranking completo de días de la semana
- ✅ Top 10 días del mes (1-31)
- ✅ Mejores horas del día
- ✅ Mejor semana del mes
- ✅ Recomendaciones inteligentes

---

## 💻 EJEMPLOS DE INTEGRACIÓN FRONTEND

### Usando Axios (React, Vue, Angular)

```javascript
import axios from 'axios';

// Función para descargar reporte
async function downloadReport(type, format) {
  try {
    const token = localStorage.getItem('token');

    const response = await axios.get(
      `http://localhost:5000/api/reports/download/${type}?format=${format}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' // Importante para archivos binarios
      }
    );

    // Crear URL temporal
    const url = window.URL.createObjectURL(new Blob([response.data]));

    // Crear link temporal y hacer click automático
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte-${type}-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
    document.body.appendChild(link);
    link.click();

    // Limpiar
    link.remove();
    window.URL.revokeObjectURL(url);

    console.log('Descarga exitosa');
  } catch (error) {
    console.error('Error al descargar:', error);
  }
}

// Uso
downloadReport('sales', 'excel');
downloadReport('economic-analysis', 'pdf');
downloadReport('best-sales-days', 'excel');
```

### Componente React completo

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const DownloadReportButton = ({ reportType, reportName }) => {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('excel');

  const handleDownload = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `http://localhost:5000/api/reports/download/${reportType}?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportName}-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Reporte descargado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al descargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="download-report">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        disabled={loading}
      >
        <option value="excel">Excel (.xlsx)</option>
        <option value="pdf">PDF (.pdf)</option>
      </select>

      <button
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? 'Descargando...' : `Descargar ${reportName}`}
      </button>
    </div>
  );
};

// Uso
export default function ReportsPage() {
  return (
    <div>
      <h1>Descargar Reportes</h1>

      <DownloadReportButton
        reportType="sales"
        reportName="Reporte de Ventas"
      />

      <DownloadReportButton
        reportType="economic-analysis"
        reportName="Análisis Económico"
      />

      <DownloadReportButton
        reportType="best-sales-days"
        reportName="Mejores Días de Venta"
      />
    </div>
  );
}
```

### Componente Vue 3

```vue
<template>
  <div class="download-report">
    <select v-model="format" :disabled="loading">
      <option value="excel">Excel (.xlsx)</option>
      <option value="pdf">PDF (.pdf)</option>
    </select>

    <button @click="downloadReport" :disabled="loading">
      {{ loading ? 'Descargando...' : `Descargar ${reportName}` }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const props = defineProps({
  reportType: String,
  reportName: String
});

const loading = ref(false);
const format = ref('excel');

const downloadReport = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');

    const response = await axios.get(
      `http://localhost:5000/api/reports/download/${props.reportType}?format=${format.value}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${props.reportName}-${Date.now()}.${format.value === 'excel' ? 'xlsx' : 'pdf'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error:', error);
    alert('Error al descargar el reporte');
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## 🧪 CÓMO PROBAR

### 1. Ejecutar el test automatizado

```bash
node test-downloads.js
```

Este test descargará todos los reportes en ambos formatos y los guardará en la raíz del proyecto.

### 2. Verificar los archivos generados

Los siguientes archivos deben aparecer:
- ✅ `test-reporte-ventas.xlsx`
- ✅ `test-reporte-ventas.pdf`
- ✅ `test-analisis-economico.xlsx`
- ✅ `test-analisis-economico.pdf`
- ✅ `test-mejores-dias-venta.xlsx`
- ✅ `test-mejores-dias-venta.pdf`

### 3. Verificar manualmente con curl

```bash
# Obtener token primero
TOKEN=$(curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@farmacia.com","password":"Admin123!"}' \
  | jq -r '.token')

# Descargar reporte en Excel
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/reports/download/sales?format=excel" \
  --output ventas.xlsx

# Descargar reporte en PDF
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/reports/download/sales?format=pdf" \
  --output ventas.pdf
```

---

## 📋 CARACTERÍSTICAS DE LOS ARCHIVOS

### Excel (.xlsx)
- ✅ Formato profesional con colores y estilos
- ✅ Múltiples hojas para datos relacionados
- ✅ Encabezados con colores diferenciados
- ✅ Anchos de columna automáticos
- ✅ Datos formateados (moneda, fechas, etc.)
- ✅ Fórmulas y cálculos automáticos
- ✅ Compatible con Excel, Google Sheets, LibreOffice

### PDF (.pdf)
- ✅ Formato listo para imprimir
- ✅ Diseño profesional con márgenes adecuados
- ✅ Tablas bien formateadas
- ✅ Paginación automática
- ✅ Encabezados y pies de página
- ✅ Numeración de páginas
- ✅ Compatible con todos los lectores PDF

---

## 🔒 PERMISOS

| Endpoint | Admin | Empleado | Cliente |
|----------|-------|----------|---------|
| `/download/sales` | ✅ | ✅ | ❌ |
| `/download/economic-analysis` | ✅ | ❌ | ❌ |
| `/download/best-sales-days` | ✅ | ✅ | ❌ |

---

## 🚀 PRÓXIMAS MEJORAS SUGERIDAS

1. **Programación de Reportes**
   - Envío automático por email
   - Generación programada (diaria, semanal, mensual)

2. **Plantillas Personalizadas**
   - Logo de la empresa
   - Colores corporativos
   - Encabezados personalizados

3. **Reportes Adicionales**
   - Reporte de inventario
   - Reporte de clientes
   - Reporte de delivery

4. **Compresión**
   - Descarga de múltiples reportes en ZIP
   - Optimización de tamaño de archivos

5. **Gráficas en PDF**
   - Integración de Chart.js en PDF
   - Gráficas de barras, líneas, pastel

---

## 📞 SOPORTE

Para más información:
- Revisa `RESUMEN_SISTEMA_REPORTES_COMPLETO.md`
- Consulta `GUIA_REPORTES_AVANZADOS.md`
- Ejecuta `test-downloads.js` para verificar funcionamiento

---

## ✅ RESUMEN

**Ahora puedes:**
- ✅ Descargar reportes de ventas en Excel y PDF
- ✅ Descargar análisis económico en Excel y PDF
- ✅ Descargar análisis de mejores días en Excel y PDF
- ✅ Personalizar períodos de tiempo
- ✅ Filtrar por fechas específicas
- ✅ Integrar fácilmente en tu frontend

**Todo listo para usar! 🎉**
