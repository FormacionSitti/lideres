"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  CheckCircle, Circle, Users, MessageCircle, GraduationCap,
  Zap, Wrench, Sparkles, Compass, Target,
  ChevronDown, ChevronRight, AlertTriangle, TrendingUp,
  CheckSquare, XCircle, Clock, Cloud, CloudOff, RefreshCw,
  Filter, Sparkle, ExternalLink, BookOpen, Timer,
  Shield, Building2,
} from "lucide-react"
import {
  getLeaderLevel, getLeaderType, LEVEL_LABELS, LEVEL_COLORS,
  TYPE_LABELS_SHORT, TYPE_COLORS, type LeaderLevel, type LeaderType,
} from "@/lib/leader-levels"
import { findCompetency } from "@/lib/competencies"

function normalizeText(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Leader { id: number; name: string }
interface ActionData {
  action_id: string
  completed: boolean
  evaluation_score: number | null
  evaluation_date: string | null
  notes: string | null
  goals: string | null
}
interface DevelopmentPlanProps { leader: Leader }

// ─── TIPOS DE ACCIONES ───────────────────────────────────────────────────────

interface PlanAction {
  id: string
  time: string          // duración estimada: "20 min", "1h", etc.
  text: string          // descripción corta
  howTo: string[]       // máx 3 pasos concretos
  deliverable: string   // entregable único y claro
  questions?: string[]  // preguntas de coaching opcionales
}

interface PlanModule {
  id: string
  title: string
  icon: string
  colorBg: string; colorText: string; colorBar: string; colorDot: string
  colorBorder: string; colorFill: string
  objective: string
  actionsT: PlanAction[]   // TÁCTICO + líder formal (con equipo a cargo)
  actionsE: PlanAction[]   // ESTRATÉGICO
  actionsP: PlanAction[]   // TÁCTICO + líder de proceso (proyecto, sin personas a cargo)
  sittiCourses: { title: string; description: string; url: string; duration: string }[]
}

// ─── MÓDULOS ─────────────────────────────────────────────────────────────────

const MODULES: PlanModule[] = [
  {
    id: "liderazgo",
    title: "Liderazgo consciente",
    icon: "users",
    colorBg: "bg-blue-100", colorText: "text-blue-600", colorBar: "bg-blue-500",
    colorDot: "bg-blue-500", colorBorder: "border-blue-200", colorFill: "bg-blue-500",
    objective: "Construir presencia, escucha activa y vínculo de confianza con cada integrante del equipo.",
    sittiCourses: [
      { title: "Liderazgo Situacional", description: "Adapta tu estilo al nivel de madurez de cada colaborador.", url: "https://talentositti.buk.co/static_pages/portal", duration: "4h" },
      { title: "Escucha Activa y Empatía", description: "Escucha con intención para fortalecer vínculos de confianza.", url: "https://talentositti.buk.co/static_pages/portal", duration: "2h" },
      { title: "Feedback Efectivo", description: "Da y recibe retroalimentación constructiva que impulse el desempeño.", url: "https://talentositti.buk.co/static_pages/portal", duration: "3h" },
    ],
    actionsT: [
      {
        id: "lid_t1", time: "45 min",
        text: "Realiza UNA conversación 1:1 con el colaborador que más lo necesita hoy",
        howTo: ["Elige a la persona con más tensión o carga visible", "Pregunta: '¿qué necesitas de mí ahora mismo?'", "Anota 1 acuerdo o acción concreta al finalizar"],
        deliverable: "1 acuerdo documentado por colaborador atendido",
        questions: ["¿Qué barreras estás enfrentando esta semana?", "¿En qué momento te sientes más apoyado por mí?"],
      },
      {
        id: "lid_t2", time: "20 min",
        text: "Haz una ronda rápida preguntando: '¿en qué puedo quitarte un obstáculo hoy?'",
        howTo: ["Recorre el equipo (presencial o mensaje)", "Escucha sin juzgar ni justificar", "Resuelve o escala el obstáculo antes de terminar el día"],
        deliverable: "Al menos 1 obstáculo eliminado o escalado con seguimiento",
      },
      {
        id: "lid_t3", time: "10 min",
        text: "Envía un reconocimiento específico y público a un colaborador esta semana",
        howTo: ["Elige un logro concreto (no genérico)", "Nómbralo en el chat del equipo o en reunión", "Explica POR QUÉ ese logro importa para el resultado del área"],
        deliverable: "Reconocimiento enviado (guarda el mensaje para seguimiento)",
      },
      {
        id: "lid_t4", time: "20 min",
        text: "Define y comunica un bloque de 'disponibilidad activa' de 30 min diarios",
        howTo: ["Bloquea 30 min en tu calendario como 'disponible para el equipo'", "Comunícaselo al equipo hoy mismo", "Respeta ese bloque aunque haya otras cosas"],
        deliverable: "Horario compartido con el equipo (captura de pantalla o mensaje)",
      },
    ],
    actionsE: [
      {
        id: "lid_e1", time: "30 min",
        text: "Mapea los 3 líderes tácticos con más tensión y define una acción de apoyo por cada uno",
        howTo: ["Revisa indicadores de desempeño y señales de agotamiento", "Define 1 acción concreta de apoyo por líder (reunión, recurso, alivio de carga)", "Ejecuta o agenda la acción en las próximas 48h"],
        deliverable: "Lista de 3 líderes + acción de apoyo por cada uno",
      },
      {
        id: "lid_e2", time: "30 min",
        text: "Realiza una reunión de pulso con tu equipo directo: prioridades, fricciones y energía",
        howTo: ["Reunión de máx 30 min, sin agenda extensa", "Tres preguntas: ¿qué va bien?, ¿qué frena?, ¿qué necesitan de mí?", "Documenta 3 prioridades y 1 acción inmediata"],
        deliverable: "3 prioridades del equipo anotadas + 1 decisión tomada en la reunión",
      },
      {
        id: "lid_e3", time: "20 min",
        text: "Decide qué decisión puedes delegar definitivamente hoy para liberar espacio estratégico",
        howTo: ["Lista las decisiones que tomaste esta semana", "Identifica cuáles puede tomar otro sin perder calidad", "Comunica la delegación al responsable con criterios claros"],
        deliverable: "1+ decisión delegada con criterios comunicados por escrito",
      },
      {
        id: "lid_e4", time: "20 min",
        text: "Escribe y comparte el mensaje de liderazgo que quieres que tu equipo escuche esta semana",
        howTo: ["3 líneas máx: qué logro celebras, qué reto enfrentan, qué esperas", "Envíalo por el canal habitual del equipo", "Haz seguimiento: ¿lo leyeron?, ¿generó reacción?"],
        deliverable: "Mensaje enviado con evidencia de recepción",
      },
    ],
    actionsP: [
      {
        id: "lid_p1", time: "30 min",
        text: "Ten una conversación 1:1 con el participante del proyecto que más lo necesita hoy",
        howTo: ["Identifica a quien tiene más carga o fricción en el proyecto", "Pregunta: '¿qué necesitas de mí para avanzar?'", "Acuerda 1 acción concreta aunque esa persona no dependa de ti"],
        deliverable: "1 acuerdo de apoyo documentado con un involucrado del proyecto",
        questions: ["¿Qué te está frenando en el proyecto esta semana?"],
      },
      {
        id: "lid_p2", time: "20 min",
        text: "Haz una ronda con los involucrados del proyecto: '¿qué obstáculo puedo ayudarte a quitar?'",
        howTo: ["Contacta a los actores clave del proyecto (aunque sean de otras áreas)", "Escucha sin justificar", "Resuelve o escala 1 obstáculo antes de terminar el día"],
        deliverable: "Al menos 1 obstáculo del proyecto eliminado o escalado",
      },
      {
        id: "lid_p3", time: "10 min",
        text: "Reconoce de forma específica a alguien que aportó al proyecto, aunque no esté a tu cargo",
        howTo: ["Elige un aporte concreto y reciente", "Nómbralo en el canal del proyecto o ante quien corresponda", "Explica por qué ese aporte movió el resultado"],
        deliverable: "Reconocimiento enviado (guarda el mensaje)",
      },
      {
        id: "lid_p4", time: "20 min",
        text: "Identifica 1 hábito tuyo que genera fricción al coordinar sin autoridad y ajústalo",
        howTo: ["Piensa cómo influyes cuando no tienes mando formal", "Detecta 1 comportamiento que resta (imponer, asumir, no escuchar)", "Define el cambio y practícalo en la próxima interacción del proyecto"],
        deliverable: "1 hábito de liderazgo por influencia identificado y en práctica",
      },
    ],
  },

  {
    id: "comunicacion",
    title: "Comunicación",
    icon: "message",
    colorBg: "bg-cyan-100", colorText: "text-cyan-600", colorBar: "bg-cyan-500",
    colorDot: "bg-cyan-500", colorBorder: "border-cyan-200", colorFill: "bg-cyan-500",
    objective: "Asegurar que todos comparten el mismo norte y entienden su rol en el resultado.",
    sittiCourses: [
      { title: "Comunicación Asertiva", description: "Expresa ideas con claridad y confianza sin generar conflicto.", url: "https://talentositti.buk.co/static_pages/portal", duration: "3h" },
      { title: "Storytelling para Líderes", description: "Comunica la visión de forma que inspire y movilice equipos.", url: "https://talentositti.buk.co/static_pages/portal", duration: "2h" },
      { title: "Reuniones Efectivas", description: "Facilita reuniones con propósito, acuerdos y seguimiento real.", url: "https://talentositti.buk.co/static_pages/portal", duration: "2h" },
    ],
    actionsT: [
      {
        id: "com_t1", time: "30 min",
        text: "Revisa las tareas pendientes del equipo: ¿tienen claridad, responsable y fecha?",
        howTo: ["Abre el tablero o chat y lista las tareas activas", "Identifica las que no tienen fecha o responsable claro", "Corrige o clarifica esas tareas hoy mismo"],
        deliverable: "Todas las tareas activas con responsable y fecha visible",
      },
      {
        id: "com_t2", time: "20 min",
        text: "Diseña la agenda de tu próxima reunión con máx 3 puntos y tiempo asignado",
        howTo: ["Define los 3 temas más críticos (no más)", "Asigna tiempo a cada punto: ej. 10+15+10 min", "Envíala al equipo con 24h de anticipación"],
        deliverable: "Agenda enviada con anticipación (captura del mensaje)",
      },
      {
        id: "com_t3", time: "15 min",
        text: "Envía un mensaje corto explicando la prioridad #1 del equipo esta semana",
        howTo: ["Escribe: qué hay que lograr, por qué importa, quién hace qué", "Máx 5 líneas, sin tecnicismos", "Pide acuse de recibo o confirma comprensión"],
        deliverable: "Mensaje enviado con confirmación de lectura del equipo",
      },
      {
        id: "com_t4", time: "20 min",
        text: "Pregunta a 2 personas del equipo cuál creen que es el objetivo prioritario esta semana",
        howTo: ["Hazlo uno a uno, sin dar pistas", "Escucha sin corregir en el momento", "Si hay diferencia con lo que tú pensabas → hay brecha de alineación"],
        deliverable: "Brecha detectada (sí/no) + acción correctiva si aplica",
        questions: ["¿Qué crees que es lo más importante que el equipo debe lograr esta semana?"],
      },
    ],
    actionsE: [
      {
        id: "com_e1", time: "30 min",
        text: "Redacta y envía el comunicado de estado del área para stakeholders clave",
        howTo: ["1 párrafo: dónde estamos, qué logramos, qué viene", "Envíalo a quien necesita estar informado esta semana", "Incluye 1 dato o métrica concreta"],
        deliverable: "Comunicado enviado con métricas de área",
      },
      {
        id: "com_e2", time: "30 min",
        text: "Verifica si el mensaje estratégico del mes pasado se está ejecutando en el día a día",
        howTo: ["Observa o pregunta cómo se está trabajando en los equipos", "Compara con lo que comunicaste: ¿hay brecha?", "Si hay brecha → define 1 acción correctiva concreta"],
        deliverable: "Brecha identificada + acción correctiva documentada",
      },
      {
        id: "com_e3", time: "45 min",
        text: "Construye la narrativa para presentar resultados del área: qué, por qué importa, qué sigue",
        howTo: ["Estructura: logro → impacto → siguiente paso", "Máx 5 slides o 1 página", "Valida con alguien del equipo antes de presentar"],
        deliverable: "Presentación de máx 5 slides lista para compartir",
      },
      {
        id: "com_e4", time: "30 min",
        text: "Define el protocolo de comunicación urgente para el área: canal, tiempo de respuesta, responsable",
        howTo: ["Lista los escenarios urgentes frecuentes", "Define canal y tiempo de respuesta esperado", "Compártelo con los líderes tácticos del área"],
        deliverable: "Protocolo documentado y socializado (máx 1 página)",
      },
    ],
    actionsP: [
      {
        id: "com_p1", time: "30 min",
        text: "Revisa que cada tarea del proyecto tenga responsable y fecha, aunque dependa de otras áreas",
        howTo: ["Abre el tablero o cronograma del proyecto", "Detecta tareas sin responsable o sin fecha", "Confirma con cada dueño de tarea hoy mismo"],
        deliverable: "Todas las tareas del proyecto con responsable y fecha visibles",
      },
      {
        id: "com_p2", time: "20 min",
        text: "Diseña la agenda de tu próxima reunión de proyecto con máx 3 puntos y tiempos",
        howTo: ["Define los 3 temas más críticos del avance", "Asigna tiempo a cada punto", "Envíala a los involucrados con 24h de anticipación"],
        deliverable: "Agenda de proyecto enviada con anticipación",
      },
      {
        id: "com_p3", time: "15 min",
        text: "Envía un mensaje corto con el estado y la prioridad #1 del proyecto a los involucrados",
        howTo: ["Escribe: dónde vamos, qué sigue, qué necesito de cada quién", "Máx 5 líneas, sin tecnicismos", "Pide confirmación de lectura"],
        deliverable: "Mensaje de estado enviado con confirmación de los involucrados",
      },
      {
        id: "com_p4", time: "20 min",
        text: "Confirma con 2 stakeholders que entienden el objetivo del proyecto igual que tú",
        howTo: ["Pregúntales, uno a uno, qué creen que debe lograr el proyecto", "Escucha sin corregir en el momento", "Si hay diferencia → hay brecha de alineación que cerrar"],
        deliverable: "Brecha de alineación detectada (sí/no) + acción correctiva si aplica",
        questions: ["¿Cuál crees que es el objetivo principal de este proyecto?"],
      },
    ],
  },

  {
    id: "aprendizaje",
    title: "Cultura de aprendizaje",
    icon: "book",
    colorBg: "bg-green-100", colorText: "text-green-600", colorBar: "bg-green-500",
    colorDot: "bg-green-500", colorBorder: "border-green-200", colorFill: "bg-green-500",
    objective: "Convertir cada experiencia y error en conocimiento útil para el equipo.",
    sittiCourses: [
      { title: "Mentoría y Coaching de Equipos", description: "Herramientas para acompañar el aprendizaje continuo.", url: "https://talentositti.buk.co/static_pages/portal", duration: "4h" },
      { title: "Gestión del Conocimiento", description: "Crea sistemas para capturar y compartir aprendizaje.", url: "https://talentositti.buk.co/static_pages/portal", duration: "3h" },
      { title: "Aprendizaje Ágil", description: "Desarrolla la capacidad de aprender y adaptarse rápido.", url: "https://talentositti.buk.co/static_pages/portal", duration: "2h" },
    ],
    actionsT: [
      {
        id: "apr_t1", time: "20 min",
        text: "Comparte UNA lección aprendida de la semana con tu equipo en la próxima reunión",
        howTo: ["Elige un error o aprendizaje real y reciente", "Nómbralo sin culpables: qué pasó, qué aprendimos, qué cambiamos", "Invita al equipo a compartir uno propio (voluntario)"],
        deliverable: "Lección documentada en el acta o chat del equipo",
      },
      {
        id: "apr_t2", time: "20 min",
        text: "Haz una retrospectiva exprés: '1 cosa que funcionó, 1 que no, 1 que cambiamos'",
        howTo: ["10 min con el equipo, sin formato complejo", "Escribe las respuestas en tiempo real (pizarra o chat)", "Define 1 sola acción de mejora con responsable"],
        deliverable: "Acta con 1 acción concreta y responsable asignado",
      },
      {
        id: "apr_t3", time: "30 min",
        text: "Identifica el error más recurrente del equipo y escribe su causa raíz en 3 líneas",
        howTo: ["Pregunta al equipo cuál problema se repite más seguido", "Aplica '5 Por qués' en conversación rápida", "Escribe la causa raíz y una acción preventiva"],
        deliverable: "Causa raíz documentada + acción preventiva definida",
      },
      {
        id: "apr_t4", time: "15 min",
        text: "Elige a 1 colaborador y pídele que prepare un tip o aprendizaje de 5 min para la próxima reunión",
        howTo: ["Escoge a alguien con fortaleza en algún tema del equipo", "Dile exactamente qué tema y cuánto tiempo tiene", "Crea el hábito: un 'tip del equipo' por reunión"],
        deliverable: "Espacio de aprendizaje agendado en la agenda de la próxima reunión",
      },
    ],
    actionsE: [
      {
        id: "apr_e1", time: "30 min",
        text: "Identifica la brecha de conocimiento más crítica del área y define quién la puede cerrar",
        howTo: ["Pregunta a los líderes tácticos cuál habilidad falta más en sus equipos", "Prioriza la que más impacta en resultados", "Define responsable y recurso (curso, mentor, práctica)"],
        deliverable: "Brecha + responsable de cierre + recurso asignado",
      },
      {
        id: "apr_e2", time: "30 min",
        text: "Diseña y agenda el primer espacio quincenal de aprendizaje del área (20 min)",
        howTo: ["Define tema del primer espacio, quién lo lidera, qué formato", "Agrégalo al calendario del área como evento recurrente", "Comunícalo como práctica nueva del área"],
        deliverable: "Primer espacio agendado en el calendario del equipo",
      },
      {
        id: "apr_e3", time: "30 min",
        text: "Verifica si los 3 procesos más críticos del área están documentados",
        howTo: ["Lista los 3 procesos que más impactan el resultado del área", "Revisa si existe documentación accesible para el equipo", "Asigna responsable de documentar los que falten"],
        deliverable: "Lista: documentados vs. pendientes + responsable para cada pendiente",
      },
      {
        id: "apr_e4", time: "30 min",
        text: "Define la habilidad que el área debe desarrollar en los próximos 30 días y el cómo",
        howTo: ["Identifica la habilidad con mayor impacto en el resultado actual", "Define cómo se desarrollará: curso, práctica, mentorías internas", "Establece 1 métrica de evidencia de mejora"],
        deliverable: "Plan de 30 días: habilidad + método + métrica de evidencia",
      },
    ],
    actionsP: [
      {
        id: "apr_p1", time: "20 min",
        text: "Documenta 1 lección aprendida del proyecto y compártela con los involucrados",
        howTo: ["Elige un aprendizaje o error real y reciente del proyecto", "Descríbelo sin culpables: qué pasó, qué aprendimos, qué ajustamos", "Compártelo en el canal del proyecto"],
        deliverable: "Lección aprendida documentada y compartida",
      },
      {
        id: "apr_p2", time: "20 min",
        text: "Haz una retrospectiva exprés del avance: '1 que funcionó, 1 que no, 1 que cambiamos'",
        howTo: ["10 min con los involucrados clave", "Captura las respuestas en el momento", "Define 1 sola acción de mejora con responsable"],
        deliverable: "Nota de retrospectiva con 1 acción y responsable",
      },
      {
        id: "apr_p3", time: "30 min",
        text: "Identifica el retrabajo más recurrente del proyecto y escribe su causa raíz",
        howTo: ["Detecta qué se rehace o se traba una y otra vez", "Aplica '5 Por qués' en conversación rápida", "Escribe la causa raíz + 1 acción preventiva"],
        deliverable: "Causa raíz documentada + acción preventiva",
      },
      {
        id: "apr_p4", time: "30 min",
        text: "Documenta el proceso clave del proyecto para que sea replicable por otros",
        howTo: ["Elige el proceso que más impacta el resultado del proyecto", "Escríbelo en pasos claros y accesibles", "Compártelo con quien lo pueda necesitar"],
        deliverable: "Proceso clave documentado y disponible para el equipo",
      },
    ],
  },

  {
    id: "decisiones",
    title: "Toma de decisiones",
    icon: "zap",
    colorBg: "bg-amber-100", colorText: "text-amber-600", colorBar: "bg-amber-500",
    colorDot: "bg-amber-500", colorBorder: "border-amber-200", colorFill: "bg-amber-500",
    objective: "Decidir mejor y más rápido sin sacrificar calidad ni alineación.",
    sittiCourses: [
      { title: "Pensamiento Crítico para Líderes", description: "Evalúa alternativas y decide con claridad y criterio.", url: "https://talentositti.buk.co/static_pages/portal", duration: "4h" },
      { title: "Delegación Efectiva", description: "Delega con confianza asignando decisiones al nivel correcto.", url: "https://talentositti.buk.co/static_pages/portal", duration: "2h" },
      { title: "Agilidad en la Toma de Decisiones", description: "Frameworks para decidir rápido con información incompleta.", url: "https://talentositti.buk.co/static_pages/portal", duration: "3h" },
    ],
    actionsT: [
      {
        id: "dec_t1", time: "30 min",
        text: "Toma HOY una decisión que llevas más de 3 días postergando",
        howTo: ["Lista las decisiones pendientes (máx 5 min)", "Elige la más importante y aplica: '¿con la info que tengo, puedo decidir?'", "Comunica la decisión al equipo con contexto breve"],
        deliverable: "Decisión tomada, documentada y comunicada hoy",
        questions: ["¿Qué me impide decidir esto?", "¿Qué pasa si no decido esta semana?"],
      },
      {
        id: "dec_t2", time: "30 min",
        text: "Lista las 5 decisiones más frecuentes del equipo y define cuáles pueden tomar sin consultarte",
        howTo: ["Escribe las decisiones recurrentes que te consultan", "Para cada una: ¿puede decidir el equipo con criterios claros?", "Comunica los criterios al equipo esta semana"],
        deliverable: "Tabla de autonomía decisional compartida con el equipo",
      },
      {
        id: "dec_t3", time: "Variable",
        text: "Cierra en máx 24h una solicitud o consulta pendiente del equipo",
        howTo: ["Revisa qué decisiones o consultas están esperando tu respuesta", "Prioriza la más bloqueante para el equipo", "Responde con decisión clara y contexto suficiente"],
        deliverable: "Respuesta enviada con decisión y acción resultante",
      },
      {
        id: "dec_t4", time: "20 min",
        text: "Aplica la regla del 70%: decide con la información que tienes, no esperes la perfecta",
        howTo: ["Identifica una decisión donde llevas esperando 'más información'", "Evalúa: ¿tengo al menos 70% de la info necesaria?", "Si sí → decide y ajusta si se necesita"],
        deliverable: "Decisión tomada + nota de qué información adicional monitorearás",
      },
    ],
    actionsE: [
      {
        id: "dec_e1", time: "30 min",
        text: "Distingue qué decisiones solo TÚ debes tomar vs. cuáles puedes delegar definitivamente",
        howTo: ["Lista las decisiones de la última semana", "Clasifica: estratégica (yo) / táctica (delegar) / operativa (equipo)", "Formaliza la delegación de las tácticas y operativas"],
        deliverable: "Matriz de decisiones con clasificación y responsables definidos",
      },
      {
        id: "dec_e2", time: "45 min",
        text: "Diseña el proceso de decisión para situaciones de alta urgencia en el área",
        howTo: ["Define los 3 escenarios de urgencia más frecuentes", "Para cada uno: quién decide, con qué criterio, en cuánto tiempo", "Documenta y comparte con líderes tácticos"],
        deliverable: "Protocolo de decisión urgente documentado y socializado",
      },
      {
        id: "dec_e3", time: "30 min",
        text: "Revisa la última decisión importante que tomaste: ¿el equipo la entendió y ejecutó bien?",
        howTo: ["Elige una decisión clave de los últimos 15 días", "Pregunta a 1-2 líderes tácticos cómo la recibieron e implementaron", "Identifica brecha y ajusta la forma de comunicar decisiones"],
        deliverable: "Brecha identificada + ajuste en el proceso de comunicación de decisiones",
      },
      {
        id: "dec_e4", time: "20 min",
        text: "Empodera a 1 líder táctico para tomar una categoría de decisiones sin escalarte",
        howTo: ["Elige a un líder táctico listo para más autonomía", "Define la categoría de decisiones que puede tomar solo", "Comunícaselo formalmente y respáldalos públicamente"],
        deliverable: "Comunicación de empoderamiento enviada al líder y al equipo",
      },
    ],
    actionsP: [
      {
        id: "dec_p1", time: "30 min",
        text: "Toma HOY una decisión del proyecto que llevas más de 3 días postergando",
        howTo: ["Lista las decisiones del proyecto pendientes", "Elige la más bloqueante y pregúntate: '¿con lo que tengo, puedo decidir?'", "Comunica la decisión a los involucrados con contexto breve"],
        deliverable: "Decisión del proyecto tomada, documentada y comunicada hoy",
        questions: ["¿Qué me impide decidir esto?", "¿Qué pasa si no decido esta semana?"],
      },
      {
        id: "dec_p2", time: "30 min",
        text: "Lista las decisiones del proyecto que dependen de otros y define a quién y cómo escalarlas",
        howTo: ["Identifica las decisiones fuera de tu alcance directo", "Para cada una: quién decide y qué información necesita", "Escala la más urgente hoy con una recomendación clara"],
        deliverable: "Mapa de decisiones a escalar con responsable y recomendación",
      },
      {
        id: "dec_p3", time: "Variable",
        text: "Cierra en máx 24h una consulta pendiente que bloquea el avance del proyecto",
        howTo: ["Revisa qué respuestas están esperando por ti", "Prioriza la más bloqueante", "Responde con decisión clara y siguiente paso"],
        deliverable: "Respuesta enviada con decisión y acción resultante",
      },
      {
        id: "dec_p4", time: "20 min",
        text: "Aplica la regla del 70% en un punto trabado del proyecto: decide sin esperar la info perfecta",
        howTo: ["Identifica dónde llevas esperando 'más información'", "Evalúa: ¿tengo al menos el 70% de lo necesario?", "Si sí → decide y define qué monitorear luego"],
        deliverable: "Decisión tomada + nota de qué información seguirás vigilando",
      },
    ],
  },

  {
    id: "resolucion",
    title: "Resolución de problemas",
    icon: "wrench",
    colorBg: "bg-orange-100", colorText: "text-orange-600", colorBar: "bg-orange-500",
    colorDot: "bg-orange-500", colorBorder: "border-orange-200", colorFill: "bg-orange-500",
    objective: "Atacar las causas raíz y diseñar soluciones sistémicas, no parches.",
    sittiCourses: [
      { title: "Resolución de Conflictos", description: "Aborda conflictos de forma constructiva con soluciones duraderas.", url: "https://talentositti.buk.co/static_pages/portal", duration: "3h" },
      { title: "Design Thinking Aplicado", description: "Metodología centrada en personas para resolver problemas complejos.", url: "https://talentositti.buk.co/static_pages/portal", duration: "5h" },
      { title: "Pensamiento Sistémico", description: "Analiza dinámicas del sistema para resolver problemas de raíz.", url: "https://talentositti.buk.co/static_pages/portal", duration: "4h" },
    ],
    actionsT: [
      {
        id: "res_t1", time: "30 min",
        text: "Escribe el problema más recurrente del equipo esta semana y aplica '5 Por qués'",
        howTo: ["Elige el problema que más frena al equipo ahora", "Pregunta '¿por qué ocurre?' 5 veces seguidas", "Escribe la causa raíz (generalmente está en el nivel 4-5)"],
        deliverable: "Análisis de 5 Por Qués documentado con causa raíz identificada",
      },
      {
        id: "res_t2", time: "20 min",
        text: "Define 1 solución que puedas ejecutar esta semana para el problema identificado",
        howTo: ["La solución debe atacar la causa raíz, no el síntoma", "Debe poder ejecutarse en máx 5 días con los recursos actuales", "Asigna responsable y fecha de verificación"],
        deliverable: "Solución en ejecución con responsable y fecha de revisión",
      },
      {
        id: "res_t3", time: "20 min",
        text: "Habla con el colaborador más afectado por el problema y escucha su perspectiva",
        howTo: ["Acércate sin llegar con la solución ya lista", "Pregunta: '¿qué crees que lo genera? ¿qué intentaste ya?'", "Incorpora su perspectiva antes de cerrar la solución"],
        deliverable: "Perspectiva documentada; confirma o ajusta la solución",
        questions: ["¿Qué intentaste antes para resolver esto?", "¿Qué necesitarías para que no vuelva a pasar?"],
      },
      {
        id: "res_t4", time: "20 min",
        text: "Crea una señal de alerta temprana para detectar el problema antes de que explote",
        howTo: ["Identifica cuál es la primera señal visible de que el problema está empezando", "Define un chequeo semanal de esa señal (puede ser 1 pregunta o 1 dato)", "Asígnate el hábito de revisarlo los lunes"],
        deliverable: "Indicador o chequeo semanal definido y agendado",
      },
    ],
    actionsE: [
      {
        id: "res_e1", time: "45 min",
        text: "Mapea los 3 problemas estructurales del área y clasifica cuáles son sistémicos vs. puntuales",
        howTo: ["Reúnete 30 min con los líderes tácticos para identificarlos", "Clasifica: sistémico (afecta todo el área) vs. puntual (un proceso/persona)", "Prioriza el sistémico de mayor impacto"],
        deliverable: "Mapa de 3 problemas con clasificación y prioridad asignada",
      },
      {
        id: "res_e2", time: "30 min",
        text: "Identifica cuál problema, si lo resuelves, elimina o reduce 3 problemas menores",
        howTo: ["Busca el problema 'nodo' que genera varios otros", "Valida con los líderes tácticos si están de acuerdo", "Lanza la solución del problema nodo esta semana"],
        deliverable: "Problema nodo identificado + plan de ataque de 1 semana",
      },
      {
        id: "res_e3", time: "45 min",
        text: "Define con tu equipo qué proceso genera más reproceso y asigna un responsable de mejora",
        howTo: ["Pregunta: '¿dónde perdemos más tiempo o energía repetidamente?'", "Prioriza el proceso con mayor impacto en resultados", "Asigna responsable con fecha de propuesta de mejora"],
        deliverable: "Proceso priorizado + responsable de mejora + fecha de propuesta",
      },
      {
        id: "res_e4", time: "1h",
        text: "Diseña en 1 página el plan de solución para el problema más crítico del área",
        howTo: ["Estructura: problema → causa → solución → responsable → fecha → métrica de éxito", "Revísalo con el equipo antes de ejecutar", "Máx 1 página o 1 slide ejecutivo"],
        deliverable: "Plan de 1 página aprobado y en ejecución",
      },
    ],
    actionsP: [
      {
        id: "res_p1", time: "30 min",
        text: "Escribe el problema que más frena el proyecto esta semana y aplica '5 Por qués'",
        howTo: ["Elige el problema que más bloquea el avance", "Pregunta '¿por qué ocurre?' 5 veces seguidas", "Escribe la causa raíz (suele estar en el nivel 4-5)"],
        deliverable: "Análisis de 5 Por Qués con causa raíz identificada",
      },
      {
        id: "res_p2", time: "20 min",
        text: "Define 1 solución ejecutable esta semana para la causa raíz del problema del proyecto",
        howTo: ["La solución debe atacar la causa, no el síntoma", "Debe poder ejecutarse en máx 5 días con los recursos actuales", "Asigna responsable y fecha de verificación"],
        deliverable: "Solución en ejecución con responsable y fecha de revisión",
      },
      {
        id: "res_p3", time: "20 min",
        text: "Habla con el involucrado más afectado por el problema y suma su perspectiva",
        howTo: ["Acércate sin llegar con la solución ya lista", "Pregunta: '¿qué crees que lo genera? ¿qué intentaste ya?'", "Incorpora su perspectiva antes de cerrar la solución"],
        deliverable: "Perspectiva documentada; solución confirmada o ajustada",
        questions: ["¿Qué intentaste antes para resolver esto?", "¿Qué necesitarías para que no vuelva a pasar?"],
      },
      {
        id: "res_p4", time: "20 min",
        text: "Define una señal de alerta temprana para un riesgo del proyecto antes de que escale",
        howTo: ["Identifica la primera señal visible de que el riesgo aparece", "Define un chequeo semanal (1 pregunta o 1 dato)", "Agenda revisarlo cada semana"],
        deliverable: "Indicador de alerta temprana definido y agendado",
      },
    ],
  },

  {
    id: "motivacion",
    title: "Innovación con propósito",
    icon: "sparkles",
    colorBg: "bg-rose-100", colorText: "text-rose-600", colorBar: "bg-rose-500",
    colorDot: "bg-rose-500", colorBorder: "border-rose-200", colorFill: "bg-rose-500",
    objective: "Activar la energía del equipo y abrir espacios para nuevas ideas.",
    sittiCourses: [
      { title: "Inteligencia Emocional para Líderes", description: "Gestiona emociones para inspirar y motivar a tu equipo.", url: "https://talentositti.buk.co/static_pages/portal", duration: "4h" },
      { title: "Innovación y Creatividad en el Trabajo", description: "Técnicas para estimular ideas disruptivas en equipos.", url: "https://talentositti.buk.co/static_pages/portal", duration: "3h" },
      { title: "Propósito y Motivación de Equipos", description: "Conecta al equipo con el propósito para aumentar el compromiso.", url: "https://talentositti.buk.co/static_pages/portal", duration: "2h" },
    ],
    actionsT: [
      {
        id: "mot_t1", time: "15 min",
        text: "Identifica al colaborador con menor energía esta semana y agenda una conversación de apoyo",
        howTo: ["Observa señales: silencio, errores inusuales, falta de proactividad", "Acércate informalmente: '¿cómo estás? ¿hay algo en lo que te pueda apoyar?'", "Define 1 acción de apoyo concreta (si aplica)"],
        deliverable: "Conversación realizada + 1 acción de apoyo identificada",
        questions: ["¿Qué te está pesando más esta semana?", "¿Qué necesitarías para sentirte más en zona?"],
      },
      {
        id: "mot_t2", time: "20 min",
        text: "Pregunta al equipo: '¿qué cambiarían de cómo trabajamos?' y captura las ideas",
        howTo: ["Hazlo en reunión de equipo o por chat (formulario anónimo si son tímidos)", "No filtres ni juzgues en el momento", "Selecciona 1 idea y ejecútala esta semana"],
        deliverable: "3+ ideas capturadas + 1 idea implementada esta semana",
      },
      {
        id: "mot_t3", time: "5 min",
        text: "Reconoce públicamente un logro del equipo en el canal grupal o en reunión",
        howTo: ["El reconocimiento debe ser específico: qué logró, con qué dificultad, qué impacto tuvo", "Nómbralo delante del equipo (no en privado)", "Relaciona el logro con el objetivo del área"],
        deliverable: "Reconocimiento enviado (guarda el mensaje)",
      },
      {
        id: "mot_t4", time: "Variable",
        text: "Implementa esta semana UNA idea pequeña propuesta por el equipo",
        howTo: ["Elige la idea más fácil de ejecutar con impacto visible", "Impleméntala y comunica que fue una idea del equipo", "El equipo verá que sus ideas importan → más iniciativa"],
        deliverable: "Idea ejecutada + equipo informado de que fue su iniciativa",
      },
    ],
    actionsE: [
      {
        id: "mot_e1", time: "20 min",
        text: "Define y comunica el reconocimiento del mes para el mejor resultado del área",
        howTo: ["No tiene que ser monetario: visibilidad, autonomía, proyecto especial", "Define criterios claros de a quién aplica", "Comunícalo hoy al equipo para que todos sepan qué se valora"],
        deliverable: "Reconocimiento del mes comunicado con criterios claros",
      },
      {
        id: "mot_e2", time: "30 min",
        text: "Escribe el propósito del área en 1 frase y compártela con tu equipo esta semana",
        howTo: ["¿Para qué existe el área? ¿Qué no podría funcionar sin ustedes?", "Redacta la frase en 1 línea memorable", "Preséntala en la próxima reunión y pide feedback"],
        deliverable: "Frase de propósito comunicada con reacción del equipo documentada",
      },
      {
        id: "mot_e3", time: "30 min",
        text: "Abre un espacio de 30 min para que el equipo proponga mejoras al modelo de trabajo",
        howTo: ["Espacio sin agenda rígida: '¿qué podríamos hacer diferente para ser mejores?'", "Captura ideas sin filtrar ni priorizar en el momento", "Selecciona 3 ideas para evaluar y comunica la decisión"],
        deliverable: "3 ideas priorizadas + plan para evaluar su viabilidad en 1 semana",
      },
      {
        id: "mot_e4", time: "1h",
        text: "Lanza un mini-reto de innovación de 5 días: problema concreto, equipo pequeño, solución rápida",
        howTo: ["Define el problema a resolver (debe ser real y acotado)", "Forma equipos de 2-3 personas voluntarias", "Establece la regla: solución presentable en 5 días laborables"],
        deliverable: "Reto lanzado con descripción del problema, reglas y fecha de presentación",
      },
    ],
    actionsP: [
      {
        id: "mot_p1", time: "20 min",
        text: "Pregunta a los involucrados del proyecto qué mejorarían y captura las ideas",
        howTo: ["Hazlo en reunión o por chat (formulario anónimo si prefieren)", "No filtres ni juzgues en el momento", "Selecciona 1 idea y ejecútala esta semana"],
        deliverable: "3+ ideas capturadas + 1 idea implementada",
      },
      {
        id: "mot_p2", time: "5 min",
        text: "Reconoce públicamente un aporte destacado al proyecto",
        howTo: ["Sé específico: qué aportó, con qué dificultad, qué impacto tuvo", "Nómbralo en el canal del proyecto", "Relaciónalo con el objetivo del proyecto"],
        deliverable: "Reconocimiento enviado (guarda el mensaje)",
      },
      {
        id: "mot_p3", time: "Variable",
        text: "Implementa esta semana UNA idea pequeña propuesta por el equipo del proyecto",
        howTo: ["Elige la idea más fácil de ejecutar con impacto visible", "Impleméntala y comunica que fue una idea del equipo", "El equipo verá que sus ideas importan"],
        deliverable: "Idea ejecutada + equipo informado de que fue su iniciativa",
      },
      {
        id: "mot_p4", time: "1h",
        text: "Lanza un mini-reto de 5 días para resolver un problema acotado del proyecto",
        howTo: ["Define un problema real y acotado del proyecto", "Forma un equipo de 2-3 voluntarios", "Regla: solución presentable en 5 días laborables"],
        deliverable: "Reto lanzado con problema, reglas y fecha de presentación",
      },
    ],
  },

  {
    id: "vision",
    title: "Visión transformadora",
    icon: "compass",
    colorBg: "bg-indigo-100", colorText: "text-indigo-600", colorBar: "bg-indigo-500",
    colorDot: "bg-indigo-500", colorBorder: "border-indigo-200", colorFill: "bg-indigo-500",
    objective: "Anticipar el futuro del área y guiar al equipo hacia un estado superior de desempeño.",
    sittiCourses: [
      { title: "Liderazgo Transformacional", description: "Desarrolla habilidades para liderar procesos de cambio.", url: "https://talentositti.buk.co/static_pages/portal", duration: "5h" },
      { title: "Gestión del Cambio", description: "Guía al equipo en transiciones organizacionales con menos resistencia.", url: "https://talentositti.buk.co/static_pages/portal", duration: "4h" },
      { title: "Planeación Estratégica", description: "Define objetivos de largo plazo y planes alineados a la visión.", url: "https://talentositti.buk.co/static_pages/portal", duration: "4h" },
    ],
    actionsT: [
      {
        id: "vis_t1", time: "20 min",
        text: "Escribe cómo quieres que esté tu equipo en 30 días y qué debes hacer TÚ para lograrlo",
        howTo: ["3 líneas máx: equipo ideal en 30 días", "Define 1 comportamiento tuyo que debes cambiar para llegar allá", "Compártelo con tu jefe o con el área de formación"],
        deliverable: "Visión de 30 días documentada con 1 cambio personal de comportamiento",
      },
      {
        id: "vis_t2", time: "30 min",
        text: "Identifica 1 proceso del equipo que ya no agrega valor y propón eliminarlo o simplificarlo",
        howTo: ["Pregunta al equipo: '¿qué hacemos que podríamos dejar de hacer?'", "Evalúa el proceso: ¿qué valor genera?, ¿qué costaría eliminarlo?", "Presenta la propuesta a tu jefe esta semana"],
        deliverable: "Propuesta de simplificación con justificación de valor/costo",
      },
      {
        id: "vis_t3", time: "20 min",
        text: "Pregunta a 2 colaboradores: '¿qué haríamos diferente para ser más efectivos?'",
        howTo: ["Hazlo en conversaciones individuales informales", "Escucha sin defender el estado actual", "Captura las 2 mejores ideas y revisa si son viables"],
        deliverable: "2 oportunidades de mejora capturadas con evaluación de viabilidad",
      },
      {
        id: "vis_t4", time: "15 min",
        text: "Define 1 cosa que harás diferente esta semana respecto a cómo lo has venido haciendo",
        howTo: ["Piensa en tu rutina de liderazgo: ¿qué hábito necesita cambiar?", "Escríbelo como compromiso concreto y compártelo con alguien", "Al final de la semana: ¿lo hiciste?, ¿qué pasó?"],
        deliverable: "Nuevo hábito documentado y ejecutado con reflexión al cierre de semana",
      },
    ],
    actionsE: [
      {
        id: "vis_e1", time: "45 min",
        text: "Describe el área dentro de 6 meses: resultados, procesos y equipo diferentes",
        howTo: ["Piensa en 3 dimensiones: resultados (qué miden diferente), procesos (cómo trabajan), equipo (cómo se sienten)", "Escríbelo en 1 página narrativa", "Compártelo con tu equipo directo para alineación"],
        deliverable: "Visión de 6 meses en 1 página compartida con el equipo",
      },
      {
        id: "vis_e2", time: "30 min",
        text: "Define la transformación más urgente del área y su primer hito alcanzable en 2 semanas",
        howTo: ["¿Qué cambio no puede esperar más de 30 días?", "Divide ese cambio en el hito más pequeño que puedas lograr en 2 semanas", "Asigna responsable y define la métrica de éxito del hito"],
        deliverable: "Primer hito de transformación con responsable, fecha y métrica",
      },
      {
        id: "vis_e3", time: "30 min",
        text: "Haz el ejercicio Start/Stop/Continue para el área: ¿qué deben empezar, parar y mantener?",
        howTo: ["Facilita el ejercicio con los líderes tácticos (25 min)", "Cada categoría debe tener al menos 2 elementos", "Prioriza 1 Start y 1 Stop para ejecutar esta semana"],
        deliverable: "Lista Start/Stop/Continue con 1 Start y 1 Stop ya en ejecución",
      },
      {
        id: "vis_e4", time: "45 min",
        text: "Comparte una tendencia del sector con tu equipo y discutan cómo les impacta",
        howTo: ["Elige 1 tendencia relevante (tecnológica, de mercado, regulatoria)", "Preséntala en 5 min y abre el debate: '¿cómo nos impacta esto?'", "Cierra con 1 acción o exploración concreta que el equipo emprenda"],
        deliverable: "Sesión realizada + 1 acción derivada de la tendencia discutida",
      },
    ],
    actionsP: [
      {
        id: "vis_p1", time: "20 min",
        text: "Escribe cómo quieres que esté el proyecto en 30 días y qué depende de ti para lograrlo",
        howTo: ["3 líneas máx: estado ideal del proyecto en 30 días", "Define 1 acción tuya clave para llegar allá", "Compártelo con tu jefe o con el sponsor del proyecto"],
        deliverable: "Visión de 30 días del proyecto + 1 acción propia clave",
      },
      {
        id: "vis_p2", time: "30 min",
        text: "Identifica 1 actividad del proyecto que ya no agrega valor y propón eliminarla o simplificarla",
        howTo: ["Pregunta: '¿qué hacemos aquí que podríamos dejar de hacer?'", "Evalúa valor vs. costo de esa actividad", "Presenta la propuesta a quien decide esta semana"],
        deliverable: "Propuesta de simplificación con justificación valor/costo",
      },
      {
        id: "vis_p3", time: "20 min",
        text: "Pregunta a 2 involucrados qué harían diferente para que el proyecto sea más efectivo",
        howTo: ["Hazlo en conversaciones individuales informales", "Escucha sin defender el estado actual", "Captura las 2 mejores ideas y evalúa su viabilidad"],
        deliverable: "2 oportunidades de mejora capturadas con evaluación de viabilidad",
      },
      {
        id: "vis_p4", time: "15 min",
        text: "Define 1 cosa que harás diferente esta semana en cómo coordinas el proyecto",
        howTo: ["Piensa en tu forma de coordinar: ¿qué hábito cambiar?", "Escríbelo como compromiso concreto y compártelo con alguien", "Al cierre de semana: ¿lo hiciste?, ¿qué pasó?"],
        deliverable: "Nuevo hábito de coordinación documentado y ejecutado",
      },
    ],
  },
]

// ─── ACTION CARD ─────────────────────────────────────────────────────────────

function ActionCard({ action, mod, actionsData, onUpdate }: {
  action: PlanAction
  mod: PlanModule
  actionsData: Record<string, ActionData>
  onUpdate: (id: string, payload: Partial<ActionData>) => void
}) {
  const data = actionsData[action.id] || {} as ActionData
  const done = data.completed || false
  const score = data.evaluation_score || null
  const [showDetails, setShowDetails] = useState(false)
  const [localNotes, setLocalNotes] = useState(data.notes || "")
  const [localGoals, setLocalGoals] = useState(data.goals || "")
  const notesTimer = useRef<NodeJS.Timeout>()
  const goalsTimer = useRef<NodeJS.Timeout>()

  useEffect(() => { setLocalNotes(data.notes || "") }, [data.notes])
  useEffect(() => { setLocalGoals(data.goals || "") }, [data.goals])

  const EvIcon = () => {
    if (!score) return <Clock className="w-4 h-4 text-gray-400" />
    if (score >= 4) return <CheckSquare className="w-4 h-4 text-green-500" />
    if (score >= 3) return <AlertTriangle className="w-4 h-4 text-amber-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  return (
    <div className={`border rounded-lg p-4 ${done ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
      <div className="flex gap-3">
        <button onClick={() => onUpdate(action.id, { completed: !done })} className="mt-1 flex-shrink-0">
          {done
            ? <CheckCircle className="w-5 h-5 text-green-600" />
            : <Circle className="w-5 h-5 text-gray-300" />}
        </button>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 bg-gray-100 text-gray-600`}>
              <Timer className="w-3 h-3" />{action.time}
            </span>
            <span className={`w-2 h-2 rounded-full ${mod.colorDot}`} />
            <EvIcon />
          </div>
          <p className="text-sm font-medium text-gray-800">{action.text}</p>

          {action.howTo && (
            <>
              <button
                className="text-xs text-blue-600 font-medium hover:text-blue-800"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Ocultar guía ↑" : "Ver guía paso a paso ↓"}
              </button>
              {showDetails && (
                <div className="bg-blue-50 border-l-2 border-blue-300 pl-3 py-2 rounded-r text-xs text-gray-700 space-y-1">
                  <p className="font-semibold mb-1">Cómo hacerlo:</p>
                  {action.howTo.map((s, i) => <p key={i}>• {s}</p>)}
                  {action.deliverable && (
                    <div className="mt-2 bg-white p-2 rounded text-xs">
                      <strong>📎 Entregable:</strong> {action.deliverable}
                    </div>
                  )}
                  {action.questions && (
                    <>
                      <p className="font-semibold mt-2">Preguntas de coaching:</p>
                      {action.questions.map((q, i) => <p key={i} className="italic text-blue-700">"{q}"</p>)}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-600">¿Qué esperas lograr con esta acción?</label>
            <textarea
              value={localGoals}
              onChange={(e) => {
                setLocalGoals(e.target.value)
                clearTimeout(goalsTimer.current)
                goalsTimer.current = setTimeout(() => onUpdate(action.id, { goals: e.target.value }), 800)
              }}
              placeholder="Define tu meta o resultado esperado..."
              className="w-full text-xs border border-gray-200 rounded p-2 resize-none focus:outline-none focus:border-blue-400"
              rows={2}
            />
          </div>

          {done && (
            <div className="space-y-3 pt-3 border-t border-green-200">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Evaluación de calidad (1-5):</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => onUpdate(action.id, { evaluation_score: n, evaluation_date: new Date().toISOString().split("T")[0] })}
                      className={`w-8 h-8 rounded text-xs font-bold transition-colors ${score === n ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {data.evaluation_date && (
                  <p className="text-xs text-gray-400">Evaluado: {score}/5 el {data.evaluation_date}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Resultados observados y reflexión:</label>
                <textarea
                  value={localNotes}
                  onChange={(e) => {
                    setLocalNotes(e.target.value)
                    clearTimeout(notesTimer.current)
                    notesTimer.current = setTimeout(() => onUpdate(action.id, { notes: e.target.value }), 800)
                  }}
                  placeholder="¿Qué lograste realmente? ¿Se cumplió la meta?"
                  className="w-full text-xs border border-green-200 rounded p-2 resize-none focus:outline-none focus:border-green-400"
                  rows={3}
                />
              </div>

              {localGoals && (
                <div className="bg-gray-50 rounded p-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">Estado:</span>
                    {!score ? (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">SIN EVALUAR</span>
                    ) : score >= 4 ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">META CUMPLIDA</span>
                    ) : score >= 3 ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">PARCIAL</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">NO CUMPLIDA</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500"><strong>Meta:</strong> {localGoals.substring(0, 100)}{localGoals.length > 100 ? "…" : ""}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── DEVELOPMENT PLAN ────────────────────────────────────────────────────────

export default function DevelopmentPlan({ leader }: DevelopmentPlanProps) {
  const level: LeaderLevel = getLeaderLevel(leader.name)
  const type: LeaderType = getLeaderType(leader.name)
  const levelLabel = LEVEL_LABELS[level]
  const levelColors = LEVEL_COLORS[level]
  const typeColors = TYPE_COLORS[type]

  const [actionsData, setActionsData] = useState<Record<string, ActionData>>({})
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [topicAverages, setTopicAverages] = useState<Record<string, { avg: number; count: number }>>({})
  const [showAll, setShowAll] = useState(false)

  // Acciones según nivel + tipo del líder:
  //  - Estratégico            → actionsE
  //  - Táctico + líder formal  → actionsT (tareas con equipo a cargo)
  //  - Táctico + líder proceso → actionsP (tareas de líder de proyecto)
  const getActions = (mod: PlanModule): PlanAction[] => {
    if (level === "estrategico") return mod.actionsE
    if (type === "proceso") return mod.actionsP
    return mod.actionsT
  }

  useEffect(() => {
    setLoading(true)
    setActionsData({})
    setTopicAverages({})
    setExpandedModule(null)

    Promise.all([
      supabase.from("development_actions").select("*").eq("leader_id", leader.id),
      supabase.from("followups").select("followup_topics (rating, topics (name))").eq("leader_id", leader.id),
    ]).then(([actionsRes, followupsRes]) => {
      if (!actionsRes.error && actionsRes.data) {
        const map: Record<string, ActionData> = {}
        actionsRes.data.forEach((row: any) => { map[row.action_id] = row })
        setActionsData(map)
        setLastSync(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }))
      }
      if (!followupsRes.error && followupsRes.data) {
        const ratingsMap: Record<string, number[]> = {}
        followupsRes.data.forEach((f: any) => {
          f.followup_topics?.forEach((ft: any) => {
            if (!ft.topics?.name || !ft.rating) return
            const key = normalizeText(ft.topics.name)
            if (!ratingsMap[key]) ratingsMap[key] = []
            ratingsMap[key].push(ft.rating)
          })
        })
        const avgMap: Record<string, { avg: number; count: number }> = {}
        Object.entries(ratingsMap).forEach(([key, values]) => {
          avgMap[key] = { avg: values.reduce((a, b) => a + b, 0) / values.length, count: values.length }
        })
        setTopicAverages(avgMap)
      }
      setLoading(false)
    })
  }, [leader.id])

  const handleUpdate = useCallback(async (actionId: string, payload: Partial<ActionData>) => {
    setActionsData((prev) => ({
      ...prev,
      [actionId]: { ...(prev[actionId] || {} as ActionData), ...payload }
    }))
    setSyncing(true)
    setSyncError(false)

    const moduleId = MODULES.find((m) => getActions(m).some((a) => a.id === actionId))?.id || ""
    const current = actionsData[actionId] || {} as ActionData
    const merged = { ...current, ...payload }

    const { error } = await supabase.from("development_actions").upsert({
      leader_id: leader.id,
      action_id: actionId,
      module_id: moduleId,
      completed: merged.completed || false,
      evaluation_score: merged.evaluation_score || null,
      evaluation_date: merged.evaluation_date || null,
      notes: merged.notes || null,
      goals: merged.goals || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "leader_id,action_id" })

    setSyncing(false)
    if (!error) {
      setLastSync(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }))
    } else {
      setSyncError(true)
    }
  }, [leader.id, actionsData, level, type])

  const modulesWithScore = MODULES.map((mod) => {
    const key = normalizeText(mod.title)
    const stat = topicAverages[key]
    return { ...mod, avgScore: stat?.avg ?? null, ratingsCount: stat?.count ?? 0 }
  })

  const hasAnyFollowupData = Object.keys(topicAverages).length > 0
  const lowMediumModules = modulesWithScore.filter((m) => m.avgScore !== null && m.avgScore < 4)
  const visibleModules = !hasAnyFollowupData
    ? modulesWithScore
    : showAll || lowMediumModules.length === 0 ? modulesWithScore : lowMediumModules

  const totalActions = visibleModules.reduce((a, m) => a + getActions(m).length, 0)
  const visibleActionIds = new Set(visibleModules.flatMap((m) => getActions(m).map((a) => a.id)))
  const doneCount = Object.entries(actionsData).filter(([id, d]) => d.completed && visibleActionIds.has(id)).length
  const progress = totalActions > 0 ? Math.round((doneCount / totalActions) * 100) : 0
  const evalList = Object.entries(actionsData).filter(([id, d]) => d.evaluation_score && visibleActionIds.has(id))
  const avgScore = evalList.length > 0
    ? (evalList.reduce((s, [, d]) => s + (d.evaluation_score || 0), 0) / evalList.length).toFixed(1)
    : null

  const getModProgress = (mod: PlanModule) => {
    const actions = getActions(mod)
    const done = actions.filter((a) => actionsData[a.id]?.completed).length
    return Math.round((done / actions.length) * 100)
  }

  const getScoreLevel = (avg: number | null) => {
    if (avg === null) return null
    if (avg < 3) return { label: "Crítico", color: "bg-red-100 text-red-700 border-red-200" }
    if (avg < 4) return { label: "A fortalecer", color: "bg-amber-100 text-amber-700 border-amber-200" }
    return { label: "Fortaleza", color: "bg-green-100 text-green-700 border-green-200" }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3" />
      <p className="text-sm">Cargando plan de desarrollo...</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Leader card con badge de nivel */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${levelColors.bg}`}>
            {level === "estrategico"
              ? <Building2 className={`w-5 h-5 ${levelColors.text}`} />
              : <Shield className={`w-5 h-5 ${levelColors.text}`} />
            }
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900">{leader.name}</h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${levelColors.badge}`}>
                {levelLabel}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${typeColors.badge}`}>
                {TYPE_LABELS_SHORT[type]}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasAnyFollowupData
                ? `Plan personalizado · ${visibleModules.length} de ${MODULES.length} competencias a trabajar`
                : `Plan ${level === "estrategico" ? "estratégico" : type === "proceso" ? "táctico · líder de proyecto" : "táctico · con equipo"} · 7 competencias · acciones de impacto rápido`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {syncError ? (
            <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-medium">
              <CloudOff className="w-3 h-3" /> Sin conexión
            </span>
          ) : syncing ? (
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" /> Guardando...
            </span>
          ) : lastSync ? (
            <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-full font-medium">
              <Cloud className="w-3 h-3" /> Guardado {lastSync}
            </span>
          ) : null}
          <button
            onClick={() => {
              setLoading(true)
              supabase.from("development_actions").select("*").eq("leader_id", leader.id).then(({ data }) => {
                if (data) { const map: Record<string, ActionData> = {}; data.forEach((r: any) => { map[r.action_id] = r }); setActionsData(map) }
                setLoading(false)
              })
            }}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progreso */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap text-sm text-gray-700 mb-3">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span>Progreso: <strong>{progress}%</strong></span>
          <span className="text-gray-400">{doneCount}/{totalActions} acciones</span>
          {avgScore && <span className="ml-auto text-purple-600 font-medium">Calidad promedio: <strong>{avgScore}/5</strong></span>}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Banners de filtro */}
      {hasAnyFollowupData && lowMediumModules.length > 0 && !showAll && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Filter className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h4 className="font-semibold text-sm text-amber-900">
                Plan enfocado en {lowMediumModules.length} {lowMediumModules.length === 1 ? "competencia" : "competencias"} a fortalecer
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                Según los seguimientos realizados, estas son las competencias con calificación baja o media que requieren prioridad.
              </p>
            </div>
            <button
              onClick={() => setShowAll(true)}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 bg-white border border-amber-200 px-3 py-1.5 rounded-lg whitespace-nowrap"
            >
              Ver todas
            </button>
          </div>
        </div>
      )}

      {hasAnyFollowupData && lowMediumModules.length === 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-green-900">Todas las competencias evaluadas en nivel alto</h4>
              <p className="text-xs text-green-800 mt-1">
                Se muestra el plan completo para consolidar las fortalezas del líder.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasAnyFollowupData && showAll && lowMediumModules.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-blue-800">
            Mostrando todas las competencias. Las prioritarias están marcadas como "A fortalecer" o "Crítico".
          </p>
          <button onClick={() => setShowAll(false)} className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-3 py-1.5 rounded-lg">
            Ver solo prioritarias
          </button>
        </div>
      )}

      {!hasAnyFollowupData && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800">Aún no hay seguimientos calificados</h4>
            <p className="text-xs text-gray-600 mt-1">
              Una vez que registres seguimientos con calificaciones, el plan se ajustará para mostrar primero las competencias con menor calificación.
            </p>
          </div>
        </div>
      )}

      {/* Módulos */}
      {visibleModules.map((mod) => {
        const isOpen = expandedModule === mod.id
        const mp = getModProgress(mod)
        const level_ = getScoreLevel(mod.avgScore)
        const actions = getActions(mod)

        const ModIcon = () => {
          if (mod.icon === "message") return <MessageCircle className="w-5 h-5" />
          if (mod.icon === "book") return <GraduationCap className="w-5 h-5" />
          if (mod.icon === "zap") return <Zap className="w-5 h-5" />
          if (mod.icon === "wrench") return <Wrench className="w-5 h-5" />
          if (mod.icon === "sparkles") return <Sparkles className="w-5 h-5" />
          if (mod.icon === "compass") return <Compass className="w-5 h-5" />
          return <Users className="w-5 h-5" />
        }

        return (
          <div key={mod.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
              onClick={() => setExpandedModule(isOpen ? null : mod.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${mod.colorBg} ${mod.colorText}`}>
                  <ModIcon />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-900">{mod.title}</h4>
                    {level_ && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${level_.color}`}>
                        {level_.label}
                      </span>
                    )}
                    {mod.avgScore !== null && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {mod.avgScore.toFixed(1)}/5 ({mod.ratingsCount})
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{actions.length} acciones · impacto rápido</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-700">{mp}%</span>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full ${mod.colorFill} rounded-full transition-all`} style={{ width: `${mp}%` }} />
                  </div>
                </div>
                {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
              </div>
            </div>
            <p className="text-xs text-gray-500 px-4 pb-3">{mod.objective}</p>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3 bg-gray-50">
                {(() => {
                  const comp = findCompetency(mod.title)
                  if (!comp || comp.pending) return null
                  return (
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">
                        Definición de la competencia
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">{comp.definition}</p>
                    </div>
                  )
                })()}
                {actions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    mod={mod}
                    actionsData={actionsData}
                    onUpdate={handleUpdate}
                  />
                ))}

                {/* Cursos Sitti */}
                {mod.sittiCourses?.length > 0 && (
                  <div className="mt-4 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                        Cursos Talento Sitti recomendados
                      </span>
                    </div>
                    <div className="space-y-2">
                      {mod.sittiCourses.map((course) => (
                        <a
                          key={course.title}
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                            <GraduationCap className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                                {course.title}
                              </span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">{course.duration}</span>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-purple-500" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{course.description}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
