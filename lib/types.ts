export interface Leader {
  id: number
  name: string
}

export interface Topic {
  id: string
  name: string
}

export interface TopicRating {
  topic_id: string
  rating: number
}

export interface Followup {
  id: string
  leader_id: number
  type: "acompanamiento" | "felicitaciones"
  observations: string
  agreements: string
  followup_date: string
  next_followup_date?: string
  sequence_number: number
  previous_followup_id?: string
  topics: Array<{
    name: string
    rating: number
  }>
}
