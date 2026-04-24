"use client"
import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Minus, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Followup, Topic } from "@/lib/types"

interface DevelopmentPlanFormProps {
  leader: { id: number; name: string }
  followups: Followup[]
  topics: Topic[]
  onSave: (plan: any) => Promise<void>
}

export function DevelopmentPlanForm({ leader, followups, topics, onSave }: DevelopmentPlanFormProps) {
  const [durationMonths, setDurationMonths] = useState(3)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [targetRatings, setTargetRatings] = useState<Record<string, number>>({})
  const [activities, setActivities] = useState<Record<string, string>>({})
  const [observations, setObservations] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Normalizar texto: remover tildes y llevar a minusculas para comparacion robusta
  const normalizeText = (text: string): string =>
    (text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()

  // Calcular promedio actual de calificaciones por tema usando el NOMBRE del tema
  // Los followups almacenan topics por nombre, no por id
  const currentAverages = useMemo(() => {
    console.log("[v0] Form - followups recibidos:", followups.length)
    if (followups.length > 0) {
      console.log("[v0] Form - primer followup topics:", followups[0]?.topics)
    }

    const averages: Record<string, number> = {}
    topics.forEach((topic) => {
      const normalizedTopic = normalizeText(topic.name)
      const ratings = followups
        .flatMap((f) =>
          (f.topics || [])
            .filter((t) => normalizeText(t.name) === normalizedTopic)
            .map((t) => t.rating),
        )
        .filter((r) => typeof r === "number" && r > 0)
      averages[topic.id] = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    })
    console.log("[v0] Form - averages calculados:", averages)
    return averages
  }, [followups, topics])

  // Seleccionar solo temas con bajo desempeño (promedio < 3.5)
  const lowPerformanceTopics = useMemo(() => {
    return topics.filter((topic) => {
      const avg = currentAverages[topic.id] || 0
      return avg > 0 && avg < 3.5
    })
  }, [topics, currentAverages])

  const hasFollowups = followups.length > 0

  const handleSelectTopic = (topicId: string, checked: boolean) => {
    if (checked) {
      setSelectedTopics((prev) => [...prev, topicId])
      // Establecer meta a 4 por defecto
      setTargetRatings((prev) => ({ ...prev, [topicId]: 4 }))
    } else {
      setSelectedTopics((prev) => prev.filter((id) => id !== topicId))
      setTargetRatings((prev) => {
        const updated = { ...prev }
        delete updated[topicId]
        return updated
      })
    }
  }

  const handleSave = async () => {
    if (selectedTopics.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un tema para trabajar",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const planData = {
        leader_id: leader.id,
        duration_months: durationMonths,
        selected_topics: selectedTopics.map((topicId) => {
          const topic = topics.find((t) => t.id === topicId)
          return {
            id: topicId,
            topic_name: topic?.name || "",
            target_rating: targetRatings[topicId] || 4,
            current_rating: currentAverages[topicId] || 0,
            activities: activities[topicId] || "",
          }
        }),
        observations,
      }

      await onSave(planData)
      toast({
        title: "Éxito",
        description: "Plan de desarrollo creado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el plan de desarrollo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration" className="text-sm font-medium">
            Duración del plan (meses)
          </Label>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDurationMonths(Math.max(1, durationMonths - 1))}
              className="h-8 w-8 p-0"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              min="1"
              max="12"
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number.parseInt(e.target.value) || 1)}
              className="w-20 text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDurationMonths(Math.min(12, durationMonths + 1))}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-500">{durationMonths} meses</span>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Temas a trabajar</Label>
        {!hasFollowups ? (
          <Alert className="mb-4 border-amber-300 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-amber-900">
              <strong>Este líder aún no tiene seguimientos registrados.</strong> Para identificar areas de desarrollo con base en datos,
              primero registra al menos un seguimiento en la pestaña "Nuevo Seguimiento". Mientras tanto, puedes crear un plan manual seleccionando los temas que deseas trabajar.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Basado en {followups.length} seguimiento{followups.length === 1 ? "" : "s"} previo
              {followups.length === 1 ? "" : "s"}, se sugieren {lowPerformanceTopics.length} tema
              {lowPerformanceTopics.length === 1 ? "" : "s"} con bajo desempeño (promedio {"<"} 3.5). Puedes seleccionar estos o agregar otros.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {topics.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id)
            const currentAvg = currentAverages[topic.id] || 0
            const isLowPerformance = lowPerformanceTopics.some((t) => t.id === topic.id)

            return (
              <Card key={topic.id} className={`p-4 ${isLowPerformance ? "border-amber-200 bg-amber-50" : ""}`}>
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectTopic(topic.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{topic.name}</h3>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          currentAvg >= 4
                            ? "bg-green-100 text-green-700"
                            : currentAvg >= 3
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        Actual: {currentAvg.toFixed(1)}/5
                      </span>
                    </div>

                    {isSelected && (
                      <div className="space-y-3 mt-3 pl-4 border-l-2 border-blue-200">
                        <div>
                          <Label htmlFor={`target-${topic.id}`} className="text-xs">
                            Meta de calificación:
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id={`target-${topic.id}`}
                              type="number"
                              min="1"
                              max="5"
                              step="0.5"
                              value={targetRatings[topic.id] || 4}
                              onChange={(e) =>
                                setTargetRatings((prev) => ({
                                  ...prev,
                                  [topic.id]: Number.parseFloat(e.target.value) || 4,
                                }))
                              }
                              className="w-20"
                            />
                            <span className="text-sm text-gray-500">/5</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`activities-${topic.id}`} className="text-xs">
                            Actividades a realizar:
                          </Label>
                          <Textarea
                            id={`activities-${topic.id}`}
                            placeholder="Describe las actividades o talleres para fortalecer este tema"
                            value={activities[topic.id] || ""}
                            onChange={(e) =>
                              setActivities((prev) => ({
                                ...prev,
                                [topic.id]: e.target.value,
                              }))
                            }
                            className="text-sm mt-1"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="observations" className="text-sm font-medium">
          Observaciones adicionales
        </Label>
        <Textarea
          id="observations"
          placeholder="Notas adicionales sobre el plan de desarrollo"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          className="mt-2"
          rows={3}
        />
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
        <Save className="w-4 h-4 mr-2" />
        {loading ? "Guardando..." : "Crear plan de desarrollo"}
      </Button>
    </div>
  )
}
