import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Variables de entorno faltantes:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
  })
  throw new Error("Faltan variables de entorno de Supabase. Verifica NEXT_PUBLIC_SUPABASE_URL y SUPABASE_KEY")
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
