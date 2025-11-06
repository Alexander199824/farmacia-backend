# Sistema de Lotes - Documentación Completa

## 📚 Índice de Documentación

Esta es la documentación completa del sistema de lotes actualizado de la Farmacia Elizabeth.

---

## 🚀 Inicio Rápido

**Si eres nuevo en este proyecto, empieza aquí:**

1. **[RESUMEN_CAMBIOS_LOTES.md](RESUMEN_CAMBIOS_LOTES.md)** ⭐ **EMPIEZA AQUÍ**
   - Resumen ejecutivo de 5 minutos
   - Cambios principales
   - Ejemplos de código rápidos
   - **Audiencia:** Todos

---

## 📖 Documentación por Audiencia

### Para Desarrolladores Frontend

**Lectura obligatoria:**

1. **[RESUMEN_CAMBIOS_LOTES.md](RESUMEN_CAMBIOS_LOTES.md)** - 5 minutos
   - Qué cambió en el API
   - Reglas simples
   - Ejemplos de payload

2. **[GUIA_FRONTEND_LOTES.md](GUIA_FRONTEND_LOTES.md)** - 15 minutos
   - Guía completa con ejemplos de código
   - Implementación de formularios
   - Manejo de respuestas del API
   - Casos de uso con UI

**Lectura opcional:**

3. **[REGLAS_LOTES.md](REGLAS_LOTES.md)** - 10 minutos
   - Reglas de negocio detalladas
   - Casos de uso reales
   - Tabla de validación completa

### Para Desarrolladores Backend

**Lectura obligatoria:**

1. **[INSTRUCCIONES_DEPLOY_LOTES.md](INSTRUCCIONES_DEPLOY_LOTES.md)** - 10 minutos
   - Pasos para deploy
   - Cómo ejecutar migración
   - Checklist completo

2. **[REGLAS_LOTES.md](REGLAS_LOTES.md)** - 10 minutos
   - Reglas de negocio
   - Validaciones implementadas
   - Casos de uso

**Lectura opcional:**

3. **[CONFIGURACION.md](CONFIGURACION.md)** (sección de lotes) - 5 minutos
   - Configuración técnica
   - Variables de entorno
   - Proceso de deploy

### Para Product Owners / Stakeholders

**Lectura recomendada:**

1. **[REGLAS_LOTES.md](REGLAS_LOTES.md)** - 10 minutos
   - Reglas de negocio en lenguaje no técnico
   - Casos de uso reales
   - Beneficios de la actualización

---

## 📁 Archivos del Sistema

### Archivos de Código (Backend)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `app/models/batch.js` | Modelo de lotes | ✅ Actualizado |
| `app/controllers/batch.controller.js` | Controlador de lotes | ✅ Actualizado |
| `migrate-batch-supplier-optional.js` | Script de migración | ✅ Nuevo |
| `test-batch-without-supplier.js` | Tests completos | ✅ Nuevo |

### Archivos de Documentación

| Archivo | Contenido | Audiencia | Tiempo |
|---------|-----------|-----------|--------|
| **[README_LOTES.md](README_LOTES.md)** | Este archivo - índice | Todos | 2 min |
| **[RESUMEN_CAMBIOS_LOTES.md](RESUMEN_CAMBIOS_LOTES.md)** | Resumen ejecutivo | Todos | 5 min |
| **[GUIA_FRONTEND_LOTES.md](GUIA_FRONTEND_LOTES.md)** | Guía completa frontend | Frontend | 15 min |
| **[REGLAS_LOTES.md](REGLAS_LOTES.md)** | Reglas de negocio | Todos | 10 min |
| **[INSTRUCCIONES_DEPLOY_LOTES.md](INSTRUCCIONES_DEPLOY_LOTES.md)** | Instrucciones de deploy | Backend | 10 min |
| **[CONFIGURACION.md](CONFIGURACION.md)** | Configuración general | Backend | 5 min |

---

## 🎯 Cambios Principales

### Resumen de 30 Segundos

**Antes:**
- Todos los lotes requerían proveedor obligatorio

**Ahora:**
- **Producto CON proveedor** → Lote debe tener el MISMO proveedor (obligatorio)
- **Producto SIN proveedor** → Lote puede tener o no proveedor (opcional)
- Recibo siempre opcional

### Beneficios

✅ **Mayor flexibilidad:**
- Productos genéricos sin proveedor fijo
- Lotes de compras informales sin proveedor

✅ **Mejor trazabilidad:**
- Productos con proveedor exclusivo mantienen consistencia
- Validaciones automáticas

✅ **Realidad del negocio:**
- Refleja cómo realmente funcionan las compras en farmacias
- Permite registrar todo tipo de adquisiciones

---

## 🔧 Reglas de Negocio Simplificadas

### Regla 1: Proveedor

