# Guía Frontend - CRUD Completo de Productos

## 🔄 Flujo de Subida de Imágenes

**IMPORTANTE**: El frontend NO sube imágenes directamente a Cloudinary. El flujo es:

```
1. Frontend → Selecciona imagen del dispositivo
2. Frontend → Envía FormData con imagen al backend
3. Backend  → Valida la imagen (tipo, tamaño máx 10MB)
4. Backend  → Sube imagen a Cloudinary automáticamente
5. Backend  → Guarda la URL retornada en la base de datos
6. Backend  → Retorna el producto con imageUrl
7. Frontend → Recibe y muestra la imagen usando imageUrl
```

**El frontend solo necesita**:
- ✅ Seleccionar el archivo de imagen
- ✅ Agregarlo al FormData
- ✅ Enviarlo al backend

**El backend hace todo lo demás**: validación, subida a Cloudinary, almacenamiento de URL.

---

## Configuración Inicial

### 1. Configurar URL del Backend

```javascript
// src/config/api.js o similar
const API_URL = 'http://localhost:5000/api'; // En desarrollo
// const API_URL = 'https://tu-backend.onrender.com/api'; // En producción

export default API_URL;
```

### 2. Configurar Axios con Token de Autenticación

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Interceptor para agregar el token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📋 CRUD Completo de Productos

### 1️⃣ CREAR PRODUCTO (POST)

#### A) Crear Producto SIN Imagen

```javascript
// src/services/productService.js
import api from './api';

export const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Ejemplo de uso en un componente React
const handleCreateProduct = async () => {
  const productData = {
    name: "Paracetamol 500mg",
    genericName: "Acetaminofén",
    sku: "MED-001",
    category: "medicamento",
    presentation: "Tabletas x 100",
    price: 15.50,
    costPrice: 10.00,
    minStock: 20,
    maxStock: 500,
    requiresPrescription: false,
    supplierId: null, // ✅ Ahora es opcional
    laboratory: "Laboratorios ABC",
    activeIngredient: "Paracetamol 500mg",
    description: "Analgésico y antipirético"
  };

  try {
    const result = await createProduct(productData);
    console.log('Producto creado:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### B) Crear Producto CON Imagen

```javascript
// src/services/productService.js
export const createProductWithImage = async (productData, imageFile) => {
  try {
    const formData = new FormData();

    // Agregar la imagen
    if (imageFile) {
      formData.append('image', imageFile);
    }

    // Agregar los demás campos del producto
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });

    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Ejemplo en componente React con formulario
