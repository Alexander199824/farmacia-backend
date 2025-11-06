# 👤 Guía Completa - Editar Perfil del Cliente (MEJORADA)

## 📋 Tabla de Contenidos
- [Actualizar Campos de Texto](#actualizar-campos-texto)
- [Actualizar Solo Imagen de Perfil](#actualizar-imagen)
- [Cambiar Contraseña (Normal)](#cambiar-contraseña-normal)
- [Establecer Contraseña (Usuario Google)](#establecer-contraseña-google)
- [Ver Perfil Actual](#ver-perfil)
- [Resumen de Endpoints](#resumen-endpoints)

---

## ✨ Cambios Importantes

### ✅ **Ahora puedes editar campos individuales**
Ya no es necesario enviar todos los campos. Puedes actualizar solo el teléfono, solo el DPI, o cualquier campo individual.

### ✅ **Imagen separada**
Nuevo endpoint específico para subir imagen a Cloudinary (`PUT /api/users/profile/image`)

### ✅ **Contraseña para usuarios de Google**
Los usuarios que se registraron con Google **pueden establecer una contraseña** para tener ambas opciones de login.

---

## 📝 Actualizar Campos de Texto {#actualizar-campos-texto}

### Endpoint
```
PUT /api/users/profile
```

### Campos Editables
- `firstName` - Nombre
- `lastName` - Apellido
- `phone` - Teléfono
- `address` - Dirección en Rabinal
- `dpi` - DPI (validado para que no se repita)
- `birthDate` - Fecha de nacimiento

### Función JavaScript (Axios)

```javascript
/**
 * Actualizar campos de perfil (nombre, teléfono, dirección, DPI, fecha)
 * Permite editar UN SOLO CAMPO o varios a la vez
 * @param {object} updates - Solo los campos que quieras cambiar
 * @returns {Promise<object>} Usuario actualizado
 */
const actualizarCamposPerfil = async (updates) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.put('/api/users/profile', updates, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Perfil actualizado:', response.data);
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      message: "Perfil actualizado exitosamente",
      user: {
        id: 10,
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan@email.com",
        phone: "12345678",
        address: "Barrio San Sebastián, Rabinal",
        dpi: "1234567890101",
        birthDate: "1990-05-15",
        profileImage: "https://res.cloudinary.com/.../profile.jpg"
      }
    }
    */

  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);

    if (error.response?.status === 400) {
      alert(error.response.data.message); // "El DPI ya está registrado"
    }

    throw error;
  }
};

// ========== EJEMPLOS DE USO ==========

// 1. Actualizar SOLO el teléfono
await actualizarCamposPerfil({ phone: '55551234' });

// 2. Actualizar SOLO la dirección
await actualizarCamposPerfil({
  address: 'Barrio El Centro, frente al parque central'
});

// 3. Actualizar SOLO el DPI
await actualizarCamposPerfil({ dpi: '1234567890101' });

// 4. Actualizar SOLO la fecha de nacimiento
await actualizarCamposPerfil({ birthDate: '1990-05-15' });

// 5. Actualizar nombre completo
await actualizarCamposPerfil({
  firstName: 'Juan Carlos',
  lastName: 'Pérez López'
});

// 6. Actualizar varios campos a la vez
await actualizarCamposPerfil({
  firstName: 'Juan',
  phone: '12345678',
  address: 'Barrio San Sebastián, Rabinal',
  dpi: '9876543210987'
});
```

### Versión con Fetch

```javascript
const actualizarCamposPerfilFetch = async (updates) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const data = await response.json();
    console.log('✅ Perfil actualizado:', data);
    return data;

  } catch (error) {
    console.error('❌ Error:', error.message);
    alert(`Error: ${error.message}`);
    throw error;
  }
};
```

---

## 📸 Actualizar Solo Imagen de Perfil {#actualizar-imagen}

### Endpoint
```
PUT /api/users/profile/image
```

### Función JavaScript (Axios)

```javascript
/**
 * Actualizar SOLO la imagen de perfil
 * Sube la imagen a Cloudinary primero, luego guarda la URL en la BD
 * @param {File} imageFile - Archivo de imagen
 * @returns {Promise<object>} URL de la nueva imagen
 */
const actualizarImagenPerfil = async (imageFile) => {
  const token = localStorage.getItem('authToken');

  if (!imageFile) {
    alert('Selecciona una imagen primero');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.put('/api/users/profile/image', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('✅ Imagen actualizada:', response.data);
    alert('Imagen de perfil actualizada exitosamente');
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      message: "Imagen de perfil actualizada exitosamente",
      profileImage: "https://res.cloudinary.com/farmacia-elizabeth/users/xyz.jpg"
    }
    */

  } catch (error) {
    console.error('❌ Error al actualizar imagen:', error);
    alert(`Error: ${error.response?.data?.message || 'Error al subir imagen'}`);
    throw error;
  }
};

// ========== EJEMPLOS DE USO ==========

// 1. Desde un input de archivo en HTML
const handleImageChange = async (event) => {
  const file = event.target.files[0];

  if (file) {
    // Validar tamaño (ej: máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('El archivo debe ser una imagen');
      return;
    }

    // Subir imagen
    const result = await actualizarImagenPerfil(file);

    // Actualizar preview en el frontend
    document.getElementById('profileImg').src = result.profileImage;
  }
};

// HTML:
// <input type="file" accept="image/*" onChange={handleImageChange} />
// <img id="profileImg" src={user.profileImage} alt="Perfil" />

// 2. Desde React
const PerfilImagenUpload = () => {
  const [preview, setPreview] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];

    if (file) {
      // Mostrar preview local
      setPreview(URL.createObjectURL(file));

      // Subir a servidor
      try {
        const result = await actualizarImagenPerfil(file);
        setPreview(result.profileImage); // Usar URL de Cloudinary
        alert('Imagen actualizada');
      } catch (error) {
        setPreview(null);
      }
    }
  };

  return (
    <div>
      <img src={preview || '/default-avatar.png'} alt="Preview" />
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
      />
    </div>
  );
};
```

---

## 🔐 Cambiar Contraseña (Usuario Normal) {#cambiar-contraseña-normal}

### Endpoint
```
POST /api/users/change-password
```

### Función JavaScript (Axios)

```javascript
/**
 * Cambiar contraseña (para usuarios con contraseña existente)
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña (mínimo 8 caracteres)
 * @returns {Promise<object>} Confirmación
 */
const cambiarContrasena = async (currentPassword, newPassword) => {
  const token = localStorage.getItem('authToken');

  // Validaciones del lado del cliente
  if (!currentPassword || !newPassword) {
    alert('Debe proporcionar ambas contraseñas');
    return;
  }

  if (newPassword.length < 8) {
    alert('La nueva contraseña debe tener al menos 8 caracteres');
    return;
  }

  if (currentPassword === newPassword) {
    alert('La nueva contraseña debe ser diferente a la actual');
    return;
  }

  try {
    const response = await axios.post(
      '/api/users/change-password',
      {
        currentPassword,
        newPassword
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Contraseña actualizada:', response.data);
    alert('Contraseña actualizada exitosamente');
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      message: "Contraseña actualizada exitosamente"
    }
    */

  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);

    if (error.response?.status === 401) {
      alert('La contraseña actual es incorrecta');
    } else if (error.response?.status === 400) {
      alert(error.response.data.message);
    } else {
      alert('Error al cambiar contraseña');
    }

    throw error;
  }
};

// USO:
await cambiarContrasena('MiPasswordActual123', 'NuevoPassword456!');
```

---

## 🔓 Establecer Contraseña (Usuario Google) {#establecer-contraseña-google}

### Endpoint
```
POST /api/users/change-password
```

### Caso de Uso
Si te registraste con **Google**, no tienes contraseña. Pero ahora **puedes crear una** para tener ambas opciones de login:
- Login con Google ✅
- Login con Email + Contraseña ✅

### Función JavaScript (Axios)

```javascript
/**
 * Establecer contraseña para usuarios de Google (que no tienen contraseña)
 * @param {string} newPassword - Nueva contraseña (mínimo 8 caracteres)
 * @returns {Promise<object>} Confirmación
 */
const establecerContrasenaGoogle = async (newPassword) => {
  const token = localStorage.getItem('authToken');

  if (!newPassword || newPassword.length < 8) {
    alert('La contraseña debe tener al menos 8 caracteres');
    return;
  }

  try {
    const response = await axios.post(
      '/api/users/change-password',
      {
        // NO enviamos currentPassword porque no existe
        newPassword
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Contraseña establecida:', response.data);
    alert('Contraseña establecida. Ahora puedes iniciar sesión con email y contraseña además de Google');
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      message: "Contraseña establecida exitosamente. Ahora puedes iniciar sesión con email y contraseña además de Google"
    }
    */

  } catch (error) {
    console.error('❌ Error:', error);
    alert(error.response?.data?.message || 'Error al establecer contraseña');
    throw error;
  }
};

// USO:
await establecerContrasenaGoogle('MiNuevaPassword123!');
```

### Componente React Inteligente

```jsx
import React, { useState } from 'react';

const CambiarContrasenaForm = ({ userHasPassword }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userHasPassword) {
      // Usuario normal: requiere contraseña actual
      await cambiarContrasena(currentPassword, newPassword);
    } else {
      // Usuario de Google: solo nueva contraseña
      await establecerContrasenaGoogle(newPassword);
    }

    // Limpiar formulario
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>
        {userHasPassword ? 'Cambiar Contraseña' : 'Establecer Contraseña'}
      </h3>

      {userHasPassword && (
        <div>
          <label>Contraseña Actual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
      )}

      <div>
        <label>Nueva Contraseña</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      <button type="submit">
        {userHasPassword ? 'Cambiar Contraseña' : 'Establecer Contraseña'}
      </button>

      {!userHasPassword && (
        <p className="text-sm text-gray-600">
          * Te registraste con Google. Establece una contraseña para poder
          iniciar sesión con email además de Google.
        </p>
      )}
    </form>
  );
};

export default CambiarContrasenaForm;
```

---

## 📋 Ver Perfil Actual {#ver-perfil}

### Endpoint
```
GET /api/users/profile
```

### Función JavaScript (Axios)

```javascript
/**
 * Obtener el perfil del usuario autenticado
 * @returns {Promise<object>} Datos del perfil
 */
const obtenerMiPerfil = async () => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.get('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Mi perfil:', response.data);
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      id: 10,
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan@email.com",
      phone: "12345678",
      address: "Barrio El Centro, frente al parque central",
      dpi: "1234567890101",
      birthDate: "1990-05-15",
      role: "cliente",
      isActive: true,
      emailVerified: false,
      profileImage: "https://res.cloudinary.com/.../profile.jpg",
      googleId: "1234567890", // null si no usó Google
      password: "OCULTO", // null si es usuario de Google sin contraseña
      lastLogin: "2025-01-15T14:30:00",
      createdAt: "2025-01-01T10:00:00",
      updatedAt: "2025-01-15T14:30:00"
    }

    CAMPO IMPORTANTE:
    - Si `googleId` existe y `password` es null → Usuario de Google sin contraseña
    - Si `password` existe → Usuario puede cambiar contraseña
    */

  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    throw error;
  }
};

// USO:
const miPerfil = await obtenerMiPerfil();

// Detectar si tiene contraseña
const userHasPassword = !!miPerfil.password;
console.log('¿Tiene contraseña?', userHasPassword);
```

---

## 📝 Resumen de Endpoints {#resumen-endpoints}

| Acción | Método | Endpoint | Body | Headers |
|--------|--------|----------|------|---------|
| Ver perfil | GET | `/api/users/profile` | - | Bearer Token |
| Actualizar datos | PUT | `/api/users/profile` | `{ phone, address, dpi, etc }` | Bearer Token + JSON |
| Actualizar imagen | PUT | `/api/users/profile/image` | `FormData` con `image` | Bearer Token + multipart |
| Cambiar contraseña | POST | `/api/users/change-password` | `{ currentPassword, newPassword }` | Bearer Token + JSON |
| Establecer contraseña (Google) | POST | `/api/users/change-password` | `{ newPassword }` | Bearer Token + JSON |

---

## ⚠️ Notas Importantes

### 1. Campos Editables
El cliente PUEDE editar:
- ✅ `firstName`, `lastName` (nombre completo)
- ✅ `phone` (teléfono)
- ✅ `address` (dirección en Rabinal)
- ✅ `dpi` (validado para que no se repita)
- ✅ `birthDate` (fecha de nacimiento)
- ✅ `profileImage` (imagen de perfil vía endpoint separado)

El cliente NO PUEDE editar:
- ❌ `email` (identificador único)
- ❌ `role` (solo admin puede cambiar roles)
- ❌ `isActive` (solo admin puede activar/desactivar)

### 2. Validaciones
- **DPI:** Se valida que no esté en uso por otro usuario
- **Contraseña:** Mínimo 8 caracteres
- **Imagen:** Se sube a Cloudinary antes de guardar en BD

### 3. Usuarios de Google
- Pueden establecer una contraseña sin necesidad de tener una actual
- Una vez establecida, pueden usar **ambos** métodos de login:
  - Login con Google
  - Login con Email + Contraseña

### 4. Seguridad
- Todas las peticiones requieren `Authorization: Bearer {token}`
- Solo puedes editar **tu propio perfil**
- El backend verifica que el `userId` del token coincida con el perfil a editar

---

## 🚀 Ejemplo Completo - React Component

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MiPerfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [editMode, setEditMode] = useState(null); // 'phone', 'address', 'dpi', etc.
  const [tempValue, setTempValue] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('authToken');

  // Cargar perfil al inicio
  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    const response = await axios.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setPerfil(response.data);
  };

  // Actualizar campo individual
  const actualizarCampo = async (campo, valor) => {
    setLoading(true);
    try {
      await axios.put(
        '/api/users/profile',
        { [campo]: valor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await cargarPerfil();
      setEditMode(null);
      alert('Campo actualizado');
    } catch (error) {
      alert('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar imagen
  const actualizarImagen = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const response = await axios.put('/api/users/profile/image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setPerfil({ ...perfil, profileImage: response.data.profileImage });
      alert('Imagen actualizada');
    } catch (error) {
      alert('Error al subir imagen');
    } finally {
      setLoading(false);
    }
  };

  if (!perfil) return <div>Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

      {/* Imagen */}
      <div className="mb-6">
        <img
          src={perfil.profileImage || '/default-avatar.png'}
          alt="Perfil"
          className="w-32 h-32 rounded-full"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => actualizarImagen(e.target.files[0])}
          className="mt-2"
        />
      </div>

      {/* Campos editables */}
      {['phone', 'address', 'dpi', 'birthDate'].map((campo) => (
        <div key={campo} className="mb-4 border-b pb-4">
          <label className="font-bold capitalize">{campo}</label>
          {editMode === campo ? (
            <div className="flex gap-2">
              <input
                type={campo === 'birthDate' ? 'date' : 'text'}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="border px-2 py-1"
              />
              <button
                onClick={() => actualizarCampo(campo, tempValue)}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-1 rounded"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditMode(null)}
                className="bg-gray-300 px-4 py-1 rounded"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span>{perfil[campo] || 'No establecido'}</span>
              <button
                onClick={() => {
                  setEditMode(campo);
                  setTempValue(perfil[campo] || '');
                }}
                className="text-blue-600"
              >
                Editar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MiPerfil;
```

---

**Autor:** Alexander Echeverria
**Fecha:** 2025-01-05
**Backend:** farmacia-backend
**Versión:** 2.0 (Mejorado con edición individual de campos)
