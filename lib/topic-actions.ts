// Biblioteca de acciones sugeridas alineadas con lo que mide cada tema de liderazgo
// Cada accion esta organizada por semana con pasos, entregables y preguntas clave

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
  measures: string
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
  // 1. LIDERAZGO CERCANO - Mide la gestion del lider con el equipo
  "liderazgo cercano": {
    measures: "Gestion del lider con el equipo",
    description: "Fortalecer la conexion individual con cada miembro del equipo y mejorar la gestion cercana",
    actions: [
      {
        id: "lc-1",
        week: 1,
        title: "Realizar conversaciones uno a uno individuales con cada miembro (45 min c/u)",
        description: "Entender la perspectiva actual de cada miembro e identificar barreras especificas",
        howTo: [
          "Reservar sala privada, sin interrupciones",
          "Iniciar: 'Esta conversacion es para entender mejor'",
          "Tomar notas en formato estructurado",
        ],
        deliverable: "Matriz de insights por persona",
        keyQuestions: [
          "¿Como percibes mi estilo de liderazgo?",
          "¿En que momentos te sientes mas conectado?",
          "¿Que necesitas de mi para sentirte mas apoyado?",
        ],
      },
      {
        id: "lc-2",
        week: 1,
        title: "Mapear dinamicas grupales y roles informales del equipo",
        description: "Entender la estructura social real del equipo mas alla del organigrama",
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
        title: "Establecer rutina de check-ins semanales con el equipo",
        description: "Crear un ritmo constante de conexion y retroalimentacion",
        howTo: [
          "Agendar 15 min semanales con cada colaborador",
          "Preparar 3 preguntas abiertas diferentes cada semana",
          "Documentar avances y obstaculos identificados",
        ],
        deliverable: "Calendario de check-ins y registro de temas",
        keyQuestions: [
          "¿Que esta funcionando bien esta semana?",
          "¿Donde sientes que necesitas mas apoyo?",
        ],
      },
      {
        id: "lc-4",
        week: 3,
        title: "Acompañar en terreno a cada miembro en sus tareas clave",
        description: "Mostrar presencia activa y entender el trabajo diario del equipo",
        howTo: [
          "Identificar una tarea critica de cada miembro",
          "Acompañar sin dirigir, solo observar y aprender",
          "Dar feedback constructivo al final",
        ],
        deliverable: "Bitacora de acompañamiento y observaciones",
      },
      {
        id: "lc-5",
        week: 4,
        title: "Implementar rituales de reconocimiento individual",
        description: "Hacer visible el reconocimiento especifico y personalizado",
        howTo: [
          "Reconocer logros especificos en privado y publico",
          "Usar nombre, accion concreta e impacto",
          "Variar el formato: mensaje, reunion, nota escrita",
        ],
        deliverable: "Registro semanal de reconocimientos realizados",
      },
    ],
  },

  // 2. RESOLUCION TACTICO-ESTRATEGICA DE PROBLEMAS - Mide la capacidad de resolver problemas estructurales
  "resolucion tactico-estrategica de problemas": {
    measures: "Capacidad de resolver problemas estructurales",
    description: "Desarrollar pensamiento sistemico para identificar y resolver causas raiz de problemas",
    actions: [
      {
        id: "rt-1",
        week: 1,
        title: "Identificar 3 problemas estructurales recurrentes del area",
        description: "Distinguir problemas sintomaticos de problemas estructurales",
        howTo: [
          "Revisar indicadores y reclamos de los ultimos 3 meses",
          "Agrupar por patrones recurrentes",
          "Priorizar por impacto en el negocio",
        ],
        deliverable: "Lista priorizada de 3 problemas estructurales",
        keyQuestions: [
          "¿Que problemas se repiten constantemente?",
          "¿Cuales afectan multiples areas o procesos?",
        ],
      },
      {
        id: "rt-2",
        week: 2,
        title: "Aplicar analisis de causa raiz con la tecnica 5 Por Ques",
        description: "Llegar al origen real del problema, no solo a sus sintomas",
        howTo: [
          "Tomar un problema prioritario",
          "Preguntar 5 veces '¿por que?' a cada respuesta",
          "Validar hipotesis con datos y evidencia",
        ],
        deliverable: "Documento de analisis de causa raiz con evidencia",
      },
      {
        id: "rt-3",
        week: 3,
        title: "Diseñar plan de accion tactico-estrategico",
        description: "Combinar acciones de corto plazo (tacticas) con cambios estructurales (estrategicos)",
        howTo: [
          "Separar acciones en: mitigacion inmediata vs solucion definitiva",
          "Asignar responsables, fechas y recursos",
          "Definir metricas de exito claras",
        ],
        deliverable: "Plan de accion con roadmap tactico y estrategico",
      },
      {
        id: "rt-4",
        week: 5,
        title: "Implementar metodologia de resolucion estructurada",
        description: "Estandarizar el enfoque de resolucion de problemas en el equipo",
        howTo: [
          "Definir un framework: A3, PDCA, DMAIC u otro",
          "Capacitar al equipo en el uso del framework",
          "Aplicarlo en los proximos problemas que surjan",
        ],
        deliverable: "Framework documentado y equipo capacitado",
      },
      {
        id: "rt-5",
        week: 7,
        title: "Revisar resultados y ajustar estrategia",
        description: "Medir el impacto de las soluciones implementadas y refinar el enfoque",
        howTo: [
          "Comparar indicadores antes vs despues",
          "Identificar que funciono y que no",
          "Ajustar el plan con base en los aprendizajes",
        ],
        deliverable: "Informe de impacto y plan ajustado",
      },
    ],
  },

  // 3. VISION TRANSFORMADORA - Mide la capacidad de evolucionar y mejorar
  "vision transformadora": {
    measures: "Capacidad de evolucionar y mejorar",
    description: "Construir y comunicar una vision de futuro que inspire transformacion en el equipo",
    actions: [
      {
        id: "vt-1",
        week: 1,
        title: "Definir vision a 12 meses del equipo",
        description: "Crear una imagen clara y ambiciosa del futuro deseado",
        howTo: [
          "Responder: ¿donde queremos estar en 12 meses?",
          "Describir de forma concreta y medible",
          "Conectar con la vision organizacional",
        ],
        deliverable: "Documento de vision a 12 meses",
        keyQuestions: [
          "¿Que resultados queremos lograr?",
          "¿Como se veria el exito?",
          "¿Que impacto tendremos en la organizacion?",
        ],
      },
      {
        id: "vt-2",
        week: 2,
        title: "Identificar areas de oportunidad y mejora continua",
        description: "Detectar donde hay potencial de evolucion no aprovechado",
        howTo: [
          "Hacer benchmarking con referentes externos",
          "Mapear practicas actuales vs mejores practicas",
          "Priorizar oportunidades por impacto y factibilidad",
        ],
        deliverable: "Matriz de oportunidades priorizadas",
      },
      {
        id: "vt-3",
        week: 3,
        title: "Comunicar la vision al equipo en sesion inspiradora",
        description: "Generar alineamiento y entusiasmo con el futuro propuesto",
        howTo: [
          "Preparar narrativa clara con imagenes y ejemplos",
          "Abrir espacio para preguntas y aportes",
          "Recolectar compromisos individuales",
        ],
        deliverable: "Sesion de vision realizada y compromisos documentados",
      },
      {
        id: "vt-4",
        week: 5,
        title: "Lanzar iniciativa de transformacion piloto",
        description: "Materializar la vision en una iniciativa concreta de cambio",
        howTo: [
          "Elegir un proceso o area como piloto",
          "Definir alcance, equipo y metricas",
          "Ejecutar con iteraciones rapidas",
        ],
        deliverable: "Iniciativa piloto en ejecucion con primeros resultados",
      },
      {
        id: "vt-6",
        week: 8,
        title: "Revisar progreso de la vision y ajustar rumbo",
        description: "Evaluar avances y hacer correcciones de curso necesarias",
        howTo: [
          "Medir avance vs vision original",
          "Identificar obstaculos y facilitadores",
          "Ajustar objetivos o tacticas segun contexto",
        ],
        deliverable: "Informe de avance y vision actualizada",
      },
    ],
  },

  // 4. TOMA DE DECISIONES AGIL Y EFECTIVA - Mide la rapidez y criterio en decisiones
  "toma de decisiones agil y efectiva": {
    measures: "Rapidez y criterio en decisiones",
    description: "Mejorar la velocidad y calidad de las decisiones que toma el lider y su equipo",
    actions: [
      {
        id: "td-1",
        week: 1,
        title: "Mapear las decisiones recurrentes del area",
        description: "Clasificar las decisiones por tipo, frecuencia e impacto",
        howTo: [
          "Listar decisiones tomadas en las ultimas 4 semanas",
          "Clasificar por reversibilidad y urgencia",
          "Identificar cuellos de botella en la toma de decisiones",
        ],
        deliverable: "Matriz de decisiones clasificadas",
      },
      {
        id: "td-2",
        week: 2,
        title: "Definir niveles de delegacion de decisiones",
        description: "Establecer que decide el lider, que decide el equipo y que se consulta",
        howTo: [
          "Usar matriz RACI o niveles 1-5 de delegacion",
          "Comunicar claramente al equipo",
          "Documentar criterios para cada tipo de decision",
        ],
        deliverable: "Documento de niveles de decision por tipo",
      },
      {
        id: "td-3",
        week: 3,
        title: "Implementar framework de decision rapida",
        description: "Usar un metodo estructurado para acelerar decisiones sin perder calidad",
        howTo: [
          "Adoptar DACI, RAPID o un framework similar",
          "Aplicarlo en las proximas 5 decisiones importantes",
          "Medir tiempo desde problema hasta decision",
        ],
        deliverable: "Framework implementado y metrica de tiempo de decision",
        keyQuestions: [
          "¿Cual es la decision que hay que tomar?",
          "¿Que datos minimos necesito para decidir?",
          "¿Cual es el costo de no decidir hoy?",
        ],
      },
      {
        id: "td-4",
        week: 5,
        title: "Crear ritual de revision de decisiones pasadas",
        description: "Aprender de las decisiones tomadas para mejorar el criterio",
        howTo: [
          "Revisar mensualmente 3 decisiones importantes",
          "Evaluar: ¿fue correcta? ¿se tomo a tiempo? ¿que aprendimos?",
          "Documentar aprendizajes en bitacora de decisiones",
        ],
        deliverable: "Bitacora mensual de decisiones con aprendizajes",
      },
      {
        id: "td-5",
        week: 7,
        title: "Empoderar al equipo para decisiones autonomas",
        description: "Aumentar la capacidad del equipo para decidir sin el lider",
        howTo: [
          "Delegar formalmente 3 tipos de decisiones al equipo",
          "Acompañar en las primeras para dar seguridad",
          "Retirar gradualmente la supervision",
        ],
        deliverable: "Registro de decisiones delegadas y tomadas por el equipo",
      },
    ],
  },

  // 5. CULTURA DE APRENDIZAJE - Mide el aprendizaje a nivel de equipo
  "cultura de aprendizaje": {
    measures: "Aprendizaje a nivel de equipo",
    description: "Construir habitos y espacios para que el equipo aprenda continuamente",
    actions: [
      {
        id: "ca-1",
        week: 1,
        title: "Implementar retrospectivas quincenales del equipo",
        description: "Crear espacio estructurado para reflexionar sobre aprendizajes",
        howTo: [
          "Agendar 1 hora cada 2 semanas",
          "Usar formato: que funciono, que no, que mejorar",
          "Capturar aprendizajes en documento compartido",
        ],
        deliverable: "Calendario de retrospectivas y bitacora de aprendizajes",
      },
      {
        id: "ca-2",
        week: 2,
        title: "Crear banco de lecciones aprendidas del equipo",
        description: "Sistematizar el conocimiento que genera el equipo dia a dia",
        howTo: [
          "Definir plantilla: contexto, accion, resultado, aprendizaje",
          "Designar responsable de curaduria",
          "Compartir un aprendizaje destacado cada semana",
        ],
        deliverable: "Banco de lecciones con al menos 10 entradas iniciales",
      },
      {
        id: "ca-3",
        week: 3,
        title: "Establecer plan de desarrollo individual por persona",
        description: "Conectar el aprendizaje con los objetivos de carrera de cada miembro",
        howTo: [
          "Conversar con cada miembro sobre sus intereses",
          "Identificar 2-3 areas de desarrollo por persona",
          "Asignar retos, mentorias o formacion",
        ],
        deliverable: "Plan de desarrollo individual firmado por cada miembro",
      },
      {
        id: "ca-4",
        week: 5,
        title: "Realizar sesiones de conocimiento cruzado",
        description: "Facilitar que el equipo aprenda de sus propios miembros",
        howTo: [
          "Cada miembro presenta un tema que domine (30 min)",
          "Incluir casos practicos y preguntas",
          "Grabar y archivar para consulta futura",
        ],
        deliverable: "Ciclo de sesiones de conocimiento realizado",
      },
      {
        id: "ca-5",
        week: 6,
        title: "Celebrar errores como oportunidades de aprendizaje",
        description: "Cambiar la cultura del error de culpa a aprendizaje",
        howTo: [
          "Compartir abiertamente errores propios primero",
          "Pedir al equipo que comparta errores y aprendizajes",
          "Evitar buscar culpables, enfocarse en causas y soluciones",
        ],
        deliverable: "Ritual de 'error de la semana' implementado",
        keyQuestions: [
          "¿Que paso y por que?",
          "¿Que aprendimos de esto?",
          "¿Que haremos diferente la proxima vez?",
        ],
      },
    ],
  },

  // 6. COMUNICACION - Mide la alineacion estrategica del equipo
  comunicacion: {
    measures: "Alineacion estrategica del equipo",
    description: "Garantizar que todo el equipo comparte la misma direccion estrategica y prioridades",
    actions: [
      {
        id: "co-1",
        week: 1,
        title: "Diagnosticar el nivel de alineacion actual del equipo",
        description: "Identificar brechas entre lo que el lider comunica y lo que el equipo entiende",
        howTo: [
          "Preguntar a cada miembro: ¿cuales son las 3 prioridades del area?",
          "Comparar respuestas para detectar divergencias",
          "Identificar puntos ciegos en la comunicacion",
        ],
        deliverable: "Informe de diagnostico de alineacion",
      },
      {
        id: "co-2",
        week: 2,
        title: "Definir mensajes clave y narrativa estrategica",
        description: "Crear una narrativa consistente sobre hacia donde va el equipo y por que",
        howTo: [
          "Redactar 3-5 mensajes clave en lenguaje simple",
          "Conectar cada mensaje con objetivos organizacionales",
          "Preparar ejemplos y datos que los respalden",
        ],
        deliverable: "Documento de narrativa estrategica con mensajes clave",
      },
      {
        id: "co-3",
        week: 3,
        title: "Establecer reunion semanal de alineacion estrategica",
        description: "Crear ritual recurrente para mantener al equipo alineado",
        howTo: [
          "Agendar 30 min fijos cada semana",
          "Agenda: prioridades, avances, obstaculos, decisiones",
          "Documentar y compartir acuerdos despues",
        ],
        deliverable: "Reunion semanal en calendario y actas compartidas",
      },
      {
        id: "co-4",
        week: 5,
        title: "Mejorar la comunicacion escrita del equipo",
        description: "Elevar la calidad y claridad de la comunicacion asincrona",
        howTo: [
          "Establecer estandares: asunto claro, contexto, accion",
          "Usar bullets y negritas para destacar lo clave",
          "Revisar antes de enviar: ¿se entiende sin mi?",
        ],
        deliverable: "Guia de comunicacion escrita del equipo",
      },
      {
        id: "co-5",
        week: 7,
        title: "Validar alineacion con pulso rapido del equipo",
        description: "Medir si la comunicacion esta logrando alineacion real",
        howTo: [
          "Encuesta corta: ¿conoces las prioridades? ¿entiendes el porque?",
          "Comparar con diagnostico inicial",
          "Ajustar estrategia de comunicacion segun resultados",
        ],
        deliverable: "Resultado de pulso y ajustes implementados",
      },
    ],
  },

  // 7. MOTIVACION E INNOVACION - Mide la capacidad de inspirar y transformar
  "motivacion e innovacion": {
    measures: "Capacidad de inspirar y transformar",
    description: "Desarrollar la capacidad de inspirar al equipo y fomentar la innovacion continua",
    actions: [
      {
        id: "mi-1",
        week: 1,
        title: "Identificar motivadores individuales de cada miembro",
        description: "Conocer que impulsa e inspira a cada persona del equipo",
        howTo: [
          "Realizar conversacion sobre motivadores personales",
          "Usar framework como Moving Motivators o los 5 por ques",
          "Documentar motivador principal de cada persona",
        ],
        deliverable: "Mapa de motivadores del equipo",
        keyQuestions: [
          "¿Que te hace llegar con energia al trabajo?",
          "¿Cuando te has sentido mas inspirado aqui?",
          "¿Que tipo de proyectos te encienden?",
        ],
      },
      {
        id: "mi-2",
        week: 2,
        title: "Crear espacio de ideas e innovacion del equipo",
        description: "Habilitar un canal estructurado para capturar ideas de mejora",
        howTo: [
          "Crear tablero fisico o digital de ideas",
          "Definir proceso simple: idea, evaluacion, piloto",
          "Revisar ideas una vez por semana",
        ],
        deliverable: "Espacio de innovacion activo con primeras ideas",
      },
      {
        id: "mi-3",
        week: 3,
        title: "Implementar ritual de inspiracion quincenal",
        description: "Mantener al equipo conectado con el proposito mayor del trabajo",
        howTo: [
          "Compartir historia de impacto al inicio de la quincena",
          "Invitar clientes o usuarios a contar sus experiencias",
          "Conectar el trabajo diario con el impacto final",
        ],
        deliverable: "Ritual de inspiracion realizado cada 2 semanas",
      },
      {
        id: "mi-4",
        week: 5,
        title: "Lanzar reto de innovacion al equipo",
        description: "Canalizar la creatividad del equipo hacia un problema relevante",
        howTo: [
          "Plantear un reto concreto con restricciones claras",
          "Dar tiempo dedicado para trabajar en el (ej: 10% del tiempo)",
          "Presentar soluciones y elegir pilotos",
        ],
        deliverable: "Reto lanzado, soluciones presentadas y piloto en marcha",
      },
      {
        id: "mi-5",
        week: 7,
        title: "Reconocer y celebrar la innovacion del equipo",
        description: "Hacer visible y reforzar los comportamientos innovadores",
        howTo: [
          "Reconocer publicamente ideas y pilotos implementados",
          "Crear un 'premio' o ritual de innovacion",
          "Compartir resultados e impacto con la organizacion",
        ],
        deliverable: "Ritual de reconocimiento implementado con primeros casos",
      },
    ],
  },
}

