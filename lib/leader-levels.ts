// Clasificación de líderes por nivel organizacional
// Táctico = líderes operativos / Estratégico = gerentes

export type LeaderLevel = "tactico" | "estrategico"

const TACTICOS = [
  "ALEJANDRA MARIA ORTEGA AMARILES",
  "ANA YIRLEY AYALA ASPRILLA",
  "ASTRID VIVIANA PATIÑO TORRES",
  "BORIS ARIEL BARRIOS ULLOA",
  "CESAR AUGUSTO MAZUERA GALLON",
  "DANIELA ALZATE MEDINA",
  "DAVID OLARTE GOMEZ",
  "DENIS ALEJANDRA ARCILA ROJAS",
  "EDWIN ALONSO GARCIA HERNANDEZ",
  "JUAN CARLOS CASTRILLON SOTO",
  "JUAN FERNANDO RIOS GARCIA",
  "JULIAN ESTEBAN ARBOLEDA SALAZAR",
  "LINA MARCELA CASAS RODAS",
  "MANUELA COLLANTE RIVERA",
  "MARIA ALEJANDRA PEREZ GARCIA",
  "MARIA PAULINA RESTREPO BEDOYA",
  "NATALIA ANDREA ALVAREZ TAMAYO",
  "VALENTINA ORTIZ RUIZ",
  "VIVIANA MARIA GIRALDO QUINTERO",
  "ALBERTO GOMEZ USUGA",
  "ALBERTO GÓMEZ USUGA",
]

const ESTRATEGICOS = [
  "ANA CATALINA SOTO CARVAJAL",
  "ANDRES BARRENECHE CANO",
  "ANDRES ESTEBAN BUITRAGO REYES",
  "DANIELA ANDREA ARANGO GOEZ",
  "DIANA GIRALDO VELEZ",
  "JANIER JOSE TRUJILLO TRUJILLO",
  "MONICA PATRICIA RAMIREZ ARBELAEZ",
]

function normalize(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

export function getLeaderLevel(name: string): LeaderLevel {
  const n = normalize(name)
  if (ESTRATEGICOS.some((s) => normalize(s) === n)) return "estrategico"
  if (TACTICOS.some((s) => normalize(s) === n)) return "tactico"
  // Por defecto táctico si no se encuentra en ninguna lista
  return "tactico"
}

export const LEVEL_LABELS: Record<LeaderLevel, string> = {
  tactico: "Líder Táctico",
  estrategico: "Líder Estratégico",
}

export const LEVEL_COLORS: Record<LeaderLevel, { bg: string; text: string; border: string; badge: string }> = {
  tactico: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  estrategico: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
  },
}
