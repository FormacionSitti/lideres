-- Script para crear tabla de planes de desarrollo

-- Tabla: development_plans
CREATE TABLE IF NOT EXISTS development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id INTEGER NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'suspended')),
  overall_progress DECIMAL(3, 2) DEFAULT 0,
  observations TEXT,
  created_by VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: development_plan_items
CREATE TABLE IF NOT EXISTS development_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  target_rating DECIMAL(3, 2) NOT NULL,
  current_rating DECIMAL(3, 2) DEFAULT 0,
  progress DECIMAL(3, 2) DEFAULT 0,
  activities TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para mejor performance
CREATE INDEX idx_development_plans_leader ON development_plans(leader_id);
CREATE INDEX idx_development_plans_status ON development_plans(status);
CREATE INDEX idx_development_plan_items_plan ON development_plan_items(plan_id);
CREATE INDEX idx_development_plan_items_topic ON development_plan_items(topic_id);

-- Ver tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'development%';
