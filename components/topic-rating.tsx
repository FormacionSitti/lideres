"use client"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import type { Topic } from "@/lib/types"
import { findCompetency } from "@/lib/competencies"

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
  const competency = findCompetency(topic.name)
  const description = competency && !competency.pending ? competency.definition : ""

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
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{description}</p>
        )}
        {selected && competency?.whyMatters && (
          <p className="text-xs text-blue-700 mt-2 bg-blue-50 border border-blue-100 rounded-md px-2.5 py-1.5 leading-relaxed">
            <span className="font-semibold">Por qué importa en Sitti: </span>
            {competency.whyMatters}
          </p>
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
