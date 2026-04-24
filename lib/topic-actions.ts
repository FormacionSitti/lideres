// Biblioteca de acciones sugeridas para cada tema de liderazgo
// Cada tema tiene acciones organizadas por semana con detalles

export interface TopicAction {
  id: string
  week: number
  title: string
  description: string
  howTo: string[]
  deliverable: string
  keyQuestions?: string[]
}

export interface TopicActionPlan {
  description: string
  actions: TopicAction[]
}

// Normalizar nombre para matching (sin tildes, minusculas)
export function normalizeTopicName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export const TOPIC_ACTIONS: Record<string, TopicActionPlan> = {
  "liderazgo cercano": {
    description: "Fortalecer la conexion con cada miembro del equipo y entender sus necesidades individuales",
    actions: [
      {
        id: "lc-1",
        week: 1,
        title: "Realizar conversaciones uno a uno con cada miembro del equipo (45 min c/u)",
        description: "Entender la perspectiva actual del equipo e identificar barreras especificas",
        howTo: [
          "Reservar sala privada, sin interrupciones",
          "Iniciar con: 'Esta conversacion es para entender mejor'",
          "Tomar notas en formato estructurado",
        ],
        deliverable: "Matriz de insights por persona",
        keyQuestions: [
          "Como percibes mi estilo de liderazgo?",
          "En que momentos te sientes mas conectado con el equipo?",
          "Que necesitas de mi para sentirte mas apoyado?",
        ],
      },
      {
        id: "lc-2",
        week: 1,
        title: "Mapear dinamicas grupales y roles informales del equipo",
        description: "Identificar lideres informales y dinamicas sociales del equipo",
        howTo: [
          "Observar 3 reuniones sin intervenir",
          "Registrar quien habla con quien, quien influye",
          "Identificar lideres informales",
        ],
        deliverable: "Sociograma del equipo",
      },
      {
        id: "lc-3",
        week: 2,
        title: "Identificar momentos criticos donde se rompe la conexion",
        description: "Detectar patrones que afectan la cercania con el equipo",
        howTo: [
          "Revisar historicos de comunicacion",
          "Identificar reuniones con baja participacion",
          "Documentar situaciones de tension",
        ],
        deliverable: "Informe de puntos de ruptura",
      },
      {
        id: "lc-4",
        week: 2,
        title: "Establecer rituales semanales de conexion con el equipo",
        description: "Crear espacios regulares de interaccion cercana",
        howTo: [
          "Programar cafe 1:1 semanal con cada miembro",
          "Iniciar reuniones con check-in personal",
          "Reservar 10 min al final de cada reunion para feedback",
        ],
        deliverable: "Calendario de rituales implementado",
      },
    ],
  },
  "resolucion tactico-estrategica de problemas": {
    description: "Desarrollar capacidad para analizar problemas y generar soluciones efectivas",
    actions: [
      {
        id: "rp-1",
        week: 1,
        title: "Aplicar metodologia de analisis de causa raiz (5 porques) en problemas actuales",
        description: "Identificar causas reales detras de problemas recurrentes",
        howTo: [
          "Seleccionar 3 problemas criticos del equipo",
          "Aplicar la tecnica de los 5 porques",
          "Documentar hallazgos y validar con el equipo",
        ],
        deliverable: "Matriz de causas raiz identificadas",
      },
      {
        id: "rp-2",
        week: 2,
        title: "Crear matriz de priorizacion de problemas (impacto vs esfuerzo)",
        description: "Enfocar recursos en problemas de alto impacto",
        howTo: [
          "Listar todos los problemas identificados",
          "Evaluar cada uno en escala 1-5 en impacto y esfuerzo",
          "Priorizar cuadrante de alto impacto-bajo esfuerzo",
        ],
        deliverable: "Matriz priorizada con 10 problemas",
      },
      {
        id: "rp-3",
        week: 3,
        title: "Disenar plan de accion para top 3 problemas prioritarios",
        description: "Estructurar soluciones con objetivos medibles",
        howTo: [
          "Definir objetivos SMART para cada problema",
          "Asignar responsables y fechas",
          "Establecer metricas de exito",
        ],
        deliverable: "3 planes de accion ejecutables",
      },
      {
        id: "rp-4",
        week: 4,
        title: "Implementar sesiones de resolucion colaborativa con el equipo",
        description: "Involucrar al equipo en la busqueda de soluciones",
        howTo: [
          "Facilitar sesion de brainstorming semanal",
          "Usar tecnicas como design thinking o SCAMPER",
          "Documentar ideas y seleccionar las mejores",
        ],
        deliverable: "Registro de sesiones y soluciones implementadas",
      },
    ],
  },
  "vision transformadora": {
    description: "Construir y comunicar una vision inspiradora que motive al equipo",
    actions: [
      {
        id: "vt-1",
        week: 1,
        title: "Definir vision clara del equipo alineada con objetivos organizacionales",
        description: "Crear declaracion de vision inspiradora y medible",
        howTo: [
          "Revisar vision organizacional",
          "Co-crear con lideres informales",
          "Iterar hasta lograr claridad y conexion emocional",
        ],
        deliverable: "Declaracion de vision del equipo",
      },
      {
        id: "vt-2",
        week: 2,
        title: "Disenar roadmap visual de transformacion a 6-12 meses",
        description: "Traducir la vision en hitos concretos",
        howTo: [
          "Identificar 5-7 hitos clave",
          "Crear representacion visual del roadmap",
          "Definir metricas de avance por hito",
        ],
        deliverable: "Roadmap visual compartido",
      },
      {
        id: "vt-3",
        week: 3,
        title: "Realizar sesion de socializacion y alineacion con el equipo",
        description: "Generar compromiso y entendimiento compartido",
        howTo: [
          "Preparar presentacion dinamica (max 20 min)",
          "Facilitar espacio de preguntas y aportes",
          "Ajustar roadmap segun feedback del equipo",
        ],
        deliverable: "Vision co-creada y validada",
      },
      {
        id: "vt-4",
        week: 4,
        title: "Establecer rituales mensuales de revision de avance hacia la vision",
        description: "Mantener el enfoque y celebrar progresos",
        howTo: [
          "Agendar revision mensual de 1 hora",
          "Revisar hitos alcanzados y ajustar ruta",
          "Celebrar logros con el equipo",
        ],
        deliverable: "Ritual mensual implementado",
      },
    ],
  },
  "toma de decisiones agil y efectiva": {
    description: "Mejorar velocidad y calidad en la toma de decisiones cotidianas",
    actions: [
      {
        id: "td-1",
        week: 1,
        title: "Mapear tipos de decisiones que toma el lider diariamente",
        description: "Clasificar decisiones por urgencia e impacto",
        howTo: [
          "Registrar por 1 semana todas las decisiones",
          "Clasificar por matriz de Eisenhower",
          "Identificar cuellos de botella",
        ],
        deliverable: "Inventario de decisiones semanal",
      },
      {
        id: "td-2",
        week: 2,
        title: "Implementar marco de delegacion por tipo de decision",
        description: "Distribuir decisiones segun niveles de autonomia",
        howTo: [
          "Definir 4 niveles de delegacion",
          "Asignar tipos de decisiones a cada nivel",
          "Comunicar al equipo los limites de autonomia",
        ],
        deliverable: "Matriz de delegacion documentada",
      },
      {
        id: "td-3",
        week: 3,
        title: "Aplicar marcos de decision rapida en situaciones operativas",
        description: "Agilizar decisiones de alto volumen y bajo riesgo",
        howTo: [
          "Usar regla 80/20 para decisiones operativas",
          "Establecer limite de tiempo para decidir",
          "Documentar aprendizajes de decisiones erradas",
        ],
        deliverable: "Bitacora de decisiones tomadas",
      },
      {
        id: "td-4",
        week: 4,
        title: "Realizar retrospectivas de decisiones clave del mes",
        description: "Aprender de decisiones tomadas y mejorar el proceso",
        howTo: [
          "Seleccionar 5 decisiones relevantes del mes",
          "Analizar proceso, resultado y aprendizajes",
          "Ajustar marcos de decision segun hallazgos",
        ],
        deliverable: "Informe de retrospectiva mensual",
      },
    ],
  },
  "cultura de aprendizaje": {
    description: "Fomentar un ambiente donde el aprendizaje continuo sea valorado",
    actions: [
      {
        id: "ca-1",
        week: 1,
        title: "Diagnosticar habitos de aprendizaje actuales del equipo",
        description: "Entender como aprende el equipo hoy",
        howTo: [
          "Aplicar encuesta de habitos de aprendizaje",
          "Entrevistar a 5 miembros clave",
          "Identificar barreras al aprendizaje",
        ],
        deliverable: "Diagnostico de cultura de aprendizaje",
      },
      {
        id: "ca-2",
        week: 2,
        title: "Disenar ritual semanal de aprendizaje compartido",
        description: "Crear espacio fijo para compartir conocimiento",
        howTo: [
          "Agendar 1 hora semanal de 'learning friday'",
          "Rotar responsables de presentar un tema",
          "Documentar aprendizajes en wiki del equipo",
        ],
        deliverable: "Ritual implementado por 4 semanas",
      },
      {
        id: "ca-3",
        week: 3,
        title: "Implementar sistema de retrospectivas y lecciones aprendidas",
        description: "Capturar aprendizajes de proyectos y procesos",
        howTo: [
          "Facilitar retrospectiva al cierre de cada sprint/proyecto",
          "Usar formato start-stop-continue",
          "Publicar lecciones en espacio compartido",
        ],
        deliverable: "Banco de lecciones aprendidas",
      },
      {
        id: "ca-4",
        week: 4,
        title: "Promover desarrollo individual con planes personalizados",
        description: "Apoyar el crecimiento profesional de cada miembro",
        howTo: [
          "Sesion 1:1 de plan de desarrollo individual",
          "Identificar 2-3 objetivos de aprendizaje",
          "Asignar mentor o recursos para cada uno",
        ],
        deliverable: "Planes de desarrollo individuales firmados",
      },
    ],
  },
  "comunicacion": {
    description: "Mejorar la claridad y efectividad en la comunicacion con el equipo",
    actions: [
      {
        id: "co-1",
        week: 1,
        title: "Auditar canales y frecuencia de comunicacion actual",
        description: "Identificar sobrecarga o vacios de comunicacion",
        howTo: [
          "Mapear todos los canales usados",
          "Evaluar efectividad de cada uno",
          "Identificar redundancias y gaps",
        ],
        deliverable: "Matriz de canales de comunicacion",
      },
      {
        id: "co-2",
        week: 2,
        title: "Establecer protocolos de comunicacion por tipo de mensaje",
        description: "Definir que canal usar para cada tipo de informacion",
        howTo: [
          "Definir protocolo para urgencias, informes, decisiones",
          "Documentar estandares de comunicacion",
          "Socializar con el equipo",
        ],
        deliverable: "Protocolo de comunicacion publicado",
      },
      {
        id: "co-3",
        week: 3,
        title: "Practicar escucha activa en reuniones uno a uno",
        description: "Mejorar calidad de escucha y comprension",
        howTo: [
          "Usar tecnica de parafraseo en conversaciones",
          "Tomar notas para devolver puntos clave",
          "Validar entendimiento antes de responder",
        ],
        deliverable: "Feedback de mejora en escucha",
      },
      {
        id: "co-4",
        week: 4,
        title: "Solicitar feedback 360 sobre estilo de comunicacion",
        description: "Identificar puntos ciegos en comunicacion",
        howTo: [
          "Disenar encuesta anonima de 10 preguntas",
          "Compartir con pares, equipo y jefe",
          "Analizar resultados y crear plan de mejora",
        ],
        deliverable: "Informe de feedback 360",
      },
    ],
  },
  "motivacion e innovacion": {
    description: "Energizar al equipo y promover ideas innovadoras",
    actions: [
      {
        id: "mi-1",
        week: 1,
        title: "Diagnosticar factores motivacionales actuales del equipo",
        description: "Entender que mueve a cada miembro del equipo",
        howTo: [
          "Aplicar modelo de motivadores intrinsecos",
          "Realizar conversaciones individuales de motivacion",
          "Mapear drivers de cada persona",
        ],
        deliverable: "Mapa de motivadores del equipo",
      },
      {
        id: "mi-2",
        week: 2,
        title: "Implementar sistema de reconocimiento semanal",
        description: "Visibilizar y celebrar contribuciones del equipo",
        howTo: [
          "Definir criterios de reconocimiento",
          "Agendar espacio de reconocimiento en reunion semanal",
          "Rotar entre reconocimiento de pares y de lider",
        ],
        deliverable: "Sistema de reconocimiento en marcha",
      },
      {
        id: "mi-3",
        week: 3,
        title: "Facilitar taller de ideacion e innovacion con el equipo",
        description: "Generar ideas innovadoras para retos del equipo",
        howTo: [
          "Seleccionar 1-2 retos especificos",
          "Usar metodologias como design thinking o SCAMPER",
          "Priorizar 3 ideas para pilotear",
        ],
        deliverable: "3 ideas priorizadas para implementacion",
      },
      {
        id: "mi-4",
        week: 4,
        title: "Implementar piloto de innovacion con metricas de exito",
        description: "Probar rapido y aprender de una iniciativa concreta",
        howTo: [
          "Definir alcance del piloto (2-3 semanas)",
          "Establecer metricas de exito claras",
          "Realizar seguimiento semanal",
        ],
        deliverable: "Informe de resultados del piloto",
      },
    ],
  },
}

