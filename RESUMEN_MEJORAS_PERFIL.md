# 📊 Resumen de Mejoras - Sistema de Perfil de Cliente

## ✨ Cambios Implementados

### 1️⃣ **Edición de Campos Individuales**
**Antes:** Era necesario enviar todos los campos para actualizar el perfil.

**Ahora:** Puedes actualizar **un solo campo** sin enviar los demás.

```javascript
// ✅ AHORA: Actualizar solo el teléfono
await axios.put('/api/users/profile', { phone: '55551234' });

// ✅ AHORA: Actualizar solo el DPI
await axios.put('/api/users/profile', { dpi: '1234567890101' });

// ✅ AHORA: Actualizar solo la dirección
await axios.put('/api/users/profile', { address: 'Barrio El Centro' });
```

**Validaciones agregadas:**
- ✅ DPI no puede estar duplicado (se valida contra otros usuarios)
- ✅ Retorna error si no se envía ningún campo para actualizar

---

### 2️⃣ **Endpoint Separado para Imagen de Perfil**
**Nuevo endpoint:** `PUT /api/users/profile/image`

**Problema resuelto:** Ahora la imagen se sube primero a Cloudinary y luego se guarda el link en la BD.

```javascript
// ✅ Subir imagen de perfil
const formData = new FormData();
formData.append('image', file);

await axios.put('/api/users/profile/image', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});

// Respuesta:
// {
//   message: "Imagen de perfil actualizada exitosamente",
//   profileImage: "https://res.cloudinary.com/.../profile.jpg"
// }
```

**Beneficios:**
- ✅ La imagen anterior se elimina automáticamente de Cloudinary
- ✅ La imagen se redimensiona a 400x400 con enfoque en la cara
- ✅ Proceso separado de la actualización de datos de texto

---

### 3️⃣ **Contraseñas para Usuarios de Google**
**Problema:** Los usuarios registrados con Google no tenían contraseña y no podían cambiarla.

**Solución:** Ahora pueden **establecer una contraseña** para tener ambas opciones de login.

```javascript
// CASO 1: Usuario normal (tiene contraseña)
await axios.post('/api/users/change-password', {
  currentPassword: 'MiPasswordActual123',
  newPassword: 'NuevoPassword456!'
});

// CASO 2: Usuario de Google (sin contraseña)
// Solo envía la nueva contraseña (NO requiere la actual)
await axios.post('/api/users/change-password', {
  newPassword: 'MiPrimeraPassword123!'
});
// Respuesta: "Contraseña establecida. Ahora puedes iniciar sesión con email y contraseña además de Google"
```

**Beneficios:**
- ✅ Usuarios de Google pueden tener autenticación dual (Google + Email/Password)
- ✅ Mayor flexibilidad para los usuarios
- ✅ No pierden acceso si hay problemas con Google OAuth

---

## 🔧 Cambios Técnicos en el Backend

### Archivo: `user.controller.js`

#### 1. `updateProfile` (Mejorado)
```javascript
// ANTES:
if (firstName) updates.firstName = firstName;

// AHORA:
if (firstName !== undefined) updates.firstName = firstName;
```

**Por qué:** Ahora permite valores vacíos (`''`) y detecta correctamente si el campo fue enviado.

**Validaciones agregadas:**
- Valida que el DPI no esté en uso por otro usuario
- Retorna error si no hay campos para actualizar

#### 2. `updateProfileImage` (Nuevo)
```javascript
exports.updateProfileImage = async (req, res) => {
  // 1. Validar que se envió imagen
  // 2. Eliminar imagen anterior de Cloudinary
  // 3. Subir nueva imagen a Cloudinary
  // 4. Actualizar usuario con nueva URL
  // 5. Retornar solo la URL de la imagen
};
```

**Flujo:**
1. Verifica que se envió un archivo
2. Elimina la imagen anterior de Cloudinary (si existe)
3. Sube la nueva imagen a Cloudinary con transformaciones
4. Actualiza el usuario con `profileImage` y `cloudinaryPublicId`
5. Retorna la URL de la nueva imagen

#### 3. `changePassword` (Mejorado)
```javascript
// CASO 1: Usuario tiene contraseña
if (user.password) {
  // Requiere contraseña actual
  const isValid = await user.comparePassword(currentPassword);
  // ...
}

// CASO 2: Usuario de Google sin contraseña
if (user.googleId && !user.password) {
  // NO requiere contraseña actual
  await user.update({ password: newPassword });
  // Mensaje especial
}
```

**Beneficios:**
- ✅ Lógica clara para ambos casos
- ✅ Mensajes personalizados según el tipo de usuario
- ✅ Validación de longitud mínima (8 caracteres)

