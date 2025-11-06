# Guía Frontend - Sistema de Lotes Actualizado

## 📋 Resumen de Cambios

Se actualizó el sistema de lotes para permitir flexibilidad en la asignación de proveedores. Ahora el campo `supplierId` es **opcional** en los lotes, con validaciones inteligentes basadas en el producto.

---

## 🎯 Reglas de Negocio para el Frontend

### Regla 1: Proveedor del Lote

**Si el producto TIENE proveedor asignado:**
- El campo `supplierId` es **OBLIGATORIO** en el formulario de lote
- Debe ser el **MISMO** proveedor que el del producto
- Mostrar el proveedor como **solo lectura** o **preseleccionado**

**Si el producto NO tiene proveedor:**
- El campo `supplierId` es **OPCIONAL** en el formulario
- El usuario puede:
  - Dejar el campo vacío (lote sin proveedor)
  - Seleccionar un proveedor específico para este lote

### Regla 2: Recibo/Factura

- El campo `invoiceNumber` es **SIEMPRE OPCIONAL**
- No depende de si hay proveedor o no
- Permitir que el usuario lo deje vacío

---

## 🔧 Cambios en el API (Backend)

### Endpoint: `POST /api/batches`

**Cambios en el payload:**

```javascript
// ANTES (supplierId siempre obligatorio)
{
  "productId": 123,
  "supplierId": 45,        // ❌ Siempre obligatorio
  "batchNumber": "LOTE-001",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 100,
  "purchasePrice": 60,
  "salePrice": 100,
  "invoiceNumber": "FACT-001"
}
```

```javascript
// AHORA (supplierId condicional según el producto)
{
  "productId": 123,
  "supplierId": 45,        // ✅ Obligatorio solo si el producto tiene proveedor
                           // ⚠️ Debe ser el mismo que el del producto
                           // ✅ Opcional si el producto no tiene proveedor
  "batchNumber": "LOTE-001",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 100,
  "purchasePrice": 60,
  "salePrice": 100,
  "invoiceNumber": "FACT-001"  // ⚠️ SIEMPRE opcional
}
```

---

## 🎨 Implementación en el Frontend

### Paso 1: Obtener Información del Producto

Antes de mostrar el formulario de lote, obtener los detalles del producto:

```javascript
// Obtener producto seleccionado
const getProductDetails = async (productId) => {
  try {
    const response = await axios.get(`/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener producto:', error);
  }
};
```

### Paso 2: Lógica Condicional para el Campo Proveedor

```javascript
const [formData, setFormData] = useState({
  productId: null,
  supplierId: null,
  batchNumber: '',
  manufacturingDate: '',
  expirationDate: '',
  initialQuantity: '',
  purchasePrice: '',
  salePrice: '',
  location: '',
  invoiceNumber: '',  // Siempre opcional
  notes: ''
});

const [selectedProduct, setSelectedProduct] = useState(null);

