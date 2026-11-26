"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Globe2, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScanResult } from "@/lib/types";

const LOCAL_REPORTS_KEY = "regupulse.local.reports.v1";
const LOCAL_CREDITS_KEY = "regupulse.local.credits.v1";
type Report = ScanResult & { id: string };
type Site = { id: string; domain: string; url: string; monitoring_enabled: boolean; last_score: number | null; last_scanned_at: string | null };

export function DashboardClient() {
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState("free");
  const [founder, setFounder] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const workspace = await fetch("/api/workspace", { cache: "no-store" }).then((r) => r.json());
    if (workspace.mode === "cloud") { setCredits(Number(workspace.creditsRemaining ?? 0)); setPlan(workspace.plan || "free"); setFounder(Boolean(workspace.isFounder)); }
    else { setCredits(Number(localStorage.getItem(LOCAL_CREDITS_KEY) ?? 50)); setReports(JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || "[]") as Report[]); }
    const [scanResponse, siteResponse] = await Promise.all([fetch("/api/scans", { cache: "no-store" }), fetch("/api/sites", { cache: "no-store" })]);
    const scanData = await scanResponse.json().catch(() => ({}));
    const siteData = await siteResponse.json().catch(() => ({}));
    if (Array.isArray(scanData.scans) && scanData.scans.length) setReports(scanData.scans as Report[]);
    if (Array.isArray(siteData.sites)) setSites(siteData.sites as Site[]);
  }
  useEffect(() => { refresh().catch(() => setError("Workspace data could not be loaded.")); }, []);

  async function addSite(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: newUrl }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add website.");
      setSites((previous) => [data.site, ...previous]); setNewUrl("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add website."); }
    finally { setLoading(false); }
  }
  async function toggleSite(site: Site) {
    const response = await fetch(`/api/sites/${site.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monitoring_enabled: !site.monitoring_enabled }) });
    if (response.ok) setSites((previous) => previous.map((item) => item.id === site.id ? { ...item, monitoring_enabled: !site.monitoring_enabled } : item));
  }
  async function deleteSite(id: string) {
    const response = await fetch(`/api/sites/${id}`, { method: "DELETE" });
    if (response.ok) setSites((previous) => previous.filter((site) => site.id !== id));
  }
  const average = reports.length ? Math.round(reports.slice(0, 10).reduce((sum, report) => sum + report.overall_score, 0) / Math.min(reports.length, 10)) : 0;

  return <main className="mx-auto max-w-6xl space-y-7 px-4 py-9 sm:px-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Private guest workspace</p><h1 className="mt-2 text-3xl font-medium text-slate-900" style={{fontFamily:"var(--font-serif), Georgia, serif"}}>Your review workspace</h1><p className="mt-1 text-xs text-stone-500">No account required. Your saved cloud reports belong to this browser workspace.</p></div><div className="flex gap-2"><Link href="/#scanner"><Button size="sm">New website scan</Button></Link><Link href="/pricing"><Button variant="outline" size="sm">Upgrade plan</Button></Link></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{label:"Available credits",value:credits===null?"…":credits.toLocaleString("en-IN"),note:founder?"Founding workspace bonus":"One credit per URL scan"},{label:"Plan",value:plan.toUpperCase(),note:"Billing in INR via Razorpay"},{label:"Recent reports",value:reports.length,note:"Last 30 reports in cloud"},{label:"Average score",value:average?`${average}/100`:"—",note:"Based on visible recent reports"}].map((card)=><div key={card.label} className="rounded-xl border border-stone-200 bg-white p-5"><p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500">{card.label}</p><b className="mt-2 block text-2xl text-slate-900">{card.value}</b><p className="mt-1 text-xs text-stone-500">{card.note}</p></div>)}</div>
    <section className="rounded-xl border border-stone-200 bg-white p-5"><div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-emerald-800"/><h2 className="text-sm font-semibold text-slate-900">Monitored websites</h2></div><p className="mt-1 text-xs leading-6 text-stone-500">Save sites you revisit regularly. Scheduled scans run when Vercel Cron and Firebase are configured.</p><form onSubmit={addSite} className="mt-4 flex flex-col gap-2 sm:flex-row"><Input type="url" required value={newUrl} onChange={(e)=>setNewUrl(e.target.value)} placeholder="https://yourwebsite.com" className="text-xs"/><Button type="submit" size="sm" disabled={loading}><Plus className="mr-1 h-3.5 w-3.5"/>Add website</Button></form>{error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}{sites.length===0?<p className="mt-4 rounded-lg bg-stone-50 p-4 text-xs text-stone-500">No websites saved yet. Run a scan first, then add a site here for repeat reviews.</p>:<div className="mt-4 divide-y divide-stone-100">{sites.map((site)=><div key={site.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-xs font-semibold text-slate-900">{site.domain}</p><p className="mt-1 text-xs text-stone-500">{site.last_scanned_at?new Date(site.last_scanned_at).toLocaleString("en-IN"):"Not scanned yet"}</p></div><div className="flex items-center gap-2">{site.last_score!==null&&<span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">{site.last_score}/100</span>}<Button size="sm" variant="outline" onClick={()=>toggleSite(site)}>{site.monitoring_enabled?"Pause":"Enable"}</Button><Button size="sm" variant="ghost" onClick={()=>deleteSite(site.id)}><Trash2 className="h-3.5 w-3.5"/></Button></div></div>)}</div>}</section>
    <section className="rounded-xl border border-stone-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-800"/><h2 className="text-sm font-semibold text-slate-900">Recent reports</h2></div><Button variant="ghost" size="sm" onClick={()=>refresh()}><RefreshCw className="mr-1 h-3.5 w-3.5"/>Refresh</Button></div>{reports.length===0?<p className="mt-4 rounded-lg bg-stone-50 p-4 text-xs text-stone-500">No reports are saved yet. A local preview stores reports only in this browser; configure Firebase to save report history in the cloud.</p>:<div className="mt-3 divide-y divide-stone-100">{reports.map((report)=><div key={report.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-xs font-semibold text-slate-900">{report.normalized_domain}</p><p className="mt-1 text-xs text-stone-500">{new Date(report.created_at).toLocaleString("en-IN")} · {report.total_rules_checked} checks · {report.issues.length} findings</p></div><div className="flex items-center gap-3"><b className="text-sm text-emerald-800">{report.overall_score}/100</b><Link href={`/report/${report.id}`}><Button size="sm" variant="outline">Open report ↗</Button></Link></div></div>)}</div>}</section>
    <div className="rounded-lg bg-emerald-50 p-4 text-xs leading-6 text-emerald-950"><div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0"/><p><b>Privacy:</b> your browser receives only an opaque, HTTP-only workspace cookie. Firestore access is restricted to the server. Clearing your browser cookies creates a new anonymous workspace; save reports locally or export them if you need a copy.</p></div></div>
  </main>;
}
