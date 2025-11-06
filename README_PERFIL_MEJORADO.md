# 🎯 Sistema de Perfil de Cliente - MEJORADO

## 📋 Resumen de Mejoras

Este documento describe las **mejoras implementadas** en el sistema de perfil de cliente para la Farmacia Elizabeth.

### ✨ Nuevas Funcionalidades

1. **✅ Edición de campos individuales** - Ya no es necesario enviar todos los campos
2. **✅ Endpoint separado para imagen** - Subir imagen a Cloudinary antes de guardar en BD
3. **✅ Contraseñas para usuarios de Google** - Establecer contraseña para autenticación dual

---

## 📂 Archivos Modificados

### Backend

| Archivo | Cambios |
|---------|---------|
| `app/controllers/user.controller.js` | ✅ Mejorado `updateProfile` para campos individuales<br>✅ Agregado `updateProfileImage` nuevo<br>✅ Mejorado `changePassword` para Google Auth |
| `app/routers/userRoutes.js` | ✅ Agregada ruta `PUT /api/users/profile/image`<br>✅ Actualizado `PUT /api/users/profile` (ya no requiere multipart) |

### Documentación

| Archivo | Descripción |
|---------|-------------|
| `GUIA_PERFIL_CLIENTE_MEJORADO.md` | 📖 Guía completa con ejemplos de uso |
| `RESUMEN_MEJORAS_PERFIL.md` | 📊 Resumen técnico de las mejoras |
| `TEST_PERFIL_CLIENTE.js` | 🧪 Tests automatizados con Axios |
| `EJEMPLOS_REACT_PERFIL.jsx` | ⚛️ Componentes React listos para usar |
| `README_PERFIL_MEJORADO.md` | 📘 Este archivo |

---

## 🔧 Cambios Técnicos

### 1. Actualizar Perfil (Campos de Texto)

**Antes:**
```javascript
// ❌ Era necesario enviar todos los campos
await axios.put('/api/users/profile', {
  firstName: 'Juan',
  lastName: 'Pérez',
  phone: '12345678',
  address: 'Barrio El Centro',
  dpi: '1234567890101',
  birthDate: '1990-05-15'
});
```

**Ahora:**
```javascript
// ✅ Puedes actualizar solo un campo
await axios.put('/api/users/profile', { phone: '12345678' });

// ✅ O varios campos
await axios.put('/api/users/profile', {
  firstName: 'Juan',
  phone: '12345678'
});
```

**Content-Type:** `application/json` (ya no requiere `multipart/form-data`)

---

### 2. Actualizar Imagen de Perfil

**Antes:**
```javascript
// ❌ La imagen se subía junto con los datos
const formData = new FormData();
formData.append('firstName', 'Juan');
formData.append('image', file);

await axios.put('/api/users/profile', formData);
```

**Ahora:**
```javascript
// ✅ Endpoint separado solo para imagen
const formData = new FormData();
formData.append('image', file);

await axios.put('/api/users/profile/image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Respuesta:
// {
//   message: "Imagen de perfil actualizada exitosamente",
//   profileImage: "https://res.cloudinary.com/.../profile.jpg"
// }
```

**Beneficios:**
- ✅ Primero sube a Cloudinary, luego guarda el link en BD
- ✅ Elimina la imagen anterior automáticamente
- ✅ Proceso separado y más limpio

---

### 3. Cambiar Contraseña

**Antes:**
```javascript
// ❌ Solo funcionaba para usuarios con contraseña
await axios.post('/api/users/change-password', {
  currentPassword: 'MiPasswordActual123',
  newPassword: 'NuevoPassword456!'
});

// ❌ Usuarios de Google NO podían establecer contraseña
// Error: "Esta cuenta fue creada con Google y no tiene contraseña"
```

**Ahora:**
```javascript
// ✅ CASO 1: Usuario normal (tiene contraseña)
await axios.post('/api/users/change-password', {
  currentPassword: 'MiPasswordActual123',
  newPassword: 'NuevoPassword456!'
});

// ✅ CASO 2: Usuario de Google (sin contraseña)
// Solo envía la nueva contraseña (NO requiere la actual)
await axios.post('/api/users/change-password', {
  newPassword: 'MiPrimeraPassword123!'
});

// Respuesta:
// "Contraseña establecida. Ahora puedes iniciar sesión con email y contraseña además de Google"
```

