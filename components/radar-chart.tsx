"use client"

import { useEffect, useRef } from "react"

interface RadarChartProps {
  data: {
    label: string
    value: number
  }[]
  maxValue?: number
  size?: number
  color?: string
  backgroundColor?: string
}

export function RadarChart({
  data,
  maxValue = 5,
  size = 300,
  color = "#2563eb",
  backgroundColor = "#e5e7eb",
}: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar el canvas para alta resolución
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.35
    const numPoints = data.length
    const angleStep = (2 * Math.PI) / numPoints
    const startAngle = -Math.PI / 2 // Comenzar desde arriba

    // Limpiar canvas
    ctx.clearRect(0, 0, size, size)

    // Dibujar círculos de fondo (niveles 1-5)
    for (let level = 1; level <= maxValue; level++) {
      const levelRadius = (radius * level) / maxValue
      ctx.beginPath()
      ctx.arc(centerX, centerY, levelRadius, 0, 2 * Math.PI)
      ctx.strokeStyle = backgroundColor
      ctx.lineWidth = 1
      ctx.stroke()

      // Etiquetas de nivel
      ctx.fillStyle = "#9ca3af"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(level.toString(), centerX + 8, centerY - levelRadius + 4)
    }

    // Dibujar líneas radiales y etiquetas
    data.forEach((point, index) => {
      const angle = startAngle + index * angleStep
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      // Línea radial
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = backgroundColor
      ctx.lineWidth = 1
      ctx.stroke()

      // Etiqueta
      const labelRadius = radius + 35
      const labelX = centerX + labelRadius * Math.cos(angle)
      const labelY = centerY + labelRadius * Math.sin(angle)

      ctx.fillStyle = "#374151"
      ctx.font = "11px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Dividir etiquetas largas en múltiples líneas
      const words = point.label.split(" ")
      const maxWidth = 80
      let line = ""
      let lines: string[] = []

      words.forEach((word) => {
        const testLine = line + (line ? " " : "") + word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line) {
          lines.push(line)
          line = word
        } else {
          line = testLine
        }
      })
      lines.push(line)

      const lineHeight = 12
      const startY = labelY - ((lines.length - 1) * lineHeight) / 2

      lines.forEach((l, i) => {
        ctx.fillText(l, labelX, startY + i * lineHeight)
      })
    })

    // Dibujar el área del radar (datos)
    ctx.beginPath()
    data.forEach((point, index) => {
      const angle = startAngle + index * angleStep
      const pointRadius = (radius * point.value) / maxValue
      const x = centerX + pointRadius * Math.cos(angle)
      const y = centerY + pointRadius * Math.sin(angle)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()

    // Relleno con transparencia
    ctx.fillStyle = `${color}33`
    ctx.fill()

    // Borde del área
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Dibujar puntos en cada vértice
    data.forEach((point, index) => {
      const angle = startAngle + index * angleStep
      const pointRadius = (radius * point.value) / maxValue
      const x = centerX + pointRadius * Math.cos(angle)
      const y = centerY + pointRadius * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [data, maxValue, size, color, backgroundColor])

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  )
}
