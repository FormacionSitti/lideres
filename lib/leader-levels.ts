// Clasificación oficial de líderes (fuente: Excel "líderes.xlsx", SITTI)
// Cada líder tiene dos atributos:
//   - nivel: "tactico" | "estrategico"
//   - tipo:  "formal"  (rol con personas a cargo / líder de equipo)
//            "proceso" (rol sin personas a cargo / líder de proyecto)

export type LeaderLevel = "tactico" | "estrategico"
export type LeaderType = "formal" | "proceso"

interface LeaderInfo {
  nivel: LeaderLevel
  tipo: LeaderType
}

// Roster oficial. La clave se normaliza (mayúsculas, sin acentos) al comparar.
const ROSTER: Record<string, LeaderInfo> = {
  // === ESTRATÉGICOS (todos líder formal) ===
  "ANA CATALINA SOTO CARVAJAL": { nivel: "estrategico", tipo: "formal" },
  "ANDRES BARRENECHE CANO": { nivel: "estrategico", tipo: "formal" },
  "ANDRES ESTEBAN BUITRAGO REYES": { nivel: "estrategico", tipo: "formal" },
  "DANIELA ANDREA ARANGO GOEZ": { nivel: "estrategico", tipo: "formal" },
  "DIANA GIRALDO VELEZ": { nivel: "estrategico", tipo: "formal" },
  "JANIER JOSE TRUJILLO TRUJILLO": { nivel: "estrategico", tipo: "formal" },
  "MONICA PATRICIA RAMIREZ ARBELAEZ": { nivel: "estrategico", tipo: "formal" },

  // === TÁCTICOS ===
  "DANIELA ALZATE MEDINA": { nivel: "tactico", tipo: "formal" },
  "ANA YIRLEY AYALA ASPRILLA": { nivel: "tactico", tipo: "formal" },
  "ASTRID VIVIANA PATIÑO TORRES": { nivel: "tactico", tipo: "formal" },
  "BORIS ARIEL BARRIOS ULLOA": { nivel: "tactico", tipo: "formal" },
  "JUAN CARLOS CASTRILLON SOTO": { nivel: "tactico", tipo: "formal" },
  "JUAN FERNANDO RIOS GARCIA": { nivel: "tactico", tipo: "formal" },
  "JULIAN ESTEBAN ARBOLEDA SALAZAR": { nivel: "tactico", tipo: "formal" },
  "MANUELA COLLANTE RIVERA": { nivel: "tactico", tipo: "formal" },
  "MARIA ALEJANDRA PEREZ GARCIA": { nivel: "tactico", tipo: "formal" },
  "VALENTINA ORTIZ RUIZ": { nivel: "tactico", tipo: "formal" },
  "ALBERTO GOMEZ USUGA": { nivel: "tactico", tipo: "formal" },
  "ALEJANDRA MARIA ORTEGA AMARILES": { nivel: "tactico", tipo: "formal" },
  "CESAR AUGUSTO MAZUERA GALLON": { nivel: "tactico", tipo: "proceso" },
  "VIVIANA MARIA GIRALDO QUINTERO": { nivel: "tactico", tipo: "formal" },
  "VIVIANA MARIA GIRALDO": { nivel: "tactico", tipo: "formal" },
  "EDWIN ALONSO GARCIA HERNANDEZ": { nivel: "tactico", tipo: "formal" },
  "DAVID OLARTE GOMEZ": { nivel: "tactico", tipo: "formal" },
  "ALEJANDRA MADRIGAL MONTOYA": { nivel: "tactico", tipo: "proceso" },
  "DENIS ALEJANDRA ARCILA ROJAS": { nivel: "tactico", tipo: "formal" },
  "LINA MARCELA CASAS RODAS": { nivel: "tactico", tipo: "formal" },
  "MARIA PAULINA RESTREPO BEDOYA": { nivel: "tactico", tipo: "formal" },
  "NATALIA ANDREA ALVAREZ TAMAYO": { nivel: "tactico", tipo: "formal" },
}

function normalize(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
}

// Índice normalizado para búsquedas robustas
const NORMALIZED_ROSTER: Record<string, LeaderInfo> = Object.entries(ROSTER).reduce(
  (acc, [name, info]) => {
    acc[normalize(name)] = info
    return acc
  },
  {} as Record<string, LeaderInfo>,
)

function lookup(name: string): LeaderInfo | null {
  return NORMALIZED_ROSTER[normalize(name)] || null
}

export function getLeaderLevel(name: string): LeaderLevel {
  return lookup(name)?.nivel ?? "tactico"
}

export function getLeaderType(name: string): LeaderType {
  return lookup(name)?.tipo ?? "formal"
}

export const LEVEL_LABELS: Record<LeaderLevel, string> = {
  tactico: "Líder Táctico",
  estrategico: "Líder Estratégico",
}

export const TYPE_LABELS: Record<LeaderType, string> = {
  formal: "Líder formal (con equipo)",
  proceso: "Líder de proceso (proyecto)",
}

// Etiqueta corta para badges
export const TYPE_LABELS_SHORT: Record<LeaderType, string> = {
  formal: "Con equipo",
  proceso: "De proceso",
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

export const TYPE_COLORS: Record<LeaderType, { badge: string }> = {
  formal: { badge: "bg-sky-100 text-sky-700 border-sky-200" },
  proceso: { badge: "bg-amber-100 text-amber-700 border-amber-200" },
}
