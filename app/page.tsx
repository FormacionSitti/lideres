import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layout } from "@/components/layout"
import { FollowupForm } from "@/components/followup-form"
import { FollowupList } from "@/components/followup-list"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ResetButton } from "@/components/reset-button"
import { createClient } from "@supabase/supabase-js"

function ErrorDisplay({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        No se pudieron cargar los datos. Por favor, verifica que:
        <ul className="list-disc list-inside mt-2">
          <li>Las variables de entorno estén configuradas correctamente en Vercel</li>
          <li>La conexión a Supabase esté funcionando</li>
          <li>Las tablas 'leaders' y 'topics' existan en la base de datos</li>
        </ul>
        <div className="mt-2 text-xs bg-destructive/10 p-2 rounded">Error técnico: {error.message}</div>
      </AlertDescription>
    </Alert>
  )
}

function LoadingDisplay() {
  return (
    <div className="w-full p-8 text-center">
      <div className="animate-pulse">Cargando datos...</div>
    </div>
  )
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Faltan variables de entorno de Supabase. Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_KEY en Vercel.",
    )
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

async function getLeaders() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("leaders").select("id, name").order("name")

    if (error) {
      throw new Error(`Error cargando líderes: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error en getLeaders:", error)
    throw error
  }
}

async function getTopics() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("topics").select("id, name").order("name")

    if (error) {
      throw new Error(`Error cargando temas: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error en getTopics:", error)
    throw error
  }
}

async function getData() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout obteniendo datos")), 10000),
    )

    const dataPromise = Promise.all([getLeaders(), getTopics()])

    const [leaders, topics] = (await Promise.race([dataPromise, timeoutPromise])) as [any, any]

    return { leaders, topics }
  } catch (error) {
    console.error("Error obteniendo datos:", error)
    throw error
  }
}

export default async function Page() {
  try {
    const { leaders, topics } = await getData()

    return (
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Panel de Seguimientos</h1>
          <div className="flex items-center gap-2">
            <ResetButton />
          </div>
        </div>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Nuevo Seguimiento</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>
          <TabsContent value="new">
            <Suspense fallback={<LoadingDisplay />}>
              <FollowupForm leaders={leaders} topics={topics} />
            </Suspense>
          </TabsContent>
          <TabsContent value="history">
            <Suspense fallback={<LoadingDisplay />}>
              <FollowupList leaders={leaders} />
            </Suspense>
          </TabsContent>
        </Tabs>
        <Toaster />
      </Layout>
    )
  } catch (error) {
    return (
      <Layout>
        <ErrorDisplay error={error instanceof Error ? error : new Error("Error desconocido")} />
        <Toaster />
      </Layout>
    )
  }
}
