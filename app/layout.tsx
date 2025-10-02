import "@/styles/globals.css"
import { Toaster } from "@/components/ui/toaster"
import type React from "react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>{/* Eliminar el script que expone las variables de entorno */}</head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
