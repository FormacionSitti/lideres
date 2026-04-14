-- Script para actualizar los temas con el nuevo Radar Táctico-Estratégico
-- IMPORTANTE: Esto eliminará los temas anteriores y creará los nuevos

-- Primero, eliminar los registros de followup_topics para evitar referencias huérfanas
-- ADVERTENCIA: Esto borrará el historial de calificaciones de temas
-- DELETE FROM followup_topics;

-- Actualizar o insertar los nuevos temas del Radar Táctico-Estratégico
-- Usamos UPSERT para no perder datos si los temas ya existen

-- Opción 1: Si quieres CONSERVAR el historial, solo agrega los nuevos temas
INSERT INTO topics (name) VALUES
  ('Liderazgo cercano'),
  ('Resolución táctico-estratégica de problemas'),
  ('Visión transformadora'),
  ('Toma de decisiones ágil y efectiva'),
  ('Cultura de aprendizaje'),
  ('Comunicación'),
  ('Motivación e innovación')
ON CONFLICT DO NOTHING;

-- Ver la lista actualizada de temas
SELECT id, name FROM topics ORDER BY name;

-- NOTA: Si deseas ELIMINAR los temas antiguos y empezar de cero, ejecuta:
-- DELETE FROM topics WHERE name NOT IN (
--   'Liderazgo cercano',
--   'Resolución táctico-estratégica de problemas',
--   'Visión transformadora',
--   'Toma de decisiones ágil y efectiva',
--   'Cultura de aprendizaje',
--   'Comunicación',
--   'Motivación e innovación'
-- );
