"use server"

import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase-server"

export async function deleteAllFollowups() {
  try {
    // 1. Primero eliminar los registros de la tabla followup_topics (relaciones)
    // Eliminamos todos los registros sin usar filtros
    const { error: topicsError } = await supabaseServer.from("followup_topics").delete().neq("rating", -999) // Este filtro siempre será verdadero ya que rating nunca será -999

    if (topicsError) throw topicsError

    // 2. Luego eliminar todos los registros de la tabla followups
    const { error: followupsError } = await supabaseServer.from("followups").delete().neq("sequence_number", -999) // Este filtro siempre será verdadero ya que sequence_number nunca será -999

    if (followupsError) throw followupsError

    // 3. Revalidar la página para mostrar los cambios
    revalidatePath("/", "layout")

    return { success: true }
  } catch (error) {
    console.error("Error eliminando seguimientos:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}
