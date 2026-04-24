"use client"
import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Save, Eye, Clock, Circle } from "lucide-react"
import { getActionsForTopic, getGenericActionPlan, type TopicAction } from "@/lib/topic-actions"

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

type ActionState = {
  completed: boolean
  goal: string
}

export function DevelopmentPlanProgress({ items, planId, onSave }: DevelopmentPlanProgressProps) {
  // Estado: por cada tema, expandido o no
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    items.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})
  )
  // Estado: por cada accion, expandida o no
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({})
  // Estado: por cada accion, completada y meta
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({})
  const [saving, setSaving] = useState(false)

  // Para cada tema del plan, obtener sus acciones
  const topicsWithActions = useMemo(() => {
    return items.map((item) => {
      const plan = getActionsForTopic(item.topic_name) || getGenericActionPlan(item.topic_name)
      return {
        ...item,
        planDescription: plan.description,
        actions: plan.actions,
      }
    })
  }, [items])

  // Calcular progreso por tema basado en acciones completadas
  const getTopicProgress = (topicId: string, actions: TopicAction[]) => {
    const completedCount = actions.filter((a) => actionStates[`${topicId}-${a.id}`]?.completed).length
    return actions.length > 0 ? (completedCount / actions.length) * 100 : 0
  }

  // Progreso general del plan
  const overallProgress = useMemo(() => {
    if (topicsWithActions.length === 0) return 0
    const total = topicsWithActions.reduce(
      (sum, t) => sum + getTopicProgress(t.id, t.actions),
      0
    )
    return total / topicsWithActions.length
  }, [topicsWithActions, actionStates])

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }))
  }

  const toggleAction = (actionKey: string) => {
    setExpandedActions((prev) => ({ ...prev, [actionKey]: !prev[actionKey] }))
  }

  const toggleActionCompleted = (actionKey: string) => {
    setActionStates((prev) => ({
      ...prev,
      [actionKey]: {
        completed: !prev[actionKey]?.completed,
        goal: prev[actionKey]?.goal || "",
      },
    }))
  }

  const updateActionGoal = (actionKey: string, goal: string) => {
    setActionStates((prev) => ({
      ...prev,
      [actionKey]: {
        completed: prev[actionKey]?.completed || false,
        goal,
      },
    }))
  }

  const handleSaveProgress = async () => {
    setSaving(true)
    try {
      const updates = topicsWithActions.map((item) => {
        const progress = getTopicProgress(item.id, item.actions)
        return {
          id: item.id,
          current_rating: item.current_rating,
          progress,
          activities: JSON.stringify(
            item.actions.map((a) => ({
              id: a.id,
              completed: actionStates[`${item.id}-${a.id}`]?.completed || false,
              goal: actionStates[`${item.id}-${a.id}`]?.goal || "",
            }))
          ),
        }
      })

      await onSave({
        planId,
        updates,
        overall_progress: overallProgress,
      })
    } catch (error) {
      console.error("Error saving progress:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progreso general */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Progreso general del plan</span>
          <span className="text-sm font-bold text-blue-600">{overallProgress.toFixed(0)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </Card>

      {/* Temas del plan */}
      {topicsWithActions.map((topic) => {
        const topicProgress = getTopicProgress(topic.id, topic.actions)
        const isExpanded = expandedTopics[topic.id]
        const completedCount = topic.actions.filter(
          (a) => actionStates[`${topic.id}-${a.id}`]?.completed
        ).length

        return (
          <Card key={topic.id} className="overflow-hidden">
            {/* Header del tema */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleTopic(topic.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{topic.topic_name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Semanas 1-{Math.max(...topic.actions.map((a) => a.week))} ·{" "}
                      {topic.actions.length} acciones
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{topic.planDescription}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">
                      {topicProgress.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {completedCount}/{topic.actions.length}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="mt-3">
                <Progress value={topicProgress} className="h-1" />
              </div>
            </div>

            {/* Lista de acciones */}
            {isExpanded && (
              <div className="border-t bg-gray-50 p-4 space-y-3">
                {topic.actions.map((action) => {
                  const actionKey = `${topic.id}-${action.id}`
                  const actionState = actionStates[actionKey] || { completed: false, goal: "" }
                  const isActionExpanded = expandedActions[actionKey]

                  return (
                    <div
                      key={action.id}
                      className={`bg-white rounded-lg border p-4 transition-colors ${
                        actionState.completed ? "border-green-300 bg-green-50/30" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          <Checkbox
                            checked={actionState.completed}
                            onCheckedChange={() => toggleActionCompleted(actionKey)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                            >
                              Semana {action.week}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                              <Clock className="w-3 h-3" />
                            </div>
                          </div>
                          <h4
                            className={`text-sm font-medium leading-snug ${
                              actionState.completed ? "line-through text-gray-500" : ""
                            }`}
                          >
                            {action.title}
                          </h4>
                          <button
                            onClick={() => toggleAction(actionKey)}
                            className="text-xs text-blue-600 hover:underline mt-2"
                          >
                            {isActionExpanded ? "Ocultar detalles" : "Ver detalles"}{" "}
                            {isActionExpanded ? "↑" : "↓"}
                          </button>

                          {/* Detalles expandidos */}
                          {isActionExpanded && (
                            <div className="mt-3 space-y-3">
                              <div className="bg-blue-50 border border-blue-100 rounded p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">
                                  Como hacerlo:
                                </p>
                                <ul className="text-xs text-gray-700 space-y-1">
                                  {action.howTo.map((step, i) => (
                                    <li key={i} className="flex gap-2">
                                      <span>•</span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                  <p className="text-xs">
                                    <span className="font-semibold">Entregable:</span>{" "}
                                    <span className="text-gray-700">{action.deliverable}</span>
                                  </p>
                                </div>
                              </div>

                              {action.keyQuestions && action.keyQuestions.length > 0 && (
                                <div className="bg-amber-50 border border-amber-100 rounded p-3">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">
                                    Preguntas clave:
                                  </p>
                                  <ul className="text-xs text-gray-700 space-y-1">
                                    {action.keyQuestions.map((q, i) => (
                                      <li key={i}>? {q}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Meta / Proyeccion */}
                          <div className="mt-3">
                            <label className="text-xs text-gray-600 mb-1 block">
                              Meta / Proyeccion inicial:
                            </label>
                            <Textarea
                              placeholder="Define que esperas lograr..."
                              value={actionState.goal}
                              onChange={(e) => updateActionGoal(actionKey, e.target.value)}
                              className="text-xs min-h-[60px] resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )
      })}

      {/* Boton de guardar */}
      <Button
        onClick={handleSaveProgress}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Guardando..." : "Guardar Avance"}
      </Button>
    </div>
  )
}
