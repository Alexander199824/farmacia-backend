# Configuración de Entornos - Farmacia Elizabeth

## Cómo funciona

Este proyecto usa **dos entornos separados**:

### 1. Desarrollo Local (tu computadora)
- Archivo: `.env` (NO se sube a git)
- Base de datos: PostgreSQL local
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### 2. Producción (Render + Vercel)
- Variables de entorno en **Render Dashboard**
- Base de datos: PostgreSQL en Render
- Frontend: `https://elizabet-farmacia-frontend2.vercel.app`

## Configuración Inicial

### Paso 1: Configurar Base de Datos Local

1. Instala PostgreSQL en tu computadora
2. Crea una base de datos:
   ```sql
   CREATE DATABASE farmacia_elizabeth_local;
   ```

### Paso 2: Configurar .env Local

El archivo `.env` ya está configurado para desarrollo local. Solo necesitas ajustar:

```env
DB_PASSWORD=tu_password_local  # Cambia por tu contraseña de PostgreSQL
```

### Paso 3: Iniciar el servidor

```bash
npm run dev
```

El servidor se conectará automáticamente a tu base de datos local y aceptará peticiones desde `http://localhost:3000`.

## Cómo Trabajar sin Afectar Producción

### ✅ LO QUE PUEDES HACER SEGURO:

1. **Hacer cambios en el código**
   - Edita cualquier archivo `.js`
   - Prueba en local con `npm run dev`
   - Haz commits y push a git

2. **El archivo `.env` NO se sube a git**
   - Está en `.gitignore`
   - Tus cambios locales NO afectarán producción
   - Cada entorno tiene su propia configuración

### 🔒 PRODUCCIÓN ESTÁ PROTEGIDA:

Las variables de entorno de producción están en **Render Dashboard**:
- Ve a: https://dashboard.render.com
- Selecciona tu servicio
- Environment → Environment Variables
- Ahí están las variables de PRODUCCIÓN (diferentes a tu `.env` local)

## Diferencias Clave entre Entornos

| Variable | Local | Producción |
|----------|-------|------------|
| `DB_HOST` | `localhost` | `dpg-d3ou8c1r0fns73dsct10-a.oregon-postgres.render.com` |
| `DB_NAME` | `farmacia_elizabeth_local` | `farmacia_elizabeth_n9uq` |
| `FRONTEND_URL` | `http://localhost:3000` | `https://elizabet-farmacia-frontend2.vercel.app` |
| `NODE_ENV` | `development` | `production` |
| `CLOUDINARY_FOLDER` | `farmacia-elizabeth-dev` | `farmacia-elizabeth` |

## Flujo de Trabajo Recomendado

### Desarrollo Local:
```bash
# 1. Hacer cambios en el código
# 2. Probar localmente
npm run dev

# 3. Verificar que todo funcione
# 4. Hacer commit
git add .
git commit -m "feat: nueva funcionalidad"

# 5. Subir a GitHub
git push origin main
```

### Despliegue a Producción:
```bash
# Render detecta automáticamente los cambios en GitHub
# y despliega usando SUS PROPIAS variables de entorno
# (NO usa tu archivo .env local)
```

## Configurar Variables de Entorno en Render

Si necesitas cambiar variables de producción:

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio backend
3. Environment → Environment Variables
4. Edita o agrega variables
5. Guarda cambios (Render reiniciará automáticamente)

### Variables Importantes en Producción:

```env
DB_HOST=dpg-d3ou8c1r0fns73dsct10-a.oregon-postgres.render.com
DB_NAME=farmacia_elizabeth_n9uq
DB_USER=farmacia_elizabeth_n9uq_user
DB_PASSWORD=p6KZPR8fddhBghpkbEqeGALOWOhVLrq6
FRONTEND_URL=https://elizabet-farmacia-frontend2.vercel.app
NODE_ENV=production
CLOUDINARY_FOLDER=farmacia-elizabeth
```

## Troubleshooting

### Error: "Connection refused" al conectar a la base de datos
- Verifica que PostgreSQL esté corriendo localmente
- Comprueba el `DB_PASSWORD` en `.env`

### Error: CORS
- Verifica que `FRONTEND_URL` en `.env` sea `http://localhost:3000`
- En producción, debe ser `https://elizabet-farmacia-frontend2.vercel.app`

### Los cambios no se reflejan en producción
- Verifica que hayas hecho `git push`
- Revisa los logs en Render Dashboard
- Las variables de entorno en Render son independientes de tu `.env` local

## Seguridad

- ❌ NUNCA subas el archivo `.env` a git
- ✅ Solo sube `.env.example` (plantilla sin datos sensibles)
- ✅ Usa diferentes secretos JWT en local y producción
- ✅ Usa diferentes carpetas de Cloudinary (`-dev` en local)

## Resumen

**LOCAL (tu computadora):**
- Usa archivo `.env`
- Base de datos local
- Puedes hacer todos los cambios que quieras

**PRODUCCIÓN (Render):**
- Usa variables de entorno en Render Dashboard
- Base de datos en Render
- Solo se actualiza cuando haces `git push`
- Usa SUS PROPIAS variables (no tu `.env`)

**¡Trabaja tranquilo! Tu `.env` local NO afecta producción.**

---

## Cambios Recientes en el Sistema de Lotes

### Actualización: Lotes sin Proveedor (2025-11-05)

#### 🎯 Cambio Principal
Se actualizó el sistema de lotes para permitir crear lotes sin proveedor cuando el producto tampoco tiene proveedor asignado.

