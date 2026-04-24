"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp, Save } from "lucide-react"

interface PlanItem {
  id: string
  topic_name: string
  target_rating: number
  current_rating: number
  progress: number
  activities: string
}

interface DevelopmentPlanProgressProps {
  items: PlanItem[]
  planId: string
  onSave: (updates: any) => Promise<void>
}

export function DevelopmentPlanProgress({ items, planId, onSave }: DevelopmentPlanProgressProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [ratings, setRatings] = useState<Record<string, number>>(
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.current_rating }), {})
  )
  const [observations, setObservations] = useState<Record<string, string>>(
    items.reduce((acc, item) => ({ ...acc, [item.id]: "" }), {})
  )
  const [saving, setSaving] = useState(false)

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const handleSaveProgress = async () => {
    setSaving(true)
    try {
      const updates = items.map((item) => ({
        id: item.id,
        current_rating: ratings[item.id] || 0,
        progress: Math.round(((ratings[item.id] || 0) / item.target_rating) * 100),
        observation: observations[item.id] || "",
      }))

      await onSave({
        planId,
        updates,
        overall_progress: Math.round(
          updates.reduce((sum, u) => sum + u.progress, 0) / updates.length
        ),
      })
    } catch (error) {
      console.error("Error saving progress:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          Actualiza la calificación actual de cada tema y registra observaciones sobre el progreso
        </p>
      </div>

      {items.map((item, index) => (
        <Card key={item.id} className="p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleExpand(item.id)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">Semana {index + 1}</span>
                <h3 className="font-medium">{item.topic_name}</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Calificación actual: {ratings[item.id] || 0}/5 • Meta: {item.target_rating}/5
              </p>
            </div>
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(((ratings[item.id] || 0) / item.target_rating) * 100)}%
              </div>
              {expandedItems[item.id] ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedItems[item.id] && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {/* Cómo hacerlo */}
              {item.activities && (
                <div className="bg-blue-50 rounded p-3">
                  <h4 className="font-medium text-sm mb-2">Cómo hacerlo:</h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {item.activities.split("\n").map((activity, i) => (
                      <li key={i} className="flex gap-2">
                        <span>•</span>
                        <span>{activity.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Calificación actual */}
              <div>
                <label className="text-sm font-medium mb-2 block">Calificación actual (1-5)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={ratings[item.id] || 0}
                    onChange={(e) =>
                      setRatings((prev) => ({
                        ...prev,
                        [item.id]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-20"
                  />
                  <Progress value={((ratings[item.id] || 0) / 5) * 100} className="flex-1 h-2" />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-sm font-medium mb-2 block">Observaciones y progreso</label>
                <Textarea
                  placeholder="Describe el progreso en este tema..."
                  value={observations[item.id] || ""}
                  onChange={(e) =>
                    setObservations((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                  className="text-sm"
                  rows={3}
                />
              </div>

              {/* Meta / Proyección */}
              <div className="bg-green-50 rounded p-3">
                <h4 className="font-medium text-sm mb-2">Meta / Proyección inicial</h4>
                <p className="text-xs text-gray-700">
                  Objetivo alcanzar una calificación de {item.target_rating}/5 al finalizar el plan
                </p>
              </div>
            </div>
          )}
        </Card>
      ))}

      <Button
        onClick={handleSaveProgress}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Guardando..." : "Guardar Progreso"}
      </Button>
    </div>
  )
}
