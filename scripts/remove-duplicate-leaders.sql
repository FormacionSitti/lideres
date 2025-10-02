-- Eliminar líderes duplicados manteniendo solo uno de cada nombre
-- Este script eliminará los duplicados basándose en el nombre

-- Primero, identificamos los IDs de los duplicados que queremos mantener (los de ID más bajo)
WITH duplicates AS (
  SELECT name, MIN(id) as keep_id
  FROM leaders
  GROUP BY name
  HAVING COUNT(*) > 1
)
-- Luego eliminamos todos los registros excepto el que queremos mantener
DELETE FROM leaders
WHERE id NOT IN (
  SELECT keep_id FROM duplicates
  UNION
  SELECT id FROM leaders
  WHERE name NOT IN (SELECT name FROM duplicates)
);

-- Verificar los líderes después de eliminar duplicados
SELECT * FROM leaders
ORDER BY name;
