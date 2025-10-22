"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, differenceInDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Download, ArrowRight, BarChart, Database, RefreshCw, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Leader, Followup } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

interface FollowupListProps {
  leaders: Leader[]
}

export function FollowupList({ leaders }: FollowupListProps) {
  const [selectedLeader, setSelectedLeader] = useState("")
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Filtrar líderes duplicados basándose en el nombre
  const uniqueLeaders = leaders.reduce((acc: Leader[], current) => {
    const duplicate = acc.find((item) => item.name === current.name)
    if (!duplicate) {
      acc.push(current)
    }
    return acc
  }, [])

  // Agregar un key para forzar la recarga de datos
  const [refreshKey, setRefreshKey] = useState(0)

  // Función helper para descargar archivos
  const downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const fetchFollowups = async (leaderId: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getFollowups",
          data: { leader_id: leaderId },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al obtener seguimientos")
      }

      const { data } = await response.json()

      const formattedFollowups = data.map((followup: any) => ({
        ...followup,
        leader_name: followup.leaders?.name,
        topics: followup.followup_topics.map((ft: any) => ({
          name: ft.topics.name,
          rating: ft.rating,
        })),
      }))

      setFollowups(formattedFollowups)
    } catch (error) {
      console.error("Error fetching followups:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los seguimientos. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLeaderChange = (leaderId: string) => {
    setSelectedLeader(leaderId)
    fetchFollowups(leaderId)
  }

  const refreshData = () => {
    if (selectedLeader) {
      fetchFollowups(selectedLeader)
    }
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    if (selectedLeader) {
      fetchFollowups(selectedLeader)
    }
  }, [refreshKey])

  const handleContinueFollowup = (followupId: string) => {
    router.push(`/?previous=${followupId}`)
  }

  const formatDateWithTimezone = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "d 'de' MMMM, yyyy", { locale: es })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Función para generar síntesis automática basada en reglas
  const generateSynthesis = (summary: any) => {
    const { leader, totalFollowups, avgRating, followups } = summary
    const plannedFollowups = 10
    const progress = totalFollowups > 0 ? (totalFollowups / plannedFollowups) * 100 : 0

    // Si no hay seguimientos
    if (totalFollowups === 0) {
      return "Aún no se registran acompañamientos. Es importante iniciar el proceso para fortalecer el liderazgo, la comunicación y el acompañamiento cercano con el equipo. Cada sesión será una oportunidad para conectar con las necesidades del grupo y guiar desde la empatía y la coherencia."
    }

    let synthesis = ""

    // Evaluar el nivel de progreso
    if (progress >= 100) {
      synthesis +=
        "Excelente nivel de avance. El líder ha completado sus acompañamientos planificados demostrando compromiso y claridad en el desarrollo del equipo. "
    } else if (progress >= 70) {
      synthesis +=
        "Se observa un avance positivo y sostenido en los acompañamientos. El líder mantiene un tono cercano, promueve la participación y continúa fortaleciendo su estilo de liderazgo. "
    } else if (progress >= 50) {
      synthesis +=
        "Se evidencia compromiso en los acompañamientos realizados. El líder ha dado pasos importantes para fortalecer su rol, y ahora el reto está en mantener la regularidad de los espacios, consolidar aprendizajes y potenciar la comunicación efectiva con el equipo. "
    } else if (progress >= 30) {
      synthesis +=
        "El proceso avanza en su fase inicial. Es clave mantener la constancia en los acompañamientos, promover espacios de escucha activa y enfocarse en construir confianza con el equipo. "
    } else {
      synthesis +=
        "El líder ha iniciado el proceso de acompañamiento. Es fundamental incrementar la frecuencia de las sesiones y enfocarse en establecer una comunicación cercana y efectiva con el equipo. "
    }

    // Evaluar calificaciones promedio
    const avgNum = Number.parseFloat(avgRating)
    if (!isNaN(avgNum)) {
      if (avgNum >= 4.5) {
        synthesis +=
          "Las calificaciones reflejan un desempeño sobresaliente en los temas trabajados, indicando dominio y aplicación efectiva de las competencias de liderazgo. "
      } else if (avgNum >= 4.0) {
        synthesis +=
          "Las calificaciones demuestran un buen nivel de desarrollo en las áreas trabajadas, con oportunidades para alcanzar la excelencia. "
      } else if (avgNum >= 3.5) {
        synthesis +=
          "Las calificaciones muestran un nivel satisfactorio, con margen para fortalecer aspectos específicos del liderazgo. "
      } else if (avgNum >= 3.0) {
        synthesis +=
          "Las calificaciones sugieren áreas de mejora importantes. Se recomienda enfocar los próximos acompañamientos en consolidar competencias fundamentales. "
      } else {
        synthesis +=
          "Las calificaciones indican la necesidad de un acompañamiento más intensivo para desarrollar las competencias de liderazgo. "
      }
    }

    // Sugerencias según el estado
    if (progress < 100) {
      if (progress >= 50) {
        synthesis +=
          "Se recomienda mantener la consistencia y generar espacios de retroalimentación impacto en los resultados del equipo."
      } else {
        synthesis +=
          "Pequeños avances sostenidos consolidarán al liderazgo en el tiempo. Cada sesión es una oportunidad para conectar, aprender y compartir buenas prácticas con otros líderes."
      }
    } else {
      synthesis +=
        "El siguiente paso es consolidar los aprendizajes y compartir buenas prácticas con otros líderes para fortalecer el liderazgo organizacional."
    }

    return synthesis
  }

  const exportWithAnalysis = async () => {
    setAnalysisLoading(true)
    try {
      // Importar XLSX dinámicamente
      const XLSX = await import("xlsx")

      toast({
        title: "Generando análisis...",
        description: "Procesando datos de los líderes...",
      })

      const response = await fetch("/api/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAllFollowups",
        }),
      })

      if (!response.ok) {
        throw new Error("Error al obtener seguimientos")
      }

      const { data: allFollowups } = await response.json()

      const leaderSummary = uniqueLeaders.map((leader) => {
        const leaderFollowups = allFollowups.filter((f: any) => f.leader_id === leader.id)
        const totalFollowups = leaderFollowups.length

        let totalRatings = 0
        let ratingCount = 0
        leaderFollowups.forEach((f: any) => {
          f.followup_topics.forEach((ft: any) => {
            totalRatings += ft.rating
            ratingCount++
          })
        })
        const avgRating = ratingCount > 0 ? (totalRatings / ratingCount).toFixed(2) : "N/A"

        return {
          leader,
          totalFollowups,
          avgRating,
          followups: leaderFollowups,
        }
      })

      // Generar síntesis para cada líder
      const reportData = leaderSummary.map((summary) => {
        const plannedFollowups = 10
        const progress =
          summary.totalFollowups > 0 ? ((summary.totalFollowups / plannedFollowups) * 100).toFixed(2) : "0.00"

        let status = "Pendiente"
        if (summary.totalFollowups >= plannedFollowups) {
          status = "Completado"
        } else if (summary.totalFollowups > 0) {
          status = "En progreso"
        }

        const synthesis = generateSynthesis(summary)

        return {
          Líder: summary.leader.name,
          "Acompañamientos planificados": plannedFollowups,
          "Acompañamientos realizados": summary.totalFollowups,
          "% Avance": `${progress}%`,
          Estado: status,
          "Promedio Calificaciones": summary.avgRating,
          "Síntesis del avance": synthesis,
        }
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(reportData)

      // Ajustar anchos de columna
      ws["!cols"] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 120 }]

      XLSX.utils.book_append_sheet(wb, ws, "Análisis de Seguimiento")

      // Generar el archivo como array buffer
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      const fileName = `Analisis_Coaching_${format(new Date(), "dd-MM-yyyy_HHmm")}.xlsx`
      downloadFile(blob, fileName)

      toast({
        title: "Exportación exitosa",
        description: "El análisis se ha generado correctamente.",
      })
    } catch (error) {
      console.error("Error generando análisis:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo generar el análisis. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setAnalysisLoading(false)
    }
  }

  const exportToExcel = async (allLeaders = false) => {
    setExportLoading(true)
    try {
      // Importar XLSX dinámicamente
      const XLSX = await import("xlsx")

      let followupsToExport = []

      if (allLeaders) {
        const response = await fetch("/api/supabase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAllFollowups",
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al obtener seguimientos")
        }

        const { data } = await response.json()
        followupsToExport = data
      } else {
        followupsToExport = followups
      }

      const followupsData = followupsToExport.map((followup) => {
        const followupDate = parseISO(followup.followup_date)
        const nextFollowupDate = followup.next_followup_date ? parseISO(followup.next_followup_date) : null

        return {
          "ID Líder": followup.leaders?.id || "",
          "Nombre del Líder": followup.leaders?.name || "",
          "ID Seguimiento": followup.id,
          "Número de Secuencia": followup.sequence_number,
          "Tipo de Seguimiento": followup.type === "acompanamiento" ? "Acompañamiento" : "Felicitaciones",
          "Fecha y Hora": followup.followup_date,
          Fecha: format(followupDate, "dd/MM/yyyy"),
          Hora: format(followupDate, "HH:mm:ss"),
          "Próxima Fecha": followup.next_followup_date || "",
          "Días hasta próximo seguimiento":
            nextFollowupDate && followupDate ? differenceInDays(nextFollowupDate, followupDate) : "",
          Observaciones: followup.observations || "",
          Acuerdos: followup.agreements || "",
          "Cantidad de Temas": followup.followup_topics.length,
          "Promedio Calificaciones":
            followup.followup_topics.length > 0
              ? (
                  followup.followup_topics.reduce((acc: number, curr: any) => acc + curr.rating, 0) /
                  followup.followup_topics.length
                ).toFixed(2)
              : "",
        }
      })

      const topicsData = followupsToExport.flatMap((followup) =>
        followup.followup_topics.map((topic: any) => ({
          "ID Seguimiento": followup.id,
          "Fecha y Hora": followup.followup_date,
          "ID Líder": followup.leaders?.id || "",
          "Nombre del Líder": followup.leaders?.name || "",
          "ID Tema": topic.topics.id,
          "Nombre del Tema": topic.topics.name,
          Calificación: topic.rating,
        })),
      )

      const wb = XLSX.utils.book_new()
      const wsFollowups = XLSX.utils.json_to_sheet(followupsData)
      const wsTopics = XLSX.utils.json_to_sheet(topicsData)

      XLSX.utils.book_append_sheet(wb, wsFollowups, "Seguimientos")
      XLSX.utils.book_append_sheet(wb, wsTopics, "Temas")

      const followupsColWidths = [
        { wch: 10 },
        { wch: 30 },
        { wch: 15 },
        { wch: 10 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 10 },
        { wch: 20 },
        { wch: 15 },
        { wch: 50 },
        { wch: 50 },
        { wch: 10 },
        { wch: 12 },
      ]

      wsFollowups["!cols"] = followupsColWidths

      // Generar el archivo como array buffer
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      const fileName = allLeaders
        ? `Reporte_Completo_${format(new Date(), "dd-MM-yyyy_HHmm")}.xlsx`
        : `Seguimientos_${leaders.find((l) => l.id.toString() === selectedLeader)?.name}_${format(
            new Date(),
            "dd-MM-yyyy_HHmm",
          )}.xlsx`

      downloadFile(blob, fileName)

      toast({
        title: "Exportación exitosa",
        description: "El archivo se ha descargado correctamente.",
      })
    } catch (error) {
      console.error("Error exportando seguimientos:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setExportLoading(false)
    }
  }

  const exportForPowerBI = async () => {
    setExportLoading(true)
    try {
      // Importar XLSX dinámicamente
      const XLSX = await import("xlsx")

      const [followupsResponse, leadersResponse, topicsResponse] = await Promise.all([
        fetch("/api/supabase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAllFollowups",
          }),
        }),

        fetch("/api/supabase?action=getLeaders"),

        fetch("/api/supabase?action=getTopics"),
      ])

      if (!followupsResponse.ok || !leadersResponse.ok || !topicsResponse.ok) {
        throw new Error("Error al obtener los datos")
      }

      const { data: followupsData } = await followupsResponse.json()
      const { data: leadersData } = await leadersResponse.json()
      const { data: topicsData } = await topicsResponse.json()

      const followupTopicsResponse = await fetch("/api/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAllFollowupTopics",
        }),
      })

      if (!followupTopicsResponse.ok) {
        throw new Error("Error al obtener las calificaciones de temas")
      }

      const { data: followupTopicsData } = await followupTopicsResponse.json()

      const dimLideres = leadersData.map((leader) => ({
        ID_Lider: leader.id,
        Nombre_Lider: leader.name,
      }))

      const dimTemas = topicsData.map((topic) => ({
        ID_Tema: topic.id,
        Nombre_Tema: topic.name,
      }))

      const dates = new Set(followupsData.map((f) => f.followup_date))
      const dimFechas = Array.from(dates).map((dateStr) => {
        const date = parseISO(dateStr)
        return {
          Fecha_Clave: dateStr,
          Fecha_Completa: dateStr,
          Fecha_Corta: format(date, "dd/MM/yyyy"),
          Hora: format(date, "HH:mm:ss"),
          Año: format(date, "yyyy"),
          Mes_Numero: format(date, "MM"),
          Mes: format(date, "MMMM", { locale: es }),
          Trimestre: `T${Math.floor((date.getMonth() + 3) / 3)}`,
          Año_Mes: format(date, "MMMM yyyy", { locale: es }),
          Dia_Semana: format(date, "EEEE", { locale: es }),
          Dia_Mes: format(date, "dd"),
        }
      })

      const factSeguimientos = followupsData.map((followup) => {
        const followupDate = parseISO(followup.followup_date)
        const nextFollowupDate = followup.next_followup_date ? parseISO(followup.next_followup_date) : null

        return {
          ID_Seguimiento: followup.id,
          ID_Lider: followup.leader_id,
          Fecha_Seguimiento: followup.followup_date,
          Fecha_Proximo: followup.next_followup_date,
          Numero_Secuencia: followup.sequence_number,
          Tipo_Seguimiento: followup.type === "acompanamiento" ? "Acompañamiento" : "Felicitaciones",
          Observaciones: followup.observations || "",
          Acuerdos: followup.agreements || "",
          ID_Seguimiento_Anterior: followup.previous_followup_id || "",
          Dias_Entre_Seguimientos:
            nextFollowupDate && followupDate ? differenceInDays(nextFollowupDate, followupDate) : "",
        }
      })

      const factCalificaciones = followupTopicsData.map((ft) => ({
        ID_Seguimiento: ft.followup_id,
        ID_Tema: ft.topic_id,
        Calificacion: ft.rating,
        Calificacion_Texto: `${ft.rating} de 5`,
      }))

      const wb = XLSX.utils.book_new()

      const instrucciones = [
        {
          "Instrucciones de Uso": [
            "1. Este archivo está optimizado para Power BI",
            "2. Relaciones recomendadas:",
            "   - Fact_Seguimientos[ID_Lider] → Dim_Lideres[ID_Lider]",
            "   - Fact_Seguimientos[Fecha_Seguimiento] → Dim_Fechas[Fecha_Completa]",
            "   - Fact_Calificaciones[ID_Seguimiento] → Fact_Seguimientos[ID_Seguimiento]",
            "   - Fact_Calificaciones[ID_Tema] → Dim_Temas[ID_Tema]",
            "3. Medidas sugeridas:",
            "   - Promedio de Calificaciones = AVERAGE(Fact_Calificaciones[Calificacion])",
            "   - Total de Seguimientos = COUNT(Fact_Seguimientos[ID_Seguimiento])",
            "   - Días Entre Seguimientos = AVERAGE(Fact_Seguimientos[Dias_Entre_Seguimientos])",
            "4. Las fechas incluyen hora exacta para mayor precisión",
            "5. Usar Dim_Fechas para análisis temporales detallados",
          ].join("\n"),
        },
      ]

      const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones)
      XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones")

      const sheets = [
        { name: "Dim_Lideres", data: dimLideres },
        { name: "Dim_Temas", data: dimTemas },
        { name: "Dim_Fechas", data: dimFechas },
        { name: "Fact_Seguimientos", data: factSeguimientos },
        { name: "Fact_Calificaciones", data: factCalificaciones },
      ]

      sheets.forEach((sheet) => {
        const ws = XLSX.utils.json_to_sheet(sheet.data)
        XLSX.utils.book_append_sheet(wb, ws, sheet.name)
      })

      // Generar el archivo como array buffer
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      const fileName = `Seguimientos_PowerBI_${format(new Date(), "dd-MM-yyyy_HHmm")}.xlsx`
      downloadFile(blob, fileName)

      toast({
        title: "Exportación exitosa",
        description: "El archivo para Power BI se ha descargado correctamente.",
      })
    } catch (error) {
      console.error("Error exportando datos:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar para Power BI. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-semibold">Historial de Seguimientos</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} className="flex items-center bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button
            variant="default"
            onClick={exportWithAnalysis}
            disabled={analysisLoading}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            {analysisLoading ? "Generando..." : "Análisis de Coach"}
          </Button>
          <Button variant="outline" onClick={exportForPowerBI} disabled={exportLoading}>
            <Database className="w-4 h-4 mr-2" />
            Exportar para Power BI
          </Button>
          {selectedLeader && followups.length > 0 && (
            <Button variant="outline" onClick={() => exportToExcel(false)} disabled={exportLoading}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Líder Actual
            </Button>
          )}
          <Button variant="outline" onClick={() => exportToExcel(true)} disabled={exportLoading}>
            <BarChart className="w-4 h-4 mr-2" />
            Exportar para Análisis
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Select value={selectedLeader} onValueChange={handleLeaderChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar líder" />
          </SelectTrigger>
          <SelectContent>
            {uniqueLeaders.map((leader) => (
              <SelectItem key={leader.id} value={leader.id.toString()}>
                {leader.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading && <div className="text-center py-4 text-muted-foreground">Cargando seguimientos...</div>}

        <div className="space-y-4">
          {followups.map((followup) => (
            <Card key={followup.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium">
                    Seguimiento #{followup.sequence_number} -{" "}
                    {followup.type === "acompanamiento" ? "Acompañamiento" : "Felicitaciones"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{formatDateWithTimezone(followup.followup_date)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleContinueFollowup(followup.id)}>
                  Continuar Seguimiento
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="space-y-4">
                {followup.observations && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Observaciones:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{followup.observations}</p>
                  </div>
                )}

                {followup.agreements && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Acuerdos:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{followup.agreements}</p>
                  </div>
                )}

                {followup.topics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Temas trabajados:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {followup.topics.map((topic, index) => (
                        <div key={index} className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                          {topic.name} - Calificación: {topic.rating}/5
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {followup.next_followup_date && (
                  <div className="text-sm">
                    <span className="font-medium">Próximo seguimiento: </span>
                    <span className="text-muted-foreground">{formatDateWithTimezone(followup.next_followup_date)}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {!loading && followups.length === 0 && selectedLeader && (
            <div className="text-center py-4 text-muted-foreground">
              No hay seguimientos registrados para este líder.
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
