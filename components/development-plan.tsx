"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  CheckCircle, Circle, Users, Heart, Eye, Target,
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
    id: "diagnostico", title: "Diagnóstico de Relación",
    icon: "eye", weeks: "1-2",
    colorBg: "bg-blue-100", colorText: "text-blue-600", colorBar: "bg-blue-500", colorDot: "bg-blue-500",
    colorBorder: "border-blue-200", colorFill: "bg-blue-500",
    objective: "Entender la perspectiva actual del equipo e identificar barreras específicas",
    actions: [
      { id: "diag1", week: 1, text: "Realizar conversaciones uno a uno individuales con cada miembro (45 min c/u)", howTo: ["Reservar sala privada, sin interrupciones", "Iniciar: 'Esta conversación es para entenderte mejor'", "Tomar notas en formato estructurado"], deliverable: "Matriz de insights por persona", questions: ["¿Cómo percibes mi estilo de liderazgo?", "¿En qué momentos te sientes más conectado?", "¿Qué necesitas de mí para sentirte más apoyado?"] },
      { id: "diag2", week: 1, text: "Mapear dinámicas grupales y roles informales del equipo", howTo: ["Observar 3 reuniones sin intervenir", "Registrar quién habla con quién, quién influye", "Identificar líderes informales"], deliverable: "Sociograma del equipo" },
      { id: "diag3", week: 2, text: "Identificar momentos críticos donde se rompe la conexión", howTo: ["Listar últimas 10 interacciones tensas", "Documentar: Fecha, Personas, Qué ocurrió", "Buscar patrones de comportamiento"], deliverable: "Cronología de desconexión con patrones" },
      { id: "diag4", week: 2, text: "Autoevaluación: analizar patrones propios de comunicación", howTo: ["Documentar 3 reuniones diferentes", "Análisis: interrupciones, % tiempo hablando", "Identificar muletillas condescendientes"], deliverable: "Plan de autoconciencia con 3 patrones problemáticos" },
    ]
  },
  {
    id: "construccion", title: "Construcción de Puentes",
    icon: "heart", weeks: "3-5",
    colorBg: "bg-green-100", colorText: "text-green-600", colorBar: "bg-green-500", colorDot: "bg-green-500",
    colorBorder: "border-green-200", colorFill: "bg-green-500",
    objective: "Implementar acciones específicas para generar cercanía y confianza",
    actions: [
      { id: "const1", week: 3, text: "Implementar 'Revisión emocional' al inicio de reuniones", howTo: ["Guión: 'En UNA palabra, ¿cómo llegan hoy?'", "Implementar en TODAS las reuniones por 2 semanas", "Llevar registro de participación"], deliverable: "Protocolo de revisión emocional" },
      { id: "const2", week: 3, text: "Crear rituales de reconocimiento individual y grupal", howTo: ["Momento fijo: viernes 4pm", "Formato 'Destacado': una persona diferente cada semana", "'Esta semana [Nombre] brilló cuando...'"], deliverable: "Sistema de reconocimiento semanal" },
      { id: "const3", week: 4, text: "Establecer 'Horas de oficina abierta' para conversaciones informales", howTo: ["Bloquear martes y jueves 3-4pm", "Sin agenda, solo conversación", "Primeros 10 min sobre temas NO laborales"], deliverable: "Calendario de disponibilidad" },
      { id: "const4", week: 5, text: "Participar activamente en espacios informales del equipo", howTo: ["Identificar espacios informales existentes", "Participar sin agenda de trabajo", "Escuchar más que hablar"], deliverable: "Mapa de espacios informales" },
      { id: "const5", week: 5, text: "Evaluar y ajustar estrategias basado en feedback inicial", howTo: ["Mini-encuesta de pulse al equipo", "Analizar datos de participación", "Identificar qué estrategias funcionan mejor"], deliverable: "Reporte de evaluación intermedia" },
    ]
  },
  {
    id: "fortalecimiento", title: "Fortalecimiento de Vínculos",
    icon: "users", weeks: "6-8",
    colorBg: "bg-purple-100", colorText: "text-purple-600", colorBar: "bg-purple-500", colorDot: "bg-purple-500",
    colorBorder: "border-purple-200", colorFill: "bg-purple-500",
    objective: "Consolidar relaciones sólidas y sostenibles con el equipo",
    actions: [
      { id: "fort1", week: 6, text: "Crear sistema de feedback continuo bidireccional", howTo: ["Check-in semanal de 10 minutos por persona", "Formato: ¿Cómo te sientes? ¿Qué necesitas? ¿Cómo voy yo?", "Canal digital para feedback anónimo"], deliverable: "Protocolo de feedback bidireccional" },
      { id: "fort2", week: 6, text: "Diseñar experiencias de equipo significativas", howTo: ["Co-crear con el equipo una actividad mensual", "Alternar desarrollo profesional y team building", "Asegurar participación de todos"], deliverable: "Calendario anual de experiencias" },
      { id: "fort3", week: 7, text: "Establecer mentorías cruzadas dentro del equipo", howTo: ["Mapear fortalezas complementarias", "Crear duplas de mentoría mutua por 3 meses", "Facilitar primera sesión de cada dupla"], deliverable: "Red de mentorías internas" },
      { id: "fort4", week: 8, text: "Crear rituales de cierre y continuidad", howTo: ["Ritual semanal de cierre que celebre logros", "Manual del equipo con valores acordados", "Sistema de seguimiento trimestral"], deliverable: "Manual del equipo y seguimiento cultural" },
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

  const ModIcon = () => {
    if (mod.icon === "eye") return <Eye className="w-5 h-5" />
    if (mod.icon === "heart") return <Heart className="w-5 h-5" />
    return <Users className="w-5 h-5" />
  }

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
  const [expandedModule, setExpandedModule] = useState<string | null>("diagnostico")
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
            <p className="text-xs text-gray-500">Comunicación Efectiva · 8 semanas</p>
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
          if (mod.icon === "eye") return <Eye className="w-5 h-5" />
          if (mod.icon === "heart") return <Heart className="w-5 h-5" />
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
