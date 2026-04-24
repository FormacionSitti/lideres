"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadarChart } from "@/components/radar-chart"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { Followup } from "@/lib/types"

interface RadarEvolutionProps {
  followups: Followup[]
  leaderName: string
}

const DIMENSIONS = [
  "Liderazgo cercano",
  "Resolución táctico-estratégica de problemas",
  "Visión transformadora",
  "Toma de decisiones ágil y efectiva",
  "Cultura de aprendizaje",
  "Comunicación",
  "Motivación e innovación",
]

// Colores vibrantes para las sesiones
const SESSION_COLORS = [
  { color: "#2563eb", bg: "#dbeafe", name: "Azul" },
  { color: "#dc2626", bg: "#fee2e2", name: "Rojo" },
  { color: "#16a34a", bg: "#dcfce7", name: "Verde" },
  { color: "#9333ea", bg: "#f3e8ff", name: "Morado" },
  { color: "#ea580c", bg: "#ffedd5", name: "Naranja" },
  { color: "#db2777", bg: "#fce7f3", name: "Rosa" },
  { color: "#0d9488", bg: "#ccfbf1", name: "Teal" },
  { color: "#ca8a04", bg: "#fef9c3", name: "Amarillo" },
]

export function RadarEvolution({ followups, leaderName }: RadarEvolutionProps) {
  const [selectedSessions, setSelectedSessions] = useState<number[]>([])

  // Ordenar followups por fecha
  const sortedFollowups = useMemo(() => {
    return [...followups].sort((a, b) => {
      const dateA = a.followup_date || a.created_at || ""
      const dateB = b.followup_date || b.created_at || ""
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })
  }, [followups])

  // Calcular datos para cada sesion
  const sessionData = useMemo(() => {
    return sortedFollowups.map((followup, index) => {
      const data = DIMENSIONS.map((dimension) => {
        // Buscar coincidencia exacta o normalizada (sin tildes)
        const normalizedDimension = dimension.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        const topic = followup.topics.find((t) => {
          const normalizedTopic = t.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
          return normalizedTopic === normalizedDimension || t.name === dimension
        })
        return {
          dimension,
          value: topic?.rating || 0,
        }
      })

      const validValues = data.filter((d) => d.value > 0)
      const average = validValues.length > 0 
        ? validValues.reduce((sum, d) => sum + d.value, 0) / validValues.length 
        : 0

      return {
        sessionNumber: index + 1,
        date: followup.followup_date || followup.created_at || "",
        type: followup.type,
        data,
        average,
        colorInfo: SESSION_COLORS[index % SESSION_COLORS.length],
      }
    })
  }, [sortedFollowups])

  const toggleSession = (sessionNumber: number) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionNumber)
        ? prev.filter((s) => s !== sessionNumber)
        : [...prev, sessionNumber]
    )
  }

  const selectAll = () => {
    setSelectedSessions(sessionData.map((s) => s.sessionNumber))
  }

  const clearSelection = () => {
    setSelectedSessions([])
  }

  if (sessionData.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No hay sesiones para mostrar</p>
      </Card>
    )
  }

  // Sesiones seleccionadas
  const sessionsToShow = sessionData.filter((s) => selectedSessions.includes(s.sessionNumber))

  // Generar datasets para RadarChart
  const datasets = sessionsToShow
    .sort((a, b) => a.sessionNumber - b.sessionNumber)
    .map((session) => ({
      label: `Sesión ${session.sessionNumber}`,
      data: session.data,
      color: session.colorInfo.color,
    }))

  // Calcular evolucion
  const evolution = useMemo(() => {
    if (sessionsToShow.length < 2) return null

    const sortedSelected = [...sessionsToShow].sort((a, b) => a.sessionNumber - b.sessionNumber)
    const first = sortedSelected[0]
    const last = sortedSelected[sortedSelected.length - 1]

    return DIMENSIONS.map((dimension, idx) => {
      const firstData = first.data.find((d) => d.dimension === dimension)
      const lastData = last.data.find((d) => d.dimension === dimension)
      const firstValue = firstData?.value || 0
      const lastValue = lastData?.value || 0
      const change = lastValue - firstValue

      return {
        dimension,
        firstValue,
        lastValue,
        change,
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
        firstSession: first.sessionNumber,
        lastSession: last.sessionNumber,
      }
    })
  }, [sessionsToShow])

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-center mb-2">
          Evolucion del Radar: {leaderName}
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Selecciona las sesiones que deseas comparar
        </p>

        {/* Selector de sesiones */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">Sesiones de acompañamiento:</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Todas
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Limpiar
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sessionData.map((session) => {
              const isSelected = selectedSessions.includes(session.sessionNumber)
              return (
                <div
                  key={session.sessionNumber}
                  onClick={() => toggleSession(session.sessionNumber)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected ? "shadow-md" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  style={{
                    borderColor: isSelected ? session.colorInfo.color : undefined,
                    backgroundColor: isSelected ? session.colorInfo.bg : undefined,
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSession(session.sessionNumber)}
                    className="pointer-events-none"
                  />
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.colorInfo.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-semibold cursor-pointer block">
                      Sesion {session.sessionNumber}
                    </Label>
                    <p className="text-xs text-gray-500">
                      {session.date
                        ? format(parseISO(session.date), "dd MMM yyyy", { locale: es })
                        : "-"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Radar Chart */}
        {datasets.length > 0 ? (
          <div className="flex flex-col items-center">
            <RadarChart
              datasets={datasets}
              dimensions={DIMENSIONS}
              maxValue={5}
              size={420}
              showLegend={false}
            />

            {/* Leyenda personalizada */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {sessionsToShow
                .sort((a, b) => a.sessionNumber - b.sessionNumber)
                .map((session) => (
                  <div
                    key={session.sessionNumber}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-2"
                    style={{ 
                      borderColor: session.colorInfo.color,
                      backgroundColor: session.colorInfo.bg 
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: session.colorInfo.color }}
                    />
                    <span className="font-semibold text-sm" style={{ color: session.colorInfo.color }}>
                      Sesion {session.sessionNumber}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {session.date
                        ? format(parseISO(session.date), "dd/MM/yy", { locale: es })
                        : "-"}
                    </span>
                    <span className="text-gray-500 text-sm">
                      Prom: {session.average.toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500">Selecciona al menos una sesion para ver el radar</p>
          </div>
        )}
      </Card>

      {/* Tabla de comparacion */}
      {evolution && sessionsToShow.length >= 2 && (
        <Card className="p-6 overflow-x-auto">
          <h4 className="text-md font-semibold mb-4">
            Comparacion: Sesion {evolution[0].firstSession} vs Sesion {evolution[0].lastSession}
          </h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-3 font-semibold">Dimension</th>
                <th className="text-center py-3 px-3 font-semibold">
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: sessionsToShow.sort((a,b) => a.sessionNumber - b.sessionNumber)[0]?.colorInfo.color }} 
                    />
                    Sesion {evolution[0].firstSession}
                  </div>
                </th>
                <th className="text-center py-3 px-3 font-semibold">
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: sessionsToShow.sort((a,b) => a.sessionNumber - b.sessionNumber)[sessionsToShow.length - 1]?.colorInfo.color }} 
                    />
                    Sesion {evolution[0].lastSession}
                  </div>
                </th>
                <th className="text-center py-3 px-3 font-semibold">Cambio</th>
                <th className="text-center py-3 px-3 font-semibold">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {evolution.map((item, index) => (
                <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-700 font-medium">{item.dimension}</td>
                  <td className="text-center py-3 px-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      item.firstValue >= 4 ? "bg-green-100 text-green-700" :
                      item.firstValue >= 3 ? "bg-blue-100 text-blue-700" :
                      item.firstValue > 0 ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {item.firstValue > 0 ? item.firstValue : "-"}
                    </span>
                  </td>
                  <td className="text-center py-3 px-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      item.lastValue >= 4 ? "bg-green-100 text-green-700" :
                      item.lastValue >= 3 ? "bg-blue-100 text-blue-700" :
                      item.lastValue > 0 ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {item.lastValue > 0 ? item.lastValue : "-"}
                    </span>
                  </td>
                  <td className="text-center py-3 px-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      item.change > 0 ? "bg-green-100 text-green-700" :
                      item.change < 0 ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {item.firstValue > 0 && item.lastValue > 0
                        ? `${item.change > 0 ? "+" : ""}${item.change}`
                        : "-"}
                    </span>
                  </td>
                  <td className="text-center py-3 px-3">
                    {item.firstValue > 0 && item.lastValue > 0 ? (
                      item.trend === "up" ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-xs font-semibold">Mejora</span>
                        </div>
                      ) : item.trend === "down" ? (
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <TrendingDown className="w-5 h-5" />
                          <span className="text-xs font-semibold">Baja</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-gray-500">
                          <Minus className="w-5 h-5" />
                          <span className="text-xs font-semibold">Estable</span>
                        </div>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Resumen */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <h5 className="font-semibold mb-3 text-center">Resumen de Evolucion</h5>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {evolution.filter(e => e.trend === "up" && e.firstValue > 0 && e.lastValue > 0).length}
                </p>
                <p className="text-xs text-green-700 font-medium">Mejoraron</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-3xl font-bold text-gray-600">
                  {evolution.filter(e => e.trend === "stable" && e.firstValue > 0 && e.lastValue > 0).length}
                </p>
                <p className="text-xs text-gray-700 font-medium">Estables</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">
                  {evolution.filter(e => e.trend === "down" && e.firstValue > 0 && e.lastValue > 0).length}
                </p>
                <p className="text-xs text-red-700 font-medium">Bajaron</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