**Beneficios:**
- ✅ Usuarios de Google pueden tener autenticación dual
- ✅ Mayor flexibilidad
- ✅ No pierden acceso si hay problemas con Google OAuth

---

## 🚀 Cómo Usar

### 1. Instalación (si no tienes el proyecto configurado)

```bash
# Clonar repositorio
git clone <url-del-repo>

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor
npm start
```

### 2. Probar los Endpoints

#### Opción A: Con Postman/Thunder Client

```
GET    http://localhost:5000/api/users/profile
PUT    http://localhost:5000/api/users/profile
PUT    http://localhost:5000/api/users/profile/image
POST   http://localhost:5000/api/users/change-password
```

Headers:
```
Authorization: Bearer TU_TOKEN_JWT
Content-Type: application/json (excepto para /image)
```

#### Opción B: Con el archivo de tests

```bash
# Editar TOKEN en TEST_PERFIL_CLIENTE.js
# Ejecutar todos los tests
node TEST_PERFIL_CLIENTE.js
```

### 3. Integrar en Frontend

```bash
# Copiar el componente React
cp EJEMPLOS_REACT_PERFIL.jsx src/components/PerfilCliente.jsx

# Usar en tu aplicación
import PerfilCliente from './components/PerfilCliente';

function App() {
  return <PerfilCliente />;
}
```

---

## 📊 Endpoints Disponibles

### Ver Perfil
```
GET /api/users/profile
```

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "id": 10,
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@email.com",
  "phone": "12345678",
  "address": "Barrio El Centro, Rabinal",
  "dpi": "1234567890101",
  "birthDate": "1990-05-15",
  "role": "cliente",
  "profileImage": "https://res.cloudinary.com/.../profile.jpg",
  "googleId": "1234567890", // null si no usó Google
  "password": "OCULTO" // null si es usuario de Google sin contraseña
}
```

---

### Actualizar Datos (Campos Individuales)
```
PUT /api/users/profile
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (solo los campos que quieras actualizar):**
```json
{
  "phone": "55551234"
}
```

O múltiples campos:
```json
{
  "firstName": "Juan Carlos",
  "phone": "55551234",
  "address": "Barrio San Sebastián, Rabinal"
}
```

**Respuesta:**
```json
{
  "message": "Perfil actualizado exitosamente",
  "user": {
    "id": 10,
    "firstName": "Juan Carlos",
    "phone": "55551234",
    ...
  }
}
```

---

### Actualizar Solo Imagen
```
PUT /api/users/profile/image
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
image: [archivo de imagen]
```

**Respuesta:**
```json
{
  "message": "Imagen de perfil actualizada exitosamente",
  "profileImage": "https://res.cloudinary.com/.../profile.jpg"
}
```

---

### Cambiar/Establecer Contraseña
```
POST /api/users/change-password
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (Usuario con contraseña):**
```json
{
  "currentPassword": "MiPasswordActual123",
  "newPassword": "NuevoPassword456!"
}
```

**Body (Usuario de Google sin contraseña):**
```json
{
  "newPassword": "MiPrimeraPassword123!"
}
```

**Respuesta:**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

O:
```json
{
  "message": "Contraseña establecida exitosamente. Ahora puedes iniciar sesión con email y contraseña además de Google"
}
```

---

## ⚠️ Validaciones

### Campos de Perfil
- ✅ `firstName`, `lastName`: Requeridos en el registro, editables
- ✅ `phone`: Opcional, editable
- ✅ `address`: Opcional, editable (dirección en Rabinal)
- ✅ `dpi`: Opcional, validado para que no se duplique
- ✅ `birthDate`: Opcional, formato `YYYY-MM-DD`

### Imagen
- ✅ Tamaño máximo: 5MB (recomendado validar en frontend)
- ✅ Formatos: JPG, PNG, GIF
- ✅ Se redimensiona a 400x400 en Cloudinary
- ✅ Se elimina la imagen anterior automáticamente

### Contraseña
- ✅ Longitud mínima: 8 caracteres
- ✅ Usuario normal: requiere contraseña actual
- ✅ Usuario de Google: NO requiere contraseña actual

---

## 🧪 Testing

### 1. Tests Automatizados

```bash
# Editar TOKEN en TEST_PERFIL_CLIENTE.js
# Descomentar el test que quieras ejecutar al final del archivo

