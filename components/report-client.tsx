"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Download, Printer, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreGauge } from "@/components/score-gauge";
import type { ComplianceIssue, CompliancePillar, ScanResult } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Report = ScanResult & { id: string };

function severityVariant(severity: ComplianceIssue["severity"]) {
  if (severity === "CRITICAL") return "critical";
  if (severity === "HIGH") return "high";
  if (severity === "MODERATE") return "moderate";
  return "low";
}

const pillarLabels: Record<CompliancePillar, string> = {
  ACCESSIBILITY: "Accessibility",
  PRIVACY: "Privacy",
  SECURITY: "Security",
  GENERAL: "General quality",
};

export function ReportClient({ scan }: { scan: Report }) {
  const [activePillar, setActivePillar] = useState<"ALL" | CompliancePillar>("ALL");
  const [copied, setCopied] = useState<string | null>(null);
  const filteredIssues = useMemo(() => activePillar === "ALL" ? scan.issues : scan.issues.filter((item) => item.pillar === activePillar), [activePillar, scan.issues]);
  const totalIssues = scan.issues.length;
  const critical = scan.issues.filter((item) => item.severity === "CRITICAL").length;
  const high = scan.issues.filter((item) => item.severity === "HIGH").length;
  const techItems = [...scan.detected_tech.analytics, ...scan.detected_tech.consent_platforms, ...scan.detected_tech.cms_or_framework];

  async function copy(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); setCopied(key); window.setTimeout(() => setCopied(null), 1600); }
    catch { setCopied("copy-error"); }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(scan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${scan.normalized_domain}-regupulse-report.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
    <div className="no-print flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-slate-900"><ArrowLeft className="h-3.5 w-3.5" /> Open workspace</Link><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={downloadJson}><Download className="mr-1.5 h-3.5 w-3.5" /> Download JSON</Button><Button size="sm" onClick={() => window.print()}><Printer className="mr-1.5 h-3.5 w-3.5" /> Print / Save as PDF</Button></div></div>

    <header className="border-b border-stone-200 pb-5">
      <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Website assessment report · {formatDate(scan.created_at)}</p>
      <h1 className="mt-2 break-words text-3xl font-medium text-slate-900 sm:text-4xl" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>{scan.normalized_domain}</h1>
      <p className="mt-2 break-all font-mono text-xs text-stone-500">{scan.target_url}</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">This report evaluates the inspected page using 30 deterministic checks across accessibility, privacy, security and general website quality. It identifies visible signals in the fetched page and response; manual testing is still necessary for complete coverage.</p>
    </header>

    <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <Card className="print-card p-5"><ScoreGauge score={scan.overall_score} riskLevel={scan.risk_level} /><div className="mt-4 border-t border-stone-100 pt-3 text-center"><p className="font-mono text-sm uppercase tracking-wider text-stone-500">Overall readiness</p><p className="mt-1 text-sm text-stone-600">{scan.risk_level} risk band</p></div></Card>
      <Card className="print-card"><CardContent className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-sm font-semibold uppercase tracking-wider text-stone-500">Review overview</p><h2 className="mt-1 text-xl font-medium text-slate-900" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>What the scan found</h2></div><div className="text-right"><b className="text-2xl text-slate-900">{scan.total_rules_checked}</b><p className="text-sm text-stone-500">checks run</p></div></div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{[
          {label:"Accessibility",score:scan.accessibility_score}, {label:"Privacy",score:scan.privacy_score}, {label:"Security",score:scan.security_score}, {label:"General quality",score:scan.general_score},
        ].map((item)=><div key={item.label} className="rounded-lg border border-stone-200 p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm text-stone-600">{item.label}</span><b className="text-sm text-slate-900">{item.score}</b></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-emerald-800" style={{width:`${item.score}%`}} /></div></div>)}</div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{[
          {label:"Passed",value:scan.passed_rules_count,tone:"text-emerald-800"},{label:"Findings",value:totalIssues,tone:"text-slate-900"},{label:"Critical",value:critical,tone:"text-red-700"},{label:"High",value:high,tone:"text-amber-800"},
        ].map((item)=><div key={item.label} className="rounded-lg bg-stone-50 p-3"><b className={`text-2xl ${item.tone}`}>{item.value}</b><p className="mt-1 text-sm text-stone-500">{item.label}</p></div>)}</div>
        <div className="mt-5 border-t border-stone-100 pt-4"><p className="font-mono text-sm font-semibold uppercase tracking-wider text-stone-500">Detected technologies and response signals</p><div className="mt-2 flex flex-wrap gap-1.5">{techItems.length ? techItems.map((item)=><Badge key={item} variant="outline">{item}</Badge>) : <span className="text-sm text-stone-500">No listed analytics, consent platform or common CMS signature was detected.</span>}</div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-600"><span>HSTS: {scan.detected_tech.security_headers.hsts ? "Detected" : "Missing"}</span><span>CSP: {scan.detected_tech.security_headers.csp ? "Detected" : "Missing"}</span><span>Nosniff: {scan.detected_tech.security_headers.x_content_type_options ? "Detected" : "Missing"}</span><span>Frame options: {scan.detected_tech.security_headers.x_frame_options ? "Detected" : "Missing"}</span></div></div>
      </CardContent></Card>
    </section>

    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-800">Detailed findings</p><h2 className="mt-1 text-2xl font-medium text-slate-900" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>Issues to review and resolve</h2><p className="mt-1 text-sm text-stone-500">Each issue includes evidence, its impact, a suggested change and steps to verify the fix.</p></div><span className="text-sm text-stone-500">{filteredIssues.length} shown · {scan.total_rules_checked} checks total</span></div>
      <div className="no-print flex flex-wrap gap-1.5 border-b border-stone-200 pb-3">{(["ALL","ACCESSIBILITY","PRIVACY","SECURITY","GENERAL"] as const).map((key)=><Button key={key} variant={activePillar===key?"default":"ghost"} size="sm" onClick={()=>setActivePillar(key)}>{key==="ALL"?`All findings (${totalIssues})`:`${pillarLabels[key]} (${scan.issues.filter((x)=>x.pillar===key).length})`}</Button>)}</div>
      {filteredIssues.length===0?<Card className="p-8 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-700"/><p className="mt-2 text-sm font-semibold text-emerald-800">No findings in this category.</p><p className="mt-1 text-sm text-stone-500">All checks in this area passed the available automated test.</p></Card>:filteredIssues.map((issue)=> <Card key={issue.rule_id} className="print-card overflow-hidden"><CardHeader className="pb-2"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><Badge variant={severityVariant(issue.severity)}>{issue.severity}</Badge><span className="font-mono text-sm font-semibold text-slate-700">{issue.rule_id}</span><span className="text-sm text-stone-500">{pillarLabels[issue.pillar]}</span></div><span className="font-mono text-sm text-stone-500">-{issue.points_deducted} weight</span></div><CardTitle className="mt-2 flex items-start gap-2 text-base"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />{issue.title}</CardTitle></CardHeader><CardContent className="space-y-4">
        <p className="text-sm leading-7 text-stone-600">{issue.description}</p>
        <div className="grid gap-3 lg:grid-cols-2"><div className="rounded-lg border border-stone-200 bg-stone-50 p-4"><p className="font-mono text-sm font-semibold uppercase tracking-wider text-stone-500">Why this matters</p><p className="mt-2 text-sm leading-7 text-stone-700">{issue.why_it_matters}</p></div><div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4"><p className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-900">Recommended change</p><p className="mt-2 text-sm leading-7 text-slate-800">{issue.recommendation}</p></div></div>
        {issue.affected_snippets.length>0&&<div className="rounded-lg border border-stone-200 p-4"><p className="font-mono text-sm font-semibold uppercase tracking-wider text-stone-500">Evidence from the inspected page</p><div className="mt-2 space-y-2">{issue.affected_snippets.map((snippet,index)=><pre key={index} className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-3 text-sm leading-5 text-emerald-100">{snippet}</pre>)}</div><div className="no-print mt-2 flex justify-end"><Button size="sm" variant="ghost" onClick={()=>copy(issue.affected_snippets.join("\n"),issue.rule_id)}>{copied===issue.rule_id?<><Check className="mr-1 h-3.5 w-3.5"/>Copied</>:"Copy evidence"}</Button></div></div>}
        <div className="rounded-lg border border-stone-200 p-4"><p className="font-mono text-sm font-semibold uppercase tracking-wider text-stone-500">How to verify the fix</p><ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-6 text-stone-700">{issue.verification_steps.map((step,index)=><li key={index}>{step}</li>)}</ol></div>
        <p className="text-sm text-stone-500">Reference: {issue.legal_reference}</p>
      </CardContent></Card>)}
    </section>

    <details className="print-card rounded-xl border border-stone-200 bg-white p-5">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">Checks that passed ({scan.passed_checks.length})</summary>
      <p className="mt-2 text-sm leading-6 text-stone-500">These checks passed the available static inspection on this page. They do not replace manual and user-flow testing.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{scan.passed_checks.map((item) => <div key={item.rule_id} className="flex items-start gap-2 rounded-md bg-emerald-50/60 px-3 py-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-800"/><span className="text-sm text-slate-800">{item.title}<small className="ml-1 font-mono text-xs text-stone-500">{item.rule_id}</small></span></div>)}</div>
    </details>

    <section className="print-card rounded-xl border border-stone-200 bg-[#F6F6F1] p-5"><h2 className="text-sm font-semibold text-slate-900">Scope and limitations</h2><p className="mt-2 text-sm leading-6 text-stone-600">This review inspects the public HTML response and selected response headers from the requested URL. It may not see content rendered only after interaction, authenticated pages, user-specific experiences, keyboard behaviour, actual contrast in every state, or scripts loaded through later interactions. A successful check is not legal advice, a penetration test, accessibility certification or a guarantee of compliance. Confirm findings manually before using this report for business or legal decisions.</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500"><span>Scan duration: {(scan.scan_duration_ms/1000).toFixed(1)}s</span><span>Checks: {scan.total_rules_checked}</span><span>Passed: {scan.passed_rules_count}</span><span>Findings: {totalIssues}</span></div></section>
    <div className="no-print flex justify-end gap-2"><Link href="/dashboard"><Button variant="outline" size="sm">Open workspace</Button></Link><Button size="sm" onClick={()=>window.print()}><Printer className="mr-1.5 h-3.5 w-3.5"/> Print / Save PDF</Button></div>
  </main>;
}
