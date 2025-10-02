"use client"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import type { Topic } from "@/lib/types"

interface TopicRatingProps {
  topic: Topic
  selected: boolean
  rating: number
  onSelectChange: (topicId: string, selected: boolean) => void
  onRatingChange: (topicId: string, rating: number) => void
}

export function TopicRating({ topic, selected, rating, onSelectChange, onRatingChange }: TopicRatingProps) {
  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelectChange(topic.id, checked as boolean)}
        id={`topic-${topic.id}`}
      />
      <div className="flex-1">
        <Label htmlFor={`topic-${topic.id}`} className="text-sm font-medium">
          {topic.name}
        </Label>
        {selected && (
          <RadioGroup
            value={rating.toString()}
            onValueChange={(value) => onRatingChange(topic.id, Number.parseInt(value))}
            className="flex space-x-2 mt-2"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <div key={value} className="flex items-center space-x-1">
                <RadioGroupItem value={value.toString()} id={`rating-${topic.id}-${value}`} />
                <Label htmlFor={`rating-${topic.id}-${value}`}>{value}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>
    </div>
  )
}