#### 📋 Reglas de Negocio

**1. Proveedor del Lote:**
- **Producto CON proveedor asignado** → El lote **DEBE** tener el **MISMO** proveedor (obligatorio y debe coincidir)
- **Producto SIN proveedor asignado** → El lote **PUEDE o NO** tener proveedor (opcional)
  - Ejemplo: Un producto genérico sin proveedor fijo, pero un lote específico comprado a un proveedor particular
- Esta validación asegura consistencia cuando el producto tiene un proveedor fijo, pero permite flexibilidad cuando no lo tiene

**2. Recibo (invoiceNumber):**
- El campo `invoiceNumber` es **SIEMPRE OPCIONAL**
- Se puede registrar cuando existe documento físico (factura/recibo)
- Es válido tener recibo incluso sin proveedor registrado (compras informales)
- No es obligatorio incluso cuando hay proveedor

#### 🔧 Cambios Técnicos

**Modelo Batch ([app/models/batch.js](app/models/batch.js)):**
```javascript
supplierId: {
  type: DataTypes.INTEGER,
  allowNull: true,  // ✅ Ahora es opcional
  references: {
    model: 'suppliers',
    key: 'id'
  },
  comment: 'Proveedor (opcional - productos pueden no tener proveedor)'
}
```

**Controlador ([app/controllers/batch.controller.js](app/controllers/batch.controller.js)):**
- ✅ Si producto tiene proveedor → valida que lote tenga el MISMO proveedor (obligatorio)
- ✅ Si producto NO tiene proveedor → lote puede tener o no proveedor (opcional)
- ✅ Valida que el proveedor exista cuando se proporciona
- ✅ Permite invoiceNumber opcional en todos los casos

#### 🗄️ Migración de Base de Datos

Para aplicar los cambios en la base de datos:

```bash
# Ejecutar migración
node migrate-batch-supplier-optional.js
```

Esta migración:
1. Cambia `supplierId` de `NOT NULL` a `NULL` en la tabla `batches`
2. Actualiza el comentario de la columna
3. Verifica el estado final de las columnas

#### 🧪 Pruebas

Archivo de prueba: `test-batch-without-supplier.js`

```bash
# Ejecutar pruebas
node test-batch-without-supplier.js
```

Las pruebas verifican:
- ✅ Crear lote con proveedor y con recibo
- ✅ Crear lote con proveedor sin recibo
- ✅ Crear lote sin proveedor y sin recibo
- ✅ Crear lote sin proveedor pero con recibo (compra informal)
- ❌ ERROR esperado: Producto con proveedor pero lote sin proveedor
- ✅ Producto sin proveedor pero lote con proveedor (válido - es opcional)

#### 📝 Ejemplos de Uso

**Caso 1: Producto con proveedor registrado**
```javascript
// Crear lote (proveedor requerido)
POST /api/batches
{
  "productId": 123,
  "supplierId": 45,        // ✅ Requerido
  "batchNumber": "LOTE-001",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 100,
  "purchasePrice": 60,
  "salePrice": 100,
  "invoiceNumber": "FACT-001"  // ⚠️ Opcional
}
```

**Caso 2: Producto sin proveedor (lote sin proveedor)**
```javascript
// Crear lote sin proveedor
POST /api/batches
{
  "productId": 456,
  // supplierId: NO INCLUIR    // ✅ Opcional - no se especifica
  "batchNumber": "LOTE-002",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 50,
  "purchasePrice": 30,
  "salePrice": 50,
  "invoiceNumber": "REC-001"   // ⚠️ Opcional (puede incluirse si hay recibo)
}
```

**Caso 3: Producto sin proveedor (pero lote CON proveedor)**
```javascript
// Producto genérico sin proveedor fijo, pero este lote específico tiene proveedor
POST /api/batches
{
  "productId": 456,
  "supplierId": 45,            // ✅ Opcional - en este caso SÍ se incluye
  "batchNumber": "LOTE-003",
  "manufacturingDate": "2024-01-01",
  "expirationDate": "2026-01-01",
  "initialQuantity": 75,
  "purchasePrice": 28,
  "salePrice": 50,
  "invoiceNumber": "FACT-XYZ-001"  // ⚠️ Opcional
}
```

#### 🚀 Despliegue a Producción

Antes de desplegar:

1. **Probar localmente:**
   ```bash
   # 1. Ejecutar migración en local
   node migrate-batch-supplier-optional.js

   # 2. Ejecutar pruebas
   node test-batch-without-supplier.js

   # 3. Verificar que todo funcione
   ```

2. **Hacer commit:**
   ```bash
   git add .
   git commit -m "feat: permitir lotes sin proveedor cuando el producto no tiene proveedor"
   git push origin main
   ```

3. **En producción (Render):**
   - Render detectará los cambios y desplegará automáticamente
   - **IMPORTANTE:** Ejecutar la migración en producción:
     ```bash
     # Conectarse a la BD de producción y ejecutar:
     ALTER TABLE batches ALTER COLUMN "supplierId" DROP NOT NULL;
     ```
   - O ejecutar el script de migración en el servicio de Render

#### ⚠️ Notas Importantes

- Los lotes existentes no se ven afectados
- La migración solo cambia la restricción `NOT NULL`
- Los datos existentes permanecen intactos
- Es compatible con versiones anteriores del frontend
- El frontend puede necesitar actualizarse para aprovechar esta funcionalidad
