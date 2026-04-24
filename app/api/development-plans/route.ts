import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leader_id, duration_months, selected_topics, observations } = body

    // Validar datos requeridos
    if (!leader_id || !duration_months || !selected_topics || selected_topics.length === 0) {
      return NextResponse.json(
        { success: false, error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()

    // Calcular fechas
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + duration_months)

    // Crear plan de desarrollo
    const { data: plan, error: planError } = await supabase
      .from("development_plans")
      .insert({
        leader_id,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        duration_months,
        status: "active",
        observations,
      })
      .select()
      .single()

    if (planError) {
      throw new Error(`Error creando plan: ${planError.message}`)
    }

    // Crear items del plan
    if (selected_topics && selected_topics.length > 0) {
      const itemsData = selected_topics.map((item: any) => ({
        plan_id: plan.id,
        topic_id: item.id,
        target_rating: item.target_rating || 4,
        current_rating: 0,
        progress: 0,
        activities: item.activities || "",
      }))

      const { error: itemsError } = await supabase
        .from("development_plan_items")
        .insert(itemsData)

      if (itemsError) {
        throw new Error(`Error creando items: ${itemsError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        items: selected_topics.map((item: any) => ({
          id: item.id,
          topic_id: item.id,
          topic_name: item.topic_name || "",
          target_rating: item.target_rating || 4,
          current_rating: 0,
          progress: 0,
          activities: item.activities || "",
        })),
      },
    })
  } catch (error: any) {
    console.error("Error en POST /api/development-plans:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno del servidor",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const leaderId = searchParams.get("leaderId")

    const supabase = getSupabaseServer()

    let query = supabase
      .from("development_plans")
      .select(`
        *,
        development_plan_items(
          id,
          topic_id,
          topics(name),
          target_rating,
          current_rating,
          progress,
          activities
        )
      `)
      .order("created_at", { ascending: false })

    if (leaderId) {
      query = query.eq("leader_id", Number.parseInt(leaderId))
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error obteniendo planes: ${error.message}`)
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Error en GET /api/development-plans:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno del servidor",
      },
      { status: 500 }
    )
  }
}
