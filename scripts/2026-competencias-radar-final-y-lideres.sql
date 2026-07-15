-- Migración aplicada el 2026-07 (SITTI)
-- 1. Renombre de competencias (topics) según el nuevo modelo de competencias
-- 2. Ampliación del constraint assessment_type para el tercer radar ("closing")
-- 3. Depuración del listado de líderes
-- Ya ejecutado en Supabase. Se conserva como referencia/repetible.

-- === 1. Renombre de competencias ===
UPDATE topics SET name = 'Liderazgo consciente'      WHERE name = 'Liderazgo cercano';
UPDATE topics SET name = 'Resolucion de problemas'   WHERE name = 'Resolucion tactico-estrategica de problemas';
UPDATE topics SET name = 'Innovacion con proposito'  WHERE name = 'Motivacion e innovacion';
UPDATE topics SET name = 'Toma de decisiones'        WHERE name = 'Toma de decisiones agil y efectiva';
-- Comunicacion, Cultura de aprendizaje y Vision transformadora se conservan igual.

-- === 2. Tercer radar: evaluación final manual (assessment_type = 'closing') ===
ALTER TABLE leader_assessments DROP CONSTRAINT IF EXISTS leader_assessments_assessment_type_check;
ALTER TABLE leader_assessments ADD CONSTRAINT leader_assessments_assessment_type_check
  CHECK (assessment_type IN ('initial','final','closing'));
-- Semántica de los radares:
--   initial  → Radar Inicial (autoevaluación)
--   final    → Radar de Acompañamiento (promedio de seguimientos al cierre)
--   closing  → Radar Final (evaluación de cierre manual)

-- === 3. Depuración de líderes ===
-- Eliminados: Andrés Durango, Victor Florez, Catalina Arenas
DELETE FROM followup_topics WHERE followup_id IN (
  SELECT id FROM followups WHERE leader_id IN (
    SELECT id FROM leaders WHERE name ILIKE '%Durango%' OR name ILIKE '%Victor%Florez%' OR name ILIKE '%Catalina Arenas%'
  )
);
DELETE FROM followups WHERE leader_id IN (
  SELECT id FROM leaders WHERE name ILIKE '%Durango%' OR name ILIKE '%Victor%Florez%' OR name ILIKE '%Catalina Arenas%'
);
DELETE FROM leader_assessments WHERE leader_id IN (
  SELECT id FROM leaders WHERE name ILIKE '%Durango%' OR name ILIKE '%Victor%Florez%' OR name ILIKE '%Catalina Arenas%'
);
DELETE FROM leaders WHERE name ILIKE '%Durango%' OR name ILIKE '%Victor%Florez%' OR name ILIKE '%Catalina Arenas%';

-- Agregado: Alejandra Madrigal Montoya (táctico, líder de proceso) del roster oficial
INSERT INTO leaders (name) VALUES ('ALEJANDRA MADRIGAL MONTOYA') ON CONFLICT DO NOTHING;
