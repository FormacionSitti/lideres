import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

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