---

### Archivo: `userRoutes.js`

#### Rutas agregadas/modificadas:

```javascript
// MODIFICADO: Ya no requiere multipart (solo JSON)
router.put('/profile', authMiddleware, updateProfile);

// NUEVO: Endpoint específico para imagen
router.put('/profile/image', authMiddleware, upload.single('image'), updateProfileImage);

// MODIFICADO: Ahora soporta usuarios de Google
router.post('/change-password', authMiddleware, changePassword);
```

---

## 📋 Resumen de Endpoints

| Endpoint | Método | Propósito | Content-Type |
|----------|--------|-----------|--------------|
| `/api/users/profile` | GET | Ver perfil | - |
| `/api/users/profile` | PUT | Actualizar datos (campos individuales) | `application/json` |
| `/api/users/profile/image` | PUT | Actualizar solo imagen | `multipart/form-data` |
| `/api/users/change-password` | POST | Cambiar/establecer contraseña | `application/json` |

---

## 🎯 Casos de Uso en el Frontend

### 1. Formulario de Perfil con Edición Individual

```jsx
const EditarCampo = ({ campo, valor, onSave }) => {
  const [edit, setEdit] = useState(false);
  const [temp, setTemp] = useState(valor);

  const guardar = async () => {
    await axios.put('/api/users/profile', { [campo]: temp });
    onSave();
    setEdit(false);
  };

  return (
    <div>
      {edit ? (
        <>
          <input value={temp} onChange={(e) => setTemp(e.target.value)} />
          <button onClick={guardar}>Guardar</button>
          <button onClick={() => setEdit(false)}>Cancelar</button>
        </>
      ) : (
        <>
          <span>{valor}</span>
          <button onClick={() => setEdit(true)}>Editar</button>
        </>
      )}
    </div>
  );
};
```

### 2. Subir Imagen con Preview

```jsx
const SubirImagenPerfil = ({ imagenActual, onUpdate }) => {
  const [preview, setPreview] = useState(imagenActual);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview local
    setPreview(URL.createObjectURL(file));

    // Subir a servidor
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.put('/api/users/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPreview(response.data.profileImage); // URL de Cloudinary
      onUpdate(response.data.profileImage);
      alert('Imagen actualizada');
    } catch (error) {
      setPreview(imagenActual); // Revertir
      alert('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <img src={preview} alt="Perfil" className="w-32 h-32 rounded-full" />
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={uploading}
      />
      {uploading && <p>Subiendo...</p>}
    </div>
  );
};
```

### 3. Cambiar Contraseña (Detecta Google vs Normal)

```jsx
const CambiarContrasena = ({ userHasPassword }) => {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = userHasPassword
      ? { currentPassword: current, newPassword: newPass }
      : { newPassword: newPass };

    try {
      await axios.post('/api/users/change-password', body);
      alert('Contraseña actualizada');
      setCurrent('');
      setNewPass('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {userHasPassword && (
        <input
          type="password"
          placeholder="Contraseña actual"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      )}

      <input
        type="password"
        placeholder="Nueva contraseña"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
        minLength={8}
        required
      />

      <button type="submit">
        {userHasPassword ? 'Cambiar' : 'Establecer'} Contraseña
      </button>

      {!userHasPassword && (
        <p className="text-sm text-gray-500">
          Te registraste con Google. Establece una contraseña para poder
          iniciar sesión también con email.
        </p>
      )}
    </form>
  );
};
```

---

## ✅ Testing

### Pruebas a realizar:

#### 1. Actualizar campos individuales
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "12345678"}'
```

#### 2. Actualizar imagen
```bash
curl -X PUT http://localhost:5000/api/users/profile/image \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@/path/to/image.jpg"
```

#### 3. Cambiar contraseña (usuario normal)
```bash
curl -X POST http://localhost:5000/api/users/change-password \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "old123", "newPassword": "new123456"}'
```

#### 4. Establecer contraseña (usuario Google)
```bash
curl -X POST http://localhost:5000/api/users/change-password \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword": "new123456"}'
```

---

## 🚀 Próximos Pasos Recomendados

1. **Validación de email en frontend** - Agregar validación de formato de DPI (13 dígitos)
2. **Preview de imagen antes de subir** - Permitir recortar la imagen antes de subir
3. **Indicador de fortaleza de contraseña** - Mostrar qué tan segura es la nueva contraseña
4. **Confirmación de contraseña** - Pedir que escriba la nueva contraseña dos veces
5. **Notificaciones por email** - Enviar email cuando se cambie la contraseña

---

**Autor:** Alexander Echeverria
**Fecha:** 2025-01-05
**Backend:** farmacia-backend
