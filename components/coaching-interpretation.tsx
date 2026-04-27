"use client"

import { Card } from "@/components/ui/card"

interface CoachingInterpretationProps {
  data: {
    label: string
    value: number
    questions?: { question: string; rating: number }[]
  }[]
  leaderName: string
}

export function CoachingInterpretation({ data, leaderName }: CoachingInterpretationProps) {
  const firstName = leaderName.split(" ")[0]
  const avgScore = data.length > 0 ? data.reduce((sum, d) => sum + d.value, 0) / data.length : 0

  // Identificar fortalezas y áreas de oportunidad
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  const strengths = sortedData.filter((d) => d.value >= 4)
  const opportunities = sortedData.filter((d) => d.value < 3)
  const developing = sortedData.filter((d) => d.value >= 3 && d.value < 4)

  const generateOverallInterpretation = () => {
    if (avgScore >= 4.5) {
      return `${firstName} demuestra un nivel de madurez excepcional en sus competencias de liderazgo. Su perfil refleja consistencia y solidez en las dimensiones evaluadas, lo que posiciona a este líder como un referente dentro de la organización.`
    } else if (avgScore >= 4) {
      return `El perfil de ${firstName} evidencia un desarrollo sólido en la mayoría de las competencias de liderazgo. Existe una base fuerte sobre la cual continuar construyendo, con oportunidades claras de alcanzar la excelencia.`
    } else if (avgScore >= 3.5) {
      return `${firstName} presenta un perfil de liderazgo en desarrollo, con competencias que muestran progreso satisfactorio. El acompañamiento continuo permitirá consolidar las fortalezas identificadas y abordar las áreas de mejora.`
    } else if (avgScore >= 3) {
      return `El radar de ${firstName} indica competencias de liderazgo en fase de construcción. Es fundamental mantener el enfoque en el desarrollo sistemático de cada dimensión, priorizando aquellas con mayor impacto en el equipo.`
    } else {
      return `El perfil actual de ${firstName} presenta oportunidades significativas de desarrollo en varias dimensiones del liderazgo. Se recomienda un plan de acompañamiento intensivo y estructurado para fortalecer las competencias base.`
    }
  }

  const generateStrengthsInterpretation = () => {
    if (strengths.length === 0) return null

    const strengthNames = strengths.map((s) => s.label).join(", ")

    if (strengths.length === 1) {
      return `**${strengths[0].label}** emerge como la competencia distintiva de ${firstName} (${strengths[0].value.toFixed(1)}/5). Esta fortaleza representa un activo valioso que puede aprovecharse para impulsar el desarrollo de otras dimensiones y generar impacto positivo en el equipo.`
    } else if (strengths.length <= 3) {
      return `${firstName} destaca en ${strengthNames}. Estas competencias constituyen el núcleo de su liderazgo y deben ser reconocidas y potenciadas. Se sugiere que ${firstName} comparta estas prácticas exitosas con otros líderes de la organización.`
    } else {
      return `El perfil de ${firstName} presenta múltiples fortalezas: ${strengthNames}. Este nivel de desarrollo integral es poco común y refleja un compromiso sostenido con el crecimiento profesional. ${firstName} tiene el potencial de convertirse en mentor de otros líderes.`
    }
  }

  const generateOpportunitiesInterpretation = () => {
    if (opportunities.length === 0) return null

    if (opportunities.length === 1) {
      const opp = opportunities[0]
      return `**${opp.label}** (${opp.value.toFixed(1)}/5) representa el área prioritaria de desarrollo para ${firstName}. Se recomienda diseñar un plan de acción específico con objetivos medibles, prácticas concretas y espacios de retroalimentación frecuente para cerrar esta brecha.`
    } else {
      const oppNames = opportunities.map((o) => `${o.label} (${o.value.toFixed(1)}/5)`).join(", ")
      return `Las áreas que requieren atención prioritaria son: ${oppNames}. Se sugiere abordar estas competencias de manera secuencial, comenzando por aquella que tenga mayor impacto en el desempeño del equipo. El avance en una dimensión frecuentemente impulsa mejoras en las demás.`
    }
  }

  const generateDevelopingInterpretation = () => {
    if (developing.length === 0 || (strengths.length > 0 && opportunities.length > 0)) return null

    const devNames = developing.map((d) => d.label).join(", ")
    return `Las competencias ${devNames} se encuentran en nivel satisfactorio. Con práctica intencional y retroalimentación continua, ${firstName} puede elevarlas al nivel de fortaleza, completando así un perfil de liderazgo más robusto.`
  }

  const generateRecommendations = () => {
    const recommendations: string[] = []

    if (opportunities.length > 0) {
      recommendations.push(
        `Establecer sesiones de acompañamiento focalizadas en ${opportunities[0].label}, con ejercicios prácticos y seguimiento quincenal.`,
      )
    }

    if (strengths.length > 0) {
      recommendations.push(
        `Documentar las prácticas exitosas en ${strengths[0].label} para replicarlas conscientemente y compartirlas con el equipo.`,
      )
    }

    if (avgScore < 4) {
      recommendations.push(
        `Implementar rutinas de autoevaluación mensual para monitorear el progreso en cada dimensión del radar.`,
      )
    }

    if (opportunities.length >= 2) {
      recommendations.push(
        `Considerar programas de formación específicos o mentorías con líderes que destaquen en las áreas de oportunidad identificadas.`,
      )
    }

    return recommendations
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">Interpretación del Coach</h3>

      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        {/* Visión general */}
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Visión General</h4>
          <p>{generateOverallInterpretation()}</p>
        </div>

        {/* Fortalezas */}
        {strengths.length > 0 && (
          <div>
            <h4 className="font-medium text-green-700 mb-2">Fortalezas Identificadas</h4>
            <p>{generateStrengthsInterpretation()}</p>
          </div>
        )}

        {/* Áreas de oportunidad */}
        {opportunities.length > 0 && (
          <div>
            <h4 className="font-medium text-amber-700 mb-2">Áreas de Oportunidad</h4>
            <p>{generateOpportunitiesInterpretation()}</p>
          </div>
        )}

        {/* En desarrollo */}
        {developing.length > 0 && generateDevelopingInterpretation() && (
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Competencias en Desarrollo</h4>
            <p>{generateDevelopingInterpretation()}</p>
          </div>
        )}

        {/* Recomendaciones */}
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Recomendaciones Estratégicas</h4>
          <ul className="list-disc list-inside space-y-1">
            {generateRecommendations().map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Puntaje promedio */}
        <div className="mt-4 pt-4 border-t border-blue-100">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">Índice de Liderazgo Táctico-Estratégico:</span>
            <span
              className={`text-xl font-bold ${avgScore >= 4 ? "text-green-600" : avgScore >= 3 ? "text-blue-600" : "text-amber-600"}`}
            >
              {avgScore.toFixed(2)}/5
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