# Ejecutar
node TEST_PERFIL_CLIENTE.js
```

### 2. Tests Manuales con cURL

**Ver perfil:**
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TU_TOKEN"
```

**Actualizar solo teléfono:**
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "55551234"}'
```

**Actualizar imagen:**
```bash
curl -X PUT http://localhost:5000/api/users/profile/image \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "image=@/ruta/a/imagen.jpg"
```

**Cambiar contraseña:**
```bash
curl -X POST http://localhost:5000/api/users/change-password \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "old123", "newPassword": "new123456"}'
```

---

## 📝 Ejemplos de Uso en Frontend

### JavaScript Vanilla

```javascript
// Actualizar solo teléfono
const actualizarTelefono = async (nuevoTelefono) => {
  const token = localStorage.getItem('authToken');

  const response = await fetch('http://localhost:5000/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone: nuevoTelefono })
  });

  const data = await response.json();
  console.log('Perfil actualizado:', data);
};
```

### React (con Axios)

Ver archivo completo: `EJEMPLOS_REACT_PERFIL.jsx`

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const EditarTelefono = () => {
  const [phone, setPhone] = useState('');

  const guardar = async () => {
    const token = localStorage.getItem('authToken');

    await axios.put(
      'http://localhost:5000/api/users/profile',
      { phone },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    alert('Teléfono actualizado');
  };

  return (
    <div>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button onClick={guardar}>Guardar</button>
    </div>
  );
};
```

---

## 🔒 Seguridad

### Autenticación
- ✅ Todos los endpoints requieren `Authorization: Bearer {token}`
- ✅ Solo puedes editar tu propio perfil
- ✅ El backend verifica que el `userId` del token coincida

### Validaciones
- ✅ DPI validado para que no se duplique
- ✅ Contraseña mínimo 8 caracteres
- ✅ Imagen máximo 5MB (recomendado validar en frontend también)

### Datos Protegidos
- ❌ El cliente NO puede editar: `email`, `role`, `isActive`
- ❌ Solo admin puede cambiar roles

---

## 📚 Documentación Adicional

- **Guía completa:** [GUIA_PERFIL_CLIENTE_MEJORADO.md](./GUIA_PERFIL_CLIENTE_MEJORADO.md)
- **Resumen técnico:** [RESUMEN_MEJORAS_PERFIL.md](./RESUMEN_MEJORAS_PERFIL.md)
- **Tests automatizados:** [TEST_PERFIL_CLIENTE.js](./TEST_PERFIL_CLIENTE.js)
- **Componentes React:** [EJEMPLOS_REACT_PERFIL.jsx](./EJEMPLOS_REACT_PERFIL.jsx)

---

## ❓ FAQ

### 1. ¿Puedo actualizar la imagen junto con otros campos?

No, ahora están separados:
- Campos de texto: `PUT /api/users/profile` (JSON)
- Imagen: `PUT /api/users/profile/image` (multipart)

### 2. ¿Qué pasa si soy usuario de Google y establezco una contraseña?

Podrás usar **ambos** métodos de login:
- Login con Google ✅
- Login con Email + Contraseña ✅

### 3. ¿Puedo enviar campos vacíos para borrar datos?

Sí, puedes enviar `null` o `''` para borrar:
```javascript
await axios.put('/api/users/profile', { phone: '' }); // Borra el teléfono
```

### 4. ¿Se elimina la imagen anterior de Cloudinary?

Sí, automáticamente cuando subes una nueva imagen.

### 5. ¿Puedo actualizar solo mi nombre sin tocar otros campos?

Sí:
```javascript
await axios.put('/api/users/profile', { firstName: 'Juan Carlos' });
```

---

## 🚀 Próximos Pasos Recomendados

1. **Validación de DPI en frontend** - Validar formato de 13 dígitos
2. **Preview de imagen antes de subir** - Mostrar la imagen antes de confirmar
3. **Indicador de fortaleza de contraseña** - Mostrar qué tan segura es
4. **Confirmación de contraseña** - Pedir que escriba dos veces
5. **Notificaciones por email** - Enviar email cuando se cambie la contraseña
6. **Recorte de imagen** - Permitir recortar la imagen antes de subir

---

**Autor:** Alexander Echeverria
**Fecha:** 2025-01-05
**Backend:** farmacia-backend
**Versión:** 2.0 (Sistema de Perfil Mejorado)
