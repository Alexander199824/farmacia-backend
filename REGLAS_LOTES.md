# Reglas de Negocio - Sistema de Lotes

## 📋 Resumen Ejecutivo

Este documento describe las reglas para crear lotes de productos en el sistema de inventario de la Farmacia Elizabeth.

---

## 🎯 Regla Principal: Proveedor del Lote

### Caso 1: Producto CON Proveedor Asignado

```
Producto tiene supplierId = 45
→ El lote DEBE tener supplierId = 45 (OBLIGATORIO y debe coincidir)
```

**Validaciones:**
- ✅ El lote debe incluir `supplierId`
- ✅ El `supplierId` del lote debe ser el mismo que el del producto
- ❌ ERROR si el lote no tiene proveedor
- ❌ ERROR si el lote tiene un proveedor diferente

**Ejemplo:**
```javascript
// ✅ VÁLIDO
{
  productId: 123,        // Producto con supplierId: 45
  supplierId: 45,        // ✅ Mismo proveedor
  batchNumber: "LOTE-001",
  // ... otros campos
}

// ❌ INVÁLIDO - Sin proveedor
{
  productId: 123,        // Producto con supplierId: 45
  // supplierId: NO INCLUIDO
  batchNumber: "LOTE-002",
  // ... otros campos
}
// Error: "El producto tiene asignado el proveedor ID 45. El lote debe tener el mismo proveedor."

// ❌ INVÁLIDO - Proveedor diferente
{
  productId: 123,        // Producto con supplierId: 45
  supplierId: 99,        // ❌ Proveedor diferente
  batchNumber: "LOTE-003",
  // ... otros campos
}
// Error: "El proveedor del lote (99) no coincide con el proveedor del producto (45)"
```

---

### Caso 2: Producto SIN Proveedor Asignado

```
Producto tiene supplierId = null
→ El lote PUEDE o NO tener proveedor (OPCIONAL)
```

**Validaciones:**
- ✅ El lote puede incluir `supplierId` (si este lote específico tiene proveedor)
- ✅ El lote puede NO incluir `supplierId` (compra sin proveedor registrado)
- ✅ Si se incluye `supplierId`, debe existir en la tabla de proveedores

**Ejemplo A: Lote sin proveedor**
```javascript
// ✅ VÁLIDO - Producto y lote sin proveedor
{
  productId: 456,        // Producto sin supplierId
  // supplierId: NO INCLUIDO
  batchNumber: "LOTE-004",
  manufacturingDate: "2024-01-01",
  expirationDate: "2026-01-01",
  initialQuantity: 50,
  purchasePrice: 30,
  salePrice: 50
}
```

**Ejemplo B: Lote con proveedor**
```javascript
// ✅ VÁLIDO - Producto sin proveedor fijo, pero este lote sí tiene
{
  productId: 456,        // Producto sin supplierId
  supplierId: 45,        // ✅ Este lote específico tiene proveedor
  batchNumber: "LOTE-005",
  manufacturingDate: "2024-01-01",
  expirationDate: "2026-01-01",
  initialQuantity: 100,
  purchasePrice: 28,
  salePrice: 50,
  invoiceNumber: "FACT-001"
}
```

**Caso de uso real:**
Un producto genérico (ej: "Alcohol en gel") no tiene proveedor fijo asignado.
- Lote A: Se compra sin factura en una tienda local → sin proveedor
- Lote B: Se compra a un distribuidor específico → con proveedor

---

## 📄 Regla Secundaria: Recibo/Factura (invoiceNumber)

```
invoiceNumber es SIEMPRE OPCIONAL
→ Independientemente de si hay proveedor o no
```

**Validaciones:**
- ✅ Puede incluirse con proveedor
- ✅ Puede incluirse sin proveedor
- ✅ Puede omitirse con proveedor
- ✅ Puede omitirse sin proveedor

**Cuándo incluir `invoiceNumber`:**
- Cuando existe documento físico (factura, recibo, ticket)
- Para control contable y auditoría
- Para facilitar devoluciones al proveedor

**Cuándo NO incluir `invoiceNumber`:**
- Compras informales sin documentación
- Donaciones o muestras médicas
- Transferencias internas sin factura

---

## 📊 Tabla de Validación

