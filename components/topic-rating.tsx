"use client"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Star } from "lucide-react"
import type { Topic } from "@/lib/types"

// Descripciones de cada dimensión del Radar Táctico-Estratégico
const topicDescriptions: Record<string, string> = {
  "Liderazgo cercano": "Mide la gestión del líder con el equipo: accesibilidad, claridad en prioridades, seguimiento y retroalimentación.",
  "Resolución táctico-estratégica de problemas": "Mide la capacidad de resolver problemas estructurales: diagnóstico de raíz, planificación y ejecución efectiva.",
  "Visión transformadora": "Mide la capacidad de evolucionar y mejorar: pensamiento a futuro, gestión del cambio e innovación sostenida.",
  "Toma de decisiones ágil y efectiva": "Mide la rapidez y criterio en decisiones: análisis rápido, priorización y responsabilidad sobre resultados.",
  "Cultura de aprendizaje": "Mide el aprendizaje a nivel de equipo: promover aprendizaje, compartir conocimientos, espacios de mejora.",
  "Comunicación": "Mide la alineación estratégica del equipo: mensajes claros, escucha activa y feedback constructivo.",
  "Motivación e innovación": "Mide la capacidad de inspirar y transformar: reconocimiento, propósito compartido y fomento de ideas nuevas.",
}

// Escala de calificación con descripciones
const ratingDescriptions: Record<number, string> = {
  1: "Muy bajo",
  2: "Bajo",
  3: "Medio",
  4: "Alto",
  5: "Muy alto",
}

interface TopicRatingProps {
  topic: Topic
  selected: boolean
  rating: number
  onSelectChange: (topicId: string, selected: boolean) => void
  onRatingChange: (topicId: string, rating: number) => void
}

export function TopicRating({ topic, selected, rating, onSelectChange, onRatingChange }: TopicRatingProps) {
  const description = topicDescriptions[topic.name] || ""

  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50 border border-transparent hover:border-blue-200 transition-colors">
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelectChange(topic.id, checked as boolean)}
        id={`topic-${topic.id}`}
        className="mt-1"
      />
      <div className="flex-1">
        <Label htmlFor={`topic-${topic.id}`} className="text-sm font-medium text-gray-900">
          {topic.name}
        </Label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {selected && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Calificación: <span className="font-semibold">{rating}</span> - {ratingDescriptions[rating]}</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onRatingChange(topic.id, value)}
                  className="p-1 rounded hover:scale-110 transition-transform"
                  aria-label={`Calificar ${value} estrellas`}
                >
                  <Star
                    className={`w-6 h-6 ${
                      value <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
