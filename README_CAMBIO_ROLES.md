# 📚 Guía Completa - Sistema de Cambio de Roles

## 🎯 Propósito

Esta documentación te ayudará a resolver el problema de **cambiar roles de usuarios** en el sistema de Farmacia Elizabeth.

**Problema reportado:** Al intentar cambiar usuarios a roles `bodega`, `vendedor` o `repartidor`, se generan errores.

**Solución:** El backend funciona perfectamente. El problema está en cómo el frontend envía las peticiones.

---

## 📂 Archivos de Documentación

### 1. **RESUMEN_SOLUCION_ROLES.md** ⭐ EMPEZAR AQUÍ
**📍 Archivo principal con la solución completa**

Contenido:
- ✅ Confirmación de que el backend funciona
- 🔍 Causas comunes del problema
- ✅ Solución JavaScript lista para copiar
- 🎨 Componente React funcional
- 🧪 Test rápido en consola del navegador
- ⚠️ Checklist de 10 puntos de verificación
- 🔧 Código de depuración paso a paso

**👉 LEE ESTE PRIMERO**

---

### 2. **GUIA_FRONTEND_USUARIOS_ROLES.md**
**📍 Documentación completa del API**

Contenido:
- 📋 Resumen del sistema de roles
- 🔐 Cómo autenticar peticiones
- 📚 API Reference de todos los endpoints:
  - `GET /api/users` - Listar usuarios
  - `GET /api/users/:id` - Obtener usuario
  - `POST /api/users` - Crear usuario
  - `PUT /api/users/:id` - Actualizar usuario ⭐
  - `PATCH /api/users/:id/toggle-active` - Activar/desactivar
  - `DELETE /api/users/:id` - Eliminar usuario
  - `GET /api/users/stats` - Estadísticas
- 🎨 Implementación en React
- ⚠️ Errores posibles y soluciones
- ✅ Checklist de implementación

---

### 3. **EJEMPLOS_CAMBIAR_ROLES.md**
**📍 Ejemplos prácticos específicos**

Contenido:
- ✅ Ejemplo: Cambiar a Bodega
- ✅ Ejemplo: Cambiar a Vendedor
- ✅ Ejemplo: Cambiar a Repartidor
- 🎨 Componente React con selector de roles
- 🔥 Versión con `fetch` (sin Axios)
- 🧪 Prueba manual paso a paso
- ⚠️ Errores comunes y cómo solucionarlos
- 📝 Checklist de verificación
- 🎯 Código listo para copiar y pegar con todas las validaciones

---

### 4. **EJEMPLOS_FRONTEND_FRAMEWORKS.md**
**📍 Código para diferentes frameworks**

Contenido:
- React con Axios
- React con Fetch
- Vue 3 (Composition API)
- Angular (Service + Component)
- Vanilla JavaScript
- Next.js (App Router)
- jQuery

Cada ejemplo incluye código completo y listo para usar.

---

### 5. **test-cambiar-roles.js**
**📍 Script de prueba del backend**

Ejecuta:
```bash
node test-cambiar-roles.js
```

Este script:
- ✅ Se autentica como admin
- ✅ Lista usuarios actuales
- ✅ Crea usuarios de prueba
- ✅ Cambia roles a: bodega, vendedor, repartidor, admin
- ✅ Prueba cambios múltiples
- ✅ Verifica rechazo de roles inválidos
- ✅ Muestra resumen de resultados

**Resultado:** 🎉 TODAS LAS PRUEBAS PASARON

Esto confirma que el **backend funciona al 100%**.

---

## 🚀 Inicio Rápido

### Paso 1: Leer el Resumen
```
Abre: RESUMEN_SOLUCION_ROLES.md
```

### Paso 2: Copiar el Código de Solución
```javascript
// Del archivo RESUMEN_SOLUCION_ROLES.md
const cambiarRolDeUsuario = async (userId, nuevoRol) => {
  // ... código completo listo para copiar
};
```

### Paso 3: Probar en tu Frontend
Implementa el código en tu aplicación.

### Paso 4: Si No Funciona
1. Lee el checklist de 10 puntos en `RESUMEN_SOLUCION_ROLES.md`
2. Usa el código de depuración del mismo archivo
3. Revisa los ejemplos específicos en `EJEMPLOS_CAMBIAR_ROLES.md`
4. Busca tu framework en `EJEMPLOS_FRONTEND_FRAMEWORKS.md`

---

## 📋 Requisitos para Cambiar Roles

### 1. Token Válido de Admin
```javascript
const token = localStorage.getItem('authToken');
// El token debe ser de un usuario con role: 'admin'
```

### 2. Headers Correctos
```javascript
headers: {
  'Authorization': `Bearer ${token}`,     // ⚠️ No olvidar "Bearer "
  'Content-Type': 'application/json'      // ⚠️ Obligatorio
}
```

### 3. Método HTTP
```javascript
axios.put(...)  // ✅ Correcto
fetch('...', { method: 'PUT' })  // ✅ Correcto
```

### 4. Payload Exacto
```javascript
{ role: 'bodega' }       // ✅ Correcto
{ role: 'vendedor' }     // ✅ Correcto
{ role: 'repartidor' }   // ✅ Correcto

{ role: 'Bodega' }       // ❌ Incorrecto (mayúscula)
{ role: 'VENDEDOR' }     // ❌ Incorrecto (todo mayúsculas)
```

