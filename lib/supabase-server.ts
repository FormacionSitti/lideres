import { createClient, SupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Aceptar cualquiera de los nombres estandar de variables que crea la integracion de Vercel/Supabase
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_SUPABASE_URL // nombre con prefijo que a veces genera Vercel

  // Preferir la service role key en el servidor; si no esta, usar la anon key
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    const missing: string[] = []
    if (!supabaseUrl) missing.push("URL (NEXT_PUBLIC_SUPABASE_URL o SUPABASE_URL)")
    if (!supabaseKey)
      missing.push(
        "KEY (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY)",
      )
    throw new Error(
      `Faltan variables de entorno de Supabase: ${missing.join(", ")}. Configuralas en el panel de Vercel en Settings > Environment Variables.`,
    )
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return supabaseInstance
}

// Export para compatibilidad hacia atras
export const supabaseServer = {
  get client() {
    return getSupabaseServer()
  }
}
