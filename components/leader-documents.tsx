"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  FileText, Upload, Trash2, Download, Tag, ChevronDown,
  ChevronRight, Loader2, AlertTriangle, BookOpen, X, CheckCircle2,
} from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const COMPETENCIES = [
  { key: "liderazgo_cercano", label: "Liderazgo cercano", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "resolucion_problemas", label: "Resolución táctico-estratégica", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { key: "vision_transformadora", label: "Visión transformadora", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { key: "toma_decisiones", label: "Toma de decisiones ágil", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "cultura_aprendizaje", label: "Cultura de aprendizaje", color: "bg-green-100 text-green-700 border-green-200" },
  { key: "comunicacion", label: "Comunicación", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { key: "motivacion_innovacion", label: "Motivación e innovación", color: "bg-rose-100 text-rose-700 border-rose-200" },
]

interface LeaderDocument {
  id: string
  leader_id: number
  file_name: string
  file_path: string
  file_size: number | null
  notes: string | null
  competencies_flagged: string[] | null
  created_at: string
}

interface LeaderDocumentsProps {
  leader: { id: number; name: string }
  onCompetenciesFlagged?: (competencies: string[]) => void
}

export default function LeaderDocuments({ leader, onCompetenciesFlagged }: LeaderDocumentsProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<LeaderDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [editCompetencies, setEditCompetencies] = useState<Record<string, string[]>>({})
  const [savingMeta, setSavingMeta] = useState<string | null>(null)

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getLeaderDocuments", data: { leader_id: leader.id } }),
      })
      const json = await res.json()
      if (json?.tableMissing) { setTableMissing(true); setDocuments([]); return }
      if (!res.ok) throw new Error(json?.error || "Error cargando documentos")
      setTableMissing(false)
      setDocuments(json.data || [])
      // Notificar competencias marcadas en todos los docs
      const allFlagged = Array.from(new Set((json.data || []).flatMap((d: LeaderDocument) => d.competencies_flagged || [])))
      onCompetenciesFlagged?.(allFlagged as string[])
    } catch (e: any) {
      if (!e.message?.includes("tableMissing")) {
        toast({ title: "Error", description: e.message, variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocuments() }, [leader.id])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      toast({ title: "Solo se permiten archivos PDF", variant: "destructive" })
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "El archivo no puede superar 20 MB", variant: "destructive" })
      return
    }
    setUploading(true)
    try {
      const filePath = `leader-${leader.id}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`
      const { error: uploadError } = await supabase.storage
        .from("leader-documents")
        .upload(filePath, file, { contentType: "application/pdf", upsert: false })
      if (uploadError) throw uploadError

      const res = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addLeaderDocument",
          data: { leader_id: leader.id, file_name: file.name, file_path: filePath, file_size: file.size },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Error guardando metadatos")
      toast({ title: "Informe cargado", description: `"${file.name}" se subió correctamente.` })
      await fetchDocuments()
    } catch (e: any) {
      toast({ title: "Error al subir archivo", description: e.message, variant: "destructive" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (doc: LeaderDocument) => {
    if (!confirm(`¿Eliminar el documento "${doc.file_name}"?`)) return
    try {
      await supabase.storage.from("leader-documents").remove([doc.file_path])
      const res = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteLeaderDocument", data: { id: doc.id } }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j?.error) }
      toast({ title: "Documento eliminado" })
      await fetchDocuments()
    } catch (e: any) {
      toast({ title: "Error al eliminar", description: e.message, variant: "destructive" })
    }
  }

  const handleDownload = async (doc: LeaderDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("leader-documents")
        .createSignedUrl(doc.file_path, 60)
      if (error) throw error
      window.open(data.signedUrl, "_blank")
    } catch (e: any) {
      toast({ title: "Error al descargar", description: e.message, variant: "destructive" })
    }
  }

  const toggleExpand = (id: string, doc: LeaderDocument) => {
    if (expandedDoc === id) { setExpandedDoc(null); return }
    setExpandedDoc(id)
    setEditNotes((p) => ({ ...p, [id]: doc.notes || "" }))
    setEditCompetencies((p) => ({ ...p, [id]: doc.competencies_flagged || [] }))
  }

  const toggleCompetency = (docId: string, key: string) => {
    setEditCompetencies((p) => {
      const current = p[docId] || []
      return { ...p, [docId]: current.includes(key) ? current.filter((k) => k !== key) : [...current, key] }
    })
  }

  const handleSaveMeta = async (doc: LeaderDocument) => {
    setSavingMeta(doc.id)
    try {
      const res = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateLeaderDocument",
          data: { id: doc.id, notes: editNotes[doc.id] || null, competencies_flagged: editCompetencies[doc.id] || [] },
        }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j?.error) }
      toast({ title: "Hallazgos guardados", description: "Las competencias a trabajar se han actualizado." })
      await fetchDocuments()
    } catch (e: any) {
      toast({ title: "Error al guardar", description: e.message, variant: "destructive" })
    } finally {
      setSavingMeta(null)
    }
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return ""
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })

  if (loading) return (
    <Card className="p-8 flex items-center justify-center gap-2 text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Cargando documentos...</span>
    </Card>
  )

  if (tableMissing) return (
    <Card className="p-6 border-amber-200 bg-amber-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <h3 className="font-semibold text-amber-900">Falta configurar el almacenamiento</h3>
          <p className="text-sm text-amber-800">
            Para activar la carga de informes PDF, ejecuta el siguiente script SQL en Supabase y crea el bucket de almacenamiento:
          </p>
          <code className="block text-xs bg-white border border-amber-200 rounded px-3 py-2 text-amber-900 font-mono">
            scripts/create-leader-documents-table.sql
          </code>
          <p className="text-xs text-amber-700">
            Luego, en Supabase → Storage, crea un bucket llamado <strong>leader-documents</strong> (privado).
          </p>
        </div>
      </div>
    </Card>
  )

  // Agrupa competencias marcadas en todos los documentos
  const allFlaggedKeys = Array.from(new Set(documents.flatMap((d) => d.competencies_flagged || [])))
  const allFlaggedCompetencies = COMPETENCIES.filter((c) => allFlaggedKeys.includes(c.key))

  return (
    <div className="space-y-4">
      {/* Banner de competencias identificadas desde los informes */}
      {allFlaggedCompetencies.length > 0 && (
        <Card className="p-4 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">
                Competencias a trabajar según informes históricos
              </h4>
              <p className="text-xs text-blue-700 mb-2">
                Estas competencias fueron identificadas como áreas de mejora en los informes cargados y son las que deben priorizarse en los seguimientos y el plan de desarrollo.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allFlaggedCompetencies.map((c) => (
                  <span key={c.key} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c.color}`}>
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Cabecera con botón de carga */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Informes de medición anteriores</h3>
              <p className="text-xs text-gray-500">
                {documents.length === 0
                  ? "Sin documentos cargados"
                  : `${documents.length} documento${documents.length !== 1 ? "s" : ""} cargado${documents.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subiendo...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Cargar informe PDF</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de documentos */}
      {documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <FileText className="w-10 h-10 mb-3 text-gray-300" />
          <p className="text-sm font-medium">No hay informes cargados</p>
          <p className="text-xs mt-1">Sube un PDF con los hallazgos de mediciones anteriores de {leader.name}</p>
        </div>
      )}

      {documents.map((doc) => {
        const isOpen = expandedDoc === doc.id
        const flagged = doc.competencies_flagged || []
        return (
          <Card key={doc.id} className="overflow-hidden">
            {/* Fila principal */}
            <div
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(doc.id, doc)}
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{doc.file_name}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(doc.created_at)}
                  {doc.file_size ? ` · ${formatSize(doc.file_size)}` : ""}
                  {flagged.length > 0 ? ` · ${flagged.length} competencia${flagged.length !== 1 ? "s" : ""} marcada${flagged.length !== 1 ? "s" : ""}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(doc) }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc) }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-gray-400" />
                  : <ChevronRight className="w-4 h-4 text-gray-400" />
                }
              </div>
            </div>

            {/* Panel expandido: hallazgos y competencias */}
            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                {/* Competencias a trabajar */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Competencias a trabajar (según este informe)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Marca las competencias que el informe identifica como áreas de mejora prioritaria para {leader.name}.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COMPETENCIES.map((c) => {
                      const selected = (editCompetencies[doc.id] || []).includes(c.key)
                      return (
                        <button
                          key={c.key}
                          onClick={() => toggleCompetency(doc.id, c.key)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                            selected
                              ? `${c.color} shadow-sm`
                              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {selected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Hallazgos principales */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">
                    Hallazgos principales del informe
                  </label>
                  <Textarea
                    value={editNotes[doc.id] || ""}
                    onChange={(e) => setEditNotes((p) => ({ ...p, [doc.id]: e.target.value }))}
                    placeholder="Resume los principales hallazgos de este informe: fortalezas detectadas, brechas, patrones observados, recomendaciones previas..."
                    className="bg-white text-xs min-h-[100px] resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedDoc(null)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveMeta(doc)}
                    disabled={savingMeta === doc.id}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {savingMeta === doc.id
                      ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Guardando...</>
                      : <><CheckCircle2 className="w-3 h-3 mr-1" />Guardar hallazgos</>
                    }
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
