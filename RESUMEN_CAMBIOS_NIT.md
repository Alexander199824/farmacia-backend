# Resumen de Cambios - Campo NIT

## 📋 Contexto
**Sistema:** Farmacia local en Rabinal, Baja Verapaz
**Tipo de comprobantes:** Solo recibos simples (NO facturas fiscales)
**Conclusión:** El campo NIT NO se usa ni se usará

---

## ✅ Cambios Realizados en Backend

### 1. **Modelo User (app/models/user.js)**
- ✅ Campo `nit` PERMANECE en la base de datos (por si acaso futuro)
- ⚠️ Pero NO se usará ni mostrará en el frontend

### 2. **Controlador de Usuarios (app/controllers/user.controller.js)**

#### `register()` - Línea 21-66
**ANTES:**
```javascript
const { email, password, firstName, lastName, dpi, nit, phone, address, birthDate, role = 'cliente' } = req.body;
const userData = { email, password, firstName, lastName, role, dpi, nit, phone, address, birthDate, ... };
```

**DESPUÉS:**
```javascript
const { email, password, firstName, lastName, dpi, phone, address, birthDate, role = 'cliente' } = req.body;
const userData = { email, password, firstName, lastName, role, dpi, phone, address, birthDate, ...
  // nit: No se usa en sistema local (solo recibos simples, no facturas)
};
```

#### `updateProfile()` - Línea 343-360
**ANTES:**
```javascript
const { firstName, lastName, phone, address, birthDate, nit } = req.body;
if (nit !== undefined) updates.nit = nit;
```

**DESPUÉS:**
```javascript
const { firstName, lastName, phone, address, birthDate, dpi } = req.body;
if (dpi !== undefined) updates.dpi = dpi;
// nit: No se usa en sistema local (solo recibos simples, no facturas)
```

#### `createUser()` (Admin) - Línea 503-538
**ANTES:**
```javascript
const { email, password, firstName, lastName, role, dpi, nit, phone, address, birthDate } = req.body;
const userData = { email, password, firstName, lastName, role: role || 'cliente', dpi, nit, phone, address, birthDate, ... };
```

**DESPUÉS:**
```javascript
const { email, password, firstName, lastName, role, dpi, phone, address, birthDate } = req.body;
const userData = { email, password, firstName, lastName, role: role || 'cliente', dpi, phone, address, birthDate, ...
  // nit: No se usa en sistema local (solo recibos simples, no facturas)
};
```

#### `updateUser()` (Admin) - Línea 570-617
**ANTES:**
```javascript
const { email, firstName, lastName, role, dpi, nit, phone, address, birthDate, isActive } = req.body;
if (nit !== undefined) updates.nit = nit;
```

**DESPUÉS:**
```javascript
const { email, firstName, lastName, role, dpi, phone, address, birthDate, isActive } = req.body;
// nit: No se usa en sistema local (solo recibos simples, no facturas)
```

---

## 📝 Campo NIT en Otros Modelos

### Invoice Model (app/models/invoice.js)
- Campo `clientNit` **SÍ EXISTE** en el modelo (línea 101-105)
- **Comentario:** "NIT para facturación fiscal (opcional)"
- **Estado:** Se mantiene por compatibilidad, pero NO se usa
- **Valor:** Siempre será `null` en sistema local

### Supplier Model (app/models/Supplier.js)
- Campo `nit` **SÍ EXISTE** para proveedores
- **Razón:** Los proveedores SÍ necesitan NIT para fines contables
- **Estado:** ✅ Se mantiene y se usa

---

## 🎯 Campos que SÍ se Usan (Sistema Local)

### Clientes (role: 'cliente')
| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `email` | ✅ Sí | Login único |
| `password` | ✅ Sí | Autenticación |
| `firstName` | ✅ Sí | Nombre |
| `lastName` | ✅ Sí | Apellido |
| `phone` | ⚠️ Recomendado | Teléfono de contacto |
| `address` | ⚠️ Recomendado | Dirección en Rabinal (barrio, referencias) |
| `dpi` | ❌ Opcional | Identificación (para recibos) |
| `birthDate` | ❌ Opcional | Fecha de nacimiento |
| `profileImage` | ❌ Opcional | Foto de perfil |
| `role` | ✅ Sí | Automático: 'cliente' |
| `isActive` | ✅ Sí | Automático: true |

