-- ============================================
-- MIGRACIÓN: Hacer supplierId opcional en batches
-- Fecha: 2025-11-05
-- Autor: Alexander Echeverria
-- ============================================

-- Descripción:
-- Esta migración cambia el campo supplierId de NOT NULL a NULL
-- en la tabla batches para permitir lotes sin proveedor

-- ============================================
-- PASO 1: Hacer supplierId opcional
-- ============================================

ALTER TABLE batches
ALTER COLUMN "supplierId" DROP NOT NULL;

-- ============================================
-- PASO 2: Actualizar comentario de la columna
-- ============================================

COMMENT ON COLUMN batches."supplierId" IS
'Proveedor (opcional - productos pueden no tener proveedor)';

-- ============================================
-- PASO 3: Actualizar comentario de invoiceNumber
-- ============================================

COMMENT ON COLUMN batches."invoiceNumber" IS
'Numero de factura/recibo de compra (opcional - solo cuando existe documento físico)';

-- ============================================
-- VERIFICACIÓN: Comprobar los cambios
-- ============================================

-- Ejecuta esto para verificar que los cambios se aplicaron correctamente:
SELECT
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'batches'
AND column_name IN ('supplierId', 'invoiceNumber', 'productId')
ORDER BY column_name;

-- Salida esperada:
-- column_name     | is_nullable | data_type | column_default
-- ----------------|-------------|-----------|---------------
-- invoiceNumber   | YES         | character varying | NULL
-- productId       | NO          | integer   | NULL
-- supplierId      | YES         | integer   | NULL

-- ============================================
-- ROLLBACK (solo si necesitas revertir)
-- ============================================

-- ⚠️ NO EJECUTAR A MENOS QUE NECESITES REVERTIR LA MIGRACIÓN
-- ALTER TABLE batches
-- ALTER COLUMN "supplierId" SET NOT NULL;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Esta migración es SEGURA para ejecutar:
--    - No modifica datos existentes
--    - Solo cambia la restricción NOT NULL
--    - Los lotes existentes conservan su proveedor

-- 2. Después de ejecutar:
--    - Los lotes existentes con proveedor siguen funcionando
--    - Ahora se pueden crear lotes sin proveedor (si el producto no tiene proveedor)

-- 3. Validaciones en el código:
--    - Si producto.supplierId existe → lote.supplierId es OBLIGATORIO
--    - Si producto.supplierId es NULL → lote.supplierId es OPCIONAL
--    - Las validaciones están en app/controllers/batch.controller.js

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