```
SI producto.supplierId ≠ null:
  → lote.supplierId es OBLIGATORIO
  → lote.supplierId debe ser === producto.supplierId

SI producto.supplierId = null:
  → lote.supplierId es OPCIONAL
  → Usuario decide si incluir proveedor o no
```

### Regla 2: Recibo/Factura

```
invoiceNumber es SIEMPRE OPCIONAL
→ No importa si hay proveedor o no
```

---

## 📊 Casos de Uso

### Caso 1: Medicamento de Marca Exclusiva

**Ejemplo:** Paracetamol MK 500mg
- **Producto:** Tiene proveedor fijo (Laboratorios MK)
- **Lote:** DEBE ser del mismo proveedor
- **Razón:** Marca exclusiva, un solo fabricante

### Caso 2: Producto Genérico

**Ejemplo:** Alcohol en Gel
- **Producto:** NO tiene proveedor fijo
- **Lote A:** Sin proveedor (compra informal)
- **Lote B:** Con proveedor (compra a distribuidor)
- **Razón:** Producto disponible de múltiples fuentes

### Caso 3: Muestra Médica

**Ejemplo:** Vitamina C 1000mg
- **Producto:** Con o sin proveedor
- **Lote:** Donación de laboratorio
- **Recibo:** No hay (es donación)
- **Razón:** No es transacción comercial

---

## 🚀 Cómo Empezar

### Para Frontend

1. Lee [RESUMEN_CAMBIOS_LOTES.md](RESUMEN_CAMBIOS_LOTES.md) (5 min)
2. Lee [GUIA_FRONTEND_LOTES.md](GUIA_FRONTEND_LOTES.md) (15 min)
3. Actualiza tus formularios según los ejemplos
4. Prueba con el backend actualizado

### Para Backend

1. Lee [INSTRUCCIONES_DEPLOY_LOTES.md](INSTRUCCIONES_DEPLOY_LOTES.md) (10 min)
2. Ejecuta migración en local:
   ```bash
   node migrate-batch-supplier-optional.js
   ```
3. Ejecuta tests:
   ```bash
   node test-batch-without-supplier.js
   ```
4. Haz deploy a producción

---

## 🧪 Testing

### Tests Automatizados

```bash
# Ejecutar todos los tests de lotes
node test-batch-without-supplier.js
```

**Cubre 6 escenarios:**
1. ✅ Lote con proveedor + con recibo
2. ✅ Lote con proveedor + sin recibo
3. ✅ Lote sin proveedor + sin recibo
4. ✅ Lote sin proveedor + con recibo
5. ❌ Error: Producto con proveedor pero lote sin proveedor
6. ✅ Producto sin proveedor pero lote con proveedor

### Tests Manuales

Ver [INSTRUCCIONES_DEPLOY_LOTES.md](INSTRUCCIONES_DEPLOY_LOTES.md#testing-en-produccion) para ejemplos de peticiones.

---

## 📞 Soporte

### ¿Tienes dudas?

**Frontend:**
- Lee [GUIA_FRONTEND_LOTES.md](GUIA_FRONTEND_LOTES.md)
- Revisa ejemplos de código en la guía
- Ejecuta tests para ver comportamiento real

**Backend:**
- Lee [REGLAS_LOTES.md](REGLAS_LOTES.md)
- Revisa validaciones en `app/controllers/batch.controller.js`
- Ejecuta `node test-batch-without-supplier.js`

**Reglas de Negocio:**
- Lee [REGLAS_LOTES.md](REGLAS_LOTES.md)
- Revisa tabla de validación
- Consulta casos de uso reales

---

## 🗺️ Roadmap

### ✅ Completado (v1.0 - 2025-11-05)

- [x] Modelo actualizado
- [x] Validaciones implementadas
- [x] Migración de BD
- [x] Tests automatizados
- [x] Documentación completa

### 🔜 Próximos Pasos

- [ ] Actualizar frontend
- [ ] Deploy a producción
- [ ] Capacitación a usuarios
- [ ] Monitoreo post-deploy

---

## 📄 Licencia y Créditos

**Proyecto:** Sistema de Gestión - Farmacia Elizabeth
**Autor:** Alexander Echeverria
**Fecha:** 2025-11-05
**Versión:** 1.0

---

## 🎓 Glosario

| Término | Definición |
|---------|------------|
| **Lote** | Conjunto de productos con mismo número de fabricación |
| **supplierId** | ID del proveedor en la base de datos |
| **invoiceNumber** | Número de factura o recibo de compra |
| **Producto con proveedor** | Producto que tiene `supplierId ≠ null` |
| **Producto sin proveedor** | Producto que tiene `supplierId = null` |
| **FIFO** | First In, First Out - Primero en entrar, primero en salir |
| **Migración** | Script para modificar la estructura de la BD |

---

**¿Por dónde empezar?** → [RESUMEN_CAMBIOS_LOTES.md](RESUMEN_CAMBIOS_LOTES.md) ⭐