const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    category: 'medicamento',
    supplierId: null
  });
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('La imagen no debe superar 10MB');
        return;
      }
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await createProductWithImage(formData, imageFile);
      alert('Producto creado exitosamente');
      console.log(result);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre del producto"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />

      <input
        type="number"
        placeholder="Precio de venta"
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: e.target.value})}
        required
      />

      <input
        type="number"
        placeholder="Precio de costo"
        value={formData.costPrice}
        onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
        required
      />

      <select
        value={formData.category}
        onChange={(e) => setFormData({...formData, category: e.target.value})}
      >
        <option value="medicamento">Medicamento</option>
        <option value="suplemento">Suplemento</option>
        <option value="cuidado_personal">Cuidado Personal</option>
        <option value="equipo_medico">Equipo Médico</option>
        <option value="cosmetico">Cosmético</option>
        <option value="higiene">Higiene</option>
        <option value="bebe">Bebé</option>
        <option value="vitaminas">Vitaminas</option>
        <option value="primeros_auxilios">Primeros Auxilios</option>
        <option value="otros">Otros</option>
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />

      {imageFile && (
        <div>
          <p>Imagen seleccionada: {imageFile.name}</p>
          <img
            src={URL.createObjectURL(imageFile)}
            alt="Preview"
            style={{maxWidth: '200px'}}
          />
        </div>
      )}

      <button type="submit">Crear Producto</button>
    </form>
  );
};
```

---

### 2️⃣ OBTENER PRODUCTOS (GET)

#### A) Obtener Todos los Productos (con filtros)

```javascript
// src/services/productService.js
export const getProducts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    // Agregar filtros opcionales
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.supplierId) params.append('supplierId', filters.supplierId);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.requiresPrescription !== undefined) {
      params.append('requiresPrescription', filters.requiresPrescription);
    }
    if (filters.stockStatus) params.append('stockStatus', filters.stockStatus);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Ejemplo de uso
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts({
        isActive: true,
        page: 1,
        limit: 50
      });

      setProducts(data.products);
      console.log('Total productos:', data.total);
      console.log('Páginas:', data.totalPages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <ul>
          {products.map(product => (
            <li key={product.id}>
              <img
                src={product.imageUrl || 'https://via.placeholder.com/100'}
                alt={product.name}
                width="100"
              />
              <h3>{product.name}</h3>
              <p>Precio: Q{product.price}</p>
              <p>Stock: {product.stock}</p>
              {product.supplier && (
                <p>Proveedor: {product.supplier.name}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

#### B) Obtener Un Producto por ID

```javascript
export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Uso
const ProductDetail = ({ productId }) => {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await getProductById(productId);
      setProduct(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!product) return <p>Cargando...</p>;

  return (
    <div>
      <h2>{product.name}</h2>
      {product.imageUrl && (
        <img src={product.imageUrl} alt={product.name} />
      )}
      <p>SKU: {product.sku}</p>
      <p>Precio: Q{product.price}</p>
      <p>Stock: {product.stock}</p>
      <p>Categoría: {product.category}</p>
      {product.supplier ? (
        <p>Proveedor: {product.supplier.name}</p>
      ) : (
        <p>Sin proveedor asignado</p>
      )}
    </div>
  );
};
```

#### C) Buscar por SKU

```javascript
export const getProductBySku = async (sku) => {
  try {
    const response = await api.get(`/products/sku/${sku}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
```

#### D) Buscar por Código de Barras

```javascript
export const getProductByBarcode = async (barcode) => {
  try {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Ejemplo con escáner de código de barras
const BarcodeScanner = () => {
  const [barcode, setBarcode] = useState('');

  const handleScan = async (code) => {
    try {
      const product = await getProductByBarcode(code);
      console.log('Producto encontrado:', product);
    } catch (error) {
      alert('Producto no encontrado');
    }
  };

  return (
    <input
      type="text"
      placeholder="Escanea el código de barras"
      value={barcode}
      onChange={(e) => setBarcode(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          handleScan(barcode);
        }
      }}
    />
  );
};
```

---

### 3️⃣ ACTUALIZAR PRODUCTO (PUT)

#### A) Actualizar SIN Cambiar Imagen

```javascript
export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/products/${id}`, productData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Ejemplo: Actualizar solo el precio
const updatePrice = async (productId, newPrice) => {
  try {
    const result = await updateProduct(productId, {
      price: newPrice
    });
    console.log('Precio actualizado:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Ejemplo: Agregar proveedor a un producto existente
const addSupplierToProduct = async (productId, supplierId) => {
  try {
    const result = await updateProduct(productId, {
      supplierId: supplierId
    });
    console.log('Proveedor agregado:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### B) Actualizar CON Nueva Imagen

```javascript
export const updateProductWithImage = async (id, productData, imageFile) => {
  try {
    const formData = new FormData();

    // Agregar nueva imagen (si existe)
    if (imageFile) {
      formData.append('image', imageFile);
    }

    // Agregar campos a actualizar
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });

    const response = await api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Componente de edición
const EditProductForm = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    const data = await getProductById(productId);
    setProduct(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateProductWithImage(productId, product, imageFile);
      alert('Producto actualizado exitosamente');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (!product) return <p>Cargando...</p>;

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={product.name}
        onChange={(e) => setProduct({...product, name: e.target.value})}
      />

      <input
        type="number"
        value={product.price}
        onChange={(e) => setProduct({...product, price: e.target.value})}
      />

      {/* Mostrar imagen actual */}
      {product.imageUrl && (
        <div>
          <p>Imagen actual:</p>
          <img src={product.imageUrl} alt={product.name} width="200" />
        </div>
      )}

      {/* Seleccionar nueva imagen */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      <button type="submit">Actualizar Producto</button>
    </form>
  );
};
```

---

### 4️⃣ ACTIVAR/DESACTIVAR PRODUCTO (PATCH)

```javascript
export const toggleProductActive = async (id) => {
  try {
    const response = await api.patch(`/products/${id}/toggle-active`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Ejemplo de uso
const ProductItem = ({ product }) => {
  const handleToggle = async () => {
    try {
      const result = await toggleProductActive(product.id);
      alert(`Producto ${result.product.isActive ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <p>Estado: {product.isActive ? 'Activo' : 'Inactivo'}</p>
      <button onClick={handleToggle}>
        {product.isActive ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  );
};
```

---

### 5️⃣ ELIMINAR PRODUCTO (DELETE)

```javascript
export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Ejemplo con confirmación
const ProductDeleteButton = ({ productId, productName, onDeleted }) => {
  const handleDelete = async () => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar "${productName}"?\n\n` +
      `⚠️ Solo se pueden eliminar productos sin stock.`
    );

    if (!confirmed) return;

    try {
      await deleteProduct(productId);
      alert('Producto eliminado exitosamente');
      onDeleted(productId);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <button onClick={handleDelete} style={{color: 'red'}}>
      Eliminar Producto
    </button>
  );
};
```

---

## 📊 CONSULTAS ADICIONALES

### Productos con Stock Bajo

```javascript
export const getLowStockProducts = async () => {
  try {
    const response = await api.get('/products/low-stock');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
```

### Productos Agotados

```javascript
export const getOutOfStockProducts = async () => {
  try {
    const response = await api.get('/products/out-of-stock');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
```

### Estadísticas de Productos

```javascript
export const getProductStats = async () => {
  try {
    const response = await api.get('/products/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Ejemplo de uso
const ProductDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const data = await getProductStats();
    setStats(data);
  };

  if (!stats) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Estadísticas de Productos</h2>
      <p>Total: {stats.total}</p>
      <p>Activos: {stats.active}</p>
      <p>Inactivos: {stats.inactive}</p>
      <p>Con stock: {stats.withStock}</p>
      <p>Agotados: {stats.outOfStock}</p>
      <p>Stock bajo: {stats.lowStock}</p>
      <p>Valor total inventario: Q{stats.totalInventoryValue}</p>
    </div>
  );
};
```

---

## 🔍 FILTROS AVANZADOS

### Búsqueda con Múltiples Filtros

```javascript
const ProductSearch = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stockStatus: '',
    isActive: true,
    page: 1,
    limit: 20
  });
  const [products, setProducts] = useState([]);

  const handleSearch = async () => {
    try {
      const data = await getProducts(filters);
      setProducts(data.products);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar por nombre, SKU, código de barras..."
        value={filters.search}
        onChange={(e) => setFilters({...filters, search: e.target.value})}
      />

      <select
        value={filters.category}
        onChange={(e) => setFilters({...filters, category: e.target.value})}
      >
        <option value="">Todas las categorías</option>
        <option value="medicamento">Medicamentos</option>
        <option value="suplemento">Suplementos</option>
        {/* ... más opciones */}
      </select>

      <select
        value={filters.stockStatus}
        onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
      >
        <option value="">Todos los estados de stock</option>
        <option value="ok">Stock OK</option>
        <option value="low">Stock Bajo</option>
        <option value="out">Agotado</option>
        <option value="high">Stock Alto</option>
      </select>

      <button onClick={handleSearch}>Buscar</button>

      <div>
        {products.map(product => (
          <div key={product.id}>{product.name}</div>
        ))}
      </div>
    </div>
  );
};
```

---

## ⚠️ MANEJO DE ERRORES

```javascript
// Hook personalizado para manejar errores
const useProductAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = async (requestFn) => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleRequest };
};

// Uso del hook
const ProductManager = () => {
  const { loading, error, handleRequest } = useProductAPI();

  const createNewProduct = async (data, image) => {
    try {
      const result = await handleRequest(() =>
        createProductWithImage(data, image)
      );
      alert('Producto creado exitosamente');
    } catch (error) {
      // El error ya está manejado
    }
  };

  return (
    <div>
      {loading && <p>Procesando...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
    </div>
  );
};
```

---

## 📝 NOTAS IMPORTANTES

1. **Autenticación**: La mayoría de endpoints requieren token JWT (excepto GET /products)

2. **Imágenes**:
   - ✅ **Máximo 10MB por imagen** (actualizado desde 5MB)
   - ✅ **El BACKEND sube a Cloudinary**, no el frontend
   - ✅ Formatos permitidos: JPEG, PNG, GIF, WEBP
   - ✅ El frontend solo envía el archivo al backend vía FormData
   - ✅ El backend retorna la URL de Cloudinary en `imageUrl`
   - ✅ Si no se envía imagen, el producto se crea sin imagen

3. **Proveedor Opcional**:
   - Ahora puedes crear productos sin proveedor (`supplierId: null`)
   - Puedes agregar el proveedor después con PUT

4. **Validaciones del Backend**:
   - SKU único
   - Código de barras único (si se proporciona)
   - No se pueden eliminar productos con stock

5. **Soft Delete**:
   - Los productos eliminados se marcan como "deleted" pero no se borran físicamente

6. **Stock**:
   - El stock se actualiza automáticamente al crear/vender lotes
   - No se puede modificar el stock directamente, solo a través de lotes/ventas
