"use client";

import { useEffect, useRef, useState } from "react";
import { FileCode2, FileUp, Download, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { FileReviewResult } from "@/lib/types";

const LOCAL_CREDITS_KEY = "regupulse.local.credits.v1";
const LOCAL_REVIEWS_KEY = "regupulse.local.file-reviews.v1";

export function FileReviewTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FileReviewResult | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  async function getCredits() {
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const data = await response.json();
      if (data.mode === "cloud") setCredits(Number(data.creditsRemaining ?? 0));
      else setCredits(Number(localStorage.getItem(LOCAL_CREDITS_KEY) ?? 50));
    } catch { setCredits(50); }
  }

  useEffect(() => { getCredits(); }, []);

  async function inspect() {
    if (!file) { setError("Choose a file before starting the inspection."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("The file must be 2 MB or smaller."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/file-review", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || !data.result) throw new Error(data.error || "File inspection failed.");
      const next = data.result as FileReviewResult;
      setResult(next);
      if (data.mode === "cloud") setCredits(Number(data.creditsRemaining ?? 0));
      else {
        const nextCredits = Math.max(0, Number(localStorage.getItem(LOCAL_CREDITS_KEY) ?? 50) - 5);
        localStorage.setItem(LOCAL_CREDITS_KEY, String(nextCredits)); setCredits(nextCredits);
        const prior = JSON.parse(localStorage.getItem(LOCAL_REVIEWS_KEY) || "[]") as FileReviewResult[];
        localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify([next, ...prior].slice(0, 20)));
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Could not inspect the file."); }
    finally { setLoading(false); }
  }

  function downloadNotes() {
    if (!result) return;
    const content = [
      `# File review: ${result.filename}`,
      `Score: ${result.score}/100`,
      `Created: ${result.created_at}`,
      "",
      result.summary,
      "",
      ...result.findings.flatMap((item, index) => [
        `## ${index + 1}. ${item.title}`,
        `Severity: ${item.severity} | Category: ${item.category} | Line: ${item.line ?? "Not applicable"}`,
        "",
        `Evidence: ${item.evidence}`,
        "",
        `Why it matters: ${item.why_it_matters}`,
        "",
        `Recommendation: ${item.recommendation}`,
        "",
        "How to verify:",
        ...item.verification_steps.map((step) => `- ${step}`),
        ...(item.suggested_rewrite ? ["", "Suggested rewrite:", "```", item.suggested_rewrite, "```"] : []),
        "",
      ]),
      "This static review is a set of suggestions, not a guarantee that the file is secure, accessible or legally compliant. Review and test all changes before deployment.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${result.filename}.review.md`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2 text-emerald-800"><FileCode2 className="h-4 w-4" /><span className="font-mono text-xs font-semibold uppercase tracking-[0.17em]">Source-file inspection</span></div><h3 className="mt-2 text-xl font-medium text-slate-900" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>Review a file and get rewrite guidance.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Upload HTML, CSS, JavaScript, TypeScript, JSON, Markdown or TXT. ReguPulse checks the file, points to affected lines and gives evidence, practical recommendations, verification steps and suggested rewrites.</p></div><div className="shrink-0 rounded-lg bg-amber-50 px-3 py-2 text-right"><span className="block font-mono text-xs font-semibold uppercase tracking-wider text-amber-800">Tool cost</span><b className="text-lg text-amber-950">5 credits</b></div></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-16 items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 text-left hover:border-emerald-700 hover:bg-emerald-50/40"><FileUp className="h-5 w-5 text-stone-500" /><span className="min-w-0"><b className="block truncate text-xs text-slate-900">{file?.name || "Choose a file to upload"}</b><small className="mt-1 block text-xs text-stone-500">Maximum 2 MB · HTML, CSS, JS, TS, JSON, MD, TXT</small></span></button>
      <input ref={inputRef} type="file" className="hidden" accept=".html,.htm,.css,.js,.jsx,.ts,.tsx,.json,.md,.txt,text/html,text/css,text/javascript,application/json,text/plain" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button type="button" onClick={inspect} disabled={!file || loading || (credits !== null && credits < 5)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Inspecting…</> : <>Inspect & prepare suggestions <span>↗</span></>}</button>
    </div>
    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-stone-500"><span>Five credits are charged only when an inspection completes successfully.</span><span>{credits === null ? "" : `${credits} credits`}</span></div>
    {error && <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><ShieldAlert className="h-4 w-4" />{error}</p>}
    {result && <div className="mt-6 border-t border-stone-200 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-500">Inspection result · {result.file_type}</span><h4 className="mt-1 text-sm font-semibold text-slate-900">{result.filename}</h4><p className="mt-1 text-xs text-stone-500">{result.summary}</p></div><div className="text-right"><b className="text-2xl text-emerald-800">{result.score}</b><span className="text-xs text-stone-500">/100</span><button onClick={downloadNotes} className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-800"><Download className="h-3.5 w-3.5" /> Download full review</button></div></div>
      {result.findings.length === 0 ? <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-xs text-emerald-900"><CheckCircle2 className="h-4 w-4" />No issues were found by these static checks. Manual review is still recommended.</p> : <div className="mt-4 space-y-3">{result.findings.map((item) => <article key={item.id} className="rounded-xl border border-stone-200 p-4"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.severity === "HIGH" || item.severity === "CRITICAL" ? "bg-red-50 text-red-800" : item.severity === "MODERATE" ? "bg-amber-50 text-amber-800" : "bg-stone-100 text-stone-700"}`}>{item.severity}</span><span className="text-xs text-stone-500">{item.category}{item.line ? ` · line ${item.line}` : ""}</span></div><h5 className="mt-2 text-sm font-semibold text-slate-900">{item.title}</h5><p className="mt-2 text-sm leading-6 text-stone-600">{item.why_it_matters}</p><div className="mt-3 rounded-lg bg-stone-50 p-3"><p className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-500">Evidence</p><pre className="mt-1 whitespace-pre-wrap break-words text-xs text-stone-700">{item.evidence}</pre></div><p className="mt-3 text-sm leading-6 text-slate-800"><b>Suggested change:</b> {item.recommendation}</p><ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-stone-600">{item.verification_steps.map((step) => <li key={step}>{step}</li>)}</ol>{item.suggested_rewrite && <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-emerald-800">View suggested rewrite</summary><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs leading-5 text-emerald-100">{item.suggested_rewrite}</pre></details>}</article>)}</div>}
      <p className="mt-4 text-xs leading-5 text-stone-500">Suggested changes are deterministic checks and templates, not automatic edits to your original upload. Review each change and test the updated file before using it.</p>
    </div>}
  </div>;
}