| Producto     | Lote         | Recibo       | ¿Válido? | Mensaje                                    |
|--------------|--------------|--------------|----------|--------------------------------------------|
| Con Prov 45  | Con Prov 45  | Con recibo   | ✅ SÍ    | Caso estándar                              |
| Con Prov 45  | Con Prov 45  | Sin recibo   | ✅ SÍ    | Válido sin documentación                   |
| Con Prov 45  | Sin Prov     | -            | ❌ NO    | Producto tiene proveedor, lote debe tenerlo|
| Con Prov 45  | Con Prov 99  | -            | ❌ NO    | Proveedores no coinciden                   |
| Sin Prov     | Sin Prov     | Sin recibo   | ✅ SÍ    | Compra informal                            |
| Sin Prov     | Sin Prov     | Con recibo   | ✅ SÍ    | Compra con documentación                   |
| Sin Prov     | Con Prov 45  | Sin recibo   | ✅ SÍ    | Lote específico de un proveedor            |
| Sin Prov     | Con Prov 45  | Con recibo   | ✅ SÍ    | Lote con proveedor y documentación         |

---

## 🔍 Casos de Uso Reales

### Caso A: Medicamento de marca con proveedor exclusivo
```
Producto: "Paracetamol MK 500mg"
Proveedor del producto: Laboratorios MK (ID: 10)

Regla: Todos los lotes DEBEN ser del proveedor ID: 10
Razón: Marca exclusiva de un solo laboratorio
```

### Caso B: Producto genérico sin proveedor fijo
```
Producto: "Alcohol en gel"
Proveedor del producto: NULL (sin proveedor fijo)

Escenario 1: Compra a Distribuidora ABC
→ Lote con supplierId: 20

Escenario 2: Compra en supermercado sin factura
→ Lote sin supplierId

Razón: Producto disponible de múltiples fuentes
```

### Caso C: Muestra médica gratuita
```
Producto: "Vitamina C 1000mg"
Proveedor del producto: NULL o proveedor específico

Lote: Donación de Laboratorio XYZ
→ Puede o no registrar proveedor
→ invoiceNumber: NULL (no hay factura)
→ notes: "Muestra médica - donación"

Razón: No hay transacción comercial
```

---

## 🚀 Implementación Técnica

### Modelo (Sequelize)
```javascript
supplierId: {
  type: DataTypes.INTEGER,
  allowNull: true,  // ✅ Permite NULL
  references: {
    model: 'suppliers',
    key: 'id'
  },
  comment: 'Proveedor (opcional - productos pueden no tener proveedor)'
}
```

### Validación en Controlador
```javascript
if (product.supplierId) {
  // Producto CON proveedor → Lote DEBE tener el MISMO
  if (!supplierId) {
    return error("El producto tiene proveedor. El lote debe tenerlo.");
  }
  if (supplierId !== product.supplierId) {
    return error("Proveedores no coinciden");
  }
} else {
  // Producto SIN proveedor → Lote OPCIONAL
  if (supplierId) {
    // Validar que el proveedor existe
    verificarQueExiste(supplierId);
  }
}
```

---

## 📝 Notas Importantes

1. **Consistencia de datos:**
   - Cuando un producto tiene proveedor fijo, TODOS sus lotes deben ser de ese proveedor
   - Esto asegura trazabilidad y control de calidad

2. **Flexibilidad:**
   - Productos sin proveedor fijo permiten diversificar fuentes de abastecimiento
   - Útil para productos genéricos o de múltiples marcas

3. **Recibo siempre opcional:**
   - No todo lote tiene documentación formal
   - El sistema no debe bloquear operaciones por falta de factura
   - La factura es útil para auditoría pero no es requisito técnico

4. **Migración de datos:**
   - Lotes existentes con proveedor NULL son válidos si el producto tampoco tiene proveedor
   - La migración no afecta datos existentes, solo permite nuevas combinaciones

---

## 🧪 Testing

Ejecutar:
```bash
node test-batch-without-supplier.js
```

Cubre:
- ✅ Producto con proveedor → Lote con mismo proveedor
- ✅ Producto con proveedor → Lote sin proveedor (debe fallar)
- ✅ Producto sin proveedor → Lote sin proveedor
- ✅ Producto sin proveedor → Lote con proveedor
- ✅ Recibo opcional en todos los casos

---

**Fecha de actualización:** 2025-11-05
**Autor:** Alexander Echeverria
**Versión:** 1.0