// Obtener acciones para un tema con matching normalizado
export function getActionsForTopic(topicName: string): TopicActionPlan | null {
  const normalized = normalizeTopicName(topicName)

  // Match exacto
  if (TOPIC_ACTIONS[normalized]) {
    return TOPIC_ACTIONS[normalized]
  }

  // Match parcial (contiene palabras clave)
  for (const [key, plan] of Object.entries(TOPIC_ACTIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return plan
    }
  }

  return null
}

// Plan generico si no se encuentra el tema
export function getGenericActionPlan(topicName: string): TopicActionPlan {
  return {
    description: `Fortalecer competencias en ${topicName}`,
    actions: [
      {
        id: "gen-1",
        week: 1,
        title: `Diagnostico inicial de ${topicName}`,
        description: "Evaluar situacion actual e identificar oportunidades",
        howTo: [
          "Analizar el estado actual del tema",
          "Identificar brechas y oportunidades",
          "Documentar hallazgos",
        ],
        deliverable: "Informe de diagnostico",
      },
      {
        id: "gen-2",
        week: 2,
        title: `Disenar plan de accion para ${topicName}`,
        description: "Estructurar objetivos y actividades",
        howTo: [
          "Definir objetivos SMART",
          "Listar actividades concretas",
          "Asignar tiempos y recursos",
        ],
        deliverable: "Plan de accion documentado",
      },
      {
        id: "gen-3",
        week: 3,
        title: `Implementar acciones iniciales en ${topicName}`,
        description: "Ejecutar las primeras acciones del plan",
        howTo: [
          "Iniciar con quick wins",
          "Documentar avances",
          "Ajustar segun feedback",
        ],
        deliverable: "Registro de implementacion",
      },
      {
        id: "gen-4",
        week: 4,
        title: `Evaluar y ajustar plan de ${topicName}`,
        description: "Medir avance y ajustar rumbo",
        howTo: [
          "Comparar contra objetivos iniciales",
          "Identificar ajustes necesarios",
          "Planear siguientes pasos",
        ],
        deliverable: "Informe de avance y ajustes",
      },
    ],
  }
}