### Campos que NO se usan
- ❌ `nit` - No se emiten facturas fiscales
- ❌ `city`, `state`, `postalCode` - No existen en modelo (todos son de Rabinal)

---

## 📊 Impacto en Base de Datos

### ¿Necesita Migración?
**NO** - No se requiere migración porque:
1. El campo `nit` ya existe en la BD
2. Solo dejamos de usarlo en el código
3. Los valores existentes quedarán como `null`
4. No afecta datos existentes

### Estado del Campo NIT
```sql
-- Campo en tabla users (se mantiene)
nit VARCHAR(20) NULL

-- Campo en tabla invoices (se mantiene)
clientNit VARCHAR(20) NULL COMMENT 'NIT para facturacion fiscal (opcional)'

-- Campo en tabla suppliers (se mantiene y usa)
nit VARCHAR(20) NULL
```

---

## 🔄 Frontend - Guía Actualizada

### Registro de Usuario
```javascript
// ❌ ANTES (con NIT)
const userData = {
  email, password, firstName, lastName, phone, address, dpi, nit
};

// ✅ AHORA (sin NIT)
const userData = {
  email, password, firstName, lastName, phone, address, dpi
};
```

### Actualizar Perfil
```javascript
// ❌ ANTES (con NIT)
formData.append('nit', updates.nit);

// ✅ AHORA (sin NIT)
// No se envía el campo NIT
```

### Respuestas del API
```javascript
// El campo 'nit' puede aparecer en respuestas pero siempre será null
{
  id: 10,
  firstName: "Juan",
  email: "juan@email.com",
  dpi: "1234567890101",
  nit: null,  // Siempre null - no se usa
  role: "cliente",
  isActive: true
}
```

---

## ⚠️ Notas Importantes

### 1. ¿Por qué NO eliminar el campo de la BD?
- Evitar cambios de esquema innecesarios
- Mantener compatibilidad con código existente
- Fácil de reactivar si en el futuro emiten facturas

### 2. ¿Qué pasa con datos existentes?
- Usuarios con `nit` previo: se mantiene el valor
- Usuarios nuevos: `nit` será `null`
- NO afecta funcionamiento del sistema

### 3. ¿Se puede reactivar en el futuro?
- ✅ Sí, fácilmente
- Solo descomentar las líneas en controllers
- Agregar campo en formularios frontend

---

## 🧪 Testing

### Endpoints a Probar

#### 1. Registro de Usuario
```bash
POST /api/users/register
{
  "email": "test@email.com",
  "password": "Test123!",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "12345678",
  "address": "Barrio El Centro, Rabinal",
  "dpi": "1234567890101"
  // ❌ NO enviar 'nit'
}
```

#### 2. Actualizar Perfil
```bash
PUT /api/users/profile
Authorization: Bearer {token}
{
  "firstName": "Juan Carlos",
  "phone": "98765432",
  "address": "Barrio San Sebastián",
  "dpi": "1234567890101"
  // ❌ NO enviar 'nit'
}
```

#### 3. Admin Crear Usuario
```bash
POST /api/users
Authorization: Bearer {admin_token}
{
  "email": "nuevo@email.com",
  "password": "Pass123!",
  "firstName": "María",
  "lastName": "López",
  "role": "cliente",
  "phone": "11111111"
  // ❌ NO enviar 'nit'
}
```

---

## 📚 Archivos Modificados

1. ✅ `app/controllers/user.controller.js` - Eliminadas 4 referencias a NIT
2. ✅ `GUIA_FRONTEND_CLIENTES.md` - Documentación actualizada
3. ✅ `RESUMEN_CAMBIOS_NIT.md` - Este archivo (nueva documentación)

---

## ✅ Checklist de Verificación

- [x] Eliminar NIT de `register()`
- [x] Eliminar NIT de `updateProfile()`
- [x] Eliminar NIT de `createUser()`
- [x] Eliminar NIT de `updateUser()`
- [x] Actualizar documentación frontend
- [x] Crear resumen de cambios
- [ ] Probar endpoints sin NIT
- [ ] Validar que perfiles existentes funcionen
- [ ] Actualizar frontend (pendiente)

---

**Fecha:** 2025-01-05
**Autor:** Alexander Echeverria
**Sistema:** Farmacia Elizabeth - Rabinal, B.V.
