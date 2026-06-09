"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const db = createClient(
  "https://rbbbsactmuilnlbhqrqa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYmJzYWN0bXVpbG5sYmhxcnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNjEzNTksImV4cCI6MjA1MzgzNzM1OX0.Yo7Eg3w2pxnEh5t1XsouKCwhaVwVlTG1F6JOOToKT94"
);

// ─── Constants ────────────────────────────────────────────────────────────────
const AREAS = [
  "Aseguramiento Contractual","Aseguramiento Contravencional","CAD","Cartera",
  "Conexión de Soluciones","Digitalización","Experiencia de Servicio",
  "Experiencia y Bienestar","Financiera y Administrativa","Fotodetección",
  "Gestión de Correspondencia","Gestión de Notificaciones","Gestión Jurídica de Cobro",
  "Gestión Jurídica Documental","Gestión Legal","Radicación",
];

const COMPETENCIAS = [
  { id: "tec", nombre: "Conocimiento técnico",   peso: 25, desc: "Dominio de conceptos, procesos y herramientas del cargo" },
  { id: "ada", nombre: "Adaptación e iniciativa", peso: 20, desc: "Aprendizaje y propuesta de soluciones" },
  { id: "cal", nombre: "Calidad del trabajo",     peso: 20, desc: "Precisión, orden y cumplimiento de estándares" },
  { id: "com", nombre: "Comunicación",            peso: 15, desc: "Claridad en interacciones escritas y verbales" },
  { id: "eq",  nombre: "Trabajo en equipo",       peso: 10, desc: "Integración y colaboración con el equipo" },
  { id: "tpo", nombre: "Gestión del tiempo",      peso: 10, desc: "Puntualidad y cumplimiento de plazos" },
];

const NOTA_MINIMA = 3.5;

