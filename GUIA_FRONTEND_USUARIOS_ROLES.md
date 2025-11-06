# Guía Frontend - Sistema de Gestión de Usuarios y Roles

## 📋 Resumen del Sistema

El sistema tiene **5 roles** disponibles:
- `admin` - Administrador (acceso total)
- `vendedor` - Vendedor (ventas y facturación)
- `bodega` - Personal de bodega (inventario y lotes)
- `repartidor` - Repartidor (entregas)
- `cliente` - Cliente (compras)

---

## 🎯 Endpoints Clave para el Frontend

### Base URL
```
http://localhost:5000/api/users
```

---

## 🔐 Autenticación

Todas las peticiones de administración de usuarios requieren:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📚 API Reference

### 1. Listar Todos los Usuarios

**Endpoint:** `GET /api/users`

**Parámetros de consulta (query params):**

```javascript
// Ejemplo completo
const getUsers = async () => {
  try {
    const params = new URLSearchParams({
      page: 1,              // Página actual
      limit: 50,            // Registros por página
      role: 'vendedor',     // Filtrar por rol (opcional)
      isActive: 'true',     // Solo usuarios activos (opcional)
      search: 'juan'        // Buscar en nombre, email, DPI (opcional)
    });

    const response = await axios.get(`/api/users?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};
```

**Respuesta exitosa (200):**

```json
{
  "total": 25,
  "page": 1,
  "totalPages": 3,
  "users": [
    {
      "id": 1,
      "email": "admin@farmacia.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "admin",
      "isActive": true,
      "emailVerified": true,
      "dpi": "1234567890123",
      "nit": "12345678",
      "phone": "12345678",
      "address": "Ciudad de Guatemala",
      "birthDate": "1990-01-15",
      "profileImage": "https://res.cloudinary.com/...",
      "cloudinaryPublicId": "farmacia-elizabeth/users/abc123",
      "googleId": null,
      "lastLogin": "2025-11-05T10:30:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-11-05T10:30:00.000Z",
      "deletedAt": null
    }
    // ... más usuarios
  ]
}
```

---

### 2. Obtener Usuario por ID

**Endpoint:** `GET /api/users/:id`

```javascript
const getUserById = async (userId) => {
  try {
    const response = await axios.get(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('Usuario no encontrado');
    }
    throw error;
  }
};
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "email": "admin@farmacia.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "admin",
  "isActive": true,
  "dpi": "1234567890123",
  "phone": "12345678",
  "address": "Ciudad de Guatemala",
  // ... todos los campos excepto password
}
```

---

### 3. Crear Usuario (Solo Admin)

**Endpoint:** `POST /api/users`

**IMPORTANTE:** Esta ruta es para que **ADMIN** cree usuarios manualmente con cualquier rol.

```javascript
const createUser = async (userData) => {
  try {
    const payload = {
      email: "nuevo@farmacia.com",     // OBLIGATORIO
      password: "Password123!",         // OBLIGATORIO
      firstName: "María",               // OBLIGATORIO
      lastName: "González",             // OBLIGATORIO
      role: "vendedor",                 // OPCIONAL (default: cliente)
      dpi: "9876543210987",            // Opcional pero debe ser único
      nit: "87654321",                 // Opcional
      phone: "87654321",               // Opcional
      address: "Antigua Guatemala",     // Opcional
      birthDate: "1995-05-20"          // Opcional (formato: YYYY-MM-DD)
    };

    const response = await axios.post('/api/users', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Usuario creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};
```

**Respuesta exitosa (201):**

```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": 15,
    "email": "nuevo@farmacia.com",
    "firstName": "María",
    "lastName": "González",
    "role": "vendedor"
  }
}
```

**Errores posibles:**

```json
// Email duplicado (400)
{
  "message": "El email ya está registrado"
}

// DPI duplicado (400)
{
  "message": "El DPI ya está registrado"
}

// Rol inválido (400)
{
  "message": "Rol inválido. Roles válidos: admin, vendedor, bodega, repartidor, cliente"
}
```

---

### 4. Actualizar Usuario (ESTA ES LA CLAVE PARA CAMBIAR ROLES)

**Endpoint:** `PUT /api/users/:id`

**⚠️ IMPORTANTE:**
- Solo ADMIN puede usar esta ruta
- Se pueden actualizar TODOS los campos, incluyendo `role`
- Solo se envían los campos que se quieren actualizar

```javascript
const updateUser = async (userId, updates) => {
  try {
    // ✅ CORRECTO - Solo enviar los campos a actualizar
    const payload = {
      role: "bodega",              // Cambiar rol
      firstName: "Juan Carlos",    // Actualizar nombre
      isActive: true               // Reactivar usuario
      // NO incluir campos que no se quieren cambiar
    };

    const response = await axios.put(`/api/users/${userId}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Usuario actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};
```

**Ejemplo: Solo cambiar el ROL de un usuario**

```javascript
// ✅ SOLUCIÓN AL PROBLEMA PRINCIPAL
const changeUserRole = async (userId, newRole) => {
  try {
    // Solo enviar el campo 'role'
    const payload = {
      role: newRole  // 'admin', 'vendedor', 'bodega', 'repartidor', 'cliente'
    };

    const response = await axios.put(`/api/users/${userId}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Rol actualizado:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      console.error('❌ Rol inválido o datos incorrectos');
    } else if (error.response?.status === 404) {
      console.error('❌ Usuario no encontrado');
    }
    throw error;
  }
};

