import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { planId, updates, overall_progress } = body

    const supabase = getSupabaseServer()

    // Actualizar cada item con su progreso
    if (updates && Array.isArray(updates)) {
      for (const update of updates) {
        const { error } = await supabase
          .from("development_plan_items")
          .update({
            current_rating: update.current_rating,
            progress: update.progress,
            updated_at: new Date().toISOString(),
          })
          .eq("id", update.id)

        if (error) {
          throw new Error(`Error actualizando item: ${error.message}`)
        }
      }
    }

    // Actualizar progreso general del plan
    const { error: planError } = await supabase
      .from("development_plans")
      .update({
        overall_progress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId || id)

    if (planError) {
      throw new Error(`Error actualizando plan: ${planError.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en PUT /api/development-plans/[id]/progress:", error.message)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
