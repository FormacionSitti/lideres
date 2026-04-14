"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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

// Colores vibrantes y distintivos para cada sesión
const SESSION_COLORS = [
  { fill: "rgba(37, 99, 235, 0.25)", stroke: "#2563eb", bg: "#dbeafe" },
  { fill: "rgba(220, 38, 38, 0.25)", stroke: "#dc2626", bg: "#fee2e2" },
  { fill: "rgba(22, 163, 74, 0.25)", stroke: "#16a34a", bg: "#dcfce7" },
  { fill: "rgba(147, 51, 234, 0.25)", stroke: "#9333ea", bg: "#f3e8ff" },
  { fill: "rgba(234, 88, 12, 0.25)", stroke: "#ea580c", bg: "#ffedd5" },
  { fill: "rgba(219, 39, 119, 0.25)", stroke: "#db2777", bg: "#fce7f3" },
  { fill: "rgba(13, 148, 136, 0.25)", stroke: "#0d9488", bg: "#ccfbf1" },
  { fill: "rgba(202, 138, 4, 0.25)", stroke: "#ca8a04", bg: "#fef9c3" },
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

  // Calcular datos para cada sesión
  const sessionData = useMemo(() => {
    return sortedFollowups.map((followup, index) => {
      const data = DIMENSIONS.map((dimension) => {
        const topic = followup.topics.find((t) => t.name === dimension)
        return topic?.rating || 0
      })

      const validValues = data.filter((v) => v > 0)
      const average = validValues.length > 0 
        ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length 
        : 0

      return {
        sessionNumber: index + 1,
        date: followup.followup_date || followup.created_at || "",
        type: followup.type,
        data,
        average,
        color: SESSION_COLORS[index % SESSION_COLORS.length],
      }
    })
  }, [sortedFollowups])

  // Toggle selección de sesión
  const toggleSession = (sessionNumber: number) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionNumber)
        ? prev.filter((s) => s !== sessionNumber)
        : [...prev, sessionNumber]
    )
  }

  // Seleccionar todas
  const selectAll = () => {
    setSelectedSessions(sessionData.map((s) => s.sessionNumber))
  }

  // Deseleccionar todas
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

  // Configuración del radar
  const size = 420
  const center = size / 2
  const maxRadius = size / 2 - 60
  const levels = 5

  // Calcular punto para cada dimensión
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / DIMENSIONS.length - Math.PI / 2
    const radius = (value / 5) * maxRadius
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  // Generar path para un polígono completo
  const generatePolygonPath = (values: number[]) => {
    const points = values.map((value, index) => getPoint(index, value))
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
  }

  // Sesiones seleccionadas para mostrar
  const sessionsToShow = sessionData.filter((s) => selectedSessions.includes(s.sessionNumber))

  // Calcular evolución entre primera y última sesión seleccionada
  const evolution = useMemo(() => {
    if (sessionsToShow.length < 2) return null

    const sortedSelected = [...sessionsToShow].sort((a, b) => a.sessionNumber - b.sessionNumber)
    const first = sortedSelected[0]
    const last = sortedSelected[sortedSelected.length - 1]

    return DIMENSIONS.map((dimension, idx) => {
      const firstValue = first.data[idx]
      const lastValue = last.data[idx]
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
          Evolución del Radar: {leaderName}
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Selecciona las sesiones que deseas comparar en el radar
        </p>

        {/* Selector de sesiones */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">Sesiones de acompañamiento:</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Seleccionar todas
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
                    isSelected
                      ? "shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  style={{
                    borderColor: isSelected ? session.color.stroke : undefined,
                    backgroundColor: isSelected ? session.color.bg : undefined,
                  }}
                >
                  <Checkbox
                    id={`session-${session.sessionNumber}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleSession(session.sessionNumber)}
                    className="pointer-events-none"
                  />
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.color.stroke }}
                  />
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-semibold cursor-pointer block">
                      Sesión {session.sessionNumber}
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

        {/* Radar Chart SVG */}
        {selectedSessions.length > 0 ? (
          <div className="flex justify-center">
            <svg width={size} height={size} className="overflow-visible">
              {/* Polígonos de fondo (niveles 1-5) */}
              {Array.from({ length: levels }).map((_, i) => {
                const levelValue = i + 1
                const points = DIMENSIONS.map((_, idx) => {
                  const point = getPoint(idx, levelValue)
                  return `${point.x},${point.y}`
                }).join(" ")
                return (
                  <polygon
                    key={i}
                    points={points}
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Líneas desde el centro a cada vértice */}
              {DIMENSIONS.map((_, index) => {
                const point = getPoint(index, 5)
                return (
                  <line
                    key={index}
                    x1={center}
                    y1={center}
                    x2={point.x}
                    y2={point.y}
                    stroke="#d1d5db"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Polígonos de datos (sesiones seleccionadas) - ordenados para que el más reciente quede arriba */}
              {[...sessionsToShow]
                .sort((a, b) => a.sessionNumber - b.sessionNumber)
                .map((session) => (
                  <path
                    key={session.sessionNumber}
                    d={generatePolygonPath(session.data)}
                    fill={session.color.fill}
                    stroke={session.color.stroke}
                    strokeWidth="3"
                  />
                ))}

              {/* Puntos en cada vértice */}
              {[...sessionsToShow]
                .sort((a, b) => a.sessionNumber - b.sessionNumber)
                .map((session) =>
                  session.data.map((value, index) => {
                    if (value === 0) return null
                    const point = getPoint(index, value)
                    return (
                      <circle
                        key={`${session.sessionNumber}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        fill={session.color.stroke}
                        stroke="white"
                        strokeWidth="2"
                      />
                    )
                  })
                )}

              {/* Etiquetas de dimensiones */}
              {DIMENSIONS.map((dimension, index) => {
                const angle = (Math.PI * 2 * index) / DIMENSIONS.length - Math.PI / 2
                const labelRadius = maxRadius + 45
                const x = center + labelRadius * Math.cos(angle)
                const y = center + labelRadius * Math.sin(angle)

                let textAnchor: "start" | "middle" | "end" = "middle"
                if (x < center - 20) textAnchor = "end"
                else if (x > center + 20) textAnchor = "start"

                // Truncar nombres largos
                const displayName = dimension.length > 22 
                  ? dimension.substring(0, 20) + "..." 
                  : dimension

                return (
                  <text
                    key={index}
                    x={x}
                    y={y}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    className="text-[11px] fill-gray-600 font-medium"
                  >
                    {displayName}
                  </text>
                )
              })}

              {/* Etiquetas de niveles */}
              {Array.from({ length: levels }).map((_, i) => {
                const levelValue = i + 1
                return (
                  <text
                    key={i}
                    x={center + 8}
                    y={center - (levelValue / 5) * maxRadius}
                    className="text-[10px] fill-gray-400"
                  >
                    {levelValue}
                  </text>
                )
              })}
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center h-72 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500">Selecciona al menos una sesión para ver el radar</p>
          </div>
        )}

        {/* Leyenda de sesiones seleccionadas */}
        {sessionsToShow.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {sessionsToShow
              .sort((a, b) => a.sessionNumber - b.sessionNumber)
              .map((session) => (
                <div
                  key={session.sessionNumber}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border-2"
                  style={{ 
                    borderColor: session.color.stroke,
                    backgroundColor: session.color.bg 
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: session.color.stroke }}
                  />
                  <span className="font-semibold text-sm" style={{ color: session.color.stroke }}>
                    Sesión {session.sessionNumber}
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
        )}
      </Card>

      {/* Tabla de comparación detallada */}
      {evolution && sessionsToShow.length >= 2 && (
        <Card className="p-6 overflow-x-auto">
          <h4 className="text-md font-semibold mb-4">
            Comparación: Sesión {evolution[0].firstSession} vs Sesión {evolution[0].lastSession}
          </h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-3 font-semibold">Dimensión</th>
                <th className="text-center py-3 px-3 font-semibold">
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: sessionsToShow.sort((a,b) => a.sessionNumber - b.sessionNumber)[0]?.color.stroke }} 
                    />
                    Sesión {evolution[0].firstSession}
                  </div>
                </th>
                <th className="text-center py-3 px-3 font-semibold">
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: sessionsToShow.sort((a,b) => a.sessionNumber - b.sessionNumber)[sessionsToShow.length - 1]?.color.stroke }} 
                    />
                    Sesión {evolution[0].lastSession}
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

          {/* Resumen de evolución */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <h5 className="font-semibold mb-3 text-center">Resumen de Evolución</h5>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {evolution.filter(e => e.trend === "up" && e.firstValue > 0 && e.lastValue > 0).length}
                </p>
                <p className="text-xs text-green-700 font-medium">En mejora</p>
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
                <p className="text-xs text-red-700 font-medium">En retroceso</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
