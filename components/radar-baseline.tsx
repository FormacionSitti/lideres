"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { RadarChart } from "@/components/radar-chart"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Save,
  CheckCircle2,
  Edit3,
  PlayCircle,
  Flag,
  RotateCcw,
  Sparkles,
} from "lucide-react"

const DIMENSIONS = [
  { key: "liderazgo_cercano", label: "Liderazgo cercano" },
  { key: "resolucion_problemas", label: "Resolución táctico-estratégica de problemas" },
  { key: "vision_transformadora", label: "Visión transformadora" },
  { key: "toma_decisiones", label: "Toma de decisiones ágil y efectiva" },
  { key: "cultura_aprendizaje", label: "Cultura de aprendizaje" },
  { key: "comunicacion", label: "Comunicación" },
  { key: "motivacion_innovacion", label: "Motivación e innovación" },
] as const

type DimensionKey = (typeof DIMENSIONS)[number]["key"]

const DIMENSION_LABELS = DIMENSIONS.map((d) => d.label)

const COLOR_INITIAL = "#f59e0b" // amber - punto de partida (autoevaluacion)
const COLOR_AVG = "#2563eb" // azul - promedio actual de seguimientos
const COLOR_FINAL = "#16a34a" // verde - radar final (cierre)

interface AssessmentRow {
  id: string
  leader_id: number
  assessment_type: "initial" | "final"
  liderazgo_cercano: number | null
  resolucion_problemas: number | null
  vision_transformadora: number | null
  toma_decisiones: number | null
  cultura_aprendizaje: number | null
  comunicacion: number | null
  motivacion_innovacion: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface RadarBaselineProps {
  leaderId: number
  leaderName: string
  averageData: { label: string; value: number }[]
}

type FormState = Record<DimensionKey, string>

function emptyForm(): FormState {
  return {
    liderazgo_cercano: "",
    resolucion_problemas: "",
    vision_transformadora: "",
    toma_decisiones: "",
    cultura_aprendizaje: "",
    comunicacion: "",
    motivacion_innovacion: "",
  }
}

function rowToForm(row: AssessmentRow | null): FormState {
  const form = emptyForm()
  if (!row) return form
  DIMENSIONS.forEach((d) => {
    const v = row[d.key]
    if (v !== null && v !== undefined) {
      form[d.key] = String(v)
    }
  })
  return form
}

function rowToRadarData(row: AssessmentRow | null) {
  if (!row) return []
  return DIMENSIONS.map((d) => ({
    dimension: d.label,
    value: row[d.key] !== null && row[d.key] !== undefined ? Number(row[d.key]) : 0,
  }))
}

function avgOfRow(row: AssessmentRow | null): number | null {
  if (!row) return null
  const values = DIMENSIONS.map((d) => row[d.key]).filter(
    (v): v is number => v !== null && v !== undefined,
  )
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function RadarBaseline({ leaderId, leaderName, averageData }: RadarBaselineProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [initialAssessment, setInitialAssessment] = useState<AssessmentRow | null>(null)
  const [finalAssessment, setFinalAssessment] = useState<AssessmentRow | null>(null)
  const [showInitialForm, setShowInitialForm] = useState(false)
  const [savingInitial, setSavingInitial] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [notes, setNotes] = useState("")

  const fetchAssessments = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getLeaderAssessments",
          data: { leader_id: leaderId },
        }),
      })
      if (!res.ok) throw new Error("No se pudieron cargar las autoevaluaciones")
      const { data } = await res.json()
      const initial = data?.find((a: AssessmentRow) => a.assessment_type === "initial") || null
      const final = data?.find((a: AssessmentRow) => a.assessment_type === "final") || null
      setInitialAssessment(initial)
      setFinalAssessment(final)
      setForm(rowToForm(initial))
      setNotes(initial?.notes || "")
    } catch (error: any) {
      console.error("[v0] Error obteniendo autoevaluaciones:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las autoevaluaciones.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssessments()
    setShowInitialForm(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderId])

  const validateValue = (raw: string): number | null => {
    if (raw.trim() === "") return null
    const n = Number(raw.replace(",", "."))
    if (Number.isNaN(n)) return null
    if (n < 1 || n > 5) return null
    return n
  }

  const handleSaveInitial = async () => {
    // Validar que todos los campos esten en rango 1-5 (permitir vacios para edicion parcial)
    const payload: Record<string, number | null | string | undefined> = {
      leader_id: leaderId,
      assessment_type: "initial",
      notes: notes || null,
    }
    let hasAtLeastOne = false
    for (const d of DIMENSIONS) {
      const raw = form[d.key]
      if (raw.trim() === "") {
        payload[d.key] = null
        continue
      }
      const n = validateValue(raw)
      if (n === null) {
        toast({
          title: "Valor inválido",
          description: `${d.label} debe ser un número entre 1 y 5.`,
          variant: "destructive",
        })
        return
      }
      payload[d.key] = n
      hasAtLeastOne = true
    }

    if (!hasAtLeastOne) {
      toast({
        title: "Faltan datos",
        description: "Ingresa al menos una calificación de la autoevaluación.",
        variant: "destructive",
      })
      return
    }

    setSavingInitial(true)
    try {
      const res = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveLeaderAssessment", data: payload }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al guardar la autoevaluación")
      }
      toast({
        title: "Autoevaluación guardada",
        description: "El Radar Inicial se ha actualizado.",
      })
      setShowInitialForm(false)
      await fetchAssessments()
    } catch (error: any) {
      console.error("[v0] Error guardando autoevaluacion:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSavingInitial(false)
    }
  }

  const handleFinalize = async () => {
    if (averageData.length === 0) {
      toast({
        title: "Sin seguimientos",
        description: "Necesitas al menos un seguimiento con calificaciones para finalizar.",
        variant: "destructive",
      })
      return
    }

    const confirmed = window.confirm(
      "¿Estás seguro de finalizar el proceso de seguimientos? Esto creará el Radar Final con los promedios actuales.",
    )
    if (!confirmed) return

    setFinalizing(true)
    try {
      const dimMap: Record<string, DimensionKey> = {
        "Liderazgo cercano": "liderazgo_cercano",
        "Resolución táctico-estratégica de problemas": "resolucion_problemas",
        "Visión transformadora": "vision_transformadora",
        "Toma de decisiones ágil y efectiva": "toma_decisiones",
        "Cultura de aprendizaje": "cultura_aprendizaje",
        "Comunicación": "comunicacion",
        "Motivación e innovación": "motivacion_innovacion",
      }

      const payload: Record<string, number | string | null> = {
        leader_id: leaderId,
        assessment_type: "final",
      }
      DIMENSIONS.forEach((d) => {
        payload[d.key] = null
      })

      averageData.forEach((item) => {
        const key = dimMap[item.label]
        if (key) {
          payload[key] = Number(item.value.toFixed(2))
        }
      })

      const res = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveLeaderAssessment", data: payload }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al finalizar")
      }
      toast({
        title: "Proceso finalizado",
        description: "Se ha generado el Radar Final con los promedios actuales.",
      })
      await fetchAssessments()
    } catch (error: any) {
      console.error("[v0] Error finalizando:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setFinalizing(false)
    }
  }

  const handleReopen = async () => {
    const confirmed = window.confirm(
      "¿Reabrir el proceso? Esto eliminará el Radar Final actual. La autoevaluación inicial se conservará.",
    )
    if (!confirmed) return

    setReopening(true)
    try {
      const res = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteLeaderAssessment",
          data: { leader_id: leaderId, assessment_type: "final" },
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al reabrir")
      }
      toast({
        title: "Proceso reabierto",
        description: "Puedes seguir registrando seguimientos.",
      })
      await fetchAssessments()
    } catch (error: any) {
      console.error("[v0] Error reabriendo:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setReopening(false)
    }
  }

  // Datos para el RadarChart combinado
  const datasets = useMemo(() => {
    const result: { label: string; data: { dimension: string; value: number }[]; color: string }[] = []

    if (initialAssessment) {
      result.push({
        label: "Radar Inicial",
        data: rowToRadarData(initialAssessment),
        color: COLOR_INITIAL,
      })
    }

    if (finalAssessment) {
      result.push({
        label: "Radar Final",
        data: rowToRadarData(finalAssessment),
        color: COLOR_FINAL,
      })
    } else if (averageData.length > 0) {
      // Mientras el proceso este en curso, mostrar el promedio dinamico
      result.push({
        label: "Radar Promedio",
        data: averageData.map((d) => ({ dimension: d.label, value: d.value })),
        color: COLOR_AVG,
      })
    }

    return result
  }, [initialAssessment, finalAssessment, averageData])

  const initialAvg = avgOfRow(initialAssessment)
  const finalAvg = avgOfRow(finalAssessment)
  const currentAvg =
    averageData.length > 0
      ? averageData.reduce((s, d) => s + d.value, 0) / averageData.length
      : null

  const isFinalized = !!finalAssessment

  // Mostrar evolucion inicial vs final
  const evolutionRows = useMemo(() => {
    if (!initialAssessment || !finalAssessment) return []
    return DIMENSIONS.map((d) => {
      const initial = initialAssessment[d.key]
      const final = finalAssessment[d.key]
      const change =
        initial !== null && initial !== undefined && final !== null && final !== undefined
          ? Number(final) - Number(initial)
          : null
      return {
        label: d.label,
        initial,
        final,
        change,
      }
    })
  }, [initialAssessment, finalAssessment])

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        <span className="ml-2 text-sm text-gray-600">Cargando autoevaluación...</span>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card principal con el radar */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Radar de Competencias: {leaderName}
            </h3>
            <p className="text-sm text-gray-500">
              {isFinalized
                ? "Proceso finalizado: comparación entre la autoevaluación inicial y el resultado final"
                : initialAssessment
                  ? "Autoevaluación inicial vs. promedio actual de seguimientos"
                  : "Promedio actual de seguimientos. Ingresa la autoevaluación inicial para comparar."}
            </p>
          </div>
          {isFinalized && (
            <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Finalizado
            </span>
          )}
        </div>

        {datasets.length > 0 ? (
          <div className="flex flex-col items-center">
            <RadarChart
              datasets={datasets}
              dimensions={DIMENSION_LABELS}
              maxValue={5}
              size={420}
              showLegend={false}
            />
            {/* Leyenda personalizada */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {initialAssessment && (
                <LegendBadge
                  color={COLOR_INITIAL}
                  label="Radar Inicial"
                  detail={
                    initialAvg !== null
                      ? `Autoevaluación · Prom: ${initialAvg.toFixed(1)}`
                      : "Autoevaluación"
                  }
                />
              )}
              {!isFinalized && currentAvg !== null && (
                <LegendBadge
                  color={COLOR_AVG}
                  label="Radar Promedio"
                  detail={`En curso · Prom: ${currentAvg.toFixed(1)}`}
                />
              )}
              {finalAssessment && (
                <LegendBadge
                  color={COLOR_FINAL}
                  label="Radar Final"
                  detail={finalAvg !== null ? `Cierre · Prom: ${finalAvg.toFixed(1)}` : "Cierre"}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500 text-sm text-center px-4">
              Aún no hay datos para mostrar. Ingresa la autoevaluación inicial o registra seguimientos.
            </p>
          </div>
        )}
      </Card>

      {/* Acciones */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Bloque autoevaluacion inicial */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Radar Inicial (Autoevaluación)</h4>
                <p className="text-xs text-gray-500">
                  {initialAssessment
                    ? `Registrada · Promedio ${initialAvg?.toFixed(1) ?? "-"}/5`
                    : "Aún no registrada por el líder."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForm(rowToForm(initialAssessment))
                setNotes(initialAssessment?.notes || "")
                setShowInitialForm((s) => !s)
              }}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {initialAssessment ? "Editar autoevaluación" : "Ingresar autoevaluación"}
            </Button>
          </div>

          {/* Bloque finalizar */}
          <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isFinalized ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                }`}
              >
                {isFinalized ? <CheckCircle2 className="w-5 h-5" /> : <Flag className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {isFinalized ? "Radar Final generado" : "Finalizar seguimientos"}
                </h4>
                <p className="text-xs text-gray-500">
                  {isFinalized
                    ? `Snapshot del cierre · Promedio ${finalAvg?.toFixed(1) ?? "-"}/5`
                    : currentAvg !== null
                      ? `Generará el Radar Final con el promedio actual (${currentAvg.toFixed(1)}/5).`
                      : "Registra al menos un seguimiento para poder finalizar."}
                </p>
              </div>
            </div>
            {isFinalized ? (
              <Button variant="outline" size="sm" onClick={handleReopen} disabled={reopening}>
                {reopening ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Reabrir proceso
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinalize}
                disabled={finalizing || averageData.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {finalizing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Flag className="w-4 h-4 mr-2" />
                )}
                Finalizar y generar Radar Final
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Formulario autoevaluacion inicial */}
      {showInitialForm && (
        <Card className="p-6 border-amber-200 bg-amber-50/40">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {initialAssessment ? "Editar Autoevaluación Inicial" : "Nueva Autoevaluación Inicial"}
              </h4>
              <p className="text-xs text-gray-500">
                Ingresa la calificación del líder en cada competencia (escala 1 a 5). Puedes dejar
                vacío lo que aún no se haya autoevaluado.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {DIMENSIONS.map((d) => (
              <div key={d.key} className="space-y-1.5">
                <Label htmlFor={`init-${d.key}`} className="text-sm">
                  {d.label}
                </Label>
                <Input
                  id={`init-${d.key}`}
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  inputMode="decimal"
                  placeholder="1.0 - 5.0"
                  value={form[d.key]}
                  onChange={(e) => setForm({ ...form, [d.key]: e.target.value })}
                  className="bg-white"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5 mb-4">
            <Label htmlFor="init-notes" className="text-sm">
              Notas (opcional)
            </Label>
            <Textarea
              id="init-notes"
              placeholder="Contexto de la autoevaluación, fecha, comentarios del líder..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white"
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowInitialForm(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveInitial}
              disabled={savingInitial}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {savingInitial ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar autoevaluación
            </Button>
          </div>
        </Card>
      )}

      {/* Comparativo Inicial vs Final */}
      {isFinalized && evolutionRows.length > 0 && (
        <Card className="p-6 overflow-x-auto">
          <h4 className="font-semibold text-gray-900 mb-4">Evolución: Inicial vs Final</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-3 font-semibold">Competencia</th>
                <th className="text-center py-3 px-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLOR_INITIAL }}
                    />
                    Inicial
                  </span>
                </th>
                <th className="text-center py-3 px-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLOR_FINAL }}
                    />
                    Final
                  </span>
                </th>
                <th className="text-center py-3 px-3 font-semibold">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {evolutionRows.map((row) => {
                const change = row.change
                const formatted =
                  row.initial !== null && row.final !== null && change !== null
                    ? `${change > 0 ? "+" : ""}${change.toFixed(1)}`
                    : "-"
                const changeClass =
                  change === null
                    ? "bg-gray-100 text-gray-500"
                    : change > 0
                      ? "bg-green-100 text-green-700"
                      : change < 0
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-500"
                return (
                  <tr key={row.label} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-700 font-medium">{row.label}</td>
                    <td className="text-center py-3 px-3 text-gray-700">
                      {row.initial !== null ? Number(row.initial).toFixed(1) : "-"}
                    </td>
                    <td className="text-center py-3 px-3 text-gray-700">
                      {row.final !== null ? Number(row.final).toFixed(1) : "-"}
                    </td>
                    <td className="text-center py-3 px-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${changeClass}`}
                      >
                        {formatted}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

function LegendBadge({
  color,
  label,
  detail,
}: {
  color: string
  label: string
  detail: string
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-white"
      style={{ borderColor: color }}
    >
      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-semibold text-sm" style={{ color }}>
        {label}
      </span>
      <span className="text-xs text-gray-600">{detail}</span>
    </div>
  )
}
