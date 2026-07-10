"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layout } from "@/components/layout"
import { FollowupForm } from "@/components/followup-form"
import { FollowupList } from "@/components/followup-list"
import { Toaster } from "@/components/ui/toaster"
import { ResetButton } from "@/components/reset-button"

export default function Page() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [leadersRes, topicsRes] = await Promise.all([
          fetch("/api/supabase?action=getLeaders"),
          fetch("/api/supabase?action=getTopics"),
        ])
        const { data: leadersData } = await leadersRes.json()
        const { data: topicsData } = await topicsRes.json()
        setLeaders(leadersData || [])
        setTopics(topicsData || [])
      } catch (e: any) {
        setError(e.message || "Error cargando datos")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Panel de Seguimientos</h1>
        <div className="flex items-center gap-2">
          <a
            href="/plan-desarrollo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            📋 Plan de Desarrollo
          </a>
          <ResetButton />
        </div>
      </div>

      {loading && (
        <div className="w-full p-8 text-center animate-pulse text-gray-500">Cargando datos...</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Nuevo Seguimiento</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>
          <TabsContent value="new">
            <FollowupForm leaders={leaders} topics={topics} />
          </TabsContent>
          <TabsContent value="history">
            <FollowupList leaders={leaders} />
          </TabsContent>
        </Tabs>
      )}

      <Toaster />
    </Layout>
  )
}