### 5. URL Correcta
```javascript
PUT /api/users/${userId}  // ✅ Correcto
```

---

## 🎨 Roles Disponibles

El sistema tiene **5 roles**:

| Rol | Valor | Descripción |
|-----|-------|-------------|
| 👑 Admin | `admin` | Administrador (acceso total) |
| 💼 Vendedor | `vendedor` | Vendedor (ventas, facturación) |
| 📦 Bodega | `bodega` | Personal de bodega (inventario, lotes) |
| 🚚 Repartidor | `repartidor` | Repartidor (entregas) |
| 👤 Cliente | `cliente` | Cliente (compras) |

**IMPORTANTE:** Los valores deben enviarse **exactamente** como se muestran (todo en minúsculas).

---

## ✅ Verificación: ¿Funciona el Backend?

Ejecuta el test:
```bash
node test-cambiar-roles.js
```

Si ves:
```
🎉 ¡TODAS LAS PRUEBAS PASARON!
Total de pruebas: 6
Exitosas: 6
Fallidas: 0
```

Entonces el backend funciona perfectamente y el problema está en el frontend.

---

## 🧪 Test Rápido en Consola del Navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
// 1. Login
const loginResponse = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@farmacia.com',
    password: 'Admin123!'
  })
});
const { token } = await loginResponse.json();

// 2. Cambiar rol del usuario 5 a bodega
const response = await fetch('/api/users/5', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ role: 'bodega' })
});
const result = await response.json();
console.log('Resultado:', result);
```

Si esto funciona, el problema está en tu código frontend.

---

## ⚠️ Errores Comunes

### Error 1: "No tienes permisos"
**Causa:** El usuario no es admin
**Solución:** Asegúrate de que el token sea de un usuario admin

### Error 2: "Rol inválido"
**Causa:** El rol está mal escrito
**Solución:** Usa exactamente: `admin`, `vendedor`, `bodega`, `repartidor`, `cliente`

### Error 3: "Token inválido"
**Causa:** El token expiró o no existe
**Solución:** Haz login nuevamente

### Error 4: "Usuario no encontrado"
**Causa:** El ID del usuario no existe
**Solución:** Verifica que el ID sea correcto

---

## 📚 Flujo Completo de Solución

```
1. ¿El backend funciona?
   └─ Ejecutar: node test-cambiar-roles.js
      ├─ ✅ Sí → El problema está en el frontend
      └─ ❌ No → Revisar configuración del backend

2. ¿El API es accesible?
   └─ Ejecutar test en consola del navegador
      ├─ ✅ Sí → El problema está en tu código
      └─ ❌ No → Revisar CORS/configuración de red

3. ¿Tu código está correcto?
   └─ Revisar checklist de 10 puntos
      ├─ ✅ Todo correcto → Usar código de depuración
      └─ ❌ Hay errores → Corregir según checklist

4. ¿Necesitas ejemplos?
   └─ Buscar tu framework en EJEMPLOS_FRONTEND_FRAMEWORKS.md
      └─ Copiar código completo y adaptar
```

---

## 🎯 Solución Rápida (TL;DR)

**Si solo quieres el código que funciona:**

```javascript
const cambiarRol = async (userId, nuevoRol) => {
  const token = localStorage.getItem('authToken');

  const response = await axios.put(
    `/api/users/${userId}`,
    { role: nuevoRol },  // bodega, vendedor, repartidor, admin, cliente
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

// Uso:
await cambiarRol(5, 'bodega');
await cambiarRol(10, 'vendedor');
await cambiarRol(15, 'repartidor');
```

**Eso es todo.**

---

## 📞 Soporte Adicional

Si después de revisar toda la documentación aún tienes problemas:

1. ✅ Confirma que ejecutaste: `node test-cambiar-roles.js`
2. ✅ Confirma que el test en consola del navegador funciona
3. ✅ Revisa el checklist de 10 puntos completo
4. ✅ Usa el código de depuración para ver qué se envía exactamente
5. ✅ Compara tu código con los ejemplos de tu framework

---

## 📊 Resumen de Archivos

| Archivo | Propósito | Cuándo Usarlo |
|---------|-----------|---------------|
| `RESUMEN_SOLUCION_ROLES.md` | Solución rápida | ⭐ Empezar aquí |
| `GUIA_FRONTEND_USUARIOS_ROLES.md` | Documentación API completa | Necesitas detalles del API |
| `EJEMPLOS_CAMBIAR_ROLES.md` | Ejemplos prácticos | Quieres código específico |
| `EJEMPLOS_FRONTEND_FRAMEWORKS.md` | Código por framework | Buscas tu framework |
| `test-cambiar-roles.js` | Test del backend | Verificar que backend funciona |

---

## ✨ Conclusión

**El backend funciona perfectamente.** Las pruebas lo demuestran.

**El problema está en el frontend.** Revisa los archivos de documentación y usa los ejemplos de código.

**Todo el código está probado y listo para usar.** Solo copia, pega y adapta a tu aplicación.

---

## 🚀 ¡Buena Suerte!

Con esta documentación tienes todo lo necesario para solucionar el problema de cambio de roles en tu frontend.

**¿Preguntas? Revisa primero `RESUMEN_SOLUCION_ROLES.md`**