// Uso:
await changeUserRole(5, 'vendedor');   // Cambiar usuario 5 a vendedor
await changeUserRole(10, 'bodega');    // Cambiar usuario 10 a bodega
await changeUserRole(15, 'repartidor'); // Cambiar usuario 15 a repartidor
```

**Respuesta exitosa (200):**

```json
{
  "message": "Usuario actualizado exitosamente",
  "user": {
    "id": 5,
    "email": "maria@farmacia.com",
    "firstName": "María",
    "lastName": "González",
    "role": "vendedor",        // ← ROL ACTUALIZADO
    "isActive": true
  }
}
```

**Errores posibles:**

```json
// Usuario no encontrado (404)
{
  "message": "Usuario no encontrado"
}

// Rol inválido (400)
{
  "message": "Rol inválido. Roles válidos: admin, vendedor, bodega, repartidor, cliente"
}

// Email duplicado (400)
{
  "message": "El email ya está en uso"
}

// DPI duplicado (400)
{
  "message": "El DPI ya está registrado"
}
```

---

### 5. Activar/Desactivar Usuario

**Endpoint:** `PATCH /api/users/:id/toggle-active`

**IMPORTANTE:** Alterna el estado `isActive` del usuario (true ↔ false)

```javascript
const toggleUserActive = async (userId) => {
  try {
    const response = await axios.patch(
      `/api/users/${userId}/toggle-active`,
      {}, // Sin body
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('Estado actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    throw error;
  }
};
```

**Respuesta exitosa (200):**

```json
{
  "message": "Usuario activado exitosamente",
  "user": {
    "id": 5,
    "email": "maria@farmacia.com",
    "isActive": true
  }
}
```

---

### 6. Eliminar Usuario (Soft Delete)

**Endpoint:** `DELETE /api/users/:id`

**IMPORTANTE:**
- Es un borrado "suave" (soft delete)
- El usuario NO se elimina físicamente
- Se marca con `deletedAt` y queda inaccesible
- NO puedes eliminar tu propia cuenta

```javascript
const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Usuario eliminado:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      console.error('No puedes eliminar tu propia cuenta');
    }
    throw error;
  }
};
```

**Respuesta exitosa (200):**

```json
{
  "message": "Usuario eliminado exitosamente"
}
```

**Error si intentas eliminar tu cuenta (400):**

```json
{
  "message": "No puedes eliminar tu propia cuenta"
}
```

---

### 7. Obtener Estadísticas de Usuarios

**Endpoint:** `GET /api/users/stats`

```javascript
const getUserStats = async () => {
  try {
    const response = await axios.get('/api/users/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};
```

**Respuesta exitosa (200):**

```json
{
  "total": 50,
  "active": 45,
  "inactive": 5,
  "byRole": [
    { "role": "admin", "count": "2" },
    { "role": "vendedor", "count": "10" },
    { "role": "bodega", "count": "5" },
    { "role": "repartidor", "count": "8" },
    { "role": "cliente", "count": "25" }
  ],
  "withGoogle": 15,
  "withPassword": 35,
  "recentLogins": 20
}
```

---

## 🎨 Implementación en React - Componente de Edición de Usuario

### Formulario para Cambiar Rol

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserEditForm = ({ userId, onSuccess }) => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    phone: '',
    address: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('authToken');

  // Roles disponibles
  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'bodega', label: 'Bodega' },
    { value: 'repartidor', label: 'Repartidor' },
    { value: 'cliente', label: 'Cliente' }
  ];

  // Cargar datos del usuario
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const userData = response.data;
        setUser(userData);
        setFormData({
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          phone: userData.phone || '',
          address: userData.address || '',
          isActive: userData.isActive
        });
      } catch (err) {
        setError('Error al cargar usuario');
        console.error(err);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, token]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Enviar actualización
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Solo enviar los campos que cambiaron
      const updates = {};

      if (formData.firstName !== user.firstName) {
        updates.firstName = formData.firstName;
      }
      if (formData.lastName !== user.lastName) {
        updates.lastName = formData.lastName;
      }
      if (formData.role !== user.role) {
        updates.role = formData.role;
      }
      if (formData.phone !== user.phone) {
        updates.phone = formData.phone;
      }
      if (formData.address !== user.address) {
        updates.address = formData.address;
      }
      if (formData.isActive !== user.isActive) {
        updates.isActive = formData.isActive;
      }

      // Enviar solo si hay cambios
      if (Object.keys(updates).length === 0) {
        alert('No hay cambios para guardar');
        setLoading(false);
        return;
      }

      const response = await axios.put(
        `/api/users/${userId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Usuario actualizado:', response.data);
      alert('Usuario actualizado exitosamente');

      if (onSuccess) {
        onSuccess(response.data.user);
      }
    } catch (err) {
      console.error('❌ Error al actualizar usuario:', err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al actualizar usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Editar Usuario</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email (solo lectura) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            El email no se puede cambiar
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ROL - ⭐ CAMPO CLAVE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Define los permisos del usuario en el sistema
          </p>
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Estado activo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm font-medium text-gray-700">
            Usuario activo
          </label>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserEditForm;
```

---

## 🔍 Ejemplo de Listado de Usuarios con Cambio de Rol

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('authToken');

  const roles = [
    { value: 'admin', label: 'Admin', color: 'red' },
    { value: 'vendedor', label: 'Vendedor', color: 'blue' },
    { value: 'bodega', label: 'Bodega', color: 'green' },
    { value: 'repartidor', label: 'Repartidor', color: 'yellow' },
    { value: 'cliente', label: 'Cliente', color: 'gray' }
  ];

  // Cargar usuarios
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setLoading(false);
    }
  };

  // Cambiar rol de usuario
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`¿Cambiar el rol del usuario a ${newRole}?`)) {
      return;
    }

    try {
      const response = await axios.put(
        `/api/users/${userId}`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Rol actualizado:', response.data);
      alert('Rol actualizado exitosamente');

      // Recargar usuarios
      fetchUsers();
    } catch (error) {
      console.error('❌ Error al cambiar rol:', error);
      alert(error.response?.data?.message || 'Error al cambiar rol');
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Usuarios del Sistema</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Nombre</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Rol</th>
              <th className="px-4 py-2 border">Estado</th>
              <th className="px-4 py-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border text-center">{user.id}</td>
                <td className="px-4 py-2 border">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-2 border">{user.email}</td>
                <td className="px-4 py-2 border">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="px-2 py-1 border rounded"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 border text-center">
                  {user.isActive ? (
                    <span className="text-green-600">✓ Activo</span>
                  ) : (
                    <span className="text-red-600">✗ Inactivo</span>
                  )}
                </td>
                <td className="px-4 py-2 border text-center">
                  <button
                    onClick={() => {/* Ir a edición */}}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;
```

---

## ⚠️ Errores Comunes y Soluciones

### Error 1: "Rol inválido"

**Causa:** Estás enviando un rol que no existe o está mal escrito

**Solución:**
```javascript
// ❌ INCORRECTO
{ role: 'Vendedor' }  // Mayúscula
{ role: 'admin ' }    // Espacio extra
{ role: 'bodega' }    // Correcto

// ✅ CORRECTO - Roles válidos exactos:
'admin'
'vendedor'
'bodega'
'repartidor'
'cliente'
```

### Error 2: "No tienes permisos"

**Causa:** El usuario autenticado no es admin

**Solución:**
```javascript
// Verificar que el usuario sea admin antes de mostrar opciones
const currentUser = jwtDecode(token);
if (currentUser.role !== 'admin') {
  // Ocultar botón de editar rol
  // O mostrar mensaje de error
}
```

### Error 3: "Token expirado"

**Causa:** El JWT expiró

**Solución:**
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirigir a login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## ✅ Checklist para el Frontend

### Funcionalidad de Cambio de Roles

- [ ] Crear un dropdown/select con los 5 roles válidos
- [ ] Al cambiar el select, enviar `PUT /api/users/:id` con `{ role: nuevoRol }`
- [ ] Incluir header `Authorization: Bearer ${token}`
- [ ] Incluir header `Content-Type: application/json`
- [ ] Manejar respuesta exitosa (200) y actualizar UI
- [ ] Manejar errores:
  - [ ] 400 - Rol inválido
  - [ ] 401 - No autenticado
  - [ ] 403 - Sin permisos (no es admin)
  - [ ] 404 - Usuario no encontrado
- [ ] Mostrar mensaje de confirmación antes de cambiar
- [ ] Recargar lista de usuarios después del cambio
- [ ] Solo mostrar opción si el usuario actual es admin

---

## 🧪 Probar con cURL

### Cambiar rol de usuario

```bash
# Obtener token de admin primero
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@farmacia.com",
    "password": "Admin123!"
  }'

# Cambiar rol del usuario ID 5 a "vendedor"
curl -X PUT http://localhost:5000/api/users/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "role": "vendedor"
  }'
```

---

## 📞 Soporte

Si sigues teniendo problemas:

1. Verifica que estés usando el token de un usuario **admin**
2. Verifica que estés enviando `Content-Type: application/json`
3. Verifica que el rol esté exactamente como se muestra (minúsculas, sin espacios)
4. Revisa la consola del navegador para ver el error exacto
5. Ejecuta `node tests/test-users.js` en el backend para probar manualmente
