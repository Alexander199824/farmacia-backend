# Guía Frontend - Portal de Clientes

## 📋 Tabla de Contenidos
- [Ver Pedidos/Ventas del Cliente](#ver-pedidos-ventas)
- [Ver Recibos/Comprobantes del Cliente](#ver-recibos)
- [Ver Detalle de un Pedido](#detalle-pedido)
- [Ver Detalle de un Recibo](#detalle-recibo)
- [Editar Perfil del Cliente](#editar-perfil)
- [Cambiar Contraseña](#cambiar-contraseña)
- [Componente React Completo](#componente-completo)

---

## 🛒 Ver Pedidos/Ventas del Cliente {#ver-pedidos-ventas}

### Endpoint
```
GET /api/invoices?clientId={clientId}
```

### Función JavaScript (Axios)

```javascript
import axios from 'axios';

/**
 * Obtener todos los pedidos/ventas de un cliente
 * @param {number} clientId - ID del cliente (opcional si se usa el usuario logueado)
 * @param {object} filters - Filtros opcionales
 * @returns {Promise<object>} Lista de pedidos con paginación
 */
const obtenerPedidosCliente = async (clientId, filters = {}) => {
  const token = localStorage.getItem('authToken');

  try {
    // Construir query params
    const params = new URLSearchParams({
      clientId: clientId,
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
      ...(filters.status && { status: filters.status }),
      ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus })
    });

    const response = await axios.get(`/api/invoices?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Pedidos obtenidos:', response.data);
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      total: 15,
      page: 1,
      totalPages: 1,
      invoices: [
        {
          id: 5,
          invoiceNumber: "REC-202501-000005",
          invoiceDate: "2025-01-15",
          total: 250.00,
          subtotal: 250.00,
          discount: 0,
          tax: 0,
          status: "completada",
          paymentStatus: "pagado",
          paymentMethod: "efectivo",
          clientName: "Juan Pérez",
          client: {
            id: 10,
            firstName: "Juan",
            lastName: "Pérez",
            email: "juan@email.com"
          },
          seller: {
            id: 1,
            firstName: "María",
            lastName: "González"
          },
          items: [
            {
              id: 12,
              quantity: 2,
              unitPrice: 125.00,
              total: 250.00,
              product: {
                id: 3,
                name: "Paracetamol 500mg",
                sku: "MED-001"
              }
            }
          ]
        }
      ]
    }
    */

  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error);
    throw error;
  }
};

// EJEMPLOS DE USO:

// 1. Obtener todos los pedidos del cliente ID 10
const pedidos = await obtenerPedidosCliente(10);

// 2. Con filtros de fecha
const pedidosFiltrados = await obtenerPedidosCliente(10, {
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  page: 1,
  limit: 10
});

// 3. Filtrar por estado
const pedidosPendientes = await obtenerPedidosCliente(10, {
  paymentStatus: 'pendiente'
});
```

### Versión con Fetch

```javascript
const obtenerPedidosClienteFetch = async (clientId, filters = {}) => {
  const token = localStorage.getItem('authToken');

  const params = new URLSearchParams({
    clientId: clientId,
    page: filters.page || 1,
    limit: filters.limit || 20
  });

  try {
    const response = await fetch(`/api/invoices?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener pedidos');
    }

    const data = await response.json();
    console.log('✅ Pedidos obtenidos:', data);
    return data;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
};
```

---

## 🧾 Ver Recibos/Comprobantes del Cliente {#ver-recibos}

### Endpoint
```
GET /api/receipts/client/{clientId}
```

### Función JavaScript (Axios)

```javascript
/**
 * Obtener todos los recibos/comprobantes de un cliente
 * @param {number} clientId - ID del cliente
 * @param {number} limit - Cantidad de recibos a obtener (default: 20)
 * @returns {Promise<object>} Lista de recibos del cliente
 */
const obtenerRecibosCliente = async (clientId, limit = 20) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.get(`/api/receipts/client/${clientId}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Recibos obtenidos:', response.data);
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      client: {
        id: 10,
        name: "Juan Pérez",
        email: "juan@email.com"
      },
      count: 5,
      receipts: [
        {
          id: 8,
          receiptNumber: "COMP-2025-000008",
          issueDate: "2025-01-15T10:30:00",
          amount: 250.00,
          currency: "GTQ",
          paymentMethod: "efectivo",
          status: "emitido",
          emailSent: false,
          invoice: {
            id: 5,
            invoiceNumber: "REC-202501-000005",
            total: 250.00,
            invoiceDate: "2025-01-15"
          }
        }
      ]
    }
    */

  } catch (error) {
    console.error('❌ Error al obtener recibos:', error);
    throw error;
  }
};

// USO:
const recibos = await obtenerRecibosCliente(10, 50); // Últimos 50 recibos
```

### Versión con Fetch

```javascript
const obtenerRecibosClienteFetch = async (clientId, limit = 20) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await fetch(`/api/receipts/client/${clientId}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener recibos');
    }

    const data = await response.json();
    console.log('✅ Recibos obtenidos:', data);
    return data;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
};
```

---

## 📄 Ver Detalle de un Pedido {#detalle-pedido}

### Endpoint
```
GET /api/invoices/{id}
```

### Función JavaScript (Axios)

```javascript
/**
 * Obtener detalle completo de un pedido/venta
 * @param {number} invoiceId - ID del pedido
 * @returns {Promise<object>} Detalle completo del pedido
 */
const obtenerDetallePedido = async (invoiceId) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.get(`/api/invoices/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Detalle del pedido:', response.data);
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      id: 5,
      invoiceNumber: "REC-202501-000005",
      invoiceDate: "2025-01-15",
      invoiceDateTime: "2025-01-15T10:30:00",
      clientName: "Juan Pérez",
      clientDPI: "1234567890101",
      clientNit: "12345678",
      subtotal: 250.00,
      discount: 0,
      tax: 0,
      total: 250.00,
      paymentMethod: "efectivo",
      paymentStatus: "pagado",
      status: "completada",
      notes: null,
      client: {
        id: 10,
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan@email.com",
        phone: "12345678",
        address: "Guatemala, Guatemala"
      },
      seller: {
        id: 1,
        firstName: "María",
        lastName: "González",
        email: "maria@farmacia.com"
      },
      items: [
        {
          id: 12,
          quantity: 2,
          unitPrice: 125.00,
          unitCost: 80.00,
          discount: 0,
          subtotal: 250.00,
          total: 250.00,
          product: {
            id: 3,
            name: "Paracetamol 500mg",
            sku: "MED-001",
            description: "Analgésico y antipirético"
          },
          batch: {
            id: 7,
            batchNumber: "LOTE-2025-001",
            expirationDate: "2026-12-31",
            manufacturingDate: "2024-06-15"
          }
        }
      ],
      receipts: [
        {
          id: 8,
          receiptNumber: "COMP-2025-000008",
          amount: 250.00,
          issueDate: "2025-01-15T10:30:00"
        }
      ]
    }
    */

  } catch (error) {
    console.error('❌ Error al obtener detalle:', error);

    if (error.response?.status === 404) {
      alert('Pedido no encontrado');
    }

    throw error;
  }
};

// USO:
const detallePedido = await obtenerDetallePedido(5);
```

---

## 🧾 Ver Detalle de un Recibo {#detalle-recibo}

### Endpoint
```
GET /api/receipts/{id}
```

### Función JavaScript (Axios)

```javascript
/**
 * Obtener detalle completo de un recibo/comprobante
 * @param {number} receiptId - ID del recibo
 * @returns {Promise<object>} Detalle completo del recibo
 */
const obtenerDetalleRecibo = async (receiptId) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.get(`/api/receipts/${receiptId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Detalle del recibo:', response.data);
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      id: 8,
      receiptNumber: "COMP-2025-000008",
      issueDate: "2025-01-15T10:30:00",
      amount: 250.00,
      currency: "GTQ",
      paymentMethod: "efectivo",
      status: "emitido",
      emailSent: false,
      emailSentDate: null,
      issuedBy: "María González",
      notes: "Comprobante de Venta REC-202501-000005",
      invoice: {
        id: 5,
        invoiceNumber: "REC-202501-000005",
        total: 250.00,
        invoiceDate: "2025-01-15",
        subtotal: 250.00,
        discount: 0,
        tax: 0,
        seller: {
          id: 1,
          firstName: "María",
          lastName: "González"
        }
      },
      client: {
        id: 10,
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan@email.com",
        phone: "12345678",
        address: "Guatemala, Guatemala",
        dpi: "1234567890101"
      },
      payment: null
    }
    */

  } catch (error) {
    console.error('❌ Error al obtener recibo:', error);
    throw error;
  }
};

// USO:
const detalleRecibo = await obtenerDetalleRecibo(8);
```

### Descargar Recibo en PDF

```javascript
/**
 * Generar y descargar PDF del recibo
 * @param {number} receiptId - ID del recibo
 */
const descargarReciboPDF = async (receiptId) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await axios.get(`/api/receipts/${receiptId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
      // responseType: 'blob' // Descomentar cuando se implemente PDF real
    });

    console.log('✅ Datos para PDF:', response.data);

    // TODO: Cuando se implemente generación de PDF real:
    // const blob = new Blob([response.data], { type: 'application/pdf' });
    // const url = window.URL.createObjectURL(blob);
    // const link = document.createElement('a');
    // link.href = url;
    // link.download = `Recibo-${receiptId}.pdf`;
    // link.click();
    // window.URL.revokeObjectURL(url);

    return response.data;

  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    throw error;
  }
};

