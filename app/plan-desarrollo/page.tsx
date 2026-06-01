"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import DevelopmentPlan from "@/components/development-plan"
import LeaderFollowupSummary from "@/components/leader-followup-summary"
import { RadarBaseline } from "@/components/radar-baseline"
import LeaderDocuments from "@/components/leader-documents"
import { Target, ArrowLeft, FileText, BarChart2, ClipboardList, BookOpen } from "lucide-react"
import Link from "next/link"
import { Toaster } from "@/components/ui/toaster"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Leader {
  id: number
  name: string
  created_at: string
}

type TabId = "resumen" | "radar" | "documentos" | "plan"

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "resumen", label: "Resumen", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "radar", label: "Radar de Competencias", icon: <Target className="w-4 h-4" /> },
  { id: "documentos", label: "Informes", icon: <FileText className="w-4 h-4" /> },
  { id: "plan", label: "Plan de Desarrollo", icon: <ClipboardList className="w-4 h-4" /> },
]

export default function PlanDesarrolloPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("resumen")
  const [averageData, setAverageData] = useState<{ label: string; value: number }[]>([])
  const [flaggedCompetencies, setFlaggedCompetencies] = useState<string[]>([])

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

  // Carga promedios de seguimientos para el RadarBaseline
  useEffect(() => {
    if (!selectedLeader) return
    setAverageData([])

    supabase
      .from("followups")
      .select("followup_topics (rating, topics (name))")
      .eq("leader_id", selectedLeader.id)
      .then(({ data, error }) => {
        if (error || !data) return
        const ratingsMap: Record<string, number[]> = {}
        data.forEach((f: any) => {
          f.followup_topics?.forEach((ft: any) => {
            if (!ft.topics?.name || !ft.rating) return
            const key = ft.topics.name
            if (!ratingsMap[key]) ratingsMap[key] = []
            ratingsMap[key].push(ft.rating)
          })
        })
        const avgs = Object.entries(ratingsMap).map(([label, values]) => ({
          label,
          value: values.reduce((a, b) => a + b, 0) / values.length,
        }))
        setAverageData(avgs)
      })
  }, [selectedLeader])

  const handleLeaderChange = (leaderId: string) => {
    const leader = leaders.find((l) => l.id.toString() === leaderId)
    if (leader) {
      setSelectedLeader(leader)
      setFlaggedCompetencies([])
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Acompañamiento
            </Link>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Plan de Desarrollo</h1>
                <p className="text-white/50 text-sm">Seguimiento de competencias — Sincronizado con Supabase</p>
              </div>
            </div>
            {/* Selector de líder en el header */}
            {!loading && leaders.length > 0 && (
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 flex items-center gap-3 min-w-[260px]">
                <span className="text-white/60 text-xs font-medium whitespace-nowrap">Líder:</span>
                <select
                  value={selectedLeader?.id || ""}
                  onChange={(e) => handleLeaderChange(e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm outline-none cursor-pointer"
                >
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id} className="text-gray-900 bg-white">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tabs en el header */}
          <div className="flex gap-1 mt-6 border-b border-white/10">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">Cargando líderes...</div>
        )}

        {!loading && leaders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No hay líderes registrados.</p>
            <Link href="/" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
              Agregar líderes desde Acompañamiento
            </Link>
          </div>
        )}

        {selectedLeader && (
          <>
            {/* Banner competencias desde informes cuando hay flagged */}
            {flaggedCompetencies.length > 0 && activeTab !== "documentos" && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-800">
                <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>
                  Los informes cargados identifican <strong>{flaggedCompetencies.length}</strong> competencias prioritarias a trabajar.
                  {" "}
                  <button onClick={() => setActiveTab("documentos")} className="underline font-semibold hover:text-blue-700">
                    Ver en Informes
                  </button>
                </span>
              </div>
            )}

            {activeTab === "resumen" && (
              <LeaderFollowupSummary leader={selectedLeader} key={`summary-${selectedLeader.id}`} />
            )}

            {activeTab === "radar" && (
              <RadarBaseline
                leaderId={selectedLeader.id}
                leaderName={selectedLeader.name}
                averageData={averageData}
                key={`radar-${selectedLeader.id}`}
              />
            )}

            {activeTab === "documentos" && (
              <LeaderDocuments
                leader={selectedLeader}
                key={`docs-${selectedLeader.id}`}
                onCompetenciesFlagged={setFlaggedCompetencies}
              />
            )}

            {activeTab === "plan" && (
              <DevelopmentPlan leader={selectedLeader} key={selectedLeader.id} />
            )}
          </>
        )}
      </div>
      <Toaster />
    </div>
  )
}
