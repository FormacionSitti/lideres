"use client"
import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

interface DevelopmentPlanViewerProps {
  plans: DevelopmentPlan[]
  leaders: Array<{ id: number; name: string }>
  onUpdate: () => Promise<void>
}

export function DevelopmentPlanViewer({ plans, leaders, onUpdate }: DevelopmentPlanViewerProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || "")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
              <Button variant="outline" className="flex-1" disabled>
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