// USO:
await descargarReciboPDF(8);
```

---

## 👤 Editar Perfil del Cliente {#editar-perfil}

### Endpoint
```
PUT /api/users/profile
```

### Función JavaScript (Axios)

```javascript
/**
 * Actualizar el perfil del usuario autenticado (cliente)
 * @param {object} updates - Campos a actualizar
 * @param {File} imageFile - Archivo de imagen (opcional)
 * @returns {Promise<object>} Usuario actualizado
 */
const actualizarPerfil = async (updates, imageFile = null) => {
  const token = localStorage.getItem('authToken');

  try {
    // Crear FormData para enviar datos con imagen
    const formData = new FormData();

    // Agregar campos al FormData
    if (updates.firstName) formData.append('firstName', updates.firstName);
    if (updates.lastName) formData.append('lastName', updates.lastName);
    if (updates.phone) formData.append('phone', updates.phone);
    if (updates.address) formData.append('address', updates.address);
    if (updates.dpi) formData.append('dpi', updates.dpi);
    if (updates.birthDate) formData.append('birthDate', updates.birthDate);
    // Nota: city, state, postalCode, nit no son necesarios para negocio local en Rabinal

    // Agregar imagen si se proporciona
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const response = await axios.put('/api/users/profile', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('✅ Perfil actualizado:', response.data);
    alert('Perfil actualizado exitosamente');
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
        role: "cliente",
        isActive: true,
        profileImage: "https://res.cloudinary.com/.../profile.jpg"
      }
    }
    */

  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);

    if (error.response) {
      alert(`Error: ${error.response.data.message}`);
    }

    throw error;
  }
};

