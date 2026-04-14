"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
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

// Colores para cada sesion (del mas claro/antiguo al mas oscuro/reciente)
const SESSION_COLORS = [
  "#bfdbfe", // Azul muy claro - Sesion 1
  "#93c5fd", // Azul claro - Sesion 2
  "#60a5fa", // Azul medio - Sesion 3
  "#3b82f6", // Azul - Sesion 4
  "#2563eb", // Azul oscuro - Sesion 5
  "#1d4ed8", // Azul muy oscuro - Sesion 6
  "#1e40af", // Azul profundo - Sesion 7
  "#1e3a8a", // Azul marino - Sesion 8
]

export function RadarEvolution({ followups, leaderName }: RadarEvolutionProps) {
  // Ordenar followups por fecha (mas antiguo primero)
  const sortedFollowups = useMemo(() => {
    return [...followups].sort((a, b) => {
      const dateA = a.followup_date || a.created_at || ""
      const dateB = b.followup_date || b.created_at || ""
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })
  }, [followups])

  // Calcular datos del radar para cada sesion
  const sessionData = useMemo(() => {
    return sortedFollowups.map((followup, index) => {
      const data = DIMENSIONS.map((dimension) => {
        const topic = followup.topics.find((t) => t.name === dimension)
        return {
          dimension,
          value: topic?.rating || 0,
        }
      })

      const validData = data.filter((d) => d.value > 0)
      const average = validData.length > 0 
        ? data.reduce((sum, d) => sum + d.value, 0) / validData.length 
        : 0

      return {
        sessionNumber: index + 1,
        date: followup.followup_date || followup.created_at || new Date().toISOString(),
        type: followup.type,
        data,
        average,
      }
    })
  }, [sortedFollowups])

  // Calcular evolucion (comparar primera vs ultima sesion)
  const evolution = useMemo(() => {
    if (sessionData.length < 2) return null

    const first = sessionData[0]
    const last = sessionData[sessionData.length - 1]

    return DIMENSIONS.map((dimension) => {
      const firstValue = first.data.find((d) => d.dimension === dimension)?.value || 0
      const lastValue = last.data.find((d) => d.dimension === dimension)?.value || 0
      const change = lastValue - firstValue

      return {
        dimension,
        firstValue,
        lastValue,
        change,
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
      }
    })
  }, [sessionData])

  if (sessionData.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">
          No hay sesiones de acompanamiento registradas para mostrar la evolucion.
        </p>
      </Card>
    )
  }

  // Crear datasets para todas las sesiones con colores progresivos
  const allSessionsDatasets = sessionData.map((session, index) => ({
    label: `Sesion ${session.sessionNumber} - ${
      session.date 
        ? format(parseISO(session.date), "dd/MM/yy", { locale: es })
        : "Sin fecha"
    }`,
    data: session.data,
    color: SESSION_COLORS[index % SESSION_COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {/* Radar con todas las sesiones superpuestas */}
      <Card className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">Evolucion del Radar: {leaderName}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {sessionData.length} acompanamiento{sessionData.length !== 1 ? "s" : ""} registrado{sessionData.length !== 1 ? "s" : ""}
          </p>
        </div>

        <RadarChart
          datasets={allSessionsDatasets}
          dimensions={DIMENSIONS}
          maxValue={5}
          size={420}
          showLegend={true}
        />

        {/* Leyenda de colores por sesion */}
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 mb-3 text-center">Sesiones de Acompanamiento</p>
          <div className="flex flex-wrap justify-center gap-3">
            {sessionData.map((session, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white"
                style={{ borderColor: SESSION_COLORS[index % SESSION_COLORS.length] }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: SESSION_COLORS[index % SESSION_COLORS.length] }}
                />
                <div className="text-xs">
                  <p className="font-medium">Sesion {session.sessionNumber}</p>
                  <p className="text-gray-500">
                    {session.date 
                      ? format(parseISO(session.date), "d MMM yyyy", { locale: es })
                      : "Sin fecha"}
                  </p>
                  <p className={`font-semibold ${
                    session.average >= 4 ? "text-green-600" :
                    session.average >= 3 ? "text-blue-600" :
                    "text-amber-600"
                  }`}>
                    Prom: {session.average.toFixed(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabla de evolucion */}
      {evolution && sessionData.length >= 2 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">
            Evolucion: Sesion 1 vs Sesion {sessionData.length}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-3 font-semibold">Dimension</th>
                  <th className="text-center py-3 px-3 font-semibold">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SESSION_COLORS[0] }} />
                      Inicial
                    </div>
                  </th>
                  <th className="text-center py-3 px-3 font-semibold">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SESSION_COLORS[Math.min(sessionData.length - 1, SESSION_COLORS.length - 1)] }} />
                      Actual
                    </div>
                  </th>
                  <th className="text-center py-3 px-3 font-semibold">Cambio</th>
                  <th className="text-center py-3 px-3 font-semibold">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {evolution.map((item, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-700">{item.dimension}</td>
                    <td className="text-center py-3 px-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {item.firstValue > 0 ? item.firstValue.toFixed(1) : "-"}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.lastValue >= 4 ? "bg-green-50 text-green-700" :
                        item.lastValue >= 3 ? "bg-blue-50 text-blue-700" :
                        item.lastValue > 0 ? "bg-amber-50 text-amber-700" :
                        "bg-gray-50 text-gray-500"
                      }`}>
                        {item.lastValue > 0 ? item.lastValue.toFixed(1) : "-"}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.change > 0 ? "bg-green-100 text-green-700" :
                        item.change < 0 ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {item.firstValue > 0 && item.lastValue > 0
                          ? `${item.change > 0 ? "+" : ""}${item.change.toFixed(1)}`
                          : "-"}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      {item.firstValue > 0 && item.lastValue > 0 ? (
                        item.trend === "up" ? (
                          <div className="flex items-center justify-center gap-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-medium">Mejora</span>
                          </div>
                        ) : item.trend === "down" ? (
                          <div className="flex items-center justify-center gap-1 text-red-600">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-xs font-medium">Baja</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-gray-500">
                            <Minus className="w-4 h-4" />
                            <span className="text-xs font-medium">Estable</span>
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
          </div>
          
          {/* Resumen de evolucion */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {evolution.filter(e => e.trend === "up").length}
                </p>
                <p className="text-xs text-gray-500">Dimensiones en mejora</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-500">
                  {evolution.filter(e => e.trend === "stable").length}
                </p>
                <p className="text-xs text-gray-500">Dimensiones estables</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {evolution.filter(e => e.trend === "down").length}
                </p>
                <p className="text-xs text-gray-500">Dimensiones en retroceso</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
