"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, differenceInDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Download, ArrowRight, BarChart, Database, RefreshCw, FileText, PieChart } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Leader, Followup } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { RadarChart } from "@/components/radar-chart"
import { CoachingInterpretation } from "@/components/coaching-interpretation"

interface FollowupListProps {
  leaders: Leader[]
}

export function FollowupList({ leaders }: FollowupListProps) {
  const [selectedLeader, setSelectedLeader] = useState("")
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [showRadar, setShowRadar] = useState(false)
  const [radarData, setRadarData] = useState<{ label: string; value: number }[]>([])
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

  // Calcular datos para el radar cuando cambian los followups
  useEffect(() => {
    if (followups.length > 0) {
      calculateRadarData()
    } else {
      setRadarData([])
      setShowRadar(false)
    }
  }, [followups])

  const calculateRadarData = () => {
    // Agrupar calificaciones por tema
    const topicRatings: Record<string, { total: number; count: number }> = {}

    followups.forEach((followup) => {
      followup.topics.forEach((topic) => {
        if (!topicRatings[topic.name]) {
          topicRatings[topic.name] = { total: 0, count: 0 }
        }
        topicRatings[topic.name].total += topic.rating
        topicRatings[topic.name].count += 1
      })
    })

    // Calcular promedio por tema
    const data = Object.entries(topicRatings).map(([label, { total, count }]) => ({
      label,
      value: Number((total / count).toFixed(2)),
    }))

    // Ordenar para mejor visualización en el radar
    const preferredOrder = [
      "Liderazgo cercano",
      "Resolución táctico-estratégica de problemas",
      "Visión transformadora",
      "Toma de decisiones ágil y efectiva",
      "Cultura de aprendizaje",
      "Comunicación",
      "Motivación e innovación",
    ]

    data.sort((a, b) => {
      const indexA = preferredOrder.indexOf(a.label)
      const indexB = preferredOrder.indexOf(b.label)
      if (indexA === -1 && indexB === -1) return a.label.localeCompare(b.label)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })

    setRadarData(data)
  }

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

  const generateExpertCoachAnalysis = (summary: any) => {
    const { leader, totalFollowups, avgRating, followups } = summary
    const plannedFollowups = 10
    const progress = totalFollowups > 0 ? (totalFollowups / plannedFollowups) * 100 : 0
    const firstName = leader.name.split(" ")[0]

    // Variaciones para evitar repeticiones
    const randomSeed = leader.id % 5

    if (totalFollowups === 0) {
      const openings = [
        `El proceso de acompañamiento con ${firstName} aún no ha iniciado. Cuando comencemos, será una oportunidad valiosa para explorar fortalezas, identificar áreas de desarrollo y construir un plan de crecimiento alineado con su estilo de liderazgo.`,
        `${firstName} todavía no ha comenzado su proceso de acompañamiento. Al iniciar, podremos trabajar juntos en identificar oportunidades de crecimiento y diseñar estrategias que potencien su liderazgo.`,
        `No se han registrado sesiones de acompañamiento con ${firstName}. El inicio del proceso permitirá establecer una línea base y co-crear un plan de desarrollo personalizado.`,
      ]
      return openings[randomSeed % openings.length]
    }

    // Análisis temporal: dividir en fase inicial y reciente
    const sortedFollowups = [...followups].sort(
      (a: any, b: any) => new Date(a.followup_date).getTime() - new Date(b.followup_date).getTime(),
    )

    const midPoint = Math.floor(sortedFollowups.length / 2)
    const initialPhase = sortedFollowups.slice(0, Math.max(1, midPoint))
    const recentPhase = sortedFollowups.slice(Math.max(1, midPoint))

    // Análisis por tema: evolución temporal
    const topicEvolution: { [key: string]: { initial: number[]; recent: number[]; all: number[] } } = {}

    initialPhase.forEach((f: any) => {
      f.followup_topics.forEach((ft: any) => {
        const topicName = ft.topics.name
        if (!topicEvolution[topicName]) {
          topicEvolution[topicName] = { initial: [], recent: [], all: [] }
        }
        topicEvolution[topicName].initial.push(ft.rating)
        topicEvolution[topicName].all.push(ft.rating)
      })
    })

    recentPhase.forEach((f: any) => {
      f.followup_topics.forEach((ft: any) => {
        const topicName = ft.topics.name
        if (!topicEvolution[topicName]) {
          topicEvolution[topicName] = { initial: [], recent: [], all: [] }
        }
        topicEvolution[topicName].recent.push(ft.rating)
        topicEvolution[topicName].all.push(ft.rating)
      })
    })

    const improvements: { topic: string; initialAvg: number; recentAvg: number; improvement: number }[] = []
    const stagnant: { topic: string; avg: number }[] = []
    const declining: { topic: string; initialAvg: number; recentAvg: number; decline: number }[] = []

    Object.entries(topicEvolution).forEach(([topic, data]) => {
      const initialAvg = data.initial.length > 0 ? data.initial.reduce((a, b) => a + b, 0) / data.initial.length : 0
      const recentAvg =
        data.recent.length > 0 ? data.recent.reduce((a, b) => a + b, 0) / data.recent.length : initialAvg
      const overallAvg = data.all.reduce((a, b) => a + b, 0) / data.all.length

      const change = recentAvg - initialAvg

      if (change >= 0.5) {
        improvements.push({ topic, initialAvg, recentAvg, improvement: change })
      } else if (change <= -0.5) {
        declining.push({ topic, initialAvg, recentAvg, decline: Math.abs(change) })
      } else if (overallAvg < 3.5) {
        stagnant.push({ topic, avg: overallAvg })
      }
    })

    improvements.sort((a, b) => b.improvement - a.improvement)
    declining.sort((a, b) => b.decline - a.decline)
    stagnant.sort((a, b) => a.avg - b.avg)

    // Construir análisis con tono profesional pero cercano
    let analysis = ""

    // 1. CONTEXTO GENERAL
    const contextOpenings = [
      `Durante el proceso de acompañamiento, ${firstName} ha completado ${totalFollowups} de ${plannedFollowups} sesiones planificadas. `,
      `${firstName} lleva ${totalFollowups} sesiones de las ${plannedFollowups} programadas en su proceso de desarrollo. `,
      `El acompañamiento con ${firstName} registra ${totalFollowups} sesiones realizadas de un total de ${plannedFollowups} planificadas. `,
    ]
    analysis += contextOpenings[randomSeed % contextOpenings.length]

    const avgNum = Number.parseFloat(avgRating)
    if (!isNaN(avgNum)) {
      if (avgNum >= 4.5) {
        analysis += `El desempeño general es sobresaliente, con un promedio de ${avgRating}/5 en las competencias trabajadas. `
      } else if (avgNum >= 4.0) {
        analysis += `Se observa un nivel de desarrollo sólido, reflejado en un promedio de ${avgRating}/5. `
      } else if (avgNum >= 3.5) {
        analysis += `El progreso es satisfactorio con un promedio de ${avgRating}/5, identificando oportunidades claras de mejora. `
      } else {
        analysis += `El promedio actual de ${avgRating}/5 indica áreas importantes que requieren atención y trabajo enfocado. `
      }
    }

    // 2. AVANCES EVIDENCIADOS
    if (improvements.length > 0) {
      const advanceIntros = [
        `\n\n**Avances evidenciados:** `,
        `\n\n**Evolución positiva:** `,
        `\n\n**Competencias que han mejorado:** `,
      ]
      analysis += advanceIntros[randomSeed % advanceIntros.length]

      if (improvements.length === 1) {
        analysis += `Se registra un avance significativo en ${improvements[0].topic}, pasando de ${improvements[0].initialAvg.toFixed(1)} a ${improvements[0].recentAvg.toFixed(1)}. `
        analysis += `Este progreso refleja la aplicación consistente de los aprendizajes en la práctica diaria. `
      } else {
        analysis += `${firstName} ha mostrado evolución en ${improvements.length} competencias clave. `
        analysis += `Destaca el avance en ${improvements[0].topic} (de ${improvements[0].initialAvg.toFixed(1)} a ${improvements[0].recentAvg.toFixed(1)})${improvements.length > 1 ? ` y ${improvements[1].topic} (de ${improvements[1].initialAvg.toFixed(1)} a ${improvements[1].recentAvg.toFixed(1)})` : ""}. `
        analysis += `Estos resultados evidencian compromiso con el proceso y capacidad de integrar nuevas prácticas. `
      }
    } else if (totalFollowups >= 3) {
      analysis += `\n\n**Estado actual:** `
      analysis += `Las competencias trabajadas se mantienen en niveles estables. `
      analysis += `El siguiente paso es profundizar en la práctica y buscar oportunidades de aplicación en contextos más desafiantes. `
    }

    // 3. BRECHAS Y OPORTUNIDADES
    const persistentGaps = stagnant.filter((s) => s.avg < 3.0)
    const moderateGaps = stagnant.filter((s) => s.avg >= 3.0 && s.avg < 3.5)

    if (persistentGaps.length > 0 || declining.length > 0) {
      const gapIntros = [
        `\n\n**Brechas que requieren atención:** `,
        `\n\n**Áreas de oportunidad prioritarias:** `,
        `\n\n**Competencias por fortalecer:** `,
      ]
      analysis += gapIntros[randomSeed % gapIntros.length]

      if (declining.length > 0) {
        analysis += `${declining[0].topic} muestra una disminución (de ${declining[0].initialAvg.toFixed(1)} a ${declining[0].recentAvg.toFixed(1)}). `
        analysis += `Es importante explorar los factores que están influyendo en este retroceso y ajustar el enfoque de trabajo. `
      }

      if (persistentGaps.length > 0) {
        if (persistentGaps.length === 1) {
          analysis += `${persistentGaps[0].topic} (${persistentGaps[0].avg.toFixed(1)}/5) representa una brecha significativa que requiere intervención focalizada. `
          analysis += `Se recomienda diseñar un plan de acción específico con práctica deliberada y retroalimentación frecuente. `
        } else {
          const gapList = persistentGaps
            .slice(0, 2)
            .map((g) => `${g.topic} (${g.avg.toFixed(1)}/5)`)
            .join(" y ")
          analysis += `${gapList} son competencias que necesitan mayor dedicación y posiblemente un enfoque metodológico diferente. `
          analysis += `Estas áreas representan oportunidades importantes de desarrollo que impactarán positivamente el liderazgo de ${firstName}. `
        }
      }
    }

    if (moderateGaps.length > 0 && persistentGaps.length === 0 && declining.length === 0) {
      analysis += `\n\n**Oportunidades de excelencia:** `
      if (moderateGaps.length === 1) {
        analysis += `${moderateGaps[0].topic} (${moderateGaps[0].avg.toFixed(1)}/5) tiene potencial para convertirse en una fortaleza distintiva. `
      } else {
        const modGapList = moderateGaps
          .slice(0, 2)
          .map((g) => `${g.topic} (${g.avg.toFixed(1)}/5)`)
          .join(" y ")
        analysis += `${modGapList} están en buen nivel y pueden elevarse con práctica intencional. `
      }
      analysis += `Con enfoque estratégico, estas competencias pueden diferenciarse significativamente. `
    }

    // 4. RECOMENDACIONES ESTRATÉGICAS
    const recoIntros = [
      `\n\n**Recomendaciones:** `,
      `\n\n**Próximos pasos sugeridos:** `,
      `\n\n**Plan de acción recomendado:** `,
    ]
    analysis += recoIntros[randomSeed % recoIntros.length]

    if (progress < 50) {
      analysis += `Estamos en la fase inicial del proceso (${progress.toFixed(0)}% completado). `
      if (persistentGaps.length > 0) {
        analysis += `Priorizar el trabajo en ${persistentGaps[0].topic} en las próximas sesiones, utilizando ejercicios prácticos y casos reales. `
      } else {
        analysis += `Mantener la constancia en las sesiones y profundizar en la aplicación práctica de los conceptos trabajados. `
      }
      analysis += `Cada sesión construye sobre la anterior, por lo que la regularidad es clave para consolidar aprendizajes. `
    } else if (progress < 100) {
      if (improvements.length > 0 && persistentGaps.length > 0) {
        analysis += `Aprovechar la fortaleza desarrollada en ${improvements[0].topic} como base para trabajar ${persistentGaps[0].topic}. `
        analysis += `Las competencias que ya dominamos pueden servir como modelo para abordar las que presentan mayor desafío. `
      }
      analysis += `En esta fase avanzada (${progress.toFixed(0)}% completado), el foco debe estar en consolidar los aprendizajes y asegurar su transferencia al contexto real de liderazgo. `
    } else {
      if (avgNum >= 4.0) {
        analysis += `${firstName} ha alcanzado un nivel de madurez notable en su desarrollo. `
        analysis += `Se sugiere considerar roles de mentoría o participación en comunidades de práctica para continuar creciendo mientras aporta a otros líderes. `
      } else if (persistentGaps.length > 0) {
        analysis += `Aunque se completó el ciclo planificado, ${persistentGaps.map((g) => g.topic).join(", ")} requieren atención adicional. `
        analysis += `Se recomienda programar 3-4 sesiones complementarias enfocadas específicamente en estas competencias para asegurar la sostenibilidad de los resultados. `
      } else {
        analysis += `El ciclo de acompañamiento se ha completado con resultados satisfactorios. `
        analysis += `Se sugiere establecer sesiones de seguimiento trimestrales para mantener el momentum, abordar nuevos desafíos y continuar el desarrollo del liderazgo. `
      }
    }

    return analysis
  }

  const exportWithAnalysis = async () => {
    setAnalysisLoading(true)
    try {
      // Importar XLSX dinámicamente
      const XLSX = await import("xlsx")

      toast({
        title: "Generando análisis de coach...",
        description: "Evaluando el proceso de cada líder con mirada experta...",
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

        const expertAnalysis = generateExpertCoachAnalysis(summary)

        return {
          Líder: summary.leader.name,
          "Acompañamientos planificados": plannedFollowups,
          "Acompañamientos realizados": summary.totalFollowups,
          "% Avance": `${progress}%`,
          Estado: status,
          "Promedio Calificaciones": summary.avgRating,
          "Análisis del Coach": expertAnalysis,
        }
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(reportData)

      ws["!cols"] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 150 }]

      XLSX.utils.book_append_sheet(wb, ws, "Análisis de Coaching")

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      const fileName = `Analisis_Coaching_${format(new Date(), "dd-MM-yyyy_HHmm")}.xlsx`
      downloadFile(blob, fileName)

      toast({
        title: "Análisis generado",
        description: "El reporte con la perspectiva del coach está listo.",
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
        body: JSON.JSON.stringify({
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
          {selectedLeader && radarData.length > 0 && (
            <Button
              variant="default"
              onClick={() => setShowRadar(!showRadar)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <PieChart className="w-4 h-4 mr-2" />
              {showRadar ? "Ocultar Radar" : "Ver Radar Táctico"}
            </Button>
          )}
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

        {/* Radar Táctico-Estratégico */}
        {showRadar && radarData.length > 0 && selectedLeader && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-center mb-4">
                Radar Táctico-Estratégico: {uniqueLeaders.find((l) => l.id.toString() === selectedLeader)?.name}
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Promedio de calificaciones por dimensión (Escala 1-5)
              </p>
              <RadarChart data={radarData} size={350} color="#2563eb" />
              
              {/* Leyenda de calificaciones */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {radarData.map((item, index) => (
                  <div 
                    key={index} 
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.value >= 4 ? "bg-green-100 text-green-700" :
                      item.value >= 3 ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.label}: {item.value.toFixed(1)}
                  </div>
                ))}
              </div>
            </Card>

            {/* Interpretación del Coach */}
            <CoachingInterpretation 
              data={radarData} 
              leaderName={uniqueLeaders.find((l) => l.id.toString() === selectedLeader)?.name || ""} 
            />
          </div>
        )}

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
