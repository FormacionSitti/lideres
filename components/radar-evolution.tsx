"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadarChart } from "@/components/radar-chart"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react"
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

const COLORS = [
  "#2563eb", // Azul
  "#16a34a", // Verde
  "#dc2626", // Rojo
  "#9333ea", // Morado
  "#ea580c", // Naranja
]

export function RadarEvolution({ followups, leaderName }: RadarEvolutionProps) {
  const [compareMode, setCompareMode] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Ordenar followups por fecha (más antiguo primero)
  const sortedFollowups = useMemo(() => {
    return [...followups].sort((a, b) => {
      const dateA = a.followup_date || a.created_at || ""
      const dateB = b.followup_date || b.created_at || ""
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })
  }, [followups])

  // Calcular datos del radar para cada sesión
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

  // Calcular evolución (comparar primera vs última sesión)
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
          No hay sesiones de acompañamiento registradas para mostrar la evolución.
        </p>
      </Card>
    )
  }

  const currentSession = sessionData[selectedIndex]
  const prevSession = selectedIndex > 0 ? sessionData[selectedIndex - 1] : null

  // Datasets para el modo comparación
  const comparisonDatasets = compareMode
    ? sessionData.slice(-3).map((session, index) => ({
        label: `Sesión ${session.sessionNumber}`,
        data: session.data,
        color: COLORS[index % COLORS.length],
      }))
    : [
        {
          label: `Sesión ${currentSession.sessionNumber}`,
          data: currentSession.data,
          color: COLORS[0],
        },
      ]

  return (
    <div className="space-y-6">
      {/* Navegación de sesiones */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Evolución del Radar: {leaderName}</h3>
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
            className={compareMode ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {compareMode ? "Modo Individual" : "Comparar Sesiones"}
          </Button>
        </div>

        {!compareMode && (
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
              disabled={selectedIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="font-medium">
                Sesión {currentSession.sessionNumber} de {sessionData.length}
              </p>
              <p className="text-sm text-gray-500">
                {currentSession.date 
                  ? format(parseISO(currentSession.date), "d 'de' MMMM, yyyy", { locale: es })
                  : "Fecha no disponible"}
              </p>
              <p className="text-xs text-gray-400 capitalize">{currentSession.type}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIndex(Math.min(sessionData.length - 1, selectedIndex + 1))}
              disabled={selectedIndex === sessionData.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Radar Chart */}
        <RadarChart
          datasets={comparisonDatasets}
          dimensions={DIMENSIONS}
          maxValue={5}
          size={380}
          showLegend={compareMode}
        />

        {/* Promedio de la sesión */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Promedio general:{" "}
            <span className="font-semibold text-blue-600">
              {currentSession.average.toFixed(2)}
            </span>
            {prevSession && (
              <span
                className={`ml-2 text-sm ${
                  currentSession.average > prevSession.average
                    ? "text-green-600"
                    : currentSession.average < prevSession.average
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                ({currentSession.average > prevSession.average ? "+" : ""}
                {(currentSession.average - prevSession.average).toFixed(2)} vs sesión anterior)
              </span>
            )}
          </p>
        </div>
      </Card>

      {/* Tabla de evolución */}
      {evolution && sessionData.length >= 2 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">
            Evolución: Sesión 1 vs Sesión {sessionData.length}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Dimensión</th>
                  <th className="text-center py-2 px-2">Inicial</th>
                  <th className="text-center py-2 px-2">Actual</th>
                  <th className="text-center py-2 px-2">Cambio</th>
                  <th className="text-center py-2 px-2">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {evolution.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2 px-2 text-gray-700">{item.dimension}</td>
                    <td className="text-center py-2 px-2">
                      {item.firstValue > 0 ? item.firstValue.toFixed(1) : "-"}
                    </td>
                    <td className="text-center py-2 px-2">
                      {item.lastValue > 0 ? item.lastValue.toFixed(1) : "-"}
                    </td>
                    <td
                      className={`text-center py-2 px-2 font-medium ${
                        item.change > 0
                          ? "text-green-600"
                          : item.change < 0
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {item.firstValue > 0 && item.lastValue > 0
                        ? `${item.change > 0 ? "+" : ""}${item.change.toFixed(1)}`
                        : "-"}
                    </td>
                    <td className="text-center py-2 px-2">
                      {item.firstValue > 0 && item.lastValue > 0 ? (
                        item.trend === "up" ? (
                          <TrendingUp className="w-4 h-4 text-green-600 mx-auto" />
                        ) : item.trend === "down" ? (
                          <TrendingDown className="w-4 h-4 text-red-600 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-gray-400 mx-auto" />
                        )
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Línea de tiempo */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">Línea de Tiempo de Sesiones</h4>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {sessionData.map((session, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedIndex(index)
                setCompareMode(false)
              }}
              className={`flex-shrink-0 p-3 rounded-lg border transition-all ${
                selectedIndex === index && !compareMode
                  ? "bg-blue-50 border-blue-400"
                  : "bg-white border-gray-200 hover:border-blue-200"
              }`}
            >
              <p className="font-medium text-sm">Sesión {session.sessionNumber}</p>
              <p className="text-xs text-gray-500">
                {session.date 
                  ? format(parseISO(session.date), "dd/MM/yy", { locale: es })
                  : "-"}
              </p>
              <p
                className={`text-xs font-medium mt-1 ${
                  session.average >= 4
                    ? "text-green-600"
                    : session.average >= 3
                    ? "text-blue-600"
                    : "text-amber-600"
                }`}
              >
                Prom: {session.average.toFixed(1)}
              </p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
