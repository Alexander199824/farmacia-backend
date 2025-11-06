# Ejemplos Prácticos - Cambiar Roles de Usuarios

## 🎯 Problema Principal

**PROBLEMA:** Al intentar cambiar un usuario a rol `bodega`, `vendedor` o `repartidor`, sale error.

**CAUSA COMÚN:** El frontend está enviando la petición incorrectamente (header faltante, payload mal formado, o sin autenticación de admin).

---

## ✅ SOLUCIÓN COMPLETA

### Ejemplo 1: Cambiar Usuario a Rol "Bodega"

```javascript
const cambiarUsuarioABodega = async (userId) => {
  try {
    // 1. Obtener el token del localStorage
    const token = localStorage.getItem('authToken');

    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // 2. Preparar el payload - SOLO el campo que quieres cambiar
    const payload = {
      role: 'bodega'  // ⚠️ IMPORTANTE: Todo en minúsculas, sin espacios
    };

    // 3. Hacer la petición PUT
    const response = await axios.put(
      `/api/users/${userId}`,  // Reemplazar con ID del usuario
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,     // ⚠️ OBLIGATORIO
          'Content-Type': 'application/json'      // ⚠️ OBLIGATORIO
        }
      }
    );

    console.log('✅ Usuario actualizado a Bodega:', response.data);
    alert('Usuario cambiado a rol Bodega exitosamente');
    return response.data;

  } catch (error) {
    console.error('❌ Error al cambiar a Bodega:', error);

    if (error.response) {
      // El servidor respondió con un código de error
      console.error('Status:', error.response.status);
      console.error('Mensaje:', error.response.data.message);
      alert(`Error: ${error.response.data.message}`);
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('No hubo respuesta del servidor');
      alert('Error: No se pudo conectar con el servidor');
    } else {
      // Algo pasó al configurar la petición
      console.error('Error:', error.message);
      alert(`Error: ${error.message}`);
    }

    throw error;
  }
};

// USO:
cambiarUsuarioABodega(5);  // Cambiar usuario ID 5 a Bodega
```

---

### Ejemplo 2: Cambiar Usuario a Rol "Vendedor"

```javascript
const cambiarUsuarioAVendedor = async (userId) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.put(
      `/api/users/${userId}`,
      { role: 'vendedor' },  // ⚠️ Exactamente así: 'vendedor' (minúsculas)
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Usuario actualizado a Vendedor:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
};

// USO:
cambiarUsuarioAVendedor(10);  // Cambiar usuario ID 10 a Vendedor
```

---

### Ejemplo 3: Cambiar Usuario a Rol "Repartidor"

```javascript
const cambiarUsuarioARepartidor = async (userId) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.put(
      `/api/users/${userId}`,
      { role: 'repartidor' },  // ⚠️ Exactamente así: 'repartidor' (minúsculas)
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Usuario actualizado a Repartidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
};

// USO:
cambiarUsuarioARepartidor(15);  // Cambiar usuario ID 15 a Repartidor
```

---

## 🎨 Componente React - Selector de Rol Universal

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const RoleSelector = ({ userId, currentRole, onRoleChanged }) => {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('authToken');

  // Definir roles disponibles
  const ROLES = [
    { value: 'admin', label: 'Administrador', icon: '👑' },
    { value: 'vendedor', label: 'Vendedor', icon: '💼' },
    { value: 'bodega', label: 'Bodega', icon: '📦' },
    { value: 'repartidor', label: 'Repartidor', icon: '🚚' },
    { value: 'cliente', label: 'Cliente', icon: '👤' }
  ];

  const handleRoleChange = async (newRole) => {
    // Confirmar cambio
    if (!window.confirm(`¿Cambiar el rol a ${newRole}?`)) {
      setRole(currentRole); // Revertir selección
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.put(
        `/api/users/${userId}`,
        { role: newRole },  // Solo enviar el rol
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Rol actualizado:', response.data);
      setRole(newRole);

      // Notificar al componente padre
      if (onRoleChanged) {
        onRoleChanged(response.data.user);
      }

      alert('Rol actualizado exitosamente');

    } catch (err) {
      console.error('❌ Error al cambiar rol:', err);

      // Mostrar mensaje de error específico
      const errorMessage = err.response?.data?.message || 'Error al cambiar rol';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);

      // Revertir cambio visual
      setRole(currentRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={role}
        onChange={(e) => {
          setRole(e.target.value);
          handleRoleChange(e.target.value);
        }}
        disabled={loading}
        className={`
          px-3 py-2 border rounded-lg
          ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          focus:ring-2 focus:ring-blue-500
        `}
      >
        {ROLES.map(r => (
          <option key={r.value} value={r.value}>
            {r.icon} {r.label}
          </option>
        ))}
      </select>

      {loading && (
        <p className="text-sm text-blue-600">Actualizando...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default RoleSelector;
```

**USO DEL COMPONENTE:**

```jsx
<RoleSelector
  userId={5}
  currentRole="cliente"
  onRoleChanged={(updatedUser) => {
    console.log('Usuario actualizado:', updatedUser);
    // Actualizar estado del componente padre
  }}
/>
```

---

## 🔥 Ejemplo Completo con Fetch (sin Axios)

Si no usas Axios, aquí está la versión con `fetch`:

```javascript
const cambiarRolConFetch = async (userId, nuevoRol) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: nuevoRol  // 'admin', 'vendedor', 'bodega', 'repartidor', 'cliente'
      })
    });

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cambiar rol');
    }

    const data = await response.json();
    console.log('✅ Rol actualizado:', data);
    alert('Rol actualizado exitosamente');
    return data;

  } catch (error) {
    console.error('❌ Error:', error.message);
    alert(`Error: ${error.message}`);
    throw error;
  }
};

