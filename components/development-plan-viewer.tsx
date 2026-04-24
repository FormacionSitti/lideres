"use client"
import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, TrendingUp, Trash2, Edit2 } from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { DevelopmentPlanProgress } from "@/components/development-plan-progress"
import { useToast } from "@/components/ui/use-toast"

interface DevelopmentPlan {
  id: string
  leader_id: number
  leader_name?: string
  start_date: string
  end_date: string
  duration_months: number
  status: string
  overall_progress: number
  observations?: string
  items?: Array<{
    id: string
    topic_id: number
    topic_name: string
    target_rating: number
    current_rating: number
    progress: number
    activities: string
  }>
}

interface EditableItem {
  topic_id: string
  topic_name: string
  target_rating: number
  current_rating: number
  activities: string
  existing_id?: string
}

interface DevelopmentPlanViewerProps {
  plans: DevelopmentPlan[]
  leaders: Array<{ id: number; name: string }>
  topics?: Array<{ id: string; name: string }>
  onUpdate: () => Promise<void>
}

export function DevelopmentPlanViewer({ plans, leaders, topics = [], onUpdate }: DevelopmentPlanViewerProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || "")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editDuration, setEditDuration] = useState<number>(3)
  const [editStartDate, setEditStartDate] = useState<string>("")
  const [editStatus, setEditStatus] = useState<string>("active")
  const [editObservations, setEditObservations] = useState<string>("")
  const [editItems, setEditItems] = useState<EditableItem[]>([])
  const { toast } = useToast()

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const leaderName =
    selectedPlan?.leader_name ||
    leaders.find((l) => l.id === selectedPlan?.leader_id)?.name ||
    "Líder"

  // Calcular progreso y fecha estimada
  const planProgress = useMemo(() => {
    if (!selectedPlan) return null

    const startDate = parseISO(selectedPlan.start_date)
    const endDate = parseISO(selectedPlan.end_date)
    const today = new Date()

    const totalDays = differenceInDays(endDate, startDate)
    const elapsedDays = differenceInDays(today, startDate)
    const timeProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))

    const daysRemaining = differenceInDays(endDate, today)
    const isOnTrack = selectedPlan.overall_progress >= timeProgress

    return {
      timeProgress,
      daysRemaining,
      isOnTrack,
      statusColor: isOnTrack ? "green" : "amber",
    }
  }, [selectedPlan])

  // Inicializar los valores del formulario cuando se abre el dialogo de edicion
  useEffect(() => {
    if (showEditDialog && selectedPlan) {
      setEditDuration(selectedPlan.duration_months)
      setEditStartDate(selectedPlan.start_date)
      setEditStatus(selectedPlan.status)
      setEditObservations(selectedPlan.observations || "")

      // Inicializar items editables desde los items del plan
      const initialItems: EditableItem[] = (selectedPlan.items || []).map((item) => ({
        topic_id: String(item.topic_id),
        topic_name: item.topic_name,
        target_rating: item.target_rating,
        current_rating: item.current_rating,
        activities: item.activities || "",
        existing_id: item.id,
      }))
      setEditItems(initialItems)
    }
  }, [showEditDialog, selectedPlan])

  const toggleEditTopic = (topic: { id: string; name: string }, checked: boolean) => {
    if (checked) {
      setEditItems((prev) => [
        ...prev,
        {
          topic_id: topic.id,
          topic_name: topic.name,
          target_rating: 4,
          current_rating: 0,
          activities: "",
        },
      ])
    } else {
      setEditItems((prev) => prev.filter((it) => it.topic_id !== topic.id))
    }
  }

  const updateEditItemField = (topicId: string, field: keyof EditableItem, value: any) => {
    setEditItems((prev) =>
      prev.map((it) => (it.topic_id === topicId ? { ...it, [field]: value } : it)),
    )
  }

  const handleSaveEdit = async () => {
    if (!selectedPlan) return

    setSaving(true)
    try {
      const response = await fetch(`/api/development-plans/${selectedPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_months: editDuration,
          start_date: editStartDate,
          status: editStatus,
          observations: editObservations,
          items: editItems.map((it) => ({
            topic_id: it.topic_id,
            topic_name: it.topic_name,
            target_rating: it.target_rating,
            current_rating: it.current_rating,
            activities: it.activities,
            existing_id: it.existing_id,
          })),
        }),
      })

      if (response.ok) {
        toast({
          title: "Exito",
          description: "Plan actualizado correctamente",
        })
        setShowEditDialog(false)
        await onUpdate()
      } else {
        throw new Error("Error al actualizar")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/development-plans/${selectedPlan.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Plan de desarrollo eliminado",
        })
        await onUpdate()
      } else {
        throw new Error("Error al eliminar")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el plan",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleSaveProgress = async (updates: any) => {
    try {
      const response = await fetch(`/api/development-plans/${selectedPlan?.id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Progreso registrado exitosamente",
        })
        await onUpdate()
      } else {
        throw new Error("Error al guardar")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso",
        variant: "destructive",
      })
    }
  }

  if (!selectedPlan || !planProgress) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay planes de desarrollo disponibles para este líder
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selector de plan */}
      {plans.length > 1 && (
        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {format(parseISO(plan.start_date), "MMM yyyy", { locale: es })} -{" "}
                {format(parseISO(plan.end_date), "MMM yyyy", { locale: es })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="progress">Registrar Avance</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          {/* Resumen del plan */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{leaderName}</h3>
                <p className="text-sm text-gray-500">
                  {selectedPlan.duration_months} meses • {format(parseISO(selectedPlan.start_date), "d MMM", { locale: es })}{" "}
                  - {format(parseISO(selectedPlan.end_date), "d MMM yyyy", { locale: es })}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedPlan.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : selectedPlan.status === "active"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {selectedPlan.status === "active"
                  ? "Activo"
                  : selectedPlan.status === "completed"
                    ? "Completado"
                    : "Suspendido"}
              </span>
            </div>

            {/* Progreso general */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progreso general</span>
                <span className="text-sm font-semibold">{selectedPlan.overall_progress.toFixed(0)}%</span>
              </div>
              <Progress value={selectedPlan.overall_progress} className="h-2" />
            </div>

            {/* Indicadores de progreso */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Progreso de tiempo</p>
                <p className="text-lg font-bold text-blue-600">{planProgress.timeProgress.toFixed(0)}%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Progreso de temas</p>
                <p className="text-lg font-bold text-green-600">{selectedPlan.overall_progress.toFixed(0)}%</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Estado</p>
                <p className="text-lg font-bold text-amber-600">
                  {planProgress.isOnTrack ? "En línea" : "Retrasado"}
                </p>
              </div>
              {planProgress.daysRemaining > 0 && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Días restantes</p>
                  <p className="text-lg font-bold text-orange-600">{planProgress.daysRemaining}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Temas del plan */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Temas a fortalecer</h3>
            {selectedPlan.items && selectedPlan.items.length > 0 ? (
              selectedPlan.items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{item.topic_name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Meta: {item.target_rating}/5 • Actual: {item.current_rating}/5
                      </p>
                    </div>
                    {item.progress >= 100 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : item.progress >= 50 ? (
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                  </div>

                  {/* Progreso del tema */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Progreso</span>
                      <span className="text-xs font-semibold">{item.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={item.progress} className="h-1.5" />
                  </div>

                  {/* Actividades */}
                  {item.activities && (
                    <div className="bg-gray-50 rounded p-2 text-xs text-gray-700">
                      <p className="font-medium mb-1">Actividades:</p>
                      <p className="whitespace-pre-wrap">{item.activities}</p>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <Card className="p-4 text-center text-gray-500">
                <p>No hay temas asignados a este plan</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Registrar Avance */}
        <TabsContent value="progress">
          {selectedPlan.items && selectedPlan.items.length > 0 ? (
            <DevelopmentPlanProgress
              items={selectedPlan.items}
              planId={selectedPlan.id}
              onSave={handleSaveProgress}
            />
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <p>No hay temas para registrar avance</p>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configuración del Plan</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Líder</label>
                  <p className="text-gray-600">{leaderName}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Fecha de inicio</label>
                <p className="text-gray-600">
                  {format(parseISO(selectedPlan.start_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Fecha de finalización</label>
                <p className="text-gray-600">
                  {format(parseISO(selectedPlan.end_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Duración</label>
                <p className="text-gray-600">{selectedPlan.duration_months} meses</p>
              </div>

              <div>
                <label className="text-sm font-medium">Estado</label>
                <p className="text-gray-600">
                  {selectedPlan.status === "active"
                    ? "Activo"
                    : selectedPlan.status === "completed"
                      ? "Completado"
                      : "Suspendido"}
                </p>
              </div>

              {selectedPlan.observations && (
                <div>
                  <label className="text-sm font-medium">Observaciones</label>
                  <p className="text-gray-600">{selectedPlan.observations}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar plan
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar plan
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de edicion */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar plan de desarrollo</DialogTitle>
            <DialogDescription>
              Modifica la configuracion del plan y los temas a desarrollar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Fecha de inicio</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duracion (meses)</Label>
                <Select
                  value={editDuration.toString()}
                  onValueChange={(value) => setEditDuration(Number(value))}
                >
                  <SelectTrigger id="edit-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mes</SelectItem>
                    <SelectItem value="2">2 meses</SelectItem>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="4">4 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="9">9 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-observations">Observaciones</Label>
              <Textarea
                id="edit-observations"
                value={editObservations}
                onChange={(e) => setEditObservations(e.target.value)}
                placeholder="Notas u observaciones del plan"
                rows={3}
              />
            </div>

            {/* Seccion de edicion de temas */}
            <div className="space-y-3 pt-4 border-t">
              <div>
                <Label className="text-base font-semibold">Temas a desarrollar</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Marca los temas que se trabajaran en el plan. Las actividades y el progreso se conservan al desmarcar y volver a marcar un tema existente.
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {topics.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No hay temas disponibles</p>
                ) : (
                  topics.map((topic) => {
                    const editingItem = editItems.find((it) => it.topic_id === topic.id)
                    const isChecked = !!editingItem

                    return (
                      <Card key={topic.id} className={`p-3 ${isChecked ? "border-blue-300 bg-blue-50/50" : ""}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`edit-topic-${topic.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => toggleEditTopic(topic, !!checked)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`edit-topic-${topic.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {topic.name}
                            </label>

                            {isChecked && editingItem && (
                              <div className="space-y-2 mt-3 pl-2 border-l-2 border-blue-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor={`edit-target-${topic.id}`} className="text-xs">
                                      Meta (1-5)
                                    </Label>
                                    <Input
                                      id={`edit-target-${topic.id}`}
                                      type="number"
                                      min="1"
                                      max="5"
                                      step="0.5"
                                      value={editingItem.target_rating}
                                      onChange={(e) =>
                                        updateEditItemField(
                                          topic.id,
                                          "target_rating",
                                          Number.parseFloat(e.target.value) || 4,
                                        )
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`edit-current-${topic.id}`} className="text-xs">
                                      Actual
                                    </Label>
                                    <Input
                                      id={`edit-current-${topic.id}`}
                                      type="number"
                                      min="0"
                                      max="5"
                                      step="0.1"
                                      value={editingItem.current_rating}
                                      onChange={(e) =>
                                        updateEditItemField(
                                          topic.id,
                                          "current_rating",
                                          Number.parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor={`edit-activities-${topic.id}`} className="text-xs">
                                    Actividades
                                  </Label>
                                  <Textarea
                                    id={`edit-activities-${topic.id}`}
                                    value={editingItem.activities}
                                    onChange={(e) =>
                                      updateEditItemField(topic.id, "activities", e.target.value)
                                    }
                                    placeholder="Actividades a realizar"
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar plan de desarrollo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar este plan? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <p className="text-sm text-red-700">
              Se eliminarán todos los datos del plan y su progreso registrado.
            </p>
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
