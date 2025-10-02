-- Agregar nuevos líderes a la tabla leaders
-- Este script no afectará los registros existentes

INSERT INTO leaders (name)
VALUES 
  ('Camilo Hernández Aristizabal'),
  ('Natalia Andrea Álvarez Tamayo')
ON CONFLICT DO NOTHING;

-- Verificar los líderes agregados
SELECT * FROM leaders
ORDER BY name;