// Obtener acciones sugeridas para un tema especifico
export function getActionsForTopic(topicName: string): TopicActionPlan | null {
  const normalized = normalizeTopicName(topicName)
  return TOPIC_ACTIONS[normalized] || null
}

// Plan generico de respaldo cuando no hay acciones predefinidas para un tema
export function getGenericActionPlan(topicName: string): TopicActionPlan {
  return {
    measures: "Desarrollo general del tema",
    description: `Acciones generales para fortalecer "${topicName}"`,
    actions: [
      {
        id: "gen-1",
        week: 1,
        title: "Diagnostico inicial del tema",
        description: "Entender la situacion actual y brechas del equipo en este tema",
        howTo: [
          "Revisar resultados previos de seguimiento",
          "Entrevistar a 2-3 miembros del equipo",
          "Documentar fortalezas y oportunidades",
        ],
        deliverable: "Informe de diagnostico inicial",
      },
      {
        id: "gen-2",
        week: 2,
        title: "Definir metas especificas y medibles",
        description: "Establecer objetivos claros de mejora con indicadores",
        howTo: [
          "Formular metas en formato SMART",
          "Definir 2-3 indicadores por meta",
          "Validar con el equipo",
        ],
        deliverable: "Documento de metas e indicadores",
      },
      {
        id: "gen-3",
        week: 4,
        title: "Implementar practicas clave y dar seguimiento",
        description: "Aplicar practicas concretas y medir avance semanal",
        howTo: [
          "Elegir 3 practicas prioritarias",
          "Aplicarlas consistentemente por 4 semanas",
          "Medir avance semanalmente con el equipo",
        ],
        deliverable: "Bitacora de practicas aplicadas y resultados",
      },
      {
        id: "gen-4",
        week: 7,
        title: "Evaluar resultados y consolidar aprendizajes",
        description: "Medir impacto y ajustar plan segun hallazgos",
        howTo: [
          "Comparar indicadores antes vs despues",
          "Identificar que funciono y que no",
          "Documentar aprendizajes para proximos ciclos",
        ],
        deliverable: "Informe de cierre con aprendizajes y siguientes pasos",
      },
    ],
  }
}
