-- Agrega columna ratings (JSON) a la tabla followups
-- para almacenar las calificaciones por competencia de cada seguimiento

ALTER TABLE followups
  ADD COLUMN IF NOT EXISTS ratings JSONB DEFAULT '{}'::jsonb;

-- Comentario descriptivo
COMMENT ON COLUMN followups.ratings IS
  'Calificaciones por competencia (topic) en formato { "<topic_id>": <rating 1-5> }';
