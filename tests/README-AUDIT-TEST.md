# Test de Auditoría - Farmacia Elizabeth
**Autor:** Alexander Echeverria
**Ubicación:** `tests/test-audit.js`

## Descripción

Sistema completo de pruebas para el módulo de auditoría que permite verificar la trazabilidad de todas las operaciones realizadas en el sistema. Con este test puedes responder preguntas como:

- ¿Quién creó este producto/usuario/venta?
- ¿Quién modificó este registro y cuándo?
- ¿Quién eliminó este elemento?
- ¿Cuál es el historial completo de cambios de un elemento?

## Ejecución

```bash
node tests/test-audit.js
```

## Funcionalidades

### Opciones Generales

#### 1. Login
Autenticarse en el sistema para acceder a las funcionalidades de auditoría.
- Email por defecto: `admin@farmacia.com`
- Password por defecto: `Admin123!`

#### 2. Listar todos los logs
Muestra todos los logs del sistema con opciones de filtrado:
- Por acción (create/update/delete/login)
- Por entidad (user/product/batch/supplier/etc)
- Por severidad (info/warning/error/critical)
- Por estado (success/failure)
- Por usuario
- Paginación configurable

#### 3. Obtener log por ID
Consulta un log específico por su ID mostrando todos los detalles:
- Información del usuario que realizó la acción
- Valores anteriores y nuevos (en caso de modificaciones)
- Metadata completa (IP, user agent, método HTTP, endpoint)

#### 4. Obtener logs por usuario
Ver todo el historial de acciones de un usuario específico.

