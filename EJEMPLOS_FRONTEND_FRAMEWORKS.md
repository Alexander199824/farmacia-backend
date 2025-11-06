# Ejemplos para Diferentes Frameworks Frontend

## 📋 Ejemplos Listos para Usar

Este documento contiene ejemplos de cómo cambiar roles de usuarios en diferentes frameworks y librerías.

---

## 1️⃣ React con Axios

### Instalación
```bash
npm install axios
```

### Código
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('authToken');

  // Cargar usuarios
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  // Cambiar rol
  const changeRole = async (userId, newRole) => {
    if (!window.confirm(`¿Cambiar rol a ${newRole}?`)) return;

    setLoading(true);

    try {
      await axios.put(
        `${API_URL}/users/${userId}`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      alert('Rol actualizado exitosamente');
      fetchUsers(); // Recargar lista

    } catch (error) {
      alert(error.response?.data?.message || 'Error al cambiar rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="px-4 py-2 border">ID</th>
            <th className="px-4 py-2 border">Nombre</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Rol</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="px-4 py-2 border">{user.id}</td>
              <td className="px-4 py-2 border">
                {user.firstName} {user.lastName}
              </td>
              <td className="px-4 py-2 border">{user.email}</td>
              <td className="px-4 py-2 border">
                <select
                  value={user.role}
                  onChange={(e) => changeRole(user.id, e.target.value)}
                  disabled={loading}
                  className="px-2 py-1 border rounded"
                >
                  <option value="admin">Administrador</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="bodega">Bodega</option>
                  <option value="repartidor">Repartidor</option>
                  <option value="cliente">Cliente</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
```

---

## 2️⃣ React con Fetch (sin Axios)

```jsx
import React, { useState, useEffect } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const changeRole = async (userId, newRole) => {
    if (!window.confirm(`¿Cambiar rol a ${newRole}?`)) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      alert('Rol actualizado exitosamente');
      fetchUsers();

    } catch (error) {
      alert(error.message || 'Error al cambiar rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Mismo JSX que el ejemplo anterior */}
    </div>
  );
};

export default UserManagement;
```

---

## 3️⃣ Vue 3 (Composition API)

```vue
<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

    <table class="min-w-full bg-white border">
      <thead>
        <tr>
          <th class="px-4 py-2 border">ID</th>
          <th class="px-4 py-2 border">Nombre</th>
          <th class="px-4 py-2 border">Email</th>
          <th class="px-4 py-2 border">Rol</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td class="px-4 py-2 border">{{ user.id }}</td>
          <td class="px-4 py-2 border">{{ user.firstName }} {{ user.lastName }}</td>
          <td class="px-4 py-2 border">{{ user.email }}</td>
          <td class="px-4 py-2 border">
            <select
              v-model="user.role"
              @change="changeRole(user.id, $event.target.value)"
              :disabled="loading"
              class="px-2 py-1 border rounded"
            >
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
              <option value="bodega">Bodega</option>
              <option value="repartidor">Repartidor</option>
              <option value="cliente">Cliente</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const users = ref([]);
const loading = ref(false);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const token = localStorage.getItem('authToken');

onMounted(() => {
  fetchUsers();
});

const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = response.data.users;
  } catch (error) {
    console.error('Error:', error);
  }
};

const changeRole = async (userId, newRole) => {
  if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;

  loading.value = true;

  try {
    await axios.put(
      `${API_URL}/users/${userId}`,
      { role: newRole },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    alert('Rol actualizado exitosamente');
    fetchUsers();

  } catch (error) {
    alert(error.response?.data?.message || 'Error al cambiar rol');
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## 4️⃣ Angular

### Servicio (user.service.ts)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'vendedor' | 'bodega' | 'repartidor' | 'cliente';
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getUsers(): Observable<{ users: User[] }> {
    return this.http.get<{ users: User[] }>(
      `${this.apiUrl}?limit=100`,
      { headers: this.getHeaders() }
    );
  }

  changeRole(userId: number, newRole: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${userId}`,
      { role: newRole },
      { headers: this.getHeaders() }
    );
  }
}
```

### Componente (user-management.component.ts)

```typescript
import { Component, OnInit } from '@angular/core';
import { UserService, User } from './user.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;

  roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'bodega', label: 'Bodega' },
    { value: 'repartidor', label: 'Repartidor' },
    { value: 'cliente', label: 'Cliente' }
  ];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data.users;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      }
    });
  }

  changeRole(userId: number, newRole: string): void {
    if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;

    this.loading = true;

    this.userService.changeRole(userId, newRole).subscribe({
      next: () => {
        alert('Rol actualizado exitosamente');
        this.loadUsers();
        this.loading = false;
      },
      error: (error) => {
        alert(error.error?.message || 'Error al cambiar rol');
        this.loading = false;
      }
    });
  }
}
```

---

## 5️⃣ Vanilla JavaScript

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Gestión de Usuarios</title>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    select { padding: 5px; }
  </style>
</head>
<body>
  <h1>Gestión de Usuarios</h1>
  <table id="usersTable">
    <thead>
      <tr>
        <th>ID</th>
        <th>Nombre</th>
        <th>Email</th>
        <th>Rol</th>
      </tr>
    </thead>
    <tbody id="usersBody">
      <!-- Se llenará dinámicamente -->
    </tbody>
  </table>

  <script>
    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('authToken');

    // Cargar usuarios
    async function loadUsers() {
      try {
        const response = await fetch(`${API_URL}/users?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        renderUsers(data.users);
      } catch (error) {
        console.error('Error:', error);
      }
    }

    // Renderizar usuarios en la tabla
    function renderUsers(users) {
      const tbody = document.getElementById('usersBody');
      tbody.innerHTML = '';

      users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.id}</td>
          <td>${user.firstName} ${user.lastName}</td>
          <td>${user.email}</td>
          <td>
            <select onchange="changeRole(${user.id}, this.value)">
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
              <option value="vendedor" ${user.role === 'vendedor' ? 'selected' : ''}>Vendedor</option>
              <option value="bodega" ${user.role === 'bodega' ? 'selected' : ''}>Bodega</option>
              <option value="repartidor" ${user.role === 'repartidor' ? 'selected' : ''}>Repartidor</option>
              <option value="cliente" ${user.role === 'cliente' ? 'selected' : ''}>Cliente</option>
            </select>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    // Cambiar rol
    async function changeRole(userId, newRole) {
      if (!confirm(`¿Cambiar rol a ${newRole}?`)) {
        loadUsers(); // Revertir visualmente
        return;
      }

      try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        alert('Rol actualizado exitosamente');
        loadUsers();

      } catch (error) {
        alert(error.message || 'Error al cambiar rol');
        loadUsers(); // Revertir
      }
    }

    // Cargar usuarios al inicio
    loadUsers();
  </script>
</body>
</html>
```

---

## 6️⃣ Next.js (App Router)

### API Route Handler

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/${params.id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### Componente Cliente

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('authToken');

    const res = await fetch('/api/users?limit=100', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    setUsers(data.users);
  };

  const changeRole = async (userId: number, newRole: string) => {
    if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;

    const token = localStorage.getItem('authToken');

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      alert('Rol actualizado exitosamente');
      fetchUsers();

    } catch (error) {
      alert((error as Error).message || 'Error al cambiar rol');
    }
  };

  return (
    <div>
      {/* Mismo JSX que React */}
    </div>
  );
}
```

---

## 7️⃣ jQuery

```javascript
$(document).ready(function() {
  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('authToken');

  // Cargar usuarios
  function loadUsers() {
    $.ajax({
      url: `${API_URL}/users?limit=100`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      success: function(data) {
        renderUsers(data.users);
      },
      error: function(error) {
        console.error('Error:', error);
      }
    });
  }

  // Renderizar usuarios
  function renderUsers(users) {
    const tbody = $('#usersBody');
    tbody.empty();

    users.forEach(function(user) {
      const row = `
        <tr>
          <td>${user.id}</td>
          <td>${user.firstName} ${user.lastName}</td>
          <td>${user.email}</td>
          <td>
            <select class="role-select" data-user-id="${user.id}">
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="vendedor" ${user.role === 'vendedor' ? 'selected' : ''}>Vendedor</option>
              <option value="bodega" ${user.role === 'bodega' ? 'selected' : ''}>Bodega</option>
              <option value="repartidor" ${user.role === 'repartidor' ? 'selected' : ''}>Repartidor</option>
              <option value="cliente" ${user.role === 'cliente' ? 'selected' : ''}>Cliente</option>
            </select>
          </td>
        </tr>
      `;
      tbody.append(row);
    });
  }

  // Evento de cambio de rol
  $(document).on('change', '.role-select', function() {
    const userId = $(this).data('user-id');
    const newRole = $(this).val();

    if (!confirm(`¿Cambiar rol a ${newRole}?`)) {
      loadUsers();
      return;
    }

    $.ajax({
      url: `${API_URL}/users/${userId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ role: newRole }),
      success: function() {
        alert('Rol actualizado exitosamente');
        loadUsers();
      },
      error: function(error) {
        alert(error.responseJSON?.message || 'Error al cambiar rol');
        loadUsers();
      }
    });
  });

  // Cargar al inicio
  loadUsers();
});
```

---

## 📝 Notas Importantes

### Para TODOS los frameworks:

1. **Token debe ser de admin:**
   ```javascript
   // El usuario autenticado debe tener role: 'admin'
   ```

2. **Headers obligatorios:**
   ```javascript
   {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
   }
   ```

3. **Método HTTP correcto:**
   ```javascript
   PUT  // ✅ Correcto
   POST // ❌ Incorrecto
   ```

4. **Payload exacto:**
   ```javascript
   { role: 'bodega' }  // ✅ Correcto (minúsculas)
   { role: 'Bodega' }  // ❌ Incorrecto
   ```

5. **URL correcta:**
   ```javascript
   /api/users/{id}  // ✅ Correcto
   ```

---

## ✅ Variables de Entorno

### React (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Vue (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### Next.js (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Angular (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```
