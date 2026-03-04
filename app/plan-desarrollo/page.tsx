"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import DevelopmentPlan from "@/components/development-plan"
import { Target, ArrowLeft } from "lucide-react"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Leader {
  id: number
  name: string
  created_at: string
}

export default function PlanDesarrolloPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLeaders = async () => {
      const { data, error } = await supabase
        .from("leaders")
        .select("*")
        .order("name", { ascending: true })

      if (!error && data && data.length > 0) {
        setLeaders(data)
        setSelectedLeader(data[0])
      }
      setLoading(false)
    }
    loadLeaders()
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Acompañamiento
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Plan de Desarrollo</h1>
              <p className="text-white/50 text-sm">Seguimiento de acciones — Sincronizado con Supabase</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Selector de líder */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Seleccionar líder:
          </label>
          {loading ? (
            <span className="text-sm text-gray-400">Cargando líderes...</span>
          ) : (
            <select
              value={selectedLeader?.id || ""}
              onChange={(e) => {
                const leader = leaders.find((l) => l.id.toString() === e.target.value)
                if (leader) setSelectedLeader(leader)
              }}
              className="flex-1 border-none bg-transparent text-sm text-gray-800 outline-none cursor-pointer"
            >
              {leaders.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Plan de Desarrollo */}
        {selectedLeader && (
          <DevelopmentPlan leader={selectedLeader} key={selectedLeader.id} />
        )}

        {!loading && leaders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No hay líderes registrados.</p>
            <Link href="/" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
              Agregar líderes desde Acompañamiento
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
