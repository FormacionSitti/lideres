import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { duration_months, status, observations, start_date, items } = body

    const supabase = getSupabaseServer()

    // Construir el objeto de actualizacion
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (observations !== undefined) updateData.observations = observations

    // Si cambia la duracion o la fecha de inicio, recalcular end_date
    if (duration_months || start_date) {
      // Obtener el plan actual para conocer start_date si no viene
      const { data: currentPlan, error: fetchError } = await supabase
        .from("development_plans")
        .select("start_date, duration_months")
        .eq("id", id)
        .single()

      if (fetchError) {
        throw new Error(`Error obteniendo plan: ${fetchError.message}`)
      }

      const finalStartDate = start_date || currentPlan.start_date
      const finalDurationMonths = duration_months || currentPlan.duration_months

      const startDateObj = new Date(finalStartDate)
      const endDateObj = new Date(startDateObj)
      endDateObj.setMonth(endDateObj.getMonth() + finalDurationMonths)

      updateData.start_date = finalStartDate
      updateData.duration_months = finalDurationMonths
      updateData.end_date = endDateObj.toISOString().split("T")[0]
    }

    const { data: updatedPlan, error: updateError } = await supabase
      .from("development_plans")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Error actualizando plan: ${updateError.message}`)
    }

    // Sincronizar items si vienen en el body
    if (Array.isArray(items)) {
      // Obtener items actuales del plan
      const { data: existingItems, error: existingError } = await supabase
        .from("development_plan_items")
        .select("id, topic_id")
        .eq("plan_id", id)

      if (existingError) {
        throw new Error(`Error obteniendo items existentes: ${existingError.message}`)
      }

      const incomingTopicIds = new Set(items.map((it: any) => it.topic_id))
      const existingByTopicId = new Map((existingItems || []).map((it: any) => [it.topic_id, it.id]))

      // 1. Eliminar items que ya no estan en la lista entrante
      const idsToDelete = (existingItems || [])
        .filter((it: any) => !incomingTopicIds.has(it.topic_id))
        .map((it: any) => it.id)

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("development_plan_items")
          .delete()
          .in("id", idsToDelete)

        if (deleteError) {
          throw new Error(`Error eliminando items: ${deleteError.message}`)
        }
      }

      // 2. Actualizar items existentes o insertar nuevos
      for (const item of items) {
        const existingId = existingByTopicId.get(item.topic_id)

        if (existingId) {
          // Update
          const { error: itemUpdateError } = await supabase
            .from("development_plan_items")
            .update({
              target_rating: item.target_rating,
              current_rating: item.current_rating,
              activities: item.activities || "",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingId)

          if (itemUpdateError) {
            throw new Error(`Error actualizando item: ${itemUpdateError.message}`)
          }
        } else {
          // Insert
          const { error: itemInsertError } = await supabase
            .from("development_plan_items")
            .insert({
              plan_id: id,
              topic_id: item.topic_id,
              target_rating: item.target_rating,
              current_rating: item.current_rating || 0,
              progress: 0,
              activities: item.activities || "",
            })

          if (itemInsertError) {
            throw new Error(`Error insertando item: ${itemInsertError.message}`)
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedPlan })
  } catch (error: any) {
    console.error("Error en PUT /api/development-plans/[id]:", error.message)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = getSupabaseServer()

    // Primero eliminar los items
    const { error: itemsError } = await supabase
      .from("development_plan_items")
      .delete()
      .eq("plan_id", id)

    if (itemsError) {
      throw new Error(`Error eliminando items: ${itemsError.message}`)
    }

    // Luego eliminar el plan
    const { error: planError } = await supabase
      .from("development_plans")
      .delete()
      .eq("id", id)

    if (planError) {
      throw new Error(`Error eliminando plan: ${planError.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en DELETE /api/development-plans/[id]:", error.message)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
