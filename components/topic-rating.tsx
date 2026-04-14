"use client"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import type { Topic } from "@/lib/types"

// Descripciones de cada dimensión del Radar Táctico-Estratégico
const topicDescriptions: Record<string, string> = {
  "Liderazgo cercano": "Mide la gestión del líder con el equipo: accesibilidad, claridad en prioridades, seguimiento y retroalimentación.",
  "Resolución táctico-estratégica de problemas": "Mide la capacidad de resolver problemas estructurales: análisis de causas raíz, soluciones sostenibles y acción preventiva.",
  "Visión transformadora": "Mide la capacidad de evolucionar y mejorar: proponer mejoras, cuestionar prácticas, impulsar innovación.",
  "Toma de decisiones ágil y efectiva": "Mide la rapidez y criterio en decisiones: oportunidad, evitar retrasos, claridad y criterio.",
  "Cultura de aprendizaje": "Mide el aprendizaje a nivel de equipo: promover aprendizaje, compartir conocimientos, espacios de mejora.",
  "Comunicación": "Mide la alineación estratégica del equipo: claridad en prioridades, decisiones a tiempo, retroalimentación.",
  "Motivación e innovación": "Mide la capacidad de inspirar y transformar: ideas innovadoras, motivación, impulso al cambio.",
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
            <RadioGroup
              value={rating.toString()}
              onValueChange={(value) => onRatingChange(topic.id, Number.parseInt(value))}
              className="flex flex-wrap gap-2"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <div 
                  key={value} 
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    rating === value 
                      ? "bg-blue-100 border-blue-400 text-blue-700" 
                      : "bg-white border-gray-200 hover:border-blue-200"
                  }`}
                >
                  <RadioGroupItem 
                    value={value.toString()} 
                    id={`rating-${topic.id}-${value}`} 
                    className="sr-only"
                  />
                  <Label 
                    htmlFor={`rating-${topic.id}-${value}`} 
                    className="cursor-pointer text-sm font-medium"
                  >
                    {value} - {ratingDescriptions[value]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  )
}