#### 5. Obtener logs por entidad
Ver el historial de una entidad específica (todos los productos, todas las ventas, etc.)
O de un elemento específico (producto #5, venta #123, etc.)

#### 6. Ver estadísticas de auditoría
Dashboard con estadísticas completas:
- Total de logs y eventos críticos
- Distribución por acción (CREATE, UPDATE, DELETE, etc.)
- Distribución por severidad
- Distribución por estado (exitosos/fallidos)
- Top 10 usuarios más activos
- Filtrable por rango de fechas

#### 7. Ver actividad reciente
Muestra la actividad del sistema en las últimas X horas (por defecto 24h).

#### 8. Limpiar logs antiguos (Admin)
Elimina logs antiguos (por defecto más de 90 días) excepto los de severidad crítica o alta.
**Requiere rol de administrador.**

---

### Verificación de Trazabilidad (NUEVO)

Estas son las nuevas funciones agregadas para responder preguntas específicas sobre trazabilidad:

#### 9. ¿Quién creó este elemento?

**Uso:** Consultar quién creó un elemento específico del sistema.

**Ejemplo:**
```
Tipo de entidad: Product
ID del elemento: 5
```

**Información mostrada:**
- ✓ Usuario que lo creó (nombre, email, rol, ID)
- ✓ Fecha y hora exacta de creación
- ✓ IP desde donde se creó
- ✓ Estado de la operación (exitoso/fallido)
- ✓ Valores iniciales del elemento

**Casos de uso:**
- Verificar quién agregó un nuevo producto al inventario
- Identificar quién registró un nuevo usuario
- Auditar quién creó una nueva venta

---

#### 10. ¿Quién modificó este elemento?

**Uso:** Ver todo el historial de modificaciones de un elemento.

**Ejemplo:**
```
Tipo de entidad: Product
ID del elemento: 5
Mostrar últimas X modificaciones: 10
```

**Información mostrada:**
- ⟳ Lista completa de todas las modificaciones
- ⟳ Usuario que modificó (nombre, rol, ID)
- ⟳ Fecha y hora de cada modificación
- ⟳ IP desde donde se modificó
- ⟳ Comparación: valor anterior vs nuevo valor
- ⟳ Estado de cada operación

**Casos de uso:**
- Investigar quién cambió el precio de un producto
- Ver quién actualizó el stock de un medicamento
- Auditar cambios en datos de usuarios o proveedores

---

#### 11. ¿Quién eliminó este elemento?

**Uso:** Investigar quién eliminó un elemento del sistema.

**Ejemplo:**
```
Tipo de entidad: Product
ID del elemento eliminado: 5
```

**Información mostrada:**
- ✗ Usuario que eliminó el elemento (nombre, email, rol, ID)
- ✗ Fecha y hora exacta de eliminación
- ✗ IP desde donde se eliminó
- ✗ Último estado del elemento antes de ser eliminado
- ✗ Historial completo del elemento (creación → modificaciones → eliminación)

**Casos de uso:**
- Investigar quién eliminó un producto del inventario
- Auditar eliminación de ventas o facturas
- Rastrear eliminación de usuarios o proveedores

---

#### 12. Ver historial completo de un elemento

**Uso:** Obtener una línea de tiempo completa de la vida de un elemento.

**Ejemplo:**
```
Tipo de entidad: Product
ID del elemento: 5
```

**Información mostrada:**
- 📊 Resumen ejecutivo:
  - ✓ Quién lo creó y cuándo
  - ⟳ Cuántas modificaciones tuvo y quiénes las hicieron
  - ✗ Si fue eliminado, quién y cuándo

- 📅 Línea de tiempo cronológica:
  - Todos los eventos ordenados por fecha
  - Código de colores por tipo de acción
  - Usuario, IP y estado de cada operación

**Casos de uso:**
- Auditoría completa de un elemento sospechoso
- Investigación de problemas o discrepancias
- Reportes de trazabilidad para compliance

---

## Entidades Disponibles

El sistema soporta las siguientes entidades:

- **User** - Usuarios del sistema
- **Product** - Productos/medicamentos
- **Batch** - Lotes de productos
- **Supplier** - Proveedores
- **Invoice** - Recibos de venta
- **Receipt** - Comprobantes
- **Payment** - Pagos
- **Purchase** - Compras a proveedores
- **InventoryMovement** - Movimientos de inventario

## Ejemplos de Casos de Uso Reales

### Caso 1: Investigar cambio de precio
**Problema:** El precio de un medicamento cambió sin autorización.

**Solución:**
1. Usar opción 10: "¿Quién modificó este elemento?"
2. Ingresar entidad: `Product`, ID: `123`
3. Ver quién cambió el precio, desde qué IP y cuándo
4. Comparar valor anterior vs nuevo

---

### Caso 2: Auditar eliminación de venta
**Problema:** Una venta fue eliminada y se necesita saber quién lo hizo.

**Solución:**
1. Usar opción 11: "¿Quién eliminó este elemento?"
2. Ingresar entidad: `Invoice`, ID: `456`
3. Ver quién eliminó, cuándo y el último estado de la venta
4. Revisar historial completo de la venta

---

### Caso 3: Trazabilidad completa de un lote
**Problema:** Se necesita documentar todo el ciclo de vida de un lote para auditoría.

**Solución:**
1. Usar opción 12: "Ver historial completo"
2. Ingresar entidad: `Batch`, ID: `789`
3. Obtener reporte completo: creación, modificaciones, movimientos
4. Identificar todos los usuarios involucrados

---

### Caso 4: Usuario sospechoso
**Problema:** Se sospecha que un usuario está realizando operaciones no autorizadas.

**Solución:**
1. Usar opción 4: "Obtener logs por usuario"
2. Ingresar ID del usuario
3. Revisar todas sus acciones recientes
4. Identificar patrones sospechosos

---

## Características Técnicas

### Seguridad
- ✓ Requiere autenticación JWT
- ✓ Logs inmutables (solo lectura)
- ✓ Registro de IP y user agent
- ✓ Auditoría de intentos de login fallidos

### Performance
- ✓ Índices en campos clave (userId, action, entity, createdAt)
- ✓ Paginación en todas las consultas
- ✓ Límites configurables

### Colores y Formato
- 🟢 Verde: Creaciones exitosas
- 🟡 Amarillo: Modificaciones
- 🔴 Rojo: Eliminaciones y errores
- 🔵 Azul: Información general
- 🟣 Magenta: Usuarios y resúmenes

## Requisitos

- Node.js
- Servidor backend corriendo en `http://localhost:5000` (o configurado en `.env`)
- Usuario con permisos de lectura de auditoría
- Paquetes: `axios`, `dotenv`, `readline`

## Variables de Entorno

```env
BASE_URL=http://localhost:5000
```

## Notas Importantes

1. **Logs antes de auditoría:** Elementos creados antes de implementar el sistema de auditoría no tendrán logs de creación.

2. **Limpieza de logs:** La opción 8 solo elimina logs antiguos de baja prioridad. Los logs críticos se mantienen indefinidamente.

3. **Permisos:** Algunas operaciones (como limpiar logs) requieren rol de administrador.

4. **Datos sensibles:** Los logs NO almacenan contraseñas ni datos sensibles, solo metadatos de operaciones.

## Soporte

Para reportar problemas o sugerencias, contactar a Alexander Echeverria.
