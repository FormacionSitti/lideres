"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { RadarBaseline } from "@/components/radar-baseline"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface PlanRadarComparisonProps {
  leaderId: number
  leaderName: string
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

export default function PlanRadarComparison({
  leaderId,
  leaderName,
}: PlanRadarComparisonProps) {
  const [averageData, setAverageData] = useState<{ label: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from("followups")
      .select("followup_topics (rating, topics (name))")
      .eq("leader_id", leaderId)
      .then(({ data, error }) => {
        if (!error && data) {
          const ratingsMap: Record<string, { name: string; values: number[] }> = {}
          data.forEach((f: any) => {
            f.followup_topics?.forEach((ft: any) => {
              if (!ft.topics?.name || !ft.rating) return
              const key = normalizeText(ft.topics.name)
              if (!ratingsMap[key]) ratingsMap[key] = { name: ft.topics.name, values: [] }
              ratingsMap[key].values.push(ft.rating)
            })
          })
          const avg = Object.values(ratingsMap).map((t) => ({
            label: t.name,
            value: t.values.reduce((a, b) => a + b, 0) / t.values.length,
          }))
          setAverageData(avg)
        }
        setLoading(false)
      })
  }, [leaderId])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
        Cargando radar comparativo...
      </div>
    )
  }

  return (
    <RadarBaseline
      leaderId={leaderId}
      leaderName={leaderName}
      averageData={averageData}
    />
  )
}
