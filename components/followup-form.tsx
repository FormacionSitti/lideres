"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { TopicRating } from "@/components/topic-rating"
import type { Leader, Topic } from "@/lib/types"
import { format, parseISO, set } from "date-fns"

interface FollowupFormProps {
  leaders: Leader[]
  topics: Topic[]
}

function FollowupFormContent({ leaders, topics }: FollowupFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPrevious, setLoadingPrevious] = useState(false)
  const [selectedLeader, setSelectedLeader] = useState("")
  const [observations, setObservations] = useState("")
  const [agreements, setAgreements] = useState("")
  const [followupDate, setFollowupDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [nextFollowupDate, setNextFollowupDate] = useState("")
  const [type, setType] = useState("acompanamiento")
  const [selectedTopics, setSelectedTopics] = useState<Record<string, boolean>>({})
  const [topicRatings, setTopicRatings] = useState<Record<string, number>>({})
  const [previousAgreements, setPreviousAgreements] = useState("")
  const { toast } = useToast()

  // Get the previous followup ID from the URL
  const previousFollowupId =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("previous") : null

  useEffect(() => {
    if (previousFollowupId) {
      loadPreviousFollowup(previousFollowupId)
    }
  }, [previousFollowupId])

  const loadPreviousFollowup = async (followupId: string) => {
    setLoadingPrevious(true)
    try {
      // Usar la API en lugar de Supabase directamente
      const response = await fetch("/api/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getPreviousFollowup",
          data: { followup_id: followupId },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar el seguimiento anterior")
      }

      const { data: followup } = await response.json()

      if (followup) {
        setSelectedLeader(followup.leader_id.toString())
        setType(followup.type)
        setPreviousAgreements(followup.agreements || "")

        const topicsSelected: Record<string, boolean> = {}
        const ratings: Record<string, number> = {}

        followup.followup_topics.forEach((ft: any) => {
          topicsSelected[ft.topic_id] = true
          ratings[ft.topic_id] = ft.rating
        })

        setSelectedTopics(topicsSelected)
        setTopicRatings(ratings)

        // Mostrar un mensaje con los acuerdos anteriores
        toast({
          title: "Acuerdos del seguimiento anterior",
          description: followup.agreements || "No se registraron acuerdos",
          duration: 10000, // 10 segundos
        })
      }
    } catch (error) {
      console.error("Error loading previous followup:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el seguimiento anterior",
        variant: "destructive",
      })
    } finally {
      setLoadingPrevious(false)
    }
  }

  // Modificar la función handleSubmit para usar la API y corregir el manejo de fechas
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones
      if (!selectedLeader) {
        throw new Error("Debes seleccionar un líder")
      }
      if (!followupDate) {
        throw new Error("Debes seleccionar una fecha de seguimiento")
      }

      // Obtener el último número de secuencia para este líder usando la API
      const seqResponse = await fetch("/api/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getFollowups",
          data: { leader_id: selectedLeader },
        }),
      })

      if (!seqResponse.ok) {
        const errorData = await seqResponse.json()
        throw new Error(errorData.error || "Error al obtener seguimientos")
      }

      const { data: followupsData } = await seqResponse.json()

      // Ordenar por número de secuencia descendente
      const sortedFollowups = followupsData.sort((a: any, b: any) => b.sequence_number - a.sequence_number)
      const nextSequenceNumber = sortedFollowups.length > 0 ? sortedFollowups[0].sequence_number + 1 : 1

      // Corregir el manejo de fechas para asegurar que se guarde la fecha correcta
      // Convertir la fecha seleccionada a un objeto Date con hora 12:00 para evitar problemas de zona horaria
      const selectedDate = parseISO(followupDate)
      const formattedFollowupDate = set(selectedDate, {
        hours: 12,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }).toISOString()

      // Hacer lo mismo con la fecha del próximo seguimiento si existe
      let formattedNextFollowupDate = null
      if (nextFollowupDate) {
        const selectedNextDate = parseISO(nextFollowupDate)
        formattedNextFollowupDate = set(selectedNextDate, {
          hours: 12,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString()
      }

      // Insertar el seguimiento usando la API
      const followupResponse = await fetch("/api/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "addFollowup",
          data: {
            leader_id: Number.parseInt(selectedLeader),
            type,
            observations,
            agreements,
            followup_date: formattedFollowupDate,
            next_followup_date: formattedNextFollowupDate,
            sequence_number: nextSequenceNumber,
            previous_followup_id: previousFollowupId,
          },
        }),
      })

      if (!followupResponse.ok) {
        const errorData = await followupResponse.json()
        throw new Error(errorData.error || "Error al agregar seguimiento")
      }

      const { data: followup } = await followupResponse.json()

      // Insertar las calificaciones de temas
      const topicRatingsToInsert = Object.entries(selectedTopics)
        .filter(([_, selected]) => selected)
        .map(([topicId]) => ({
          followup_id: followup.id,
          topic_id: topicId,
          rating: topicRatings[topicId] || 1,
        }))

      if (topicRatingsToInsert.length > 0) {
        const topicsResponse = await fetch("/api/supabase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "addTopicRatings",
            data: {
              followup_id: followup.id,
              topicRatings: topicRatingsToInsert,
            },
          }),
        })

        if (!topicsResponse.ok) {
          const errorData = await topicsResponse.json()
          throw new Error(errorData.error || "Error al agregar calificaciones de temas")
        }
      }

      toast({
        title: "Seguimiento agregado",
        description: "El seguimiento se ha guardado correctamente.",
      })

      // Limpiar formulario
      setSelectedLeader("")
      setObservations("")
      setAgreements("")
      setFollowupDate(format(new Date(), "yyyy-MM-dd"))
      setNextFollowupDate("")
      setSelectedTopics({})
      setTopicRatings({})
      setPreviousAgreements("")

      // Recargar la página para limpiar el parámetro previous
      if (previousFollowupId) {
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Error adding followup:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo guardar el seguimiento. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTopicSelect = (topicId: string, selected: boolean) => {
    setSelectedTopics((prev) => ({
      ...prev,
      [topicId]: selected,
    }))
    if (selected && !topicRatings[topicId]) {
      setTopicRatings((prev) => ({
        ...prev,
        [topicId]: 1,
      }))
    }
  }

  const handleTopicRating = (topicId: string, rating: number) => {
    setTopicRatings((prev) => ({
      ...prev,
      [topicId]: rating,
    }))
  }

  if (loadingPrevious) {
    return (
      <Card className="p-6 bg-white">
        <div className="text-center py-8 text-muted-foreground">Cargando seguimiento anterior...</div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-white">
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold mb-4">
          {previousFollowupId ? "Continuar Seguimiento" : "Nuevo Seguimiento"}
        </h2>

        {previousAgreements && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Acuerdos del seguimiento anterior:</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{previousAgreements}</p>
          </div>
        )}

        <Tabs defaultValue={type} className="mb-6" onValueChange={(value) => setType(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="acompanamiento">Acompañamiento</TabsTrigger>
            <TabsTrigger value="felicitaciones">Felicitaciones</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Seleccionar líder</label>
              <Select value={selectedLeader} onValueChange={setSelectedLeader} disabled={!!previousFollowupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar líder" />
                </SelectTrigger>
                <SelectContent>
                  {leaders.map((leader) => (
                    <SelectItem key={leader.id} value={leader.id.toString()}>
                      {leader.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <Input type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">Temas a trabajar</label>
            <div className="space-y-2">
              {topics.map((topic) => (
                <TopicRating
                  key={topic.id}
                  topic={topic}
                  selected={selectedTopics[topic.id] || false}
                  rating={topicRatings[topic.id] || 1}
                  onSelectChange={handleTopicSelect}
                  onRatingChange={handleTopicRating}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <Textarea
              placeholder="Escribe las observaciones aquí"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Acuerdos</label>
            <Textarea
              placeholder="Escribe los acuerdos aquí"
              value={agreements}
              onChange={(e) => setAgreements(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha del próximo acompañamiento</label>
            <Input type="date" value={nextFollowupDate} onChange={(e) => setNextFollowupDate(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Agregando..." : "Agregar"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function FollowupForm(props: FollowupFormProps) {
  return (
    <Suspense fallback={<div>Cargando formulario...</div>}>
      <FollowupFormContent {...props} />
    </Suspense>
  )
}
