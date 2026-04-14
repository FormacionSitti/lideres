"use client"

import { useEffect, useRef } from "react"

interface RadarDataset {
  label: string
  data: { dimension: string; value: number }[]
  color: string
}

interface RadarChartProps {
  datasets: RadarDataset[]
  dimensions: string[]
  maxValue?: number
  size?: number
  backgroundColor?: string
  showLegend?: boolean
}

export function RadarChart({
  datasets,
  dimensions,
  maxValue = 5,
  size = 350,
  backgroundColor = "#e5e7eb",
  showLegend = true,
}: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.32
    const numPoints = dimensions.length
    const angleStep = (2 * Math.PI) / numPoints
    const startAngle = -Math.PI / 2

    ctx.clearRect(0, 0, size, size)

    // Dibujar círculos de fondo
    for (let level = 1; level <= maxValue; level++) {
      const levelRadius = (radius * level) / maxValue
      ctx.beginPath()
      ctx.arc(centerX, centerY, levelRadius, 0, 2 * Math.PI)
      ctx.strokeStyle = backgroundColor
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = "#9ca3af"
      ctx.font = "9px sans-serif"
      ctx.textAlign = "left"
      ctx.fillText(level.toString(), centerX + 4, centerY - levelRadius + 3)
    }

    // Dibujar líneas radiales y etiquetas
    dimensions.forEach((dimension, index) => {
      const angle = startAngle + index * angleStep
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = backgroundColor
      ctx.lineWidth = 1
      ctx.stroke()

      const labelRadius = radius + 40
      const labelX = centerX + labelRadius * Math.cos(angle)
      const labelY = centerY + labelRadius * Math.sin(angle)

      ctx.fillStyle = "#374151"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const words = dimension.split(" ")
      const maxWidth = 70
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

      const lineHeight = 11
      const startY = labelY - ((lines.length - 1) * lineHeight) / 2

      lines.forEach((l, i) => {
        ctx.fillText(l, labelX, startY + i * lineHeight)
      })
    })

    // Dibujar cada dataset
    datasets.forEach((dataset) => {
      ctx.beginPath()
      dimensions.forEach((dimension, index) => {
        const dataPoint = dataset.data.find((d) => d.dimension === dimension)
        const value = dataPoint?.value || 0
        const angle = startAngle + index * angleStep
        const pointRadius = (radius * value) / maxValue
        const x = centerX + pointRadius * Math.cos(angle)
        const y = centerY + pointRadius * Math.sin(angle)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.closePath()

      ctx.fillStyle = `${dataset.color}33`
      ctx.fill()
      ctx.strokeStyle = dataset.color
      ctx.lineWidth = 2
      ctx.stroke()

      // Puntos
      dimensions.forEach((dimension, index) => {
        const dataPoint = dataset.data.find((d) => d.dimension === dimension)
        const value = dataPoint?.value || 0
        const angle = startAngle + index * angleStep
        const pointRadius = (radius * value) / maxValue
        const x = centerX + pointRadius * Math.cos(angle)
        const y = centerY + pointRadius * Math.sin(angle)

        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fillStyle = dataset.color
        ctx.fill()
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 2
        ctx.stroke()
      })
    })
  }, [datasets, dimensions, maxValue, size, backgroundColor])

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      {showLegend && datasets.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {datasets.map((dataset, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dataset.color }}
              />
              <span className="text-sm text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente simple para un solo líder (compatibilidad hacia atrás)
interface SimpleRadarChartProps {
  data: { label: string; value: number }[]
  maxValue?: number
  size?: number
  color?: string
}

export function SimpleRadarChart({
  data,
  maxValue = 5,
  size = 350,
  color = "#2563eb",
}: SimpleRadarChartProps) {
  const dimensions = data.map((d) => d.label)
  const datasets = [
    {
      label: "Actual",
      data: data.map((d) => ({ dimension: d.label, value: d.value })),
      color,
    },
  ]

  return (
    <RadarChart
      datasets={datasets}
      dimensions={dimensions}
      maxValue={maxValue}
      size={size}
      showLegend={false}
    />
  )
}
