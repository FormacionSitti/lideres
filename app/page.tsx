import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layout } from "@/components/layout"
import { FollowupForm } from "@/components/followup-form"
import { FollowupList } from "@/components/followup-list"
import { DevelopmentPlanContainer } from "@/components/development-plan-container"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ResetButton } from "@/components/reset-button"
import { getSupabaseServer } from "@/lib/supabase-server"

function ErrorDisplay({ error }: { error: Error }) {
  const isServerDown = error.message.includes('521') || error.message.includes('server is down') || error.message.includes('paused')
  
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{isServerDown ? 'Servidor de Supabase no disponible' : 'Error'}</AlertTitle>
      <AlertDescription>
        {isServerDown ? (
          <>
            <p className="mb-2">El servidor de Supabase no está respondiendo. Esto puede ocurrir porque:</p>
            <ul className="list-disc list-inside mt-2">
              <li><strong>El proyecto está pausado</strong> - Los proyectos gratuitos de Supabase se pausan después de 7 días de inactividad</li>
              <li><strong>Hay un problema temporal</strong> - El servidor puede estar experimentando problemas</li>
            </ul>
            <div className="mt-4 p-3 bg-destructive/10 rounded">
              <p className="font-semibold mb-1">Para reactivar tu proyecto:</p>
              <ol className="list-decimal list-inside text-sm">
                <li>Ve a <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">supabase.com/dashboard</a></li>
                <li>Selecciona tu proyecto</li>
                <li>Si está pausado, haz clic en "Restore project"</li>
                <li>Espera unos minutos y recarga esta página</li>
              </ol>
            </div>
          </>
        ) : (
          <>
            <p>No se pudieron cargar los datos. Por favor, verifica que:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Las variables de entorno estén configuradas correctamente en Vercel</li>
              <li>La conexión a Supabase esté funcionando</li>
              <li>Las tablas 'leaders' y 'topics' existan en la base de datos</li>
            </ul>
          </>
        )}
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
  return getSupabaseServer()
}

async function getLeaders() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("leaders").select("id, name").order("name")

    if (error) {
      if (error.message.includes('Invalid') || error.code === 'PGRST301') {
        throw new Error(`Error de autenticación con Supabase. Verifica que SUPABASE_KEY sea válida.`)
      }
      throw new Error(`Error cargando líderes: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    if (errorMsg.includes('521') || errorMsg.includes('Web server is down')) {
      throw new Error("Error 521: El servidor de Supabase está caído o el proyecto está pausado. Ve a supabase.com/dashboard para reactivarlo.")
    }
    if (errorMsg.includes('Invalid')) {
      throw new Error("Credenciales de Supabase inválidas. Verifica NEXT_PUBLIC_SUPABASE_URL y SUPABASE_KEY en Vercel.")
    }
    throw error
  }
}

async function getTopics() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("topics").select("id, name").order("name")

    if (error) {
      if (error.message.includes('Invalid') || error.code === 'PGRST301') {
        throw new Error(`Error de autenticación con Supabase. Verifica que SUPABASE_KEY sea válida.`)
      }
      throw new Error(`Error cargando temas: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    if (errorMsg.includes('521') || errorMsg.includes('Web server is down')) {
      throw new Error("Error 521: El servidor de Supabase está caído o el proyecto está pausado. Ve a supabase.com/dashboard para reactivarlo.")
    }
    if (errorMsg.includes('Invalid')) {
      throw new Error("Credenciales de Supabase inválidas. Verifica NEXT_PUBLIC_SUPABASE_URL y SUPABASE_KEY en Vercel.")
    }
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new">Nuevo Seguimiento</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="development">Plan de Desarrollo</TabsTrigger>
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
          <TabsContent value="development">
            <Suspense fallback={<LoadingDisplay />}>
              <DevelopmentPlanContainer leaders={leaders} topics={topics} />
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