// EJEMPLOS DE USO:

// 1. Actualizar solo datos de texto
const resultado1 = await actualizarPerfil({
  firstName: 'Juan Carlos',
  lastName: 'Pérez López',
  phone: '55551234',
  address: 'Barrio El Centro, Rabinal'
});

// 2. Actualizar con imagen
const fileInput = document.getElementById('profileImage');
const file = fileInput.files[0];

const resultado2 = await actualizarPerfil({
  firstName: 'Juan',
  phone: '12345678',
  address: 'Barrio San Sebastián'
}, file);

// 3. Actualizar solo teléfono
const resultado3 = await actualizarPerfil({
  phone: '98765432'
});
```

### Versión sin Imagen (JSON simple)

```javascript
/**
 * Actualizar perfil sin cambiar imagen
 * @param {object} updates - Campos a actualizar
 */
const actualizarPerfilSinImagen = async (updates) => {
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

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};

// USO:
await actualizarPerfilSinImagen({
  firstName: 'Juan',
  lastName: 'Pérez',
  phone: '12345678',
  address: 'Barrio El Centro, Rabinal, Baja Verapaz',
  dpi: '1234567890101'
});
```

### Obtener Perfil del Usuario Autenticado

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
      nit: null,
      role: "cliente",
      isActive: true,
      emailVerified: false,
      profileImage: "https://res.cloudinary.com/.../profile.jpg",
      cloudinaryPublicId: "farmacia-elizabeth/users/xyz",
      birthDate: "1990-05-15",
      lastLogin: "2025-01-15T14:30:00",
      notes: null,
      createdAt: "2025-01-01T10:00:00",
      updatedAt: "2025-01-15T14:30:00",
      deletedAt: null
    }
    */

  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    throw error;
  }
};

// USO:
const miPerfil = await obtenerMiPerfil();
```

---

## 🔐 Cambiar Contraseña {#cambiar-contraseña}

### Endpoint
```
POST /api/users/change-password
```

### Función JavaScript (Axios)

```javascript
/**
 * Cambiar la contraseña del usuario autenticado
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
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

    console.log('✅ Contraseña cambiada:', response.data);
    alert('Contraseña actualizada exitosamente');
    return response.data;

    /* RESPUESTA ESPERADA:
    {
      message: "Contraseña actualizada exitosamente"
    }
    */

  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);

    if (error.response) {
      const errorMsg = error.response.data.message;

      if (errorMsg.includes('contraseña actual incorrecta')) {
        alert('La contraseña actual es incorrecta');
      } else if (errorMsg.includes('8 caracteres')) {
        alert('La nueva contraseña debe tener al menos 8 caracteres');
      } else {
        alert(`Error: ${errorMsg}`);
      }
    }

    throw error;
  }
};

// USO:
await cambiarContrasena('MiPasswordActual123', 'NuevoPassword456!');
```

