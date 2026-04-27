-- Script para limpiar la base de datos y configurar el Radar Táctico-Estratégico
-- ADVERTENCIA: Este script eliminará todos los registros antiguos

-- PASO 1: Eliminar todos los seguimientos antiguos
DELETE FROM followups;

-- PASO 2: Eliminar todos los temas antiguos
DELETE FROM topics;

-- PASO 3: Insertar los nuevos temas del Radar Táctico-Estratégico
INSERT INTO topics (name) VALUES
  ('Liderazgo cercano'),
  ('Resolución táctico-estratégica de problemas'),
  ('Visión transformadora'),
  ('Toma de decisiones ágil y efectiva'),
  ('Cultura de aprendizaje'),
  ('Comunicación'),
  ('Motivación e innovación');

-- PASO 4: Verificar los nuevos temas
SELECT id, name FROM topics ORDER BY id;

-- PASO 5: Verificar que no hay seguimientos
SELECT COUNT(*) as total_followups FROM followups;
