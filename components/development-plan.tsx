"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  CheckCircle, Circle, Users, MessageCircle, GraduationCap,
  Zap, Wrench, Sparkles, Compass, Target,
  ChevronDown, ChevronRight, AlertTriangle, TrendingUp,
  CheckSquare, XCircle, Clock, Cloud, CloudOff, RefreshCw
} from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Leader {
  id: number
  name: string
}

interface ActionData {
  action_id: string
  completed: boolean
  evaluation_score: number | null
  evaluation_date: string | null
  notes: string | null
  goals: string | null
}

interface DevelopmentPlanProps {
  leader: Leader
}

// ─── DATOS ───────────────────────────────────────────────────────────────────

const MODULES = [
  {
    id: "liderazgo", title: "Liderazgo cercano",
    icon: "users", weeks: "1-2",
    colorBg: "bg-blue-100", colorText: "text-blue-600", colorBar: "bg-blue-500", colorDot: "bg-blue-500",
    colorBorder: "border-blue-200", colorFill: "bg-blue-500",
    objective: "Mide la gestión del líder con el equipo. Construir presencia, escucha activa y vínculo de confianza con cada integrante.",
    actions: [
      { id: "lid1", week: 1, text: "Realizar conversaciones uno a uno con cada miembro del equipo (45 min)", howTo: ["Agendar en bloques sin interrupciones", "Indagar: trabajo, motivación y necesidades de apoyo", "Tomar notas estructuradas por persona"], deliverable: "Matriz de insights individuales por colaborador", questions: ["¿Qué necesitas de mí como líder?", "¿En qué momentos te sientes más apoyado?", "¿Qué barreras estás enfrentando hoy?"] },
      { id: "lid2", week: 1, text: "Mapear estilos de trabajo y necesidades individuales", howTo: ["Identificar perfil de cada miembro (autónomo, colaborativo, directivo)", "Adaptar estilo de gestión por persona", "Documentar preferencias de comunicación"], deliverable: "Mapa de estilos del equipo" },
      { id: "lid3", week: 2, text: "Establecer rutinas de presencia activa con el equipo", howTo: ["Saludo intencional al inicio del día", "Bloquear 30 min/día para estar disponible en piso", "Visitar cada puesto al menos 1 vez por semana"], deliverable: "Calendario de presencia activa" },
      { id: "lid4", week: 2, text: "Habilitar canal directo y accesible de feedback ascendente", howTo: ["Definir canal (chat, formulario anónimo, buzón)", "Comunicarlo formalmente al equipo", "Responder cada feedback en menos de 48h"], deliverable: "Canal de feedback ascendente activo" },
    ]
  },
  {
    id: "comunicacion", title: "Comunicación",
    icon: "message", weeks: "2-3",
    colorBg: "bg-cyan-100", colorText: "text-cyan-600", colorBar: "bg-cyan-500", colorDot: "bg-cyan-500",
    colorBorder: "border-cyan-200", colorFill: "bg-cyan-500",
    objective: "Mide la alineación estratégica del equipo. Asegurar que todos comparten el mismo norte y entienden su rol en el resultado.",
    actions: [
      { id: "com1", week: 2, text: "Definir y comunicar la visión estratégica del equipo", howTo: ["Redactar visión en 1 frase clara y memorable", "Conectarla con objetivos trimestrales", "Presentarla al equipo en reunión dedicada"], deliverable: "Documento de visión y narrativa estratégica" },
      { id: "com2", week: 2, text: "Estructurar reunión semanal de alineación con agenda fija", howTo: ["Día y hora fijos, máximo 45 min", "Agenda: prioridades, bloqueos, métricas, acuerdos", "Acta breve enviada en menos de 2h"], deliverable: "Plantilla de agenda y actas semanales" },
      { id: "com3", week: 3, text: "Implementar protocolo de comunicación clara: qué, quién, cuándo", howTo: ["Definir canales por tipo de mensaje (urgente, informativo, decisión)", "Documentar acuerdos de respuesta", "Difundir el protocolo y revisarlo con el equipo"], deliverable: "Manual de comunicación del equipo" },
      { id: "com4", week: 3, text: "Auditar comunicación actual e identificar brechas de alineación", howTo: ["Encuesta corta al equipo sobre claridad estratégica", "Identificar 3 mensajes que se entienden distinto", "Plan de cierre de brechas"], deliverable: "Reporte de auditoría de comunicación" },
    ]
  },
  {
    id: "aprendizaje", title: "Cultura de aprendizaje",
    icon: "book", weeks: "3-4",
    colorBg: "bg-green-100", colorText: "text-green-600", colorBar: "bg-green-500", colorDot: "bg-green-500",
    colorBorder: "border-green-200", colorFill: "bg-green-500",
    objective: "Mide el aprendizaje a nivel de equipo. Convertir cada experiencia y error en conocimiento útil para todos.",
    actions: [
      { id: "apr1", week: 3, text: "Crear espacio quincenal de aprendizaje compartido", howTo: ["Sesión de 30 min cada 2 semanas", "Cada vez un miembro presenta un tema o caso", "Capturar 3 takeaways accionables"], deliverable: "Calendario de sesiones y bitácora de takeaways" },
      { id: "apr2", week: 3, text: "Implementar retrospectivas regulares del equipo", howTo: ["Frecuencia: mensual mínimo", "Formato: qué funcionó, qué no, qué cambiamos", "Definir 1-3 acciones concretas con responsable"], deliverable: "Acta de retrospectiva con acciones" },
      { id: "apr3", week: 4, text: "Establecer mentorías cruzadas internas", howTo: ["Mapear fortalezas complementarias del equipo", "Crear duplas mentor-aprendiz por 8 semanas", "Facilitar primera sesión de cada dupla"], deliverable: "Red de mentorías internas" },
      { id: "apr4", week: 4, text: "Documentar lecciones aprendidas de proyectos clave", howTo: ["Plantilla simple: contexto, decisión, resultado, lección", "Repositorio compartido y accesible", "Revisar el banco de lecciones cada mes"], deliverable: "Repositorio de lecciones aprendidas" },
    ]
  },
  {
    id: "decisiones", title: "Toma de decisiones ágil y efectiva",
    icon: "zap", weeks: "4-5",
    colorBg: "bg-amber-100", colorText: "text-amber-600", colorBar: "bg-amber-500", colorDot: "bg-amber-500",
    colorBorder: "border-amber-200", colorFill: "bg-amber-500",
    objective: "Mide la rapidez y criterio en decisiones. Decidir mejor y más rápido sin sacrificar calidad ni alineación.",
    actions: [
      { id: "dec1", week: 4, text: "Definir framework de toma de decisiones (RACI o similar)", howTo: ["Listar tipos de decisiones recurrentes", "Asignar Responsable, Aprobador, Consultado, Informado", "Difundir y validar con el equipo"], deliverable: "Matriz RACI del equipo" },
      { id: "dec2", week: 4, text: "Identificar y eliminar cuellos de botella decisionales", howTo: ["Listar las últimas 10 decisiones lentas", "Identificar dónde se atascó cada una", "Definir nuevo flujo o delegación"], deliverable: "Plan de aceleración decisional" },
      { id: "dec3", week: 5, text: "Empoderar al equipo con autonomía decisional clara", howTo: ["Definir umbrales: qué decide cada rol sin escalar", "Comunicar y respaldar las decisiones tomadas", "Revisar resultados sin micro-gestionar"], deliverable: "Documento de niveles de autonomía" },
      { id: "dec4", week: 5, text: "Establecer indicadores de calidad y velocidad de decisiones", howTo: ["Definir 2-3 métricas (tiempo de ciclo, reversiones, impacto)", "Tablero visible al equipo", "Revisión mensual de tendencias"], deliverable: "Dashboard de decisiones" },
    ]
  },
  {
    id: "resolucion", title: "Resolución táctico-estratégica de problemas",
    icon: "wrench", weeks: "5-6",
    colorBg: "bg-orange-100", colorText: "text-orange-600", colorBar: "bg-orange-500", colorDot: "bg-orange-500",
    colorBorder: "border-orange-200", colorFill: "bg-orange-500",
    objective: "Mide la capacidad de resolver problemas estructurales. Atacar las causas raíz y diseñar soluciones sistémicas, no parches.",
    actions: [
      { id: "res1", week: 5, text: "Mapear problemas estructurales recurrentes del área", howTo: ["Listar los 10 problemas más frecuentes en 90 días", "Clasificar: táctico vs estructural", "Priorizar por impacto y frecuencia"], deliverable: "Matriz de problemas priorizados" },
      { id: "res2", week: 5, text: "Aplicar análisis de causa raíz a 3 problemas críticos", howTo: ["Usar técnica de 5 Por qués o Ishikawa", "Documentar causas reales (no síntomas)", "Validar hallazgos con el equipo"], deliverable: "Reporte de causa raíz por problema" },
      { id: "res3", week: 6, text: "Diseñar soluciones sistémicas (no parches)", howTo: ["Para cada causa raíz definir solución de fondo", "Validar viabilidad y recursos requeridos", "Asignar responsable y fecha"], deliverable: "Plan de soluciones estructurales" },
      { id: "res4", week: 6, text: "Implementar mecanismos de prevención y monitoreo", howTo: ["Definir señales tempranas para cada problema", "Crear tablero de seguimiento", "Revisión quincenal del estado"], deliverable: "Sistema de prevención activo" },
    ]
  },
  {
    id: "motivacion", title: "Motivación e innovación",
    icon: "sparkles", weeks: "6-7",
    colorBg: "bg-rose-100", colorText: "text-rose-600", colorBar: "bg-rose-500", colorDot: "bg-rose-500",
    colorBorder: "border-rose-200", colorFill: "bg-rose-500",
    objective: "Mide la capacidad de inspirar y transformar. Activar la energía del equipo y abrir espacios para nuevas ideas.",
    actions: [
      { id: "mot1", week: 6, text: "Identificar drivers individuales de motivación", howTo: ["Conversación dirigida con cada miembro (20 min)", "Indagar: logro, autonomía, propósito, dominio, vínculo", "Documentar driver principal de cada persona"], deliverable: "Mapa de motivadores del equipo" },
      { id: "mot2", week: 6, text: "Crear espacio para ideas e iniciativas del equipo", howTo: ["Buzón o canal de ideas siempre abierto", "Sesión mensual para revisar y priorizar", "Compromiso de respuesta a cada propuesta"], deliverable: "Espacio de ideación activo" },
      { id: "mot3", week: 7, text: "Implementar reconocimiento por innovación e iniciativa", howTo: ["Definir criterios claros de reconocimiento", "Reconocer públicamente al menos 1 caso por mes", "Mezclar reconocimiento simbólico y tangible"], deliverable: "Programa de reconocimiento por innovación" },
      { id: "mot4", week: 7, text: "Diseñar reto trimestral de innovación", howTo: ["Definir desafío conectado al negocio", "Equipos pequeños proponen soluciones", "Espacio final para presentar e implementar la mejor"], deliverable: "Reto de innovación lanzado" },
    ]
  },
  {
    id: "vision", title: "Visión transformadora",
    icon: "compass", weeks: "7-8",
    colorBg: "bg-indigo-100", colorText: "text-indigo-600", colorBar: "bg-indigo-500", colorDot: "bg-indigo-500",
    colorBorder: "border-indigo-200", colorFill: "bg-indigo-500",
    objective: "Mide la capacidad de evolucionar y mejorar. Anticipar el futuro del área y guiar al equipo hacia un mejor estado.",
    actions: [
      { id: "vis1", week: 7, text: "Articular visión transformadora del área a 12 meses", howTo: ["Imaginar el área dentro de 1 año", "Describirla en 3 dimensiones: equipo, procesos, resultados", "Validarla con stakeholders clave"], deliverable: "Documento de visión a 12 meses" },
      { id: "vis2", week: 7, text: "Identificar oportunidades de evolución del modelo actual", howTo: ["Auditar procesos clave: qué deja de tener sentido", "Comparar con buenas prácticas externas", "Listar 5 oportunidades de transformación"], deliverable: "Lista priorizada de oportunidades" },
      { id: "vis3", week: 8, text: "Co-crear roadmap de transformación con el equipo", howTo: ["Taller con el equipo para definir hitos trimestrales", "Asignar líderes de cada iniciativa", "Visualizar el roadmap en formato accesible"], deliverable: "Roadmap de transformación a 12 meses" },
      { id: "vis4", week: 8, text: "Establecer métricas de evolución y mejora continua", howTo: ["Definir 3-5 indicadores de transformación", "Línea base actual y meta a 6 y 12 meses", "Revisión mensual con el equipo"], deliverable: "Tablero de evolución del área" },
    ]
  }
]