### Versión con Fetch

```javascript
const cambiarContrasenaFetch = async (currentPassword, newPassword) => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cambiar contraseña');
    }

    const data = await response.json();
    console.log('✅ Contraseña cambiada:', data);
    alert('Contraseña actualizada exitosamente');
    return data;

  } catch (error) {
    console.error('❌ Error:', error.message);
    alert(`Error: ${error.message}`);
    throw error;
  }
};
```

---

## 🎨 Componente React Completo {#componente-completo}

### Portal de Cliente (React + Axios)

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientPortal = () => {
  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos', 'recibos', 'perfil'
  const [pedidos, setPedidos] = useState([]);
  const [recibos, setRecibos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('authToken');

  // Obtener perfil al cargar
  useEffect(() => {
    obtenerPerfil();
  }, []);

  // Obtener datos según tab activa
  useEffect(() => {
    if (activeTab === 'pedidos' && pedidos.length === 0) {
      obtenerPedidos();
    } else if (activeTab === 'recibos' && recibos.length === 0) {
      obtenerRecibos();
    }
  }, [activeTab]);

  // ========== FUNCIONES API ==========

  const obtenerPerfil = async () => {
    try {
      const response = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerfil(response.data);
    } catch (err) {
      console.error('Error al obtener perfil:', err);
    }
  };

  const obtenerPedidos = async () => {
    if (!perfil) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/invoices?clientId=${perfil.id}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPedidos(response.data.invoices || []);
    } catch (err) {
      setError('Error al cargar pedidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerRecibos = async () => {
    if (!perfil) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/receipts/client/${perfil.id}?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecibos(response.data.receipts || []);
    } catch (err) {
      setError('Error al cargar recibos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarPerfil = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);

    try {
      const response = await axios.put('/api/users/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setPerfil(response.data.user);
      alert('Perfil actualizado exitosamente');
    } catch (err) {
      alert('Error al actualizar perfil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cambiarContrasena = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');

    try {
      await axios.post('/api/users/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert('Contraseña actualizada exitosamente');
      e.target.reset();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDERIZADO ==========

  if (!perfil) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">
          Bienvenido, {perfil.firstName} {perfil.lastName}
        </h1>
        <p className="text-gray-600">{perfil.email}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pedidos')}
          className={`px-4 py-2 rounded ${
            activeTab === 'pedidos' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          📦 Mis Pedidos
        </button>
        <button
          onClick={() => setActiveTab('recibos')}
          className={`px-4 py-2 rounded ${
            activeTab === 'recibos' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          🧾 Mis Recibos
        </button>
        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-4 py-2 rounded ${
            activeTab === 'perfil' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          👤 Mi Perfil
        </button>
      </div>

      {/* Contenido */}
      <div className="bg-white shadow rounded-lg p-6">
        {loading && <p className="text-center">Cargando...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}

        {/* TAB: PEDIDOS */}
        {activeTab === 'pedidos' && !loading && (
          <div>
            <h2 className="text-xl font-bold mb-4">Mis Pedidos</h2>
            {pedidos.length === 0 ? (
              <p className="text-gray-500">No tienes pedidos registrados</p>
            ) : (
              <div className="space-y-4">
                {pedidos.map(pedido => (
                  <div key={pedido.id} className="border rounded p-4 hover:shadow-lg transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{pedido.invoiceNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(pedido.invoiceDate).toLocaleDateString('es-GT')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          Q {pedido.total.toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          pedido.paymentStatus === 'pagado'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {pedido.paymentStatus}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 border-t pt-3">
                      <p className="text-sm text-gray-600">Productos:</p>
                      {pedido.items?.map(item => (
                        <p key={item.id} className="text-sm ml-2">
                          • {item.product.name} - Cantidad: {item.quantity} - Q {item.total.toFixed(2)}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: RECIBOS */}
        {activeTab === 'recibos' && !loading && (
          <div>
            <h2 className="text-xl font-bold mb-4">Mis Recibos</h2>
            {recibos.length === 0 ? (
              <p className="text-gray-500">No tienes recibos registrados</p>
            ) : (
              <div className="space-y-4">
                {recibos.map(recibo => (
                  <div key={recibo.id} className="border rounded p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold">{recibo.receiptNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(recibo.issueDate).toLocaleString('es-GT')}
                        </p>
                        <p className="text-sm">Pedido: {recibo.invoice.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {recibo.currency} {recibo.amount.toFixed(2)}
                        </p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {recibo.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: PERFIL */}
        {activeTab === 'perfil' && !loading && (
          <div>
            <h2 className="text-xl font-bold mb-4">Mi Perfil</h2>

            {/* Formulario Editar Perfil */}
            <form onSubmit={actualizarPerfil} className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Nombre</label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={perfil.firstName}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Apellido</label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={perfil.lastName}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Teléfono</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={perfil.phone}
                    className="w-full border rounded px-3 py-2"
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">DPI (opcional)</label>
                  <input
                    type="text"
                    name="dpi"
                    defaultValue={perfil.dpi}
                    className="w-full border rounded px-3 py-2"
                    placeholder="1234567890101"
                    maxLength={13}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold mb-1">Dirección en Rabinal</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={perfil.address}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Ej: Barrio El Centro, frente al parque"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold mb-1">Fecha de Nacimiento (opcional)</label>
                  <input
                    type="date"
                    name="birthDate"
                    defaultValue={perfil.birthDate}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                * Sistema local para Rabinal, Baja Verapaz
              </p>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>

            {/* Formulario Cambiar Contraseña */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold mb-4">Cambiar Contraseña</h3>
              <form onSubmit={cambiarContrasena} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Contraseña Actual</label>
                  <input
                    type="password"
                    name="currentPassword"
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="w-full border rounded px-3 py-2"
                    required
                    minLength={8}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPortal;
```

---

## 📝 Resumen de Endpoints para Clientes

| Funcionalidad | Método | Endpoint | Autenticación |
|--------------|--------|----------|---------------|
| Ver mis pedidos | GET | `/api/invoices?clientId={id}` | Bearer Token |
| Ver detalle de pedido | GET | `/api/invoices/{id}` | Bearer Token |
| Ver mis recibos | GET | `/api/receipts/client/{id}` | Bearer Token |
| Ver detalle de recibo | GET | `/api/receipts/{id}` | Bearer Token |
| Descargar recibo PDF | GET | `/api/receipts/{id}/pdf` | Bearer Token |
| Ver mi perfil | GET | `/api/users/profile` | Bearer Token |
| Actualizar mi perfil | PUT | `/api/users/profile` | Bearer Token |
| Cambiar contraseña | POST | `/api/users/change-password` | Bearer Token |

---

## ⚠️ Notas Importantes

### 1. Autenticación
- Todas las peticiones requieren el header `Authorization: Bearer {token}`
- El token se obtiene después del login y se guarda en `localStorage`

### 2. Filtros de Pedidos
- `clientId`: Filtrar por cliente (obligatorio para ver solo los pedidos del cliente)
- `startDate` / `endDate`: Filtrar por rango de fechas
- `status`: `completada`, `anulada`
- `paymentStatus`: `pagado`, `pendiente`
- `page` / `limit`: Paginación

### 3. Estados de Pedidos
- `completada`: Venta exitosa
- `anulada`: Venta cancelada (stock devuelto)

### 4. Estados de Recibos
- `emitido`: Recibo generado pero no enviado
- `enviado`: Recibo enviado por email
- `cancelado`: Recibo anulado

### 5. Campos Editables del Perfil
El cliente PUEDE editar:
- `firstName`, `lastName` (nombre completo)
- `phone` (teléfono)
- `address` (dirección en Rabinal - barrio, referencias)
- `dpi` (Documento Personal de Identificación - opcional)
- `birthDate` (fecha de nacimiento - opcional)
- `profileImage` (foto de perfil)

El cliente NO PUEDE editar:
- `email` (identificador único)
- `role` (solo admin puede cambiar roles)
- `isActive` (solo admin puede activar/desactivar)

Campos NO necesarios para Rabinal (sistema local):
- `city`, `state`, `postalCode` (todos los clientes son de Rabinal, B.V.)
- `nit` (no se emiten facturas fiscales, solo recibos simples)

### 6. Seguridad de Datos
- Un cliente solo puede ver SUS PROPIOS pedidos y recibos
- El backend verifica que el `clientId` en el filtro coincida con el usuario autenticado
- Si intentan acceder a pedidos de otro cliente, el backend devuelve error 403

---

## 🚀 Próximos Pasos

1. Implementar la generación real de PDF para recibos
2. Agregar sistema de notificaciones por email
3. Implementar filtros avanzados (búsqueda por producto, rango de precios)
4. Agregar paginación visual en el frontend
5. Implementar vista de pedidos pendientes vs completados

---

**Autor:** Alexander Echeverria
**Fecha:** 2025-01-05
**Backend:** farmacia-backend
