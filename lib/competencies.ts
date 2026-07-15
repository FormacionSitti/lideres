// Definiciones de las competencias SITTI.
// Fuente: documento "Competencias táctico estratégicos" (competencias 7 a 11).
// Las transversales Comunicación y Cultura de aprendizaje quedan pendientes de
// definición oficial (el usuario las compartirá).
//
// La clave (key) coincide con la columna de la tabla leader_assessments y con
// las dimensiones del radar. El campo `aliases` permite resolver la definición
// a partir del nombre del tema (topics.name) sin importar acentos o el nombre
// anterior de la competencia.

export interface Competency {
  key: string
  label: string
  definition: string
  whyMatters?: string
  pending?: boolean
  aliases: string[]
}

export const COMPETENCIES: Competency[] = [
  {
    key: "liderazgo_cercano",
    label: "Liderazgo consciente",
    definition:
      "Es la capacidad de guiar al equipo desde la cercanía, la autenticidad y el autoconocimiento, generando confianza, dirección clara y acompañamiento constante. Implica conocerse a sí mismo para conocer mejor a los demás.",
    whyMatters:
      "El Modelo Evolucionar de Sitti tiene en el liderazgo consciente su piedra angular: un líder que se conoce y guía con intención multiplica el desempeño y el bienestar del equipo.",
    aliases: ["liderazgo consciente", "liderazgo cercano", "liderazgo"],
  },
  {
    key: "resolucion_problemas",
    label: "Resolución de problemas",
    definition:
      "Es la habilidad para analizar situaciones complejas, identificar causas raíz y tomar decisiones que no solo resuelven el momento, sino que generan soluciones sostenibles, previniendo la recurrencia y mejorando el proceso a futuro.",
    whyMatters:
      "En una operación crítica como la de Sitti, resolver bien y rápido con visión de largo plazo es condición de excelencia operativa y estratégica.",
    aliases: [
      "resolucion de problemas",
      "resolucion tactico-estrategica de problemas",
      "resolucion tactico estrategica de problemas",
      "resolucion problemas",
    ],
  },
  {
    key: "vision_transformadora",
    label: "Visión transformadora",
    definition:
      "Es la capacidad de identificar oportunidades de evolución y generar cambios que impulsen el crecimiento, la eficiencia y la sostenibilidad de procesos, equipos y resultados, cuestionando el “siempre se ha hecho así” y orientando a otros hacia nuevas formas de hacer las cosas.",
    whyMatters:
      "El futuro de la movilidad urbana exige que Sitti evolucione constantemente. Esta competencia es el motor de la transformación.",
    aliases: ["vision transformadora", "vision"],
  },
  {
    key: "motivacion_innovacion",
    label: "Innovación con propósito",
    definition:
      "Es la capacidad de impulsar nuevas ideas, enfoques y soluciones que generen valor real para el negocio, los equipos y la experiencia organizacional, movilizando el cambio desde una intención clara, alineada con el propósito de Sitti.",
    whyMatters:
      "Sitti necesita personas que innoven con sentido: que no solo tengan ideas, sino que las lleven a la acción y generen impacto medible.",
    aliases: ["innovacion con proposito", "motivacion e innovacion", "motivacion innovacion", "innovacion"],
  },
  {
    key: "toma_decisiones",
    label: "Toma de decisiones",
    definition:
      "Es la capacidad de decidir de forma oportuna, informada y coherente, evaluando opciones, riesgos e impactos, y asumiendo la responsabilidad sobre las decisiones tomadas, incluso en escenarios de presión o incertidumbre.",
    whyMatters:
      "En la operación de Sitti la indecisión tiene costos reales. Decisiones de calidad y a tiempo garantizan continuidad del servicio, confianza del cliente y bienestar del equipo.",
    aliases: ["toma de decisiones", "toma de decisiones agil y efectiva", "decisiones"],
  },
  {
    key: "comunicacion",
    label: "Comunicación",
    definition: "Definición pendiente por confirmar (competencia transversal).",
    pending: true,
    aliases: ["comunicacion"],
  },
  {
    key: "cultura_aprendizaje",
    label: "Cultura de aprendizaje",
    definition: "Definición pendiente por confirmar (competencia transversal).",
    pending: true,
    aliases: ["cultura de aprendizaje", "aprendizaje"],
  },
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Resuelve una competencia a partir de un nombre de tema/label o de su key.
export function findCompetency(nameOrKey: string): Competency | null {
  const n = normalize(nameOrKey)
  for (const c of COMPETENCIES) {
    if (c.key === nameOrKey) return c
    if (normalize(c.label) === n) return c
    if (c.aliases.some((a) => normalize(a) === n)) return c
  }
  // Coincidencia parcial (por si el tema tiene nombre ampliado)
  for (const c of COMPETENCIES) {
    const labelN = normalize(c.label)
    if (n.includes(labelN) || labelN.includes(n)) return c
    if (c.aliases.some((a) => n.includes(normalize(a)) || normalize(a).includes(n))) return c
  }
  return null
}

export function getCompetencyDefinition(nameOrKey: string): string | null {
  return findCompetency(nameOrKey)?.definition ?? null
}
