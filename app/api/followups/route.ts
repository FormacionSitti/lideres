import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const leaderId = searchParams.get("leaderId")

  if (!leaderId) {
    return NextResponse.json({ error: "Leader ID is required" }, { status: 400 })
  }

  const { data: followups, error } = await supabaseServer
    .from("followups")
    .select(`
      id,
      sequence_number,
      followup_date,
      observations,
      agreements,
      type,
      followup_topics (
        topics (
          name
        ),
        rating
      )
    `)
    .eq("leader_id", leaderId)
    .order("followup_date", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transformar los datos para un formato más fácil de usar
  const formattedFollowups = followups.map((followup) => ({
    id: followup.id,
    sequence_number: followup.sequence_number,
    followup_date: followup.followup_date,
    observations: followup.observations,
    agreements: followup.agreements,
    type: followup.type,
    topics: followup.followup_topics.map((ft: any) => ({
      name: ft.topics.name,
      rating: ft.rating,
    })),
  }))

  return NextResponse.json(formattedFollowups)
}
