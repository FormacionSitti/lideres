-- Tabla para guardar:
--  1. La autoevaluacion inicial del lider (assessment_type = 'initial')
--  2. El snapshot del radar al finalizar el proceso (assessment_type = 'final')
-- Solo puede haber una fila por (leader_id, assessment_type).

CREATE TABLE IF NOT EXISTS leader_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id integer NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  assessment_type text NOT NULL CHECK (assessment_type IN ('initial', 'final')),
  liderazgo_cercano numeric(3,2) CHECK (liderazgo_cercano IS NULL OR (liderazgo_cercano >= 1 AND liderazgo_cercano <= 5)),
  resolucion_problemas numeric(3,2) CHECK (resolucion_problemas IS NULL OR (resolucion_problemas >= 1 AND resolucion_problemas <= 5)),
  vision_transformadora numeric(3,2) CHECK (vision_transformadora IS NULL OR (vision_transformadora >= 1 AND vision_transformadora <= 5)),
  toma_decisiones numeric(3,2) CHECK (toma_decisiones IS NULL OR (toma_decisiones >= 1 AND toma_decisiones <= 5)),
  cultura_aprendizaje numeric(3,2) CHECK (cultura_aprendizaje IS NULL OR (cultura_aprendizaje >= 1 AND cultura_aprendizaje <= 5)),
  comunicacion numeric(3,2) CHECK (comunicacion IS NULL OR (comunicacion >= 1 AND comunicacion <= 5)),
  motivacion_innovacion numeric(3,2) CHECK (motivacion_innovacion IS NULL OR (motivacion_innovacion >= 1 AND motivacion_innovacion <= 5)),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (leader_id, assessment_type)
);

CREATE INDEX IF NOT EXISTS idx_leader_assessments_leader ON leader_assessments(leader_id);

-- Trigger para mantener updated_at fresco
CREATE OR REPLACE FUNCTION set_leader_assessments_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leader_assessments_updated_at ON leader_assessments;
CREATE TRIGGER trg_leader_assessments_updated_at
BEFORE UPDATE ON leader_assessments
FOR EACH ROW EXECUTE FUNCTION set_leader_assessments_updated_at();