// USO:
cambiarRolConFetch(5, 'bodega');      // Usuario 5 → Bodega
cambiarRolConFetch(10, 'vendedor');   // Usuario 10 → Vendedor
cambiarRolConFetch(15, 'repartidor'); // Usuario 15 → Repartidor
```

---

## 🧪 Prueba Manual Paso a Paso

### Paso 1: Hacer Login como Admin

```javascript
const loginComoAdmin = async () => {
  try {
    const response = await axios.post('/api/users/login', {
      email: 'admin@farmacia.com',
      password: 'Admin123!'
    });

    const token = response.data.token;
    localStorage.setItem('authToken', token);

    console.log('✅ Login exitoso');
    console.log('Token:', token);
    console.log('Usuario:', response.data.user);

    return token;
  } catch (error) {
    console.error('❌ Error en login:', error);
  }
};

// Ejecutar primero
await loginComoAdmin();
```

### Paso 2: Listar Usuarios

```javascript
const listarUsuarios = async () => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.get('/api/users?limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Usuarios:', response.data.users);

    // Mostrar solo ID, nombre y rol
    response.data.users.forEach(user => {
      console.log(`ID: ${user.id} | ${user.firstName} ${user.lastName} | Rol: ${user.role}`);
    });

    return response.data.users;
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Ejecutar segundo
await listarUsuarios();
```

### Paso 3: Cambiar Rol

```javascript
const cambiarRol = async (userId, nuevoRol) => {
  const token = localStorage.getItem('authToken');

  try {
    console.log(`Cambiando usuario ${userId} a rol ${nuevoRol}...`);

    const response = await axios.put(
      `/api/users/${userId}`,
      { role: nuevoRol },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ ÉXITO:', response.data);
    console.log(`Usuario ${response.data.user.email} ahora es ${response.data.user.role}`);

    return response.data;
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
};

// Ejecutar tercero - EJEMPLOS:
await cambiarRol(5, 'bodega');      // Cambiar usuario 5 a Bodega
await cambiarRol(10, 'vendedor');   // Cambiar usuario 10 a Vendedor
await cambiarRol(15, 'repartidor'); // Cambiar usuario 15 a Repartidor
```

---

## ⚠️ Errores Comunes y Cómo Solucionarlos

### Error 1: "No tienes permisos para acceder a este recurso"

**Causa:** El usuario autenticado NO es admin

**Solución:**
```javascript
// Verificar rol antes de intentar cambiar
const verificarAdmin = () => {
  const token = localStorage.getItem('authToken');
  const decoded = jwtDecode(token);  // npm install jwt-decode

  if (decoded.role !== 'admin') {
    alert('Solo los administradores pueden cambiar roles');
    return false;
  }

  return true;
};

// Usar antes de cambiar rol
if (verificarAdmin()) {
  cambiarRol(userId, nuevoRol);
}
```

### Error 2: "Rol inválido. Roles válidos: admin, vendedor, bodega, repartidor, cliente"

**Causa:** Estás enviando el rol mal escrito

**INCORRECTO:**
```javascript
{ role: 'Bodega' }       // ❌ Mayúscula
{ role: 'VENDEDOR' }     // ❌ Todo mayúsculas
{ role: 'bodega ' }      // ❌ Espacio al final
{ role: ' repartidor' }  // ❌ Espacio al inicio
```

**CORRECTO:**
```javascript
{ role: 'bodega' }       // ✅
{ role: 'vendedor' }     // ✅
{ role: 'repartidor' }   // ✅
{ role: 'admin' }        // ✅
{ role: 'cliente' }      // ✅
```

### Error 3: "Usuario no encontrado"

**Causa:** El ID del usuario no existe

**Solución:**
```javascript
const verificarUsuarioExiste = async (userId) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.get(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Usuario encontrado:', response.data);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      alert(`Usuario con ID ${userId} no existe`);
      return false;
    }
    throw error;
  }
};

