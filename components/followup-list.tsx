"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, differenceInDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Download, ArrowRight, BarChart, Database, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
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

  const fetchFollowups = async (leaderId: string) => {
    setLoading(true)
    try {
      // Usar la API en lugar de Supabase directamente
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

  // Refrescar datos manualmente
  const refreshData = () => {
    if (selectedLeader) {
      fetchFollowups(selectedLeader)
    }
    setRefreshKey((prev) => prev + 1)
  }

  // Efecto para recargar datos cuando cambia refreshKey
  useEffect(() => {
    if (selectedLeader) {
      fetchFollowups(selectedLeader)
    }
  }, [refreshKey])

  const handleContinueFollowup = (followupId: string) => {
    router.push(`/?previous=${followupId}`)
  }

  // Función para formatear fechas correctamente considerando la zona horaria
  const formatDateWithTimezone = (dateString: string) => {
    try {
      // Parsear la fecha ISO
      const date = parseISO(dateString)
      // Formatear la fecha usando la configuración local
      return format(date, "d 'de' MMMM, yyyy", { locale: es })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString // Devolver la fecha original si hay un error
    }
  }

  const exportToExcel = async (allLeaders = false) => {
    setExportLoading(true)
    try {
      let followupsToExport = []

      if (allLeaders) {
        // Usar la API para obtener todos los seguimientos
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

      // Prepare data preserving exact timestamps
      const followupsData = followupsToExport.map((followup) => {
        // Parsear las fechas para asegurar el formato correcto
        const followupDate = parseISO(followup.followup_date)
        const nextFollowupDate = followup.next_followup_date ? parseISO(followup.next_followup_date) : null

        return {
          "ID Líder": followup.leaders?.id || "",
          "Nombre del Líder": followup.leaders?.name || "",
          "ID Seguimiento": followup.id,
          "Número de Secuencia": followup.sequence_number,
          "Tipo de Seguimiento": followup.type === "acompanamiento" ? "Acompañamiento" : "Felicitaciones",
          "Fecha y Hora": followup.followup_date, // Mantener timestamp completo
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

      // Adjust column widths
      const followupsColWidths = [
        { wch: 10 }, // ID Líder
        { wch: 30 }, // Nombre del Líder
        { wch: 15 }, // ID Seguimiento
        { wch: 10 }, // Número de Secuencia
        { wch: 20 }, // Tipo de Seguimiento
        { wch: 20 }, // Fecha y Hora
        { wch: 12 }, // Fecha
        { wch: 10 }, // Hora
        { wch: 20 }, // Próxima Fecha
        { wch: 15 }, // Días hasta próximo seguimiento
        { wch: 50 }, // Observaciones
        { wch: 50 }, // Acuerdos
        { wch: 10 }, // Cantidad de Temas
        { wch: 12 }, // Promedio Calificaciones
      ]

      wsFollowups["!cols"] = followupsColWidths

      const fileName = allLeaders
        ? `Reporte_Completo_${format(new Date(), "dd-MM-yyyy_HHmm")}.xlsx`
        : `Seguimientos_${leaders.find((l) => l.id.toString() === selectedLeader)?.name}_${format(
            new Date(),
            "dd-MM-yyyy_HHmm",
          )}.xlsx`

      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Error exportando seguimientos:", error)
    } finally {
      setExportLoading(false)
    }
  }

  const exportForPowerBI = async () => {
    setExportLoading(true)
    try {
      // Fetch all data needed for Power BI using the API
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

      // Obtener las calificaciones de temas
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

      // 1. Tabla de Líderes
      const dimLideres = leadersData.map((leader) => ({
        ID_Lider: leader.id,
        Nombre_Lider: leader.name,
      }))

      // 2. Tabla de Temas
      const dimTemas = topicsData.map((topic) => ({
        ID_Tema: topic.id,
        Nombre_Tema: topic.name,
      }))

      // 3. Tabla de Fechas - Ahora incluye la hora exacta
      const dates = new Set(followupsData.map((f) => f.followup_date))
      const dimFechas = Array.from(dates).map((dateStr) => {
        const date = parseISO(dateStr)
        return {
          Fecha_Clave: dateStr, // Mantener el timestamp completo
          Fecha_Completa: dateStr, // Mantener el timestamp completo
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

      // 4. Tabla de Seguimientos - Mantener timestamps completos
      const factSeguimientos = followupsData.map((followup) => {
        const followupDate = parseISO(followup.followup_date)
        const nextFollowupDate = followup.next_followup_date ? parseISO(followup.next_followup_date) : null

        return {
          ID_Seguimiento: followup.id,
          ID_Lider: followup.leader_id,
          Fecha_Seguimiento: followup.followup_date, // Timestamp completo
          Fecha_Proximo: followup.next_followup_date, // Timestamp completo si existe
          Numero_Secuencia: followup.sequence_number,
          Tipo_Seguimiento: followup.type === "acompanamiento" ? "Acompañamiento" : "Felicitaciones",
          Observaciones: followup.observations || "",
          Acuerdos: followup.agreements || "",
          ID_Seguimiento_Anterior: followup.previous_followup_id || "",
          Dias_Entre_Seguimientos:
            nextFollowupDate && followupDate ? differenceInDays(nextFollowupDate, followupDate) : "",
        }
      })

      // 5. Tabla de Calificaciones de Temas
      const factCalificaciones = followupTopicsData.map((ft) => ({
        ID_Seguimiento: ft.followup_id,
        ID_Tema: ft.topic_id,
        Calificacion: ft.rating,
        Calificacion_Texto: `${ft.rating} de 5`,
      }))

      // Crear libro de trabajo con múltiples hojas
      const wb = XLSX.utils.book_new()

      // Agregar una hoja con instrucciones actualizadas
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

      // Agregar las hojas de datos
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

      // Exportar el libro
      const fileName = `Seguimientos_PowerBI_${format(new Date(), "dd-MM-yyyy_HHmm")}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Error exportando datos:", error)
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