// ─── ACTION CARD ─────────────────────────────────────────────────────────────

function ActionCard({ action, mod, actionsData, onUpdate }: {
  action: any, mod: any, actionsData: Record<string, ActionData>, onUpdate: (id: string, payload: Partial<ActionData>) => void
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Semana {action.week}
            </span>
            <span className={`w-2 h-2 rounded-full ${mod.colorDot}`} />
            <EvIcon />
          </div>
          <p className="text-sm text-gray-800">{action.text}</p>

          {action.howTo && (
            <>
              <button
                className="text-xs text-blue-600 font-medium hover:text-blue-800"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Ocultar detalles ↑" : "Ver detalles ↓"}
              </button>
              {showDetails && (
                <div className="bg-blue-50 border-l-2 border-blue-300 pl-3 py-2 rounded-r text-xs text-gray-700 space-y-1">
                  <p className="font-semibold mb-1">Cómo hacerlo:</p>
                  {action.howTo.map((s: string, i: number) => <p key={i}>• {s}</p>)}
                  {action.deliverable && (
                    <div className="mt-2 bg-white p-2 rounded text-xs">
                      <strong>📎 Entregable:</strong> {action.deliverable}
                    </div>
                  )}
                  {action.questions && (
                    <>
                      <p className="font-semibold mt-2">Preguntas clave:</p>
                      {action.questions.map((q: string, i: number) => <p key={i}>? {q}</p>)}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Meta */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-600">Meta / Proyección inicial:</label>
            <textarea
              value={localGoals}
              onChange={(e) => {
                setLocalGoals(e.target.value)
                clearTimeout(goalsTimer.current)
                goalsTimer.current = setTimeout(() => onUpdate(action.id, { goals: e.target.value }), 800)
              }}
              placeholder="Define qué esperas lograr..."
              className="w-full text-xs border border-gray-200 rounded p-2 resize-none focus:outline-none focus:border-blue-400"
              rows={2}
            />
          </div>

          {/* Evaluación (solo si completada) */}
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
  const [actionsData, setActionsData] = useState<Record<string, ActionData>>({})
  const [expandedModule, setExpandedModule] = useState<string | null>("liderazgo")
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setActionsData({})
    supabase
      .from("development_actions")
      .select("*")
      .eq("leader_id", leader.id)
      .then(({ data, error }) => {
        if (!error && data) {
          const map: Record<string, ActionData> = {}
          data.forEach((row: any) => { map[row.action_id] = row })
          setActionsData(map)
          setLastSync(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }))
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

    const moduleId = MODULES.find((m) => m.actions.some((a) => a.id === actionId))?.id || ""
    const current = actionsData[actionId] || {} as ActionData
    const merged = { ...current, ...payload }

    const { error } = await supabase
      .from("development_actions")
      .upsert({
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
  }, [leader.id, actionsData])

  const totalActions = MODULES.reduce((a, m) => a + m.actions.length, 0)
  const doneCount = Object.values(actionsData).filter((d) => d.completed).length
  const progress = Math.round((doneCount / totalActions) * 100)
  const evalList = Object.values(actionsData).filter((d) => d.evaluation_score)
  const avgScore = evalList.length > 0
    ? (evalList.reduce((s, d) => s + (d.evaluation_score || 0), 0) / evalList.length).toFixed(1)
    : null

  const getModProgress = (modId: string) => {
    const mod = MODULES.find((m) => m.id === modId)!
    const done = mod.actions.filter((a) => actionsData[a.id]?.completed).length
    return Math.round((done / mod.actions.length) * 100)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3" />
      <p className="text-sm">Cargando progreso desde Supabase...</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Leader card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-blue-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{leader.name}</h3>
            <p className="text-xs text-gray-500">Plan integral de liderazgo · 8 semanas · 7 dimensiones</p>
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

      {/* Progress */}
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

      {/* Modules */}
      {MODULES.map((mod) => {
        const isOpen = expandedModule === mod.id
        const mp = getModProgress(mod.id)
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
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${mod.colorBg} ${mod.colorText}`}>
                  <ModIcon />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{mod.title}</h4>
                  <span className="text-xs text-gray-500">Semanas {mod.weeks} · {mod.actions.length} acciones</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
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
                {mod.actions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    mod={mod}
                    actionsData={actionsData}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
