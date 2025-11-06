# Instrucciones de Deploy - Sistema de Lotes Actualizado

## 📋 Archivos Modificados/Creados

### Archivos del Sistema (Backend)

✅ **Modificados:**
1. `app/models/batch.js` - supplierId ahora permite NULL
2. `app/controllers/batch.controller.js` - Validaciones actualizadas
3. `CONFIGURACION.md` - Documentación técnica actualizada

✅ **Creados:**
1. `migrate-batch-supplier-optional.js` - Script de migración de BD
2. `test-batch-without-supplier.js` - Tests completos (6 casos)
3. `REGLAS_LOTES.md` - Reglas de negocio detalladas
4. `GUIA_FRONTEND_LOTES.md` - Guía completa para frontend
5. `RESUMEN_CAMBIOS_LOTES.md` - Resumen ejecutivo
6. `INSTRUCCIONES_DEPLOY_LOTES.md` - Este archivo

---

## 🚀 Pasos para Deploy

### PASO 1: Probar en Local (Desarrollo)

#### 1.1 Verificar que PostgreSQL esté corriendo

```bash
# Windows
# Buscar "Services" → Verificar que PostgreSQL esté corriendo

# O intentar conectar
psql -U postgres
```

#### 1.2 Ejecutar la migración en local

```bash
node migrate-batch-supplier-optional.js
```

**Salida esperada:**
```
🔄 Iniciando migración: Hacer supplierId opcional en batches...
✅ Conexión a la base de datos establecida.
✅ Columna "supplierId" ahora es opcional (NULL permitido).
✅ Comentario de la columna actualizado.
📊 Estado actual de las columnas:
┌─────────┬──────────────┬─────────────┬───────────┐
│ (index) │ column_name  │ is_nullable │ data_type │
├─────────┼──────────────┼─────────────┼───────────┤
│    0    │ 'invoiceNumber' │    'YES'    │ 'character varying' │
│    1    │ 'supplierId'    │    'YES'    │   'integer'  │
└─────────┴──────────────┴─────────────┴───────────┘
✅ Migración completada exitosamente!
```

#### 1.3 Ejecutar las pruebas

```bash
node test-batch-without-supplier.js
```

**Verifica que:**
- ✅ Test 1: Lote con proveedor + recibo → Creado
- ✅ Test 2: Lote con proveedor sin recibo → Creado
- ✅ Test 3: Lote sin proveedor sin recibo → Creado
- ✅ Test 4: Lote sin proveedor + recibo → Creado
- ❌ Test 5: Producto con proveedor pero lote sin proveedor → Error esperado
- ✅ Test 6: Producto sin proveedor pero lote con proveedor → Creado

#### 1.4 Verificar que el servidor arranca sin errores

```bash
npm run dev
```

---

### PASO 2: Commit y Push a GitHub

```bash
# Ver cambios
git status

# Agregar archivos
git add .

# Crear commit
git commit -m "feat: sistema de lotes flexible - proveedor opcional según producto

- Modelo Batch: supplierId ahora permite NULL
- Controlador: validación inteligente según proveedor del producto
- Producto CON proveedor → lote debe tener el MISMO proveedor
- Producto SIN proveedor → lote puede tener o no proveedor
- invoiceNumber siempre opcional
- Incluye migración, tests y documentación completa"

# Subir a GitHub
git push origin main
```

---

### PASO 3: Deploy en Producción (Render)

#### 3.1 Render desplegará automáticamente

Una vez que hagas `git push`, Render detectará los cambios y:
1. Descargará el nuevo código
2. Instalará dependencias
3. Reiniciará el servidor

**Monitorear en:** https://dashboard.render.com
- Ve a tu servicio backend
- Click en "Logs" para ver el despliegue

#### 3.2 Ejecutar migración en producción

**Opción A: Conectarse a la BD desde Render Shell**

1. En Render Dashboard → Selecciona tu servicio
2. Click en "Shell" (consola)
3. Ejecutar:

```bash
node migrate-batch-supplier-optional.js
```

**Opción B: Conectarse directamente a PostgreSQL**

1. Obtener credenciales de la BD en Render:
   - DB_HOST
   - DB_NAME
   - DB_USER
   - DB_PASSWORD

2. Usar un cliente SQL (pgAdmin, DBeaver, etc.) y ejecutar:

```sql
-- Hacer supplierId opcional
ALTER TABLE batches
ALTER COLUMN "supplierId" DROP NOT NULL;

-- Actualizar comentario
COMMENT ON COLUMN batches."supplierId" IS
'Proveedor (opcional - productos pueden no tener proveedor)';

-- Verificar cambio
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'batches'
AND column_name IN ('supplierId', 'invoiceNumber')
ORDER BY column_name;
```

**Salida esperada:**
```
column_name     | is_nullable | data_type
----------------|-------------|------------------
invoiceNumber   | YES         | character varying
supplierId      | YES         | integer
```

#### 3.3 Verificar que el backend esté funcionando

```bash
# Hacer una petición de prueba
curl https://tu-backend.onrender.com/api/batches
```

---

### PASO 4: Actualizar Frontend

Ahora que el backend está actualizado, el equipo de frontend debe:

1. **Leer la documentación:**
   - [RESUMEN_CAMBIOS_LOTES.md](RESUMEN_CAMBIOS_LOTES.md) - Resumen rápido
   - [GUIA_FRONTEND_LOTES.md](GUIA_FRONTEND_LOTES.md) - Guía completa con código

