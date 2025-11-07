-- ========================================
-- MIGRACIÓN: Agregar estado 'listo_para_envio' al ENUM status
-- Autor: Alexander Echeverria
-- Fecha: 2025-01-06
-- ========================================

-- Paso 1: Agregar el nuevo valor al tipo ENUM existente
ALTER TYPE enum_orders_status ADD VALUE IF NOT EXISTS 'listo_para_envio' AFTER 'listo_para_recoger';

-- Confirmar
DO $$
BEGIN
    RAISE NOTICE '✅ Estado listo_para_envio agregado exitosamente al ENUM enum_orders_status';
END $$;