const P = {
  purple:"#534AB7", purpleLight:"#EEEDFE", purpleDark:"#3C3489",
  green:"#27500A",  greenLight:"#EAF3DE",  greenMid:"#639922",
  red:"#791F1F",    redLight:"#FCEBEB",    redMid:"#E24B4A",
  amber:"#633806",  amberLight:"#FAEEDA",
  blue:"#0C447C",   blueLight:"#E6F1FB",
  border:"#e2e1de", bg:"#f9f9f8", white:"#ffffff",
  text:"#1a1a18",   textMuted:"#888780",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Talento {
  id: string; nombre: string; doc: string; area: string;
  cargo: string; mentor: string; fechaInicio: string;
}
interface Sesion {
  id: string; talentoId: string; semana: number; fecha: string;
  notas: Record<string, number>; temas: Record<string, string>;
  obsComp: Record<string, string>; compromisos: string;
  observaciones: string; ponderado: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const hoy = () => new Date().toISOString().slice(0, 10);
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

function calcPonderado(notas: Record<string, string | number>): number | null {
  let sum = 0, tp = 0;
  COMPETENCIAS.forEach(c => {
    const v = parseFloat(String(notas[c.id]));
    if (!isNaN(v) && v >= 0 && v <= 5) { sum += v * (c.peso / 100); tp += c.peso / 100; }
  });
  return tp > 0 ? parseFloat((sum / tp).toFixed(3)) : null;
}
function promedioTalento(ss: Sesion[]): number | null {
  if (!ss.length) return null;
  return parseFloat((ss.reduce((a, s) => a + s.ponderado, 0) / ss.length).toFixed(2));
}
function estadoTalento(avg: number | null, n: number): string {
  if (avg === null) return "sin_sesion";
  if (n < 8) return "en_curso";
  return avg >= NOTA_MINIMA ? "apto" : "no_apto";
}
const ESTADO_META: Record<string, { label: string; bg: string; tc: string; icon: string }> = {
  sin_sesion: { label: "Sin sesiones", bg: P.blueLight,  tc: P.blue,  icon: "ℹ" },
  en_curso:   { label: "En curso",     bg: P.amberLight, tc: P.amber, icon: "⏳" },
  apto:       { label: "Aprobado",     bg: P.greenLight, tc: P.green, icon: "✓" },
  no_apto:    { label: "No aprobado",  bg: P.redLight,   tc: P.red,   icon: "✗" },
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbToTalento = (r: any): Talento => ({ id: r.id, nombre: r.nombre, doc: r.doc, area: r.area, cargo: r.cargo, mentor: r.mentor, fechaInicio: r.fecha_inicio });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbToSesion = (r: any): Sesion => ({ id: r.id, talentoId: r.talento_id, semana: r.semana, fecha: r.fecha, notas: r.notas, temas: r.temas ?? {}, obsComp: r.obs_comp ?? {}, compromisos: r.compromisos ?? "", observaciones: r.observaciones ?? "", ponderado: parseFloat(r.ponderado) });

// ─── Excel ────────────────────────────────────────────────────────────────────
function hdrStyle(ws: XLSX.WorkSheet, row: number, ncols: number) {
  for (let c = 0; c < ncols; c++) {
    const addr = XLSX.utils.encode_cell({ r: row, c });
    if (ws[addr]) ws[addr].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "534AB7" } }, alignment: { horizontal: "center", wrapText: true } };
  }
}
function exportarRepositorio(talentos: Talento[], sesiones: Sesion[]) {
  const wb = XLSX.utils.book_new();
  const h1 = ["Nombre","Documento","Cargo","Área","Mentor","Fecha inicio","Sesiones","Promedio","Estado"];
  const r1 = talentos.map(t => {
    const ss = sesiones.filter(s => s.talentoId === t.id), avg = promedioTalento(ss);
    return [t.nombre, t.doc, t.cargo, t.area, t.mentor, t.fechaInicio, ss.length, avg ?? "—", ESTADO_META[estadoTalento(avg, ss.length)].label];
  });
  const ws1 = XLSX.utils.aoa_to_sheet([["REPOSITORIO DE MENTORÍAS"],[`Exportado: ${new Date().toLocaleDateString("es-CO")}`],[],h1,...r1]);
  ws1["!cols"] = [28,15,22,32,24,13,10,12,16].map(w => ({ wch: w }));
  hdrStyle(ws1, 3, h1.length);
  XLSX.utils.book_append_sheet(wb, ws1, "Repositorio");
  const h2 = ["Talento","Documento","Área","Mentor","Semana","Fecha",...COMPETENCIAS.map(c=>`${c.nombre} (${c.peso}%)`),"Ponderado","Compromisos","Observaciones"];
  const r2 = sesiones.map(s => { const t = talentos.find(x => x.id === s.talentoId) || {} as Talento; return [t.nombre??"",t.doc??"",t.area??"",t.mentor??"",s.semana,s.fecha,...COMPETENCIAS.map(c=>s.notas[c.id]??"—"),s.ponderado,s.compromisos,s.observaciones]; });
  const ws2 = XLSX.utils.aoa_to_sheet([h2,...r2]);
  ws2["!cols"] = [24,14,28,22,8,12,...COMPETENCIAS.map(()=>18),10,35,35].map(w=>({wch:w}));
  hdrStyle(ws2, 0, h2.length);
  XLSX.utils.book_append_sheet(wb, ws2, "Todas las sesiones");
  XLSX.writeFile(wb, `Repositorio_Mentorias_${hoy().replace(/-/g,"")}.xlsx`);
}
function exportarIndividual(talento: Talento, sesiones: Sesion[]) {
  const ss = sesiones.filter(s => s.talentoId === talento.id).sort((a,b) => a.semana - b.semana);
  const avg = promedioTalento(ss), e = estadoTalento(avg, ss.length);
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([["REPORTE DE PERIODO DE PRUEBA"],[""],["INFORMACIÓN DEL TALENTO"],["Nombre",talento.nombre],["Documento",talento.doc],["Cargo",talento.cargo],["Área",talento.area],["Mentor",talento.mentor],["Fecha de inicio",talento.fechaInicio],["Sesiones realizadas",`${ss.length}/8`],[""],["RESULTADO FINAL"],["Nota final ponderada",avg??"—"],["Nota mínima",NOTA_MINIMA],["Veredicto",ESTADO_META[e].label.toUpperCase()],[""],["Exportado",new Date().toLocaleDateString("es-CO")]]);
  ws1["!cols"] = [{wch:30},{wch:35}];
  XLSX.utils.book_append_sheet(wb, ws1, "Ficha del talento");
  const h2 = ["Semana","Fecha",...COMPETENCIAS.map(c=>`${c.nombre} (${c.peso}%)`),"Ponderado","Compromisos","Observaciones"];
  const r2 = ss.map(s => [s.semana,s.fecha,...COMPETENCIAS.map(c=>s.notas[c.id]??"—"),s.ponderado,s.compromisos,s.observaciones]);
  const ws2 = XLSX.utils.aoa_to_sheet([h2,...r2]);
  ws2["!cols"] = [8,12,...COMPETENCIAS.map(()=>22),10,35,35].map(w=>({wch:w}));
  hdrStyle(ws2, 0, h2.length);
  XLSX.utils.book_append_sheet(wb, ws2, "Detalle sesiones");
  const promedioC: Record<string, number | null> = {};
  COMPETENCIAS.forEach(c => { const vals = ss.filter(s=>s.notas[c.id]!==undefined).map(s=>s.notas[c.id]); promedioC[c.id] = vals.length ? parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)) : null; });
  const h3 = ["Competencia","Peso (%)","Promedio","Contribución","Estado"];
  const r3 = COMPETENCIAS.map(c => { const p=promedioC[c.id],contrib=p!==null?parseFloat((p*(c.peso/100)).toFixed(2)):0; return [c.nombre,c.peso,p??"—",p!==null?contrib:"—",p===null?"Sin datos":p>=NOTA_MINIMA?"Aprobado":"Por mejorar"]; });
  r3.push(["","","NOTA FINAL",avg??"—",ESTADO_META[e].label.toUpperCase()]);
  const ws3 = XLSX.utils.aoa_to_sheet([h3,...r3]);
  ws3["!cols"] = [28,10,16,22,18].map(w=>({wch:w}));
  hdrStyle(ws3, 0, h3.length);
  XLSX.utils.book_append_sheet(wb, ws3, "Análisis competencias");
  const h4 = ["Competencia",...Array.from({length:8},(_,i)=>`Semana ${i+1}`)];
  const r4 = COMPETENCIAS.map(c=>[c.nombre,...Array.from({length:8},(_,i)=>{const s=ss.find(x=>x.semana===i+1);return s&&s.notas[c.id]!==undefined?s.notas[c.id]:"—";})]);
  r4.push(["Ponderado sesión",...Array.from({length:8},(_,i)=>{const s=ss.find(x=>x.semana===i+1);return s?s.ponderado:"—";})]);
  const ws4 = XLSX.utils.aoa_to_sheet([h4,...r4]);
  ws4["!cols"] = [{wch:26},...Array(8).fill({wch:12})];
  hdrStyle(ws4, 0, h4.length);
  XLSX.utils.book_append_sheet(wb, ws4, "Curva de aprendizaje");
  XLSX.writeFile(wb, `Reporte_${talento.nombre.replace(/\s+/g,"_")}_${hoy().replace(/-/g,"")}.xlsx`);
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: P.white, border: `0.5px solid ${P.border}`, borderRadius: 12, padding: "1.25rem", marginBottom: "1rem", ...style }}>{children}</div>
);
const CardTitle = ({ icon, children }: { icon?: string; children: React.ReactNode }) => (
  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: 7, color: P.text }}>
    {icon && <span style={{ color: P.purple, fontSize: 16 }}>{icon}</span>}
    {children}
  </div>
);
const FL = ({ children }: { children: React.ReactNode }) => (
  <label style={{ fontSize: 11, color: P.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>{children}</label>
);
const Inp = ({ type = "text", value, onChange, placeholder, style = {} }: { type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; style?: React.CSSProperties }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ padding: "8px 10px", border: `0.5px solid ${P.border}`, borderRadius: 8, fontSize: 13, background: P.white, color: P.text, width: "100%", fontFamily: "inherit", outline: "none", ...style }} />
);
const Sel = ({ value, onChange, children, style = {} }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; style?: React.CSSProperties }) => (
  <select value={value} onChange={onChange} style={{ padding: "8px 10px", border: `0.5px solid ${P.border}`, borderRadius: 8, fontSize: 13, background: P.white, color: value ? P.text : P.textMuted, width: "100%", fontFamily: "inherit", cursor: "pointer", outline: "none", ...style }}>{children}</select>
);
const TA = ({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ padding: "8px 10px", border: `0.5px solid ${P.border}`, borderRadius: 8, fontSize: 13, background: P.white, color: P.text, width: "100%", fontFamily: "inherit", resize: "vertical", outline: "none" }} />
);
const Btn = ({ onClick, children, variant = "default", size = "md", disabled = false }: { onClick?: () => void; children: React.ReactNode; variant?: string; size?: string; disabled?: boolean }) => {
  const s: Record<string, React.CSSProperties> = {
    default: { background: "transparent", border: `0.5px solid ${P.border}`, color: P.text },
    primary: { background: P.purple, border: `0.5px solid ${P.purple}`, color: "#fff" },
    excel:   { background: "#1D6F42", border: "0.5px solid #1D6F42", color: "#fff" },
    danger:  { background: "transparent", border: `0.5px solid ${P.border}`, color: P.red },
  };
  const sz: Record<string, React.CSSProperties> = { md: { padding: "7px 14px", fontSize: 12 }, sm: { padding: "4px 10px", fontSize: 11 } };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...s[variant], ...sz[size], borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", opacity: disabled ? 0.5 : 1 }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
      {children}
    </button>
  );
};
const Alert = ({ type = "info", children }: { type?: string; children: React.ReactNode }) => {
  const m: Record<string, [string, string, string]> = { info: [P.blueLight, P.blue, P.border], success: [P.greenLight, P.green, "#C0DD97"], danger: [P.redLight, P.red, "#F7C1C1"] };
  const [bg, tc, br] = m[type] || m.info;
  return <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginTop: 10, background: bg, color: tc, border: `0.5px solid ${br}` }}>{children}</div>;
};
const MetricCard = ({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) => (
  <div style={{ background: P.bg, borderRadius: 8, padding: "0.75rem 1rem" }}>
    <div style={{ fontSize: 11, color: P.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, color: valueColor || P.text }}>{value}</div>
  </div>
);
const MiniBar = ({ value }: { value: number }) => (
  <div style={{ height: 5, borderRadius: 3, background: "#e2e1de", overflow: "hidden", marginTop: 3, width: 60 }}>
    <div style={{ height: "100%", width: `${Math.round((value / 5) * 100)}%`, background: value >= NOTA_MINIMA ? P.greenMid : P.redMid, borderRadius: 3 }} />
  </div>
);
const Avatar = ({ name }: { name: string }) => (
  <div style={{ width: 34, height: 34, borderRadius: "50%", background: P.purpleLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: P.purpleDark, flexShrink: 0 }}>{initials(name)}</div>
);
const EstadoBadge = ({ avg, n }: { avg: number | null; n: number }) => {
  const m = ESTADO_META[estadoTalento(avg, n)];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: m.bg, color: m.tc }}>{m.icon} {m.label}</span>;
};
const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", color: P.textMuted, fontSize: 13, gap: 10 }}>
    <div style={{ width: 18, height: 18, border: `2px solid ${P.border}`, borderTopColor: P.purple, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    Cargando datos del repositorio...
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const thS: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: P.textMuted, textAlign: "left", padding: "7px 10px", borderBottom: `0.5px solid ${P.border}`, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" };
const tdS: React.CSSProperties = { padding: "8px 10px", verticalAlign: "middle" };

// ─── Tab: Nuevo Talento ───────────────────────────────────────────────────────
function TabNuevo({ talentos, reload }: { talentos: Talento[]; reload: () => Promise<void> }) {
  const [form, setForm] = useState({ nombre: "", doc: "", area: "", cargo: "", mentor: "", fechaInicio: hoy() });
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const registrar = async () => {
    if (!form.nombre || !form.doc || !form.area || !form.mentor || !form.fechaInicio) { setMsg({ type: "danger", text: "Completa todos los campos obligatorios." }); return; }
    if (talentos.find(t => t.doc === form.doc)) { setMsg({ type: "danger", text: "Ya existe un talento con ese número de documento." }); return; }
    setSaving(true);
    const { error } = await db.from("talentos").insert({ nombre: form.nombre, doc: form.doc, area: form.area, cargo: form.cargo || "—", mentor: form.mentor, fecha_inicio: form.fechaInicio });
    setSaving(false);
    if (error) { setMsg({ type: "danger", text: `Error: ${error.message}` }); return; }
    await reload();
    setForm({ nombre: "", doc: "", area: "", cargo: "", mentor: "", fechaInicio: hoy() });
    setMsg({ type: "success", text: `${form.nombre} registrado exitosamente en ${form.area}.` });
    setTimeout(() => setMsg(null), 4000);
  };

  const col3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 };
  return (
    <div>
      <Card>
        <CardTitle icon="＋">Registrar nuevo talento</CardTitle>
        <div style={col3}>
          <div><FL>Nombre completo *</FL><Inp value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Laura Martínez" /></div>
          <div><FL>N.º de documento *</FL><Inp value={form.doc} onChange={e => set("doc", e.target.value)} placeholder="Ej: 1098765432" /></div>
          <div><FL>Área *</FL><Sel value={form.area} onChange={e => set("area", e.target.value)}><option value="">Seleccionar área...</option>{AREAS.map(a => <option key={a} value={a}>{a}</option>)}</Sel></div>
        </div>
        <div style={col3}>
          <div><FL>Cargo</FL><Inp value={form.cargo} onChange={e => set("cargo", e.target.value)} placeholder="Ej: Analista Junior" /></div>
          <div><FL>Mentor asignado *</FL><Inp value={form.mentor} onChange={e => set("mentor", e.target.value)} placeholder="Ej: Andrés Gómez" /></div>
          <div><FL>Fecha de inicio *</FL><Inp type="date" value={form.fechaInicio} onChange={e => set("fechaInicio", e.target.value)} /></div>
        </div>
        <Btn variant="primary" onClick={registrar} disabled={saving}>{saving ? "Guardando..." : "＋ Registrar talento"}</Btn>
        {msg && <Alert type={msg.type}>{msg.type === "success" ? "✓" : "⚠"} {msg.text}</Alert>}
      </Card>
      <Card>
        <CardTitle icon="ℹ">¿Cómo usar esta herramienta?</CardTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          {[["1. Registrar","Ingresa los datos del talento en esta pestaña."],["2. Evaluar","Registra una sesión semanal con notas por competencia."],["3. Seguir","Revisa el repositorio para ver el avance de todos."],["4. Reportar","Genera el reporte final y exporta en Excel."]].map(([t, d]) => (
            <div key={t} style={{ padding: "10px 12px", background: P.bg, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: P.purpleDark, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t}</div>
              <div style={{ fontSize: 12, color: P.textMuted }}>{d}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Sesión ──────────────────────────────────────────────────────────────
function TabSesion({ talentos, sesiones, reload }: { talentos: Talento[]; sesiones: Sesion[]; reload: () => Promise<void> }) {
  const [talentoId, setTalentoId] = useState("");
  const [semana, setSemana] = useState("1");
  const [fecha, setFecha] = useState(hoy());
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [temas, setTemas] = useState<Record<string, string>>({});
  const [obsComp, setObsComp] = useState<Record<string, string>>({});
  const [compromisos, setCompromisos] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const talento = talentos.find(t => t.id === talentoId);
  const ss = sesiones.filter(s => s.talentoId === talentoId);
  const avg = promedioTalento(ss);
  const liveScore = calcPonderado(notas);

  const guardar = async () => {
    if (!talentoId || !fecha) { setMsg({ type: "danger", text: "Selecciona talento y fecha." }); return; }
    if (!COMPETENCIAS.some(c => !isNaN(parseFloat(notas[c.id])))) { setMsg({ type: "danger", text: "Ingresa al menos una nota (0–5)." }); return; }
    const ponderado = calcPonderado(notas) ?? 0;
    const notasNum: Record<string, number> = {};
    COMPETENCIAS.forEach(c => { const v = parseFloat(notas[c.id]); if (!isNaN(v)) notasNum[c.id] = v; });
    setSaving(true);
    const { error } = await db.from("sesiones_mentoria").insert({ talento_id: talentoId, semana: parseInt(semana), fecha, notas: notasNum, temas: { ...temas }, obs_comp: { ...obsComp }, compromisos, observaciones, ponderado });
    setSaving(false);
    if (error) { setMsg({ type: "danger", text: `Error: ${error.message}` }); return; }
    await reload();
    setNotas({}); setTemas({}); setObsComp({}); setCompromisos(""); setObservaciones("");
    setMsg({ type: "success", text: `Sesión semana ${semana} guardada. Nota ponderada: ${ponderado.toFixed(2)}` });
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div>
      <Card>
        <CardTitle icon="📋">Registrar sesión de seguimiento</CardTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><FL>Talento *</FL><Sel value={talentoId} onChange={e => setTalentoId(e.target.value)}><option value="">Seleccionar...</option>{talentos.map(t => <option key={t.id} value={t.id}>{t.nombre} · {t.area}</option>)}</Sel></div>
          <div><FL>Semana *</FL><Sel value={semana} onChange={e => setSemana(e.target.value)}>{Array.from({ length: 8 }, (_, i) => <option key={i+1} value={i+1}>Semana {i+1}</option>)}</Sel></div>
          <div><FL>Fecha de sesión *</FL><Inp type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></div>
        </div>
        {talento && <Alert type="info">ℹ <strong>{talento.nombre}</strong> · {talento.area} · Mentor: <strong>{talento.mentor}</strong> · Sesiones: <strong>{ss.length}/8</strong>{avg !== null && <> · Promedio: <strong>{avg.toFixed(2)}</strong></>}</Alert>}
        <div style={{ fontSize: 11, fontWeight: 500, color: P.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "1.25rem 0 0.6rem", paddingBottom: 5, borderBottom: `0.5px solid ${P.border}` }}>Evaluación por competencias — escala 0 a 5</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: P.bg }}>{["Competencia","Peso","Temas tratados","Nota (0–5)","Observaciones"].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {COMPETENCIAS.map(c => (
                <tr key={c.id} style={{ borderBottom: `0.5px solid ${P.border}` }}>
                  <td style={tdS}><div style={{ fontWeight: 500 }}>{c.nombre}</div><div style={{ fontSize: 11, color: P.textMuted }}>{c.desc}</div></td>
                  <td style={tdS}><span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 11, background: P.bg, color: P.textMuted, border: `0.5px solid ${P.border}` }}>{c.peso}%</span></td>
                  <td style={tdS}><input type="text" value={temas[c.id] || ""} placeholder="Tema tratado..." onChange={e => setTemas(t => ({ ...t, [c.id]: e.target.value }))} style={{ width: "100%", padding: "4px 8px", border: `0.5px solid ${P.border}`, borderRadius: 8, fontSize: 12, background: P.white, color: P.text, fontFamily: "inherit", outline: "none" }} /></td>
                  <td style={tdS}><input type="number" min={0} max={5} step={0.1} value={notas[c.id] ?? ""} placeholder="—" onChange={e => setNotas(n => ({ ...n, [c.id]: e.target.value }))} style={{ width: 58, padding: "4px 8px", textAlign: "center", border: `0.5px solid ${P.border}`, borderRadius: 8, fontSize: 13, background: P.white, color: P.text, fontFamily: "inherit", outline: "none" }} /></td>
                  <td style={tdS}><input type="text" value={obsComp[c.id] || ""} placeholder="Comentario..." onChange={e => setObsComp(o => ({ ...o, [c.id]: e.target.value }))} style={{ width: "100%", padding: "4px 8px", border: `0.5px solid ${P.border}`, borderRadius: 8, fontSize: 12, background: P.white, color: P.text, fontFamily: "inherit", outline: "none" }} /></td>
                </tr>
              ))}
              <tr style={{ background: P.bg }}>
                <td colSpan={3} style={{ ...tdS, textAlign: "right", fontSize: 12, fontWeight: 500, color: P.textMuted }}>Nota ponderada de la sesión</td>
                <td style={{ ...tdS, fontSize: 16, fontWeight: 500, color: liveScore !== null ? (liveScore >= NOTA_MINIMA ? P.green : P.red) : P.textMuted }}>{liveScore !== null ? liveScore.toFixed(2) : "—"}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ height: "0.5px", background: P.border, margin: "1rem 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><FL>Compromisos próxima sesión</FL><TA value={compromisos} onChange={e => setCompromisos(e.target.value)} placeholder="Acuerdos y tareas para la siguiente sesión..." /></div>
          <div><FL>Observaciones generales</FL><TA value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Notas adicionales sobre el desempeño..." /></div>
        </div>
        <Btn variant="primary" onClick={guardar} disabled={saving}>{saving ? "Guardando..." : "💾 Guardar sesión"}</Btn>
        {msg && <Alert type={msg.type}>{msg.type === "success" ? "✓" : "⚠"} {msg.text}</Alert>}
      </Card>
    </div>
  );
}

// ─── Tab: Repositorio ─────────────────────────────────────────────────────────
function TabRepositorio({ talentos, sesiones, reload, onVerReporte }: { talentos: Talento[]; sesiones: Sesion[]; reload: () => Promise<void>; onVerReporte: (id: string) => void }) {
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const conStats = talentos.map(t => { const ss = sesiones.filter(s => s.talentoId === t.id), avg = promedioTalento(ss); return { ...t, ss, avg, e: estadoTalento(avg, ss.length) }; });
  const total = conStats.length, aprobados = conStats.filter(t => t.e === "apto").length, enCurso = conStats.filter(t => t.e === "en_curso" || t.e === "sin_sesion").length, noAprobados = conStats.filter(t => t.e === "no_apto").length;
  const areasDispo = [...new Set(talentos.map(t => t.area))].sort();
  let filtrados = conStats;
  if (filtroArea) filtrados = filtrados.filter(t => t.area === filtroArea);
  if (filtroEstado === "c") filtrados = filtrados.filter(t => t.e === "en_curso" || t.e === "sin_sesion");
  else if (filtroEstado === "a") filtrados = filtrados.filter(t => t.e === "apto");
  else if (filtroEstado === "n") filtrados = filtrados.filter(t => t.e === "no_apto");

  const eliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre} y todas sus sesiones?`)) return;
    await db.from("talentos").delete().eq("id", id);
    await reload();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Repositorio de talentos</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Sel value={filtroArea} onChange={e => setFiltroArea(e.target.value)} style={{ width: "auto", fontSize: 12, padding: "6px 10px" }}><option value="">Todas las áreas</option>{areasDispo.map(a => <option key={a} value={a}>{a}</option>)}</Sel>
          <Sel value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: "auto", fontSize: 12, padding: "6px 10px" }}><option value="">Todos los estados</option><option value="c">En curso</option><option value="a">Aprobado</option><option value="n">No aprobado</option></Sel>
          <Btn variant="excel" size="sm" onClick={() => exportarRepositorio(talentos, sesiones)}>📊 Exportar todo</Btn>
          <Btn size="sm" onClick={reload}>↻ Actualizar</Btn>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: "1.25rem" }}>
        <MetricCard label="Total talentos" value={total} />
        <MetricCard label="En curso" value={enCurso} valueColor={P.amber} />
        <MetricCard label="Aprobados" value={aprobados} valueColor={P.green} />
        <MetricCard label="No aprobados" value={noAprobados} valueColor={P.red} />
      </div>
      <Card style={{ padding: "0.75rem 0.5rem" }}>
        {filtrados.length === 0
          ? <div style={{ textAlign: "center", padding: "2.5rem", color: P.textMuted, fontSize: 13 }}><div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>👥</div>No hay talentos para mostrar.</div>
          : <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: P.bg }}>{["Talento","Documento","Área","Mentor","Inicio","Sesiones","Promedio","Estado",""].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtrados.map(t => (
                    <tr key={t.id} onClick={() => onVerReporte(t.id)} style={{ cursor: "pointer", borderBottom: `0.5px solid ${P.border}` }}
                      onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { c.style.background = P.purpleLight; })}
                      onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { c.style.background = ""; })}>
                      <td style={tdS}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={t.nombre} /><div><div style={{ fontWeight: 500, fontSize: 13 }}>{t.nombre}</div><div style={{ fontSize: 11, color: P.textMuted }}>{t.cargo}</div></div></div></td>
                      <td style={{ ...tdS, fontSize: 12, color: P.textMuted }}>{t.doc}</td>
                      <td style={tdS}><span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 11, background: P.bg, color: P.textMuted, border: `0.5px solid ${P.border}`, whiteSpace: "nowrap" }}>{t.area}</span></td>
                      <td style={{ ...tdS, fontSize: 12 }}>{t.mentor}</td>
                      <td style={{ ...tdS, fontSize: 12, color: P.textMuted }}>{t.fechaInicio}</td>
                      <td style={{ ...tdS, textAlign: "center" }}><span style={{ fontWeight: 500 }}>{t.ss.length}</span><span style={{ color: P.textMuted, fontSize: 12 }}>/8</span></td>
                      <td style={{ ...tdS, minWidth: 70 }}>{t.avg !== null ? <><span style={{ fontWeight: 500, color: t.avg >= NOTA_MINIMA ? P.greenMid : P.redMid }}>{t.avg.toFixed(2)}</span><MiniBar value={t.avg} /></> : <span style={{ color: P.textMuted }}>—</span>}</td>
                      <td style={tdS}><EstadoBadge avg={t.avg} n={t.ss.length} /></td>
                      <td style={tdS}><Btn size="sm" variant="danger" onClick={ev => { ev.stopPropagation(); eliminar(t.id, t.nombre); }}>🗑</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </Card>
    </div>
  );
}

// ─── Tab: Reporte ─────────────────────────────────────────────────────────────
function TabReporte({ talentos, sesiones, talentoId, setTalentoId }: { talentos: Talento[]; sesiones: Sesion[]; talentoId: string; setTalentoId: (id: string) => void }) {
  const talento = talentos.find(t => t.id === talentoId);
  const ss = talento ? sesiones.filter(s => s.talentoId === talentoId).sort((a, b) => a.semana - b.semana) : [];
  const avg = promedioTalento(ss), meta = ESTADO_META[estadoTalento(avg, ss.length)];
  const promedioC: Record<string, number | null> = {};
  if (talento) COMPETENCIAS.forEach(c => { const vals = ss.filter(s => s.notas[c.id] !== undefined).map(s => s.notas[c.id]); promedioC[c.id] = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null; });

  return (
    <div>
      <Card>
        <CardTitle icon="📈">Reporte final de periodo de prueba</CardTitle>
        <div style={{ maxWidth: 340 }}><FL>Seleccionar talento</FL>
          <Sel value={talentoId} onChange={e => setTalentoId(e.target.value)}><option value="">Seleccionar talento...</option>{talentos.map(t => <option key={t.id} value={t.id}>{t.nombre} · {t.area}</option>)}</Sel>
        </div>
      </Card>
      {talento && <>
        <div style={{ borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, background: meta.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${meta.tc}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: meta.tc }}>{meta.icon}</div>
            <div><div style={{ fontSize: 16, fontWeight: 500, color: meta.tc }}>{talento.nombre}</div><div style={{ fontSize: 12, color: meta.tc, opacity: 0.8 }}>{talento.cargo} · {talento.area}</div></div>
          </div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 28, fontWeight: 500, color: meta.tc, lineHeight: 1 }}>{avg !== null ? avg.toFixed(2) : "—"}<span style={{ fontSize: 14, opacity: 0.6 }}>/5.0</span></div><div style={{ fontSize: 12, fontWeight: 500, color: meta.tc }}>{meta.label}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: "1rem" }}>
          <MetricCard label="Mentor" value={<span style={{ fontSize: 14 }}>{talento.mentor}</span>} />
          <MetricCard label="Fecha inicio" value={<span style={{ fontSize: 14 }}>{talento.fechaInicio}</span>} />
          <MetricCard label="Sesiones" value={<>{ss.length}<span style={{ fontSize: 14, color: P.textMuted, fontWeight: 400 }}>/8</span></>} />
          <MetricCard label="Nota mínima" value={NOTA_MINIMA.toFixed(1)} valueColor={P.purple} />
        </div>
        <Card>
          <CardTitle icon="📉">Curva de aprendizaje por sesión</CardTitle>
          {ss.length === 0 ? <div style={{ textAlign: "center", padding: "1.5rem", color: P.textMuted, fontSize: 13 }}>Sin sesiones registradas.</div>
          : <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: P.bg }}><th style={thS}>Sem.</th><th style={thS}>Fecha</th>{COMPETENCIAS.map(c => <th key={c.id} title={c.nombre} style={{ ...thS, maxWidth: 65, whiteSpace: "normal", lineHeight: 1.2, textAlign: "center" }}>{c.nombre.split(" ")[0]}</th>)}<th style={thS}>Ponderado</th></tr></thead>
                <tbody>{ss.map(s => (<tr key={s.id} style={{ borderBottom: `0.5px solid ${P.border}` }}><td style={{ ...tdS, fontWeight: 500 }}>S{s.semana}</td><td style={{ ...tdS, fontSize: 12, color: P.textMuted }}>{s.fecha}</td>{COMPETENCIAS.map(c => <td key={c.id} style={{ ...tdS, textAlign: "center", fontSize: 12 }}>{s.notas[c.id] !== undefined ? s.notas[c.id].toFixed(1) : "—"}</td>)}<td style={tdS}><span style={{ fontWeight: 500, color: s.ponderado >= NOTA_MINIMA ? P.greenMid : P.redMid }}>{s.ponderado.toFixed(2)}</span><MiniBar value={s.ponderado} /></td></tr>))}</tbody>
              </table>
            </div>}
        </Card>
        <Card>
          <CardTitle icon="📊">Promedio por competencia y contribución</CardTitle>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: P.bg }}>{["Competencia","Peso","Promedio","Contribución"].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{COMPETENCIAS.map(c => { const p = promedioC[c.id], contrib = p !== null ? parseFloat((p * (c.peso / 100)).toFixed(2)) : null, col = p === null ? P.textMuted : p >= NOTA_MINIMA ? P.greenMid : P.redMid; return (<tr key={c.id} style={{ borderBottom: `0.5px solid ${P.border}` }}><td style={{ ...tdS, fontWeight: 500 }}>{c.nombre}</td><td style={tdS}><span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 11, background: P.bg, color: P.textMuted, border: `0.5px solid ${P.border}` }}>{c.peso}%</span></td><td style={{ ...tdS, minWidth: 110 }}>{p !== null ? <><span style={{ fontWeight: 500, color: col }}>{p.toFixed(2)}</span><MiniBar value={p} /></> : <span style={{ color: P.textMuted }}>—</span>}</td><td style={{ ...tdS, fontWeight: 500, textAlign: "center", color: col }}>{contrib !== null ? contrib.toFixed(2) : "—"}</td></tr>); })}</tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 10, borderTop: `0.5px solid ${P.border}` }}>
            <span style={{ fontSize: 13, color: P.textMuted }}>Nota final ponderada:</span>
            <span style={{ fontSize: 24, fontWeight: 500, color: avg !== null ? (avg >= NOTA_MINIMA ? P.green : P.red) : P.textMuted }}>{avg !== null ? avg.toFixed(2) : "—"}</span>
          </div>
        </Card>
        {ss.length > 0 && <Card>
          <CardTitle icon="📝">Últimas observaciones registradas</CardTitle>
          {ss.slice(-3).reverse().map(s => (
            <div key={s.id} style={{ padding: "10px 0", borderBottom: `0.5px solid ${P.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>Semana {s.semana}</span>
                <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 11, background: P.bg, color: P.textMuted, border: `0.5px solid ${P.border}` }}>{s.fecha}</span>
                <span style={{ fontWeight: 500, color: s.ponderado >= NOTA_MINIMA ? P.green : P.red }}>{s.ponderado.toFixed(2)}</span>
              </div>
              {s.compromisos && <p style={{ fontSize: 12, color: P.textMuted, marginBottom: 3 }}><strong style={{ fontWeight: 500 }}>Compromisos:</strong> {s.compromisos}</p>}
              {s.observaciones && <p style={{ fontSize: 12, color: P.textMuted }}><strong style={{ fontWeight: 500 }}>Observaciones:</strong> {s.observaciones}</p>}
            </div>
          ))}
        </Card>}
        <Btn variant="excel" onClick={() => exportarIndividual(talento, sesiones)}>📊 Exportar reporte Excel</Btn>
      </>}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MentoriasApp() {
  const [activeTab, setActiveTab] = useState("nuevo");
  const [talentos, setTalentos] = useState<Talento[]>([]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [reporteTalentoId, setReporteTalentoId] = useState("");

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    const [{ data: t }, { data: s }] = await Promise.all([
      db.from("talentos").select("*").order("created_at", { ascending: true }),
      db.from("sesiones_mentoria").select("*").order("semana", { ascending: true }),
    ]);
    setTalentos((t || []).map(dbToTalento));
    setSesiones((s || []).map(dbToSesion));
    setLoading(false);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const irReporte = useCallback((id: string) => { setReporteTalentoId(id); setActiveTab("reporte"); }, []);

  const TABS = [{ id:"nuevo",label:"Nuevo talento",icon:"＋" },{ id:"sesion",label:"Sesión",icon:"📋" },{ id:"repositorio",label:"Repositorio",icon:"👥" },{ id:"reporte",label:"Reporte",icon:"📈" }];

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", fontSize: 14, color: P.text, padding: "0 1.5rem 2rem", maxWidth: 960, margin: "0 auto", background: P.bg, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0 0.75rem", borderBottom: `0.5px solid ${P.border}`, marginBottom: "1.25rem", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: P.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>📈</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Seguimiento de mentorías</div>
            <div style={{ fontSize: 11, color: P.textMuted }}>
              Periodo de prueba · 2 meses · 8 sesiones
              {!loading && <span style={{ marginLeft: 8, color: P.purple }}>· {talentos.length} talentos en repositorio</span>}
            </div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 2, background: P.bg, borderRadius: 12, padding: 3, border: `0.5px solid ${P.border}` }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: "6px 14px", border: activeTab === t.id ? `0.5px solid ${P.border}` : "0.5px solid transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 12, borderRadius: 8, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", background: activeTab === t.id ? P.white : "transparent", color: activeTab === t.id ? P.text : P.textMuted, fontWeight: activeTab === t.id ? 500 : 400 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </div>
      {loading ? <Spinner /> : <>
        {activeTab === "nuevo" && <TabNuevo talentos={talentos} reload={cargarDatos} />}
        {activeTab === "sesion" && <TabSesion talentos={talentos} sesiones={sesiones} reload={cargarDatos} />}
        {activeTab === "repositorio" && <TabRepositorio talentos={talentos} sesiones={sesiones} reload={cargarDatos} onVerReporte={irReporte} />}
        {activeTab === "reporte" && <TabReporte talentos={talentos} sesiones={sesiones} talentoId={reporteTalentoId} setTalentoId={setReporteTalentoId} />}
      </>}
    </div>
  );
}
