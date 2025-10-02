"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function EnvDebug() {
  const [showDebug, setShowDebug] = useState(false)

  return (
    <div className="mt-4">
      <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
        {showDebug ? "Ocultar diagnóstico" : "Mostrar diagnóstico"}
      </Button>

      {showDebug && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información de diagnóstico</AlertTitle>
          <AlertDescription>
            <div className="mt-2 text-xs bg-muted p-2 rounded">
              <p>Versión de la aplicación: 1.0.0</p>
              <p>Estado de la conexión: Activa</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