2. **Actualizar formulario de lotes:**
   - Campo proveedor bloqueado si producto tiene proveedor
   - Campo proveedor opcional si producto no tiene proveedor
   - Campo recibo siempre opcional

3. **Actualizar listados:**
   - Manejar `supplier: null`
   - Manejar `invoiceNumber: null`

4. **Enviar archivos al frontend:**

Puedes enviar estos archivos al equipo de frontend:
- `RESUMEN_CAMBIOS_LOTES.md`
- `GUIA_FRONTEND_LOTES.md`

O enviarles el link del repositorio si tienen acceso.

---

## ⚠️ Notas Importantes

### Compatibilidad con Datos Existentes

✅ **Los lotes existentes NO se ven afectados:**
- Lotes que ya tienen proveedor → siguen funcionando igual
- La migración solo cambia la restricción de la columna
- No se modifican datos existentes

### Compatibilidad con Frontend Actual

✅ **El frontend actual seguirá funcionando:**
- Si el frontend siempre envía `supplierId` → funcionará
- Si el frontend a veces no envía `supplierId` → ahora funcionará (antes daba error)
- Es **retrocompatible**

### Funcionalidad Nueva

🆕 **Lo que ahora es posible:**
1. Crear lotes sin proveedor (si el producto no tiene proveedor)
2. Crear lotes con proveedor específico para productos sin proveedor fijo
3. Mayor flexibilidad en la gestión de inventario

---

## 🧪 Testing en Producción

Una vez desplegado en producción, hacer pruebas manuales:

### Test 1: Crear lote para producto con proveedor

```bash
POST https://tu-backend.onrender.com/api/batches
{
  "productId": <ID de producto con proveedor>,
  "supplierId": <MISMO ID que el producto>,
  "batchNumber": "TEST-001",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 10,
  "purchasePrice": 50,
  "salePrice": 100
}
```

**Esperado:** ✅ 201 Created

### Test 2: Crear lote sin proveedor

```bash
POST https://tu-backend.onrender.com/api/batches
{
  "productId": <ID de producto SIN proveedor>,
  "batchNumber": "TEST-002",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 10,
  "purchasePrice": 30,
  "salePrice": 50
}
```

**Esperado:** ✅ 201 Created

### Test 3: Error - Producto con proveedor pero lote sin proveedor

```bash
POST https://tu-backend.onrender.com/api/batches
{
  "productId": <ID de producto con proveedor>,
  "batchNumber": "TEST-003",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 10,
  "purchasePrice": 30,
  "salePrice": 50
}
```

**Esperado:** ❌ 400 Bad Request
```json
{
  "message": "El producto tiene asignado el proveedor ID X. El lote debe tener el mismo proveedor."
}
```

---

## 📊 Resumen de Cambios Técnicos

| Componente | Estado | Impacto |
|------------|--------|---------|
| Modelo `Batch` | ✅ Actualizado | `supplierId` permite NULL |
| Controlador `batch.controller.js` | ✅ Actualizado | Validación condicional |
| Base de Datos | ⚠️ Requiere migración | Quitar constraint NOT NULL |
| Frontend | ⚠️ Requiere actualización | Adaptar formularios y listados |
| API Response | ⚠️ Cambio menor | `supplier` y `invoiceNumber` pueden ser null |
| Retrocompatibilidad | ✅ Sí | Frontend actual sigue funcionando |

---

## 🆘 Troubleshooting

### Error: "Connection refused" al ejecutar migración

**Causa:** PostgreSQL no está corriendo o `.env` mal configurado

**Solución:**
```bash
# Verificar .env
cat .env | grep DB_

# Verificar PostgreSQL
psql -U postgres -h localhost -p 5432
```

### Error: "supplierId is required" al crear lote sin proveedor

**Causa:** La migración no se ejecutó en producción

**Solución:**
```bash
# Ejecutar migración en Render Shell
node migrate-batch-supplier-optional.js

# O ejecutar SQL directamente
ALTER TABLE batches ALTER COLUMN "supplierId" DROP NOT NULL;
```

### Error: "Proveedor no encontrado"

**Causa:** El ID del proveedor no existe

**Solución:**
- Verificar que el proveedor exista: `GET /api/suppliers/:id`
- Actualizar el frontend para validar antes de enviar

---

## ✅ Checklist Final

**Backend:**
- [ ] Código actualizado en GitHub
- [ ] Migración ejecutada en local
- [ ] Tests ejecutados exitosamente
- [ ] Servidor local funciona sin errores
- [ ] Commit y push realizados
- [ ] Deploy en Render completado
- [ ] Migración ejecutada en producción
- [ ] Tests manuales en producción exitosos

**Frontend:**
- [ ] Documentación enviada al equipo
- [ ] Formulario de lotes actualizado
- [ ] Listados actualizados para manejar `null`
- [ ] Tests en desarrollo
- [ ] Tests en producción

**Documentación:**
- [ ] [REGLAS_LOTES.md](REGLAS_LOTES.md) creado
- [ ] [GUIA_FRONTEND_LOTES.md](GUIA_FRONTEND_LOTES.md) creado
- [ ] [RESUMEN_CAMBIOS_LOTES.md](RESUMEN_CAMBIOS_LOTES.md) creado
- [ ] [CONFIGURACION.md](CONFIGURACION.md) actualizado

---

**¡Todo listo para el deploy!** 🚀

Si tienes dudas, revisa los archivos de documentación o ejecuta los tests.

---

**Fecha:** 2025-11-05
**Autor:** Alexander Echeverria
**Versión:** 1.0
