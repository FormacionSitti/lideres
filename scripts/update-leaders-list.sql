-- Script para actualizar la lista de líderes
-- Fecha: Abril 2026

-- PASO 1: Eliminar líderes que ya no deben estar en la lista
-- Nota: Esto también eliminará los seguimientos asociados a estos líderes
-- Si deseas conservar el historial, comenta estas líneas

-- Primero eliminar los seguimientos asociados
DELETE FROM followups 
WHERE leader_id IN (
  SELECT id FROM leaders 
  WHERE name ILIKE '%Daniel Rivera%' 
     OR name ILIKE '%Camilo Hernández%'
);

-- Luego eliminar los líderes
DELETE FROM leaders 
WHERE name ILIKE '%Daniel Rivera%' 
   OR name ILIKE '%Camilo Hernández%';

-- PASO 2: Agregar nuevos líderes
INSERT INTO leaders (name)
VALUES 
  ('Viviana Maria Giraldo'),
  ('Laura Morales Calderón'),
  ('Manuela Collante Rivera')
ON CONFLICT DO NOTHING;

-- PASO 3: Verificar la lista actualizada de líderes
SELECT id, name FROM leaders ORDER BY name;