// Usar antes de cambiar rol
const existe = await verificarUsuarioExiste(5);
if (existe) {
  cambiarRol(5, 'bodega');
}
```

### Error 4: "Token inválido" o "jwt malformed"

**Causa:** El token está mal formado o no es válido

**Solución:**
```javascript
const verificarToken = () => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    alert('No hay token. Por favor inicia sesión');
    window.location.href = '/login';
    return false;
  }

  // Verificar formato básico
  const parts = token.split('.');
  if (parts.length !== 3) {
    alert('Token inválido. Por favor inicia sesión nuevamente');
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    return false;
  }

  return true;
};

// Usar antes de cualquier petición
if (verificarToken()) {
  // Hacer petición
}
```

---

## 📝 Checklist de Verificación

Antes de hacer la petición, verifica:

- [ ] Tienes el token en `localStorage.getItem('authToken')`
- [ ] El usuario autenticado es admin
- [ ] El header `Authorization` tiene el formato `Bearer ${token}`
- [ ] El header `Content-Type` es `application/json`
- [ ] El método HTTP es `PUT` (no POST, no PATCH)
- [ ] La URL es `/api/users/${userId}` con el ID correcto
- [ ] El payload es `{ role: 'rolEnMinusculas' }`
- [ ] El rol está escrito exactamente: `admin`, `vendedor`, `bodega`, `repartidor`, `cliente`
- [ ] No hay espacios extra en el rol
- [ ] El ID del usuario existe en la base de datos

---

## 🎯 Código Listo para Copiar y Pegar

### Versión Completa con Todas las Validaciones

```javascript
/**
 * Cambiar el rol de un usuario (PRODUCCIÓN)
 * @param {number} userId - ID del usuario a modificar
 * @param {string} nuevoRol - Nuevo rol: 'admin', 'vendedor', 'bodega', 'repartidor', 'cliente'
 * @returns {Promise<object>} Usuario actualizado
 */
const cambiarRolDeUsuario = async (userId, nuevoRol) => {
  // 1. Validar roles permitidos
  const ROLES_VALIDOS = ['admin', 'vendedor', 'bodega', 'repartidor', 'cliente'];

  if (!ROLES_VALIDOS.includes(nuevoRol)) {
    throw new Error(`Rol inválido. Roles válidos: ${ROLES_VALIDOS.join(', ')}`);
  }

  // 2. Obtener token
  const token = localStorage.getItem('authToken');

  if (!token) {
    throw new Error('No hay token de autenticación. Por favor inicia sesión');
  }

  // 3. Validar que el usuario actual sea admin (opcional pero recomendado)
  try {
    const decoded = jwtDecode(token);
    if (decoded.role !== 'admin') {
      throw new Error('Solo los administradores pueden cambiar roles de usuarios');
    }
  } catch (error) {
    console.warn('No se pudo verificar el rol del usuario:', error);
  }

  // 4. Hacer la petición
  try {
    const response = await axios.put(
      `/api/users/${userId}`,
      { role: nuevoRol },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Rol actualizado exitosamente:', response.data);
    return response.data;

  } catch (error) {
    // Manejo de errores detallado
    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error(`Datos inválidos: ${error.response.data.message}`);
        case 401:
          throw new Error('Token inválido o expirado. Por favor inicia sesión nuevamente');
        case 403:
          throw new Error('No tienes permisos para realizar esta acción');
        case 404:
          throw new Error(`Usuario con ID ${userId} no encontrado`);
        default:
          throw new Error(`Error del servidor: ${error.response.data.message}`);
      }
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión');
    } else {
      throw new Error(error.message);
    }
  }
};

// ==================== EJEMPLOS DE USO ====================

// Ejemplo 1: Cambiar a Bodega
try {
  const resultado = await cambiarRolDeUsuario(5, 'bodega');
  alert('Usuario cambiado a Bodega exitosamente');
} catch (error) {
  alert(error.message);
}

// Ejemplo 2: Cambiar a Vendedor
try {
  const resultado = await cambiarRolDeUsuario(10, 'vendedor');
  alert('Usuario cambiado a Vendedor exitosamente');
} catch (error) {
  alert(error.message);
}

// Ejemplo 3: Cambiar a Repartidor
try {
  const resultado = await cambiarRolDeUsuario(15, 'repartidor');
  alert('Usuario cambiado a Repartidor exitosamente');
} catch (error) {
  alert(error.message);
}
```

---

## 🎬 Test Rápido en la Consola del Navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
// 1. Login
const loginTest = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@farmacia.com',
    password: 'Admin123!'
  })
});
const loginData = await loginTest.json();
const token = loginData.token;
console.log('Token:', token);

// 2. Cambiar usuario 5 a bodega
const cambiarTest = await fetch('/api/users/5', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ role: 'bodega' })
});
const cambiarData = await cambiarTest.json();
console.log('Resultado:', cambiarData);
```

Si esto funciona, el problema está en cómo tu frontend está haciendo la petición.
