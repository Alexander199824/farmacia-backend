# Resumen Ejecutivo - Cambios en Sistema de Lotes

## 🎯 Qué Cambió

El campo `supplierId` en los lotes ahora es **OPCIONAL** en lugar de obligatorio.

---

## 📋 Reglas Simples

### Para el Frontend:

```
SI producto.supplierId !== null:
  → lote.supplierId es OBLIGATORIO
  → lote.supplierId debe ser === producto.supplierId
  → Mostrar campo bloqueado/pre-seleccionado

SI producto.supplierId === null:
  → lote.supplierId es OPCIONAL
  → Usuario puede seleccionar proveedor o dejar vacío
  → Mostrar dropdown con opción "Sin proveedor"

SIEMPRE:
  → invoiceNumber es OPCIONAL (con o sin proveedor)
```

---

## 🔧 Cambios en el Código Frontend

### 1. Al Crear Lote - Preparar Payload

```javascript
const payload = {
  productId: formData.productId,
  batchNumber: formData.batchNumber,
  manufacturingDate: formData.manufacturingDate,
  expirationDate: formData.expirationDate,
  initialQuantity: parseInt(formData.initialQuantity),
  purchasePrice: parseFloat(formData.purchasePrice),
  salePrice: parseFloat(formData.salePrice),
  location: formData.location,
  notes: formData.notes
};

// ✅ NUEVO: Solo incluir supplierId si tiene valor
if (formData.supplierId) {
  payload.supplierId = parseInt(formData.supplierId);
}
// ❌ ANTES: Siempre se incluía (era obligatorio)

// ✅ Solo incluir invoiceNumber si tiene valor
if (formData.invoiceNumber?.trim()) {
  payload.invoiceNumber = formData.invoiceNumber.trim();
}
```

### 2. Campo Proveedor en el Formulario

```jsx
{/* Opción 1: Producto CON proveedor */}
{selectedProduct?.supplierId && (
  <>
    <label>
      Proveedor <span className="text-red-500">*</span>
    </label>
    <select
      value={formData.supplierId}
      disabled  // 🔒 Bloqueado
      className="bg-gray-100"
    >
      <option value={selectedProduct.supplierId}>
        {selectedProduct.supplier?.name}
      </option>
    </select>
    <p className="text-sm text-gray-500">
      Determinado por el producto
    </p>
  </>
)}

{/* Opción 2: Producto SIN proveedor */}
{!selectedProduct?.supplierId && (
  <>
    <label>
      Proveedor <span className="text-gray-400">(Opcional)</span>
    </label>
    <select
      value={formData.supplierId || ''}
      onChange={handleChange}
    >
      <option value="">Sin proveedor</option>
      {suppliers.map(s => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
    <p className="text-sm text-gray-500">
      Puedes asignar un proveedor específico o dejarlo vacío
    </p>
  </>
)}
```

### 3. Mostrar Lotes en Lista

```jsx
// ⚠️ NUEVO: supplier puede ser null
<div>
  <span>Proveedor: </span>
  {batch.supplier ? (
    <strong>{batch.supplier.name}</strong>
  ) : (
    <em className="text-gray-400">Sin proveedor</em>
  )}
</div>

// ⚠️ NUEVO: invoiceNumber puede ser null
<div>
  <span>Factura: </span>
  {batch.invoiceNumber || (
    <em className="text-gray-400">Sin factura</em>
  )}
</div>
```

---

## 📊 Ejemplos de Payload

### Caso 1: Producto con proveedor

```javascript
// Request
POST /api/batches
{
  "productId": 123,           // Producto con supplierId: 45
  "supplierId": 45,           // ✅ Obligatorio (mismo que el producto)
  "batchNumber": "LOTE-001",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 100,
  "purchasePrice": 60,
  "salePrice": 100,
  "invoiceNumber": "FACT-001" // ⚠️ Opcional
}
```

### Caso 2: Producto sin proveedor (lote sin proveedor)

```javascript
// Request
POST /api/batches
{
  "productId": 456,           // Producto sin supplierId
  // supplierId: NO INCLUIR   // ✅ Opcional - no se envía
  "batchNumber": "LOTE-002",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 50,
  "purchasePrice": 30,
  "salePrice": 50
  // invoiceNumber: NO INCLUIR // ⚠️ Opcional - no hay factura
}
```

### Caso 3: Producto sin proveedor (pero lote con proveedor)

```javascript
// Request
POST /api/batches
{
  "productId": 456,           // Producto sin supplierId
  "supplierId": 45,           // ✅ Opcional - en este caso SÍ se incluye
  "batchNumber": "LOTE-003",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 75,
  "purchasePrice": 28,
  "salePrice": 50,
  "invoiceNumber": "FACT-002" // ⚠️ Opcional
}
```

---

## ❌ Errores Posibles

### Error 1: Producto con proveedor pero lote sin proveedor

```json
// Response 400
{
  "message": "El producto tiene asignado el proveedor ID 45. El lote debe tener el mismo proveedor."
}
```

**Solución:** Pre-seleccionar y bloquear el campo de proveedor

### Error 2: Proveedores no coinciden

```json
// Response 400
{
  "message": "El proveedor del lote (99) no coincide con el proveedor del producto (45)"
}
```

**Solución:** No permitir cambiar el proveedor del lote si el producto ya tiene uno

---

## 📝 Respuestas del API

### GET /api/batches

```json
{
  "total": 2,
  "page": 1,
  "totalPages": 1,
  "batches": [
    {
      "id": 1,
      "batchNumber": "LOTE-001",
      "supplierId": 45,              // ⚠️ Puede ser null
      "invoiceNumber": "FACT-001",   // ⚠️ Puede ser null
      "supplier": {                  // ⚠️ Puede ser null
        "id": 45,
        "name": "Laboratorios MK"
      },
      // ... otros campos
    },
    {
      "id": 2,
      "batchNumber": "LOTE-002",
      "supplierId": null,            // ⚠️ Sin proveedor
      "invoiceNumber": null,         // ⚠️ Sin factura
      "supplier": null,              // ⚠️ Sin proveedor
      // ... otros campos
    }
  ]
}
```

---

## ✅ Checklist Rápido

**Antes de hacer cambios en el frontend:**

- [ ] Leer [GUIA_FRONTEND_LOTES.md](GUIA_FRONTEND_LOTES.md) (guía completa)
- [ ] Entender las 2 reglas:
  - Producto con proveedor → lote con mismo proveedor (obligatorio)
  - Producto sin proveedor → lote opcional (con o sin proveedor)
- [ ] Actualizar formulario de crear lote
- [ ] Manejar `supplier: null` en listados
- [ ] Manejar `invoiceNumber: null` en listados
- [ ] Probar con backend actualizado

**Archivos de referencia:**

- 📖 [GUIA_FRONTEND_LOTES.md](GUIA_FRONTEND_LOTES.md) - Guía completa con ejemplos de código
- 📋 [REGLAS_LOTES.md](REGLAS_LOTES.md) - Reglas de negocio detalladas
- ⚙️ [CONFIGURACION.md](CONFIGURACION.md) - Documentación técnica del backend

---

**¿Necesitas más ayuda?**

Ejecuta en el backend:
```bash
node test-batch-without-supplier.js
```

Esto mostrará ejemplos reales de todos los casos de uso.

---

**Fecha:** 2025-11-05
**Autor:** Alexander Echeverria
