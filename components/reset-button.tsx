"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function ResetButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleReset = async () => {
    setIsLoading(true)
    try {
      // Usar la API en lugar de la acción del servidor
      const response = await fetch("/api/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deleteAllFollowups",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar seguimientos")
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Eliminación exitosa",
          description: "Todo el historial de acompañamientos ha sido eliminado.",
        })

        // Forzar una recarga completa de la página para actualizar todos los datos
        router.refresh()

        // Esperar un momento y luego recargar la página para asegurar datos frescos
        setTimeout(() => {
          window.location.reload()
        }, 300)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el historial. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)} className="flex items-center">
        <Trash2 className="w-4 h-4 mr-2" />
        Eliminar Historial
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡ADVERTENCIA! Eliminación permanente</AlertDialogTitle>
            <AlertDialogDescription className="text-red-500 font-semibold">
              Esta acción eliminará PERMANENTEMENTE todo el historial de acompañamientos.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <strong>¿Qué sucederá?</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Se eliminarán TODOS los acompañamientos registrados</li>
              <li>Se eliminarán TODAS las calificaciones de temas</li>
              <li>Esta acción NO se puede deshacer</li>
              <li>Los líderes y temas NO serán eliminados</li>
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? "Eliminando..." : "Sí, eliminar TODO el historial"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
