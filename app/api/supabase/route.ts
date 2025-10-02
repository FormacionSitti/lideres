import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "getLeaders") {
    try {
      const { data, error } = await supabaseServer.from("leaders").select("id, name").order("name")

      if (error) throw error

      return NextResponse.json({ data })
    } catch (error: any) {
      console.error("Error in getLeaders:", error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }
  }

  if (action === "getTopics") {
    try {
      const { data, error } = await supabaseServer.from("topics").select("id, name").order("name")

      if (error) throw error

      return NextResponse.json({ data })
    } catch (error: any) {
      console.error("Error in getTopics:", error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, data } = body

    console.log("Acción recibida:", action)
    console.log("Datos recibidos:", data)

    if (action === "addLeaders") {
      const { leaders } = data

      try {
        const { data: insertedLeaders, error } = await supabaseServer.from("leaders").insert(leaders).select()

        if (error) {
          // Si el error es por duplicado, intentar uno por uno
          if (error.code === "23505") {
            const results = []
            for (const leader of leaders) {
              const { data: inserted, error: singleError } = await supabaseServer
                .from("leaders")
                .insert([leader])
                .select()

              if (!singleError) {
                results.push(inserted[0])
              }
            }

            return NextResponse.json({
              success: true,
              data: results,
              message: results.length > 0 ? `${results.length} líder(es) agregado(s)` : "Los líderes ya existen",
            })
          }
          throw error
        }

        return NextResponse.json({
          data: insertedLeaders,
          success: true,
          message: `${insertedLeaders.length} líder(es) agregado(s) exitosamente`,
        })
      } catch (err: any) {
        console.error("Error insertando líderes:", err)
        throw new Error(`Error al insertar líderes: ${err.message}`)
      }
    }

    if (action === "addFollowup") {
      const {
        leader_id,
        type,
        observations,
        agreements,
        followup_date,
        next_followup_date,
        sequence_number,
        previous_followup_id,
      } = data

      const { data: followup, error: followupError } = await supabaseServer
        .from("followups")
        .insert([
          {
            leader_id: Number.parseInt(leader_id),
            type,
            observations,
            agreements,
            followup_date,
            next_followup_date: next_followup_date || null,
            sequence_number,
            previous_followup_id,
          },
        ])
        .select()
        .single()

      if (followupError) throw followupError

      return NextResponse.json({ data: followup })
    }

    if (action === "addTopicRatings") {
      const { followup_id, topicRatings } = data

      const { error: topicsError } = await supabaseServer.from("followup_topics").insert(topicRatings)

      if (topicsError) throw topicsError

      return NextResponse.json({ success: true })
    }

    if (action === "getFollowups") {
      const { leader_id } = data

      const { data: followups, error } = await supabaseServer
        .from("followups")
        .select(`
          id,
          sequence_number,
          type,
          observations,
          agreements,
          followup_date,
          next_followup_date,
          leader_id,
          leaders (
            id,
            name
          ),
          followup_topics (
            topics (
              id,
              name
            ),
            rating
          )
        `)
        .eq("leader_id", leader_id)
        .order("followup_date", { ascending: false })

      if (error) throw error

      return NextResponse.json({ data: followups })
    }

    if (action === "getPreviousFollowup") {
      const { followup_id } = data

      const { data: followup, error } = await supabaseServer
        .from("followups")
        .select(`
          leader_id,
          type,
          observations,
          agreements,
          followup_topics (
            topic_id,
            rating,
            topics (
              name
            )
          )
        `)
        .eq("id", followup_id)
        .single()

      if (error) throw error

      return NextResponse.json({ data: followup })
    }

    if (action === "getAllFollowups") {
      const { data: followups, error } = await supabaseServer
        .from("followups")
        .select(`
          id,
          sequence_number,
          type,
          observations,
          agreements,
          followup_date,
          next_followup_date,
          leader_id,
          leaders (
            id,
            name
          ),
          followup_topics (
            topics (
              id,
              name
            ),
            rating
          )
        `)
        .order("followup_date", { ascending: true })

      if (error) throw error

      return NextResponse.json({ data: followups })
    }

    if (action === "getAllFollowupTopics") {
      const { data: followupTopics, error } = await supabaseServer.from("followup_topics").select(`
          followup_id,
          topic_id,
          rating
        `)

      if (error) throw error

      return NextResponse.json({ data: followupTopics })
    }

    if (action === "deleteAllFollowups") {
      // 1. Primero eliminar los registros de la tabla followup_topics
      const { error: topicsError } = await supabaseServer.from("followup_topics").delete().neq("rating", -999)

      if (topicsError) throw topicsError

      // 2. Luego eliminar todos los registros de la tabla followups
      const { error: followupsError } = await supabaseServer.from("followups").delete().neq("sequence_number", -999)

      if (followupsError) throw followupsError

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error en API:", error)
    return NextResponse.json(
      {
        error: error.message || "Error desconocido",
        details: error,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
