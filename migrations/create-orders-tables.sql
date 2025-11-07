-- ========================================
-- MIGRACIÓN: Crear tablas de pedidos
-- Autor: Alexander Echeverria
-- Fecha: 2025-11-06
-- ========================================

-- Crear tipo ENUM para deliveryType si no existe
DO $$ BEGIN
    CREATE TYPE enum_orders_deliveryType AS ENUM ('pickup', 'delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tipo ENUM para status de orders si no existe
DO $$ BEGIN
    CREATE TYPE enum_orders_status AS ENUM (
        'pendiente',
        'confirmado',
        'en_preparacion',
        'listo_para_recoger',
        'en_camino',
        'entregado',
        'completado',
        'cancelado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tipo ENUM para paymentMethod de orders si no existe
DO $$ BEGIN
    CREATE TYPE enum_orders_paymentMethod AS ENUM (
        'efectivo',
        'tarjeta',
        'transferencia',
        'paypal',
        'stripe'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tipo ENUM para paymentStatus de orders si no existe
DO $$ BEGIN
    CREATE TYPE enum_orders_paymentStatus AS ENUM (
        'pendiente',
        'pagado',
        'parcial',
        'cancelado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla orders si no existe
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
    "invoiceId" INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    "clientId" INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    "sellerId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "deliveryPersonId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "deliveryType" enum_orders_deliveryType NOT NULL,
    "shippingAddress" TEXT,
    status enum_orders_status DEFAULT 'pendiente',
    "paymentMethod" enum_orders_paymentMethod NOT NULL DEFAULT 'efectivo',
    "paymentStatus" enum_orders_paymentStatus DEFAULT 'pendiente',
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount DECIMAL(12, 2) DEFAULT 0.00,
    tax DECIMAL(12, 2) DEFAULT 0.00,
    "shippingCost" DECIMAL(12, 2) DEFAULT 0.00,
    total DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    "cancelReason" TEXT,
    "estimatedDeliveryDate" TIMESTAMP WITH TIME ZONE,
    "deliveredAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- Crear índices para orders si no existen
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders("orderNumber");
CREATE INDEX IF NOT EXISTS orders_client_id_idx ON orders("clientId");
CREATE INDEX IF NOT EXISTS orders_seller_id_idx ON orders("sellerId");
CREATE INDEX IF NOT EXISTS orders_delivery_person_id_idx ON orders("deliveryPersonId");
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_delivery_type_idx ON orders("deliveryType");
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders("paymentStatus");
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders("createdAt");

-- Crear tabla order_items si no existe
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    "productId" INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    "batchId" INTEGER REFERENCES batches(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    "unitPrice" DECIMAL(12, 2) NOT NULL,
    "unitCost" DECIMAL(12, 2),
    discount DECIMAL(12, 2) DEFAULT 0.00,
    subtotal DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para order_items si no existen
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items("orderId");
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items("productId");
CREATE INDEX IF NOT EXISTS order_items_batch_id_idx ON order_items("batchId");

-- Confirmar creación
DO $$
BEGIN
    RAISE NOTICE '✅ Tablas de pedidos creadas exitosamente';
    RAISE NOTICE '   • orders';
    RAISE NOTICE '   • order_items';
END $$;