// Cuando se selecciona un producto
const handleProductSelect = async (productId) => {
  const product = await getProductDetails(productId);
  setSelectedProduct(product);

  // Si el producto tiene proveedor, pre-seleccionarlo
  if (product.supplierId) {
    setFormData(prev => ({
      ...prev,
      productId: product.id,
      supplierId: product.supplierId  // Pre-seleccionar proveedor
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      productId: product.id,
      supplierId: null  // Dejar vacío
    }));
  }
};
```

### Paso 3: Renderizado Condicional del Campo Proveedor

```jsx
{/* Campo Proveedor */}
<div>
  <label className="block text-sm font-medium text-neutral-700 mb-1">
    Proveedor
    {selectedProduct?.supplierId && (
      <span className="text-danger-500"> *</span>
    )}
  </label>

  {selectedProduct?.supplierId ? (
    // Producto CON proveedor → Campo bloqueado/solo lectura
    <>
      <select
        name="supplierId"
        value={formData.supplierId}
        onChange={handleFormChange}
        required
        disabled  // Bloqueado porque debe ser el del producto
        className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 cursor-not-allowed"
      >
        <option value={selectedProduct.supplierId}>
          {selectedProduct.supplier?.name || `Proveedor ID: ${selectedProduct.supplierId}`}
        </option>
      </select>
      <p className="text-xs text-neutral-500 mt-1">
        El proveedor está determinado por el producto y no se puede cambiar.
      </p>
    </>
  ) : (
    // Producto SIN proveedor → Campo opcional
    <>
      <select
        name="supplierId"
        value={formData.supplierId || ''}
        onChange={handleFormChange}
        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <option value="">Sin proveedor (opcional)</option>
        {suppliers.map(supplier => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-neutral-500 mt-1">
        Opcional: Puedes asignar un proveedor específico para este lote o dejarlo sin proveedor.
      </p>
    </>
  )}
</div>

{/* Campo Recibo - SIEMPRE OPCIONAL */}
<div>
  <label className="block text-sm font-medium text-neutral-700 mb-1">
    Número de Factura/Recibo
    <span className="text-neutral-400 ml-1">(Opcional)</span>
  </label>
  <input
    type="text"
    name="invoiceNumber"
    value={formData.invoiceNumber}
    onChange={handleFormChange}
    placeholder="Ej: FACT-001"
    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
  />
  <p className="text-xs text-neutral-500 mt-1">
    Solo si tienes factura o recibo físico del lote.
  </p>
</div>
```

### Paso 4: Enviar el Formulario

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // Preparar payload
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

    // Solo incluir supplierId si tiene valor
    if (formData.supplierId) {
      payload.supplierId = parseInt(formData.supplierId);
    }

    // Solo incluir invoiceNumber si tiene valor
    if (formData.invoiceNumber && formData.invoiceNumber.trim()) {
      payload.invoiceNumber = formData.invoiceNumber.trim();
    }

    // Enviar petición
    const response = await axios.post('/api/batches', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Lote creado:', response.data);
    // Mostrar mensaje de éxito
    // Limpiar formulario

  } catch (error) {
    console.error('Error al crear lote:', error);

    if (error.response) {
      // Mostrar mensaje de error del backend
      alert(error.response.data.message);
    }
  }
};
```

---

## ⚠️ Errores Posibles y Cómo Manejarlos

### Error 1: Producto con proveedor pero lote sin proveedor

**Mensaje del backend:**
```json
{
  "message": "El producto tiene asignado el proveedor ID 45. El lote debe tener el mismo proveedor."
}
```

**Solución en el frontend:**
- Pre-seleccionar el proveedor del producto
- Deshabilitar el campo para que no se pueda cambiar
- No permitir enviar el formulario sin proveedor si el producto lo tiene

### Error 2: Proveedor del lote diferente al del producto

**Mensaje del backend:**
```json
{
  "message": "El proveedor del lote (99) no coincide con el proveedor del producto (45)"
}
```

**Solución en el frontend:**
- Bloquear el campo de proveedor cuando el producto ya tiene uno
- Mostrar mensaje: "El proveedor está determinado por el producto"

### Error 3: Proveedor no encontrado

**Mensaje del backend:**
```json
{
  "message": "Proveedor no encontrado"
}
```

**Solución en el frontend:**
- Validar que el ID del proveedor exista antes de enviar
- Recargar lista de proveedores si es necesario

---

## 📊 Casos de Uso para el Frontend

### Caso 1: Crear Lote para Producto CON Proveedor

**Flujo:**
1. Usuario selecciona producto (tiene `supplierId: 45`)
2. Frontend detecta que el producto tiene proveedor
3. Campo de proveedor se muestra **bloqueado** con el proveedor del producto
4. Usuario NO puede cambiar el proveedor
5. Usuario completa los demás campos
6. Al enviar, incluir `supplierId: 45` en el payload

**UI Sugerida:**
```
┌─────────────────────────────────────────┐
│ Producto: Paracetamol MK 500mg          │
│                                         │
│ Proveedor: [Laboratorios MK       ] 🔒 │
│ ℹ️ El proveedor está determinado       │
│    por el producto                      │
│                                         │
│ Número de Lote: [LOTE-001          ]   │
│ Cantidad: [100                     ]   │
│ Factura (Opcional): [FACT-001      ]   │
│                                         │
│           [Crear Lote]                  │
└─────────────────────────────────────────┘
```

### Caso 2: Crear Lote para Producto SIN Proveedor

**Flujo:**
1. Usuario selecciona producto (NO tiene `supplierId`)
2. Frontend detecta que el producto NO tiene proveedor
3. Campo de proveedor se muestra **opcional** con dropdown
4. Usuario puede:
   - Dejar vacío (sin proveedor)
   - Seleccionar un proveedor de la lista
5. Usuario completa los demás campos
6. Al enviar:
   - Si seleccionó proveedor → incluir `supplierId` en el payload
   - Si NO seleccionó → NO incluir `supplierId` en el payload

**UI Sugerida:**
```
┌─────────────────────────────────────────┐
│ Producto: Alcohol en Gel Genérico      │
│                                         │
│ Proveedor (Opcional):                   │
│ [Seleccionar proveedor...        ▼]   │
│ ℹ️ Opcional: Puedes asignar un         │
│    proveedor o dejarlo sin proveedor   │
│                                         │
│ Número de Lote: [LOTE-002          ]   │
│ Cantidad: [50                      ]   │
│ Factura (Opcional): [               ]   │
│                                         │
│           [Crear Lote]                  │
└─────────────────────────────────────────┘
```

---

## 🔍 Consultas y Filtros

### Obtener Lotes (GET /api/batches)

**Parámetros de consulta:**

```javascript
// Ejemplo: Obtener todos los lotes
const getBatches = async () => {
  const response = await axios.get('/api/batches', {
    params: {
      page: 1,
      limit: 50,
      // Filtros opcionales:
      productId: 123,      // Lotes de un producto específico
      supplierId: 45,      // Lotes de un proveedor específico (o null)
      status: 'active',    // active, near_expiry, expired, depleted, blocked
      canBeSold: true      // true, false
    },
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};
```

**Respuesta:**

```json
{
  "total": 150,
  "page": 1,
  "totalPages": 3,
  "batches": [
    {
      "id": 1,
      "batchNumber": "LOTE-001",
      "productId": 123,
      "supplierId": 45,           // ⚠️ Puede ser null
      "manufacturingDate": "2024-01-01",
      "expirationDate": "2026-01-01",
      "initialQuantity": 100,
      "currentQuantity": 85,
      "purchasePrice": "60.00",
      "salePrice": "100.00",
      "location": "Estante A1",
      "status": "active",
      "invoiceNumber": "FACT-001", // ⚠️ Puede ser null
      "receiptDate": "2024-01-05T10:30:00.000Z",
      "canBeSold": true,
      "notes": null,
      "product": {
        "id": 123,
        "name": "Paracetamol MK 500mg",
        "sku": "PAR-MK-500",
        "category": "medicamento"
      },
      "supplier": {                // ⚠️ Puede ser null
        "id": 45,
        "name": "Laboratorios MK",
        "code": "LAB-MK"
      }
    },
    {
      "id": 2,
      "batchNumber": "LOTE-002",
      "productId": 456,
      "supplierId": null,          // ⚠️ Lote sin proveedor
      "manufacturingDate": "2024-02-01",
      "expirationDate": "2026-02-01",
      "initialQuantity": 50,
      "currentQuantity": 50,
      "purchasePrice": "30.00",
      "salePrice": "50.00",
      "location": "Estante B1",
      "status": "active",
      "invoiceNumber": null,       // ⚠️ Sin recibo
      "receiptDate": "2024-02-05T14:20:00.000Z",
      "canBeSold": true,
      "notes": "Compra informal sin proveedor",
      "product": {
        "id": 456,
        "name": "Alcohol en Gel Genérico",
        "sku": "ALC-GEN-001",
        "category": "higiene"
      },
      "supplier": null             // ⚠️ Sin proveedor
    }
  ]
}
```

### Mostrar Lotes en la Interfaz

```jsx
const LotesList = ({ batches }) => {
  return (
    <div>
      {batches.map(batch => (
        <div key={batch.id} className="border p-4 rounded-lg mb-2">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold">{batch.batchNumber}</h3>
              <p className="text-sm text-gray-600">{batch.product.name}</p>
            </div>
            <div>
              <span className={`badge ${getStatusColor(batch.status)}`}>
                {getStatusLabel(batch.status)}
              </span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Cantidad:</span>{' '}
              {batch.currentQuantity}/{batch.initialQuantity}
            </div>
            <div>
              <span className="text-gray-600">Vencimiento:</span>{' '}
              {formatDate(batch.expirationDate)}
            </div>
            <div>
              <span className="text-gray-600">Proveedor:</span>{' '}
              {batch.supplier ? (
                <span className="text-primary-600">{batch.supplier.name}</span>
              ) : (
                <span className="text-gray-400 italic">Sin proveedor</span>
              )}
            </div>
            <div>
              <span className="text-gray-600">Factura:</span>{' '}
              {batch.invoiceNumber ? (
                <span>{batch.invoiceNumber}</span>
              ) : (
                <span className="text-gray-400 italic">Sin factura</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## ✅ Checklist de Implementación

### Frontend - Formulario de Crear Lote

- [ ] Obtener detalles del producto al seleccionarlo
- [ ] Detectar si el producto tiene `supplierId`
- [ ] Si tiene proveedor:
  - [ ] Pre-seleccionar el proveedor del producto
  - [ ] Deshabilitar/bloquear el campo de proveedor
  - [ ] Mostrar mensaje: "El proveedor está determinado por el producto"
  - [ ] Marcar como requerido
- [ ] Si NO tiene proveedor:
  - [ ] Mostrar dropdown de proveedores
  - [ ] Incluir opción "Sin proveedor"
  - [ ] Marcar como opcional
  - [ ] Mostrar mensaje: "Opcional: Puedes asignar un proveedor específico"
- [ ] Campo `invoiceNumber` siempre opcional (independiente del proveedor)
- [ ] Incluir `supplierId` en el payload solo si tiene valor
- [ ] Incluir `invoiceNumber` en el payload solo si tiene valor
- [ ] Manejar errores de validación del backend

### Frontend - Listado de Lotes

- [ ] Manejar `supplier` como null en la respuesta
- [ ] Manejar `invoiceNumber` como null en la respuesta
- [ ] Mostrar "Sin proveedor" cuando `supplier` es null
- [ ] Mostrar "Sin factura" cuando `invoiceNumber` es null
- [ ] Permitir filtrar por lotes con/sin proveedor
- [ ] Permitir filtrar por lotes con/sin factura

### Frontend - Editar Lote

- [ ] **NO** permitir cambiar el `supplierId` de un lote existente
- [ ] Permitir editar `location`, `notes`, `status`
- [ ] Mostrar proveedor como solo lectura

---

## 📞 Soporte

Si tienes dudas sobre la implementación:

1. Revisa [REGLAS_LOTES.md](REGLAS_LOTES.md) para entender las reglas de negocio
2. Consulta [CONFIGURACION.md](CONFIGURACION.md) para la documentación técnica completa
3. Ejecuta `node test-batch-without-supplier.js` para ver ejemplos de todos los casos

---

**Fecha de actualización:** 2025-11-05
**Autor:** Alexander Echeverria
**Versión:** 1.0
