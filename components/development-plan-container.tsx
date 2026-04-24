"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DevelopmentPlanForm } from "@/components/development-plan-form"
import { DevelopmentPlanViewer } from "@/components/development-plan-viewer"
import { useToast } from "@/components/ui/use-toast"
import type { Topic, Followup } from "@/lib/types"
import { Plus, ArrowLeft } from "lucide-react"

interface Leader {
  id: number
  name: string
}

interface DevelopmentPlanContainerProps {
  leaders: Leader[]
  topics: Topic[]
}

interface DevelopmentPlan {
  id: string
  leader_id: number
  leader_name: string
  start_date: string
  end_date: string
  duration_months: number
  status: string
  overall_progress: number
  observations: string
  items: Array<{
    id: string
    topic_id: string
    topic_name: string
    target_rating: number
    current_rating: number
    progress: number
    activities: string
  }>
}

export function DevelopmentPlanContainer({ leaders, topics }: DevelopmentPlanContainerProps) {
  const [view, setView] = useState<"list" | "form" | "viewer">("list")
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null)
  const [leaderFollowups, setLeaderFollowups] = useState<Followup[]>([])
  const [plans, setPlans] = useState<DevelopmentPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<DevelopmentPlan | null>(null)
  const { toast } = useToast()

  // Cargar planes existentes al iniciar
  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/development-plans")
      if (response.ok) {
        const { data } = await response.json()
        setPlans(data || [])
      }
    } catch (error) {
      console.error("Error loading plans:", error)
    }
  }

  const handleSelectLeader = (leaderId: string) => {
    const leader = leaders.find((l) => l.id.toString() === leaderId)
    if (leader) {
      setSelectedLeader(leader)
      fetchLeaderFollowups(leader.id)
      setView("form")
    }
  }

  const fetchLeaderFollowups = async (leaderId: number) => {
    try {
      const response = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getFollowups", data: { leader_id: leaderId } }),
      })
      if (response.ok) {
        const { data } = await response.json()
        const formattedFollowups = data.map((followup: any) => ({
          ...followup,
          topics: followup.followup_topics.map((ft: any) => ({
            name: ft.topics.name,
            rating: ft.rating,
          })),
        }))
        setLeaderFollowups(formattedFollowups)
      }
    } catch (error) {
      console.error("Error fetching followups:", error)
    }
  }

  const handleSavePlan = async (planData: any) => {
    try {
      const response = await fetch("/api/development-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      })

      if (response.ok) {
        const { data: newPlan } = await response.json()
        setPlans((prev) => [...prev, newPlan])
        setSelectedPlan(newPlan)
        setView("viewer")
        toast({
          title: "Éxito",
          description: "Plan de desarrollo creado exitosamente",
        })
      } else {
        throw new Error("Error saving plan")
      }
    } catch (error) {
      console.error("Error saving plan:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el plan de desarrollo",
        variant: "destructive",
      })
    }
  }

  if (view === "form" && selectedLeader) {
    return (
      <Card className="p-6">
        <Button
          variant="ghost"
          onClick={() => {
            setView("list")
            setSelectedLeader(null)
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h2 className="text-xl font-bold mb-6">Plan de Desarrollo - {selectedLeader.name}</h2>
        <DevelopmentPlanForm
          leader={selectedLeader}
          followups={leaderFollowups}
          topics={topics}
          onSave={handleSavePlan}
        />
      </Card>
    )
  }

  if (view === "viewer" && selectedPlan) {
    return (
      <Card className="p-6">
        <Button
          variant="ghost"
          onClick={() => {
            setView("list")
            setSelectedPlan(null)
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a planes
        </Button>
        <DevelopmentPlanViewer
          plans={[selectedPlan]}
          leaders={leaders}
          onUpdate={async () => {
            await loadPlans()
          }}
        />
      </Card>
    )
  }

  // Vista de lista
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <Select onValueChange={handleSelectLeader}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar líder para crear plan" />
            </SelectTrigger>
            <SelectContent>
              {leaders.map((leader) => (
                <SelectItem key={leader.id} value={leader.id.toString()}>
                  {leader.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {plans.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <p className="text-lg mb-2">No hay planes de desarrollo creados aún</p>
          <p className="text-sm">Selecciona un líder en el selector anterior y crea un nuevo plan</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Planes de Desarrollo Activos</h3>
          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="p-4 cursor-pointer hover:shadow-md hover:bg-blue-50 transition-all"
                onClick={() => {
                  setSelectedPlan(plan)
                  setView("viewer")
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{plan.leader_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.duration_months} meses • {plan.items.length} temas a fortalecer
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(plan.start_date).toLocaleDateString('es-ES')} - {new Date(plan.end_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-blue-600">{Math.round(plan.overall_progress)}%</div>
                    <span
                      className={`inline-block text-xs px-3 py-1 rounded-full font-semibold mt-2 ${
                        plan.status === "active"
                          ? "bg-blue-100 text-blue-700"
                          : plan.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {plan.status === "active" ? "Activo" : plan.status === "completed" ? "Completado" : "Suspendido"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
