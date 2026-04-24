import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

function getSupabaseClient() {
  return getSupabaseServer()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    const supabase = getSupabaseClient()

    if (action === "getLeaders") {
      const { data, error } = await supabase.from("leaders").select("id, name").order("name")

      if (error) throw error

      return NextResponse.json({ data })
    }

    if (action === "getTopics") {
      const { data, error } = await supabase.from("topics").select("id, name").order("name")

      if (error) throw error

      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error: any) {
    console.error("Error en API:", error)
    return NextResponse.json(
      {
        error: error.message || "Error desconocido",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, data } = body

    const supabase = getSupabaseClient()

    if (action === "addLeaders") {
      const { leaders } = data

      const { data: insertedLeaders, error } = await supabase.from("leaders").insert(leaders).select()

      if (error) {
        if (error.code === "23505") {
          const results = []
          for (const leader of leaders) {
            const { data: inserted, error: singleError } = await supabase.from("leaders").insert([leader]).select()

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

      const { data: followup, error: followupError } = await supabase
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

      const { error: topicsError } = await supabase.from("followup_topics").insert(topicRatings)

      if (topicsError) throw topicsError

      return NextResponse.json({ success: true })
    }

    if (action === "getFollowups") {
      const { leader_id } = data
      const parsedLeaderId = Number(leader_id)

      console.log("[v0] getFollowups - leader_id recibido:", leader_id, "parseado:", parsedLeaderId)

      const { data: followups, error } = await supabase
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
        .eq("leader_id", parsedLeaderId)
        .order("followup_date", { ascending: false })

      if (error) {
        console.error("[v0] getFollowups - error Supabase:", error)
        throw error
      }

      console.log(
        "[v0] getFollowups - followups encontrados:",
        followups?.length || 0,
        "para leader_id:",
        parsedLeaderId,
      )

      return NextResponse.json({ data: followups })
    }

    if (action === "getPreviousFollowup") {
      const { followup_id } = data

      const { data: followup, error } = await supabase
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
      const { data: followups, error } = await supabase
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
      const { data: followupTopics, error } = await supabase.from("followup_topics").select(`
          followup_id,
          topic_id,
          rating
        `)

      if (error) throw error

      return NextResponse.json({ data: followupTopics })
    }

    if (action === "deleteAllFollowups") {
      const { error: topicsError } = await supabase.from("followup_topics").delete().neq("rating", -999)

      if (topicsError) throw topicsError

      const { error: followupsError } = await supabase.from("followups").delete().neq("sequence_number", -999)

      if (followupsError) throw followupsError

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error: any) {
    console.error("Error en API:", error)
    return NextResponse.json(
      {
        error: error.message || "Error desconocido",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
