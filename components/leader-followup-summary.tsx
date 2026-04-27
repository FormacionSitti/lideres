"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { MessageSquare, TrendingUp, Calendar, Star } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface Leader {
  id: number
  name: string
}

interface Followup {
  id: number
  sequence_number: number
  type: string
  observations: string | null
  agreements: string | null
  followup_date: string
  next_followup_date: string | null
  followup_topics: Array<{
    rating: number
    topics: { id: number; name: string } | null
  }>
}

interface LeaderFollowupSummaryProps {
  leader: Leader
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

export default function LeaderFollowupSummary({ leader }: LeaderFollowupSummaryProps) {
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setFollowups([])
    supabase
      .from("followups")
      .select(
        `id, sequence_number, type, observations, agreements, followup_date, next_followup_date,
        followup_topics (rating, topics (id, name))`,
      )
      .eq("leader_id", leader.id)
      .order("followup_date", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setFollowups(data as any)
        setLoading(false)
      })
  }, [leader.id])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
        Cargando seguimientos...
      </div>
    )
  }

  if (followups.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Aún no hay seguimientos registrados para este líder.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Los seguimientos aparecerán aquí una vez que se registren desde el Panel de Seguimientos.
        </p>
      </div>
    )
  }

  // Calcular promedios por tema
  const topicMap = new Map<string, { name: string; ratings: number[] }>()
  followups.forEach((f) => {
    f.followup_topics?.forEach((ft) => {
      if (!ft.topics?.name || !ft.rating) return
      const key = normalizeText(ft.topics.name)
      const entry = topicMap.get(key) || { name: ft.topics.name, ratings: [] }
      entry.ratings.push(ft.rating)
      topicMap.set(key, entry)
    })
  })

  const averages = Array.from(topicMap.values())
    .map((t) => ({
      name: t.name,
      average: t.ratings.reduce((a, b) => a + b, 0) / t.ratings.length,
      count: t.ratings.length,
    }))
    .sort((a, b) => b.average - a.average)

  const totalFollowups = followups.length
  const lastFollowup = followups[0]
  const overallAvg =
    averages.length > 0
      ? averages.reduce((s, t) => s + t.average, 0) / averages.length
      : 0

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return date
    }
  }

  return (
    <div className="space-y-4">
      {/* Resumen general */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-sm text-gray-800">
            Resumen de Seguimientos Realizados
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium">Total seguimientos</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{totalFollowups}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-medium">Promedio general</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {overallAvg.toFixed(1)}
              <span className="text-sm font-medium text-purple-500">/5</span>
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium">Último seguimiento</p>
            <p className="text-sm font-bold text-green-700 mt-2">
              {formatDate(lastFollowup.followup_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Promedio por tema */}
      {averages.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold text-sm text-gray-800">
              Calificaciones Promedio por Tema
            </h3>
          </div>
          <div className="space-y-2">
            {averages.map((t) => {
              const pct = (t.average / 5) * 100
              const color =
                t.average >= 4
                  ? "bg-green-500"
                  : t.average >= 3
                    ? "bg-amber-500"
                    : "bg-red-500"
              return (
                <div key={t.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium">{t.name}</span>
                    <span className="text-gray-500">
                      <Star className="w-3 h-3 inline mr-1 text-amber-400" />
                      {t.average.toFixed(1)}/5{" "}
                      <span className="text-gray-400">({t.count})</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Últimos seguimientos: observaciones y acuerdos */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-sm text-gray-800">
            Últimos Seguimientos: Observaciones y Acuerdos
          </h3>
        </div>
        <div className="space-y-3">
          {followups.slice(0, 3).map((f) => (
            <div
              key={f.id}
              className="border-l-2 border-blue-200 pl-3 py-1 space-y-1"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  #{f.sequence_number}
                </span>
                <span className="text-gray-500">{formatDate(f.followup_date)}</span>
                <span className="text-gray-400 capitalize">· {f.type}</span>
              </div>
              {f.observations && (
                <div className="text-xs text-gray-700">
                  <strong className="text-gray-900">Observaciones:</strong>{" "}
                  {f.observations}
                </div>
              )}
              {f.agreements && (
                <div className="text-xs text-gray-700">
                  <strong className="text-gray-900">Acuerdos:</strong>{" "}
                  {f.agreements}
                </div>
              )}
            </div>
          ))}
        </div>
        {followups.length > 3 && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            Mostrando los 3 más recientes de {followups.length} seguimientos.
          </p>
        )}
      </div>
    </div>
  )
}
