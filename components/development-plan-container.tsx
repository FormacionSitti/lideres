"use client"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DevelopmentPlanForm } from "@/components/development-plan-form"
import { useToast } from "@/components/ui/use-toast"
import type { Topic } from "@/lib/types"

interface DevelopmentPlanContainerProps {
  leaders: Array<{ id: number; name: string }>
  topics: Topic[]
}

export function DevelopmentPlanContainer({ leaders, topics }: DevelopmentPlanContainerProps) {
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("")
  const { toast } = useToast()

  const selectedLeader = leaders.find((l) => l.id === Number.parseInt(selectedLeaderId))

  const handleSave = async (planData: any) => {
    try {
      const response = await fetch("/api/development-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leader_id: planData.leader_id,
          duration_months: planData.duration_months,
          items: planData.selected_topics,
          observations: planData.observations,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar el plan")
      }

      toast({
        title: "Éxito",
        description: "Plan de desarrollo creado exitosamente",
      })
      setSelectedLeaderId("")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el plan de desarrollo",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar líder para crear plan de desarrollo" />
        </SelectTrigger>
        <SelectContent>
          {leaders.map((leader) => (
            <SelectItem key={leader.id} value={leader.id.toString()}>
              {leader.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedLeader && (
        <DevelopmentPlanForm
          leader={selectedLeader}
          followups={[]}
          topics={topics}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
